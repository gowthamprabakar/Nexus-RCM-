"""
LIDA Integration Service — Automatic Visualization + NL Query
==============================================================
Uses Microsoft LIDA with local Ollama to:
- Summarize RCM data into statistical profiles
- Generate visualization goals from data
- Create executable chart code
- Answer natural language questions about claims/denials/payments

Performance optimizations:
- Response cache (TTL=5 min) for repeated questions
- Pre-computed stats context (TTL=10 min) avoids per-query DB scans
- Intent complexity router adjusts prompt size & max_tokens
- DataFrame cache (TTL=5 min) avoids re-querying for chart generation
"""
import asyncio
import os
import re
import logging
import io
import base64
import hashlib
import pandas as pd
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

logger = logging.getLogger(__name__)

# Try to import LIDA
try:
    from lida import Manager, TextGenerationConfig
    LIDA_AVAILABLE = True
except ImportError:
    LIDA_AVAILABLE = False
    logger.warning("LIDA not installed")

# Cache the LIDA manager
_lida_manager = None

def get_lida_manager():
    global _lida_manager
    if _lida_manager is None and LIDA_AVAILABLE:
        # Use Ollama as the LLM provider via OpenAI-compatible API
        _lida_manager = Manager(
            text_gen=TextGenerationConfig(
                n=1,
                temperature=0.1,
                model=os.environ.get("OLLAMA_MODEL", "qwen3:4b"),
                max_tokens=2000,
                provider="openai",  # Ollama is OpenAI-compatible
                api_base="http://localhost:11434/v1"
            )
        )
    return _lida_manager


# ── FIX 1: Response Cache (TTL=5 min, LRU-capped at 500 entries) ────────────
_response_cache = {}
_CACHE_TTL = 300  # 5 minutes
_CACHE_MAX_SIZE = 500

def _cache_key(question: str, dataset: str) -> str:
    return hashlib.md5(f"{question}:{dataset}".encode()).hexdigest()

def _get_cached(question: str, dataset: str):
    key = _cache_key(question, dataset)
    if key in _response_cache:
        entry = _response_cache[key]
        if (datetime.now() - entry['ts']).total_seconds() < _CACHE_TTL:
            # LRU touch: move accessed entry to end
            _response_cache[key] = _response_cache.pop(key)
            return entry['data']
        del _response_cache[key]
    return None

def _set_cache(question: str, dataset: str, data: dict):
    key = _cache_key(question, dataset)
    # Evict oldest entry when at capacity
    if key not in _response_cache and len(_response_cache) >= _CACHE_MAX_SIZE:
        oldest_key = next(iter(_response_cache))
        del _response_cache[oldest_key]
    _response_cache[key] = {'data': data, 'ts': datetime.now()}


# ── FIX 2: Pre-computed Stats Context (TTL=10 min) ───────────────────────────
_stats_cache = {'data': None, 'ts': None}
_STATS_TTL = 600  # 10 minutes

async def _get_precomputed_stats(db) -> str:
    """Pre-computed stats snapshot — avoids re-querying for every question."""
    if _stats_cache['data'] and _stats_cache['ts'] and (datetime.now() - _stats_cache['ts']).total_seconds() < _STATS_TTL:
        return _stats_cache['data']

    # Compute once, cache for 10 min
    from sqlalchemy import text as sql_text
    parts = []
    try:
        denial_count = await db.scalar(sql_text("SELECT count(*) FROM denials"))
        denial_amt = await db.scalar(sql_text("SELECT COALESCE(sum(denial_amount),0)::bigint FROM denials"))
        era_total = await db.scalar(sql_text("SELECT COALESCE(sum(payment_amount),0)::bigint FROM era_payments"))
        claim_count = await db.scalar(sql_text("SELECT count(*) FROM claims"))

        # Root causes
        top_cause = await db.execute(sql_text("SELECT primary_root_cause, count(*), sum(financial_impact)::bigint FROM root_cause_analysis GROUP BY 1 ORDER BY 2 DESC LIMIT 7"))
        causes = [(r[0], r[1], r[2]) for r in top_cause.all()]

        # Payers
        top_payer = await db.execute(sql_text("""
            SELECT pm.payer_name, count(d.denial_id), sum(d.denial_amount)::bigint
            FROM denials d JOIN claims c ON d.claim_id=c.claim_id JOIN payer_master pm ON c.payer_id=pm.payer_id
            GROUP BY 1 ORDER BY 3 DESC LIMIT 10
        """))
        payers = [(r[0], r[1], r[2]) for r in top_payer.all()]

        # Categories
        top_cat = await db.execute(sql_text("SELECT denial_category, count(*), sum(denial_amount)::bigint FROM denials GROUP BY 1 ORDER BY 3 DESC"))
        cats = [(r[0], r[1], r[2]) for r in top_cat.all()]

        # AR
        ar_total = await db.scalar(sql_text("SELECT COALESCE(sum(total_charges),0)::bigint FROM claims WHERE status NOT IN ('PAID','WRITTEN_OFF','VOIDED')"))

        # Payments
        era_count = await db.scalar(sql_text("SELECT count(*) FROM era_payments"))
        bank_total = await db.scalar(sql_text("SELECT COALESCE(sum(bank_deposit_amount),0)::bigint FROM bank_reconciliation"))

        parts.append(f"Total claims: {claim_count:,}")
        parts.append(f"Total denials: {denial_count:,} (${denial_amt:,} at risk)")
        parts.append(f"Total ERA payments: {era_count:,} (${era_total:,})")
        parts.append(f"Total AR outstanding: ${ar_total:,}")
        parts.append(f"Bank deposits: ${bank_total:,}")
        parts.append(f"Denial categories: {', '.join(f'{c[0]}({c[1]:,} denials, ${c[2]:,})' for c in cats)}")
        parts.append(f"Root causes: {', '.join(f'{c[0]}({c[1]:,} claims, ${c[2]:,} impact)' for c in causes)}")
        parts.append(f"Top payers by denials: {', '.join(f'{p[0]}({p[1]:,} denials, ${p[2]:,})' for p in payers[:5])}")
    except Exception as e:
        parts.append(f"Stats error: {e}")

    result = "\n".join(parts)
    _stats_cache['data'] = result
    _stats_cache['ts'] = datetime.now()
    return result


# ── FIX 3: Intent Complexity Router ──────────────────────────────────────────
def _classify_intent(question: str) -> str:
    """Classify question complexity: simple, moderate, complex."""
    q = question.lower()
    # Simple: direct stat lookup
    if any(w in q for w in ['how many', 'total', 'count', 'what is the', 'show me', 'list', 'top', 'highest', 'lowest', 'average', 'sum']):
        return 'simple'
    # Complex: multi-dimensional analysis, reports, comparisons
    if any(w in q for w in ['report', 'compare', 'analyze', 'detailed', 'comprehensive', 'reconciliation report', 'trend over', 'break down', 'across all']):
        return 'complex'
    return 'moderate'

_INTENT_MAX_TOKENS = {
    'simple': 500,
    'moderate': 1500,
    'complex': 4000,
}

_INTENT_TEMPERATURE = {
    'simple': 0.05,
    'moderate': 0.15,
    'complex': 0.25,
}


def _is_root_cause_question(question: str) -> bool:
    """Detect if this is a WHY / root cause question that should bypass Text-to-SQL."""
    q = question.lower()
    return any(w in q for w in [
        'why', 'root cause', 'reason', 'what caused', 'what is causing',
        'explain', 'investigate', 'dig into', 'drill down',
        'what is behind', 'what drives', 'contributing factor',
    ])


# ── FIX 4: DataFrame Cache (TTL=5 min) ───────────────────────────────────────
_df_cache = {}

# ── Ollama concurrency limiter — max 3 simultaneous calls ────────────────────
_ollama_semaphore = asyncio.Semaphore(3)


# ── Chart detection keywords (broadened) ─────────────────────────────────────
CHART_KEYWORDS = [
    'chart', 'graph', 'show', 'visualize', 'plot', 'trend', 'distribution',
    'compare', 'breakdown', 'by payer', 'by category', 'by month',
    'top', 'why', 'bar', 'pie', 'line', 'histogram', 'scatter',
]

# Keywords that signal a data question (should attempt visualization)
DATA_VIZ_KEYWORDS = [
    'denial', 'denied', 'payment', 'claim', 'payer', 'ar', 'aging',
    'revenue', 'amount', 'total', 'count', 'rate', 'how many',
    'highest', 'lowest', 'average', 'sum', 'root cause', 'carc',
    'reconcil', 'bank', 'float', 'variance',
]


def _should_try_chart(question: str) -> bool:
    """Determine if we should attempt chart generation for this question."""
    q_lower = question.lower()
    # Always try if explicit chart keywords are present
    if any(w in q_lower for w in CHART_KEYWORDS):
        return True
    # Also try for data-oriented questions (they benefit from charts)
    if any(w in q_lower for w in DATA_VIZ_KEYWORDS):
        return True
    return False


def _prepare_dataframe_for_csv(df: pd.DataFrame) -> pd.DataFrame:
    """Clean DataFrame for safe CSV export — handle NaN, None, datetimes."""
    df = df.copy()
    # Convert datetime columns to string format
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            df[col] = df[col].dt.strftime('%Y-%m-%d')
    # Fill NaN/None with empty string to avoid CSV issues
    df = df.fillna('')
    return df


async def get_rcm_dataframe(db: AsyncSession, dataset: str = "denials") -> pd.DataFrame:
    """Extract RCM data as a pandas DataFrame for LIDA analysis.
    Uses DataFrame cache (TTL=5 min) to avoid redundant DB queries.
    """
    # FIX 4: Check DataFrame cache first
    key = dataset
    if key in _df_cache and (datetime.now() - _df_cache[key]['ts']).total_seconds() < 300:
        return _df_cache[key]['df']

    queries = {
        "denials": """
            SELECT d.denial_id, d.denial_category, d.carc_code, d.denial_amount,
                   d.denial_date, c.payer_id, pm.payer_name, pm.payer_group,
                   c.total_charges, c.status, c.date_of_service,
                   rca.primary_root_cause, rca.confidence_score, rca.root_cause_group
            FROM denials d
            JOIN claims c ON d.claim_id = c.claim_id
            JOIN payer_master pm ON c.payer_id = pm.payer_id
            LEFT JOIN root_cause_analysis rca ON d.denial_id = rca.denial_id
            ORDER BY d.denial_date DESC NULLS LAST LIMIT 5000
        """,
        "payments": """
            SELECT e.era_id, e.payment_amount, e.payment_date, e.allowed_amount,
                   e.co_amount, e.pr_amount, e.oa_amount,
                   pm.payer_name, pm.payer_group
            FROM era_payments e
            JOIN payer_master pm ON e.payer_id = pm.payer_id
            ORDER BY e.payment_date DESC NULLS LAST LIMIT 5000
        """,
        "claims": """
            SELECT c.claim_id, c.status, c.total_charges, c.date_of_service,
                   c.submission_date, c.crs_score, c.crs_passed,
                   pm.payer_name, pm.payer_group
            FROM claims c
            JOIN payer_master pm ON c.payer_id = pm.payer_id
            ORDER BY c.date_of_service DESC NULLS LAST LIMIT 5000
        """,
        "ar": """
            SELECT c.claim_id, c.total_charges, c.status, c.date_of_service,
                   c.submission_date, pm.payer_name,
                   CURRENT_DATE - c.date_of_service AS days_outstanding
            FROM claims c
            JOIN payer_master pm ON c.payer_id = pm.payer_id
            WHERE c.status NOT IN ('PAID', 'WRITTEN_OFF', 'VOIDED')
            ORDER BY c.date_of_service ASC NULLS LAST LIMIT 5000
        """,
        "reconciliation": """
            SELECT br.payer_name, br.era_received_amount, br.bank_deposit_amount,
                   br.era_bank_variance, br.reconciliation_status, br.float_days,
                   br.week_start_date
            FROM bank_reconciliation br
            ORDER BY br.week_start_date DESC NULLS LAST LIMIT 2000
        """
    }

    query = queries.get(dataset, queries["denials"])
    result = await db.execute(text(query))
    rows = result.all()
    columns = result.keys()
    df = pd.DataFrame(rows, columns=columns)

    # FIX 4: Store in DataFrame cache
    _df_cache[key] = {'df': df, 'ts': datetime.now()}
    return df


async def summarize_dataset(db: AsyncSession, dataset: str = "denials") -> dict:
    """Generate LIDA statistical summary of an RCM dataset."""
    manager = get_lida_manager()
    if not manager:
        return {"error": "LIDA not available", "available": False}

    df = await get_rcm_dataframe(db, dataset)
    if df.empty:
        return {"error": "No data", "dataset": dataset}

    # Save temp CSV for LIDA (with proper cleaning)
    import tempfile, os
    tmp = tempfile.NamedTemporaryFile(suffix='.csv', delete=False)
    clean_df = _prepare_dataframe_for_csv(df)
    clean_df.to_csv(tmp.name, index=False, date_format='%Y-%m-%d')

    try:
        summary = manager.summarize(tmp.name)
        return {
            "dataset": dataset,
            "rows": len(df),
            "columns": list(df.columns),
            "summary": summary.dict() if hasattr(summary, 'dict') else str(summary),
            "available": True
        }
    except Exception as e:
        logger.error(f"LIDA summarize failed: {e}")
        return {"error": str(e), "dataset": dataset, "available": True}
    finally:
        os.unlink(tmp.name)


async def generate_goals(db: AsyncSession, dataset: str = "denials", n: int = 5) -> dict:
    """Generate visualization goals from RCM data."""
    manager = get_lida_manager()
    if not manager:
        return {"error": "LIDA not available"}

    df = await get_rcm_dataframe(db, dataset)
    import tempfile, os
    tmp = tempfile.NamedTemporaryFile(suffix='.csv', delete=False)
    clean_df = _prepare_dataframe_for_csv(df)
    clean_df.to_csv(tmp.name, index=False, date_format='%Y-%m-%d')

    try:
        summary = manager.summarize(tmp.name)
        goals = manager.goals(summary, n=n)
        return {
            "dataset": dataset,
            "goals": [{"question": g.question, "visualization": g.visualization, "rationale": g.rationale} for g in goals]
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        os.unlink(tmp.name)


async def generate_visualization(db: AsyncSession, dataset: str = "denials", question: str = None) -> dict:
    """Generate a visualization for a specific question."""
    manager = get_lida_manager()
    df = await get_rcm_dataframe(db, dataset)

    if df.empty:
        return {"error": "No data", "dataset": dataset, "charts": []}

    # Try LIDA first if available
    lida_error = None
    if manager:
        import tempfile, os
        tmp = tempfile.NamedTemporaryFile(suffix='.csv', delete=False)
        clean_df = _prepare_dataframe_for_csv(df)
        clean_df.to_csv(tmp.name, index=False, date_format='%Y-%m-%d')

        try:
            summary = manager.summarize(tmp.name)

            if question:
                charts = manager.visualize(summary=summary, goal=question, library="seaborn")
            else:
                goals = manager.goals(summary, n=1)
                charts = manager.visualize(summary=summary, goal=goals[0], library="seaborn")

            results = []
            for chart in charts:
                raster = chart.raster if hasattr(chart, 'raster') else None
                results.append({
                    "code": chart.code if hasattr(chart, 'code') else str(chart),
                    "status": chart.status if hasattr(chart, 'status') else "generated",
                    "raster": raster,
                })

            # If LIDA returned charts with raster images, return them
            if results and any(r.get("raster") for r in results):
                return {"dataset": dataset, "question": question, "charts": results}
            else:
                lida_error = "LIDA returned no raster images"
                logger.warning(f"LIDA visualize returned empty rasters for: {question}")

        except Exception as e:
            lida_error = str(e)
            logger.error(f"LIDA visualize failed: {e}")
        finally:
            os.unlink(tmp.name)
    else:
        lida_error = "LIDA not available"

    # Fallback: generate chart with matplotlib
    logger.info(f"Falling back to matplotlib chart. LIDA error: {lida_error}")
    fallback_b64 = await _generate_fallback_chart(df, question or "Show data distribution")
    if fallback_b64:
        return {
            "dataset": dataset,
            "question": question,
            "charts": [{"raster": fallback_b64, "status": "fallback", "code": "matplotlib-fallback"}],
        }

    return {"dataset": dataset, "question": question, "charts": [], "error": lida_error}


def _pick_group_col(df: pd.DataFrame, question: str) -> Optional[str]:
    """Smart column selection based on question keywords."""
    q = question.lower()
    # Priority mapping: question keyword → preferred column names
    mappings = [
        (['payer', 'insurer', 'carrier'], ['payer_name', 'payer_group']),
        (['category', 'denial type', 'denial reason'], ['denial_category']),
        (['root cause', 'cause', 'why'], ['primary_root_cause', 'root_cause_group']),
        (['carc', 'code'], ['carc_code']),
        (['status'], ['status', 'reconciliation_status']),
        (['provider'], ['provider_name']),
        (['group'], ['payer_group', 'root_cause_group']),
    ]
    for keywords, col_names in mappings:
        if any(k in q for k in keywords):
            for col in col_names:
                if col in df.columns:
                    return col
    # Default: pick the most meaningful categorical column (not IDs)
    skip = {'denial_id', 'claim_id', 'era_id', 'payer_id', 'recon_id'}
    for col in df.select_dtypes(include='object').columns:
        if col not in skip and df[col].nunique() < 50:
            return col
    return None


def _pick_value_col(df: pd.DataFrame, question: str) -> Optional[str]:
    """Smart value column selection."""
    q = question.lower()
    if any(w in q for w in ['amount', 'revenue', 'dollar', 'cost', 'money', 'impact']):
        for col in ['denial_amount', 'total_charges', 'payment_amount', 'financial_impact',
                     'era_received_amount', 'bank_deposit_amount', 'allowed_amount']:
            if col in df.columns:
                return col
    if any(w in q for w in ['count', 'how many', 'number', 'volume']):
        return None  # Will use .count() instead of .sum()
    if any(w in q for w in ['confidence', 'score', 'accuracy']):
        for col in ['confidence_score', 'crs_score']:
            if col in df.columns:
                return col
    # Default: first dollar-amount column
    for col in ['denial_amount', 'payment_amount', 'total_charges']:
        if col in df.columns:
            return col
    num_cols = df.select_dtypes(include='number').columns.tolist()
    return num_cols[0] if num_cols else None


def _fmt_value(v: float) -> str:
    """Format large numbers for chart labels."""
    if abs(v) >= 1e6: return f'${v/1e6:.1f}M'
    if abs(v) >= 1e3: return f'${v/1e3:.0f}K'
    return f'${v:,.0f}'


async def _generate_fallback_chart(df: pd.DataFrame, question: str) -> Optional[str]:
    """Generate a data-driven chart from real DataFrame. Returns base64 PNG."""
    # FIX 1: Check response cache for chart
    cached = _get_cached(f"chart:{question}", "fallback")
    if cached:
        return cached

    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt

    try:
        fig, ax = plt.subplots(figsize=(12, 7))
        fig.patch.set_facecolor('#0f172a')
        ax.set_facecolor('#1e293b')

        q_lower = question.lower()
        group_col = _pick_group_col(df, question)
        value_col = _pick_value_col(df, question)
        date_cols = [c for c in df.columns if 'date' in c.lower()]
        chart_drawn = False

        colors_bar = ['#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#10b981',
                      '#f59e0b', '#ef4444', '#ec4899', '#a78bfa', '#818cf8']

        # TREND chart (time-series)
        if any(w in q_lower for w in ['trend', 'over time', 'monthly', 'weekly', 'timeline']):
            if date_cols:
                df_work = df.copy()
                date_col = date_cols[0]
                df_work[date_col] = pd.to_datetime(df_work[date_col], errors='coerce')
                df_sorted = df_work.dropna(subset=[date_col]).sort_values(date_col)
                if not df_sorted.empty:
                    df_sorted['_month'] = df_sorted[date_col].dt.to_period('M')
                    if value_col:
                        monthly = df_sorted.groupby('_month')[value_col].sum()
                        ylabel = value_col.replace('_', ' ').title()
                    else:
                        monthly = df_sorted.groupby('_month').size()
                        ylabel = 'Count'
                    x = range(len(monthly))
                    ax.fill_between(x, monthly.values, alpha=0.3, color='#6366f1')
                    ax.plot(x, monthly.values, color='#8b5cf6', linewidth=2.5, marker='o', markersize=5)
                    step = max(1, len(monthly) // 12)
                    ax.set_xticks(range(0, len(monthly), step))
                    ax.set_xticklabels([str(m) for m in monthly.index[::step]], color='#94a3b8', fontsize=9, rotation=45)
                    ax.set_ylabel(ylabel, color='#e2e8f0', fontsize=11)
                    ax.set_title(f'{ylabel} Over Time', color='white', fontsize=16, fontweight='bold', pad=15)
                    chart_drawn = True

        # BAR chart (categorical breakdown)
        if not chart_drawn and group_col:
            if value_col:
                grouped = df.groupby(group_col)[value_col].sum().sort_values(ascending=True).tail(10)
                ylabel = value_col.replace('_', ' ').title()
                use_dollar = any(w in value_col for w in ['amount', 'charges', 'payment', 'impact'])
            else:
                grouped = df.groupby(group_col).size().sort_values(ascending=True).tail(10)
                ylabel = 'Count'
                use_dollar = False

            if not grouped.empty:
                y_pos = range(len(grouped))
                bars = ax.barh(y_pos, grouped.values, color=colors_bar[:len(grouped)], height=0.7, edgecolor='none')
                ax.set_yticks(y_pos)
                labels = [str(l)[:30] for l in grouped.index]
                ax.set_yticklabels(labels, color='#e2e8f0', fontsize=10)
                ax.set_xlabel(ylabel, color='#e2e8f0', fontsize=11)

                # Add value labels on bars
                for bar, val in zip(bars, grouped.values):
                    label = _fmt_value(val) if use_dollar else f'{val:,.0f}'
                    ax.text(bar.get_width() + grouped.max() * 0.02, bar.get_y() + bar.get_height()/2,
                            label, va='center', color='#e2e8f0', fontsize=9, fontweight='bold')

                title_col = group_col.replace('_', ' ').title()
                ax.set_title(f'{ylabel} by {title_col}', color='white', fontsize=16, fontweight='bold', pad=15)
                ax.set_xlim(0, grouped.max() * 1.2)
                chart_drawn = True

        # Default: use denial_category or first meaningful categorical
        if not chart_drawn:
            for try_col in ['denial_category', 'primary_root_cause', 'payer_name', 'status']:
                if try_col in df.columns:
                    for try_val in ['denial_amount', 'payment_amount', 'total_charges']:
                        if try_val in df.columns:
                            grouped = df.groupby(try_col)[try_val].sum().sort_values(ascending=True).tail(10)
                            if not grouped.empty:
                                y_pos = range(len(grouped))
                                bars = ax.barh(y_pos, grouped.values, color=colors_bar[:len(grouped)], height=0.7)
                                ax.set_yticks(y_pos)
                                ax.set_yticklabels([str(l)[:30] for l in grouped.index], color='#e2e8f0', fontsize=10)
                                for bar, val in zip(bars, grouped.values):
                                    ax.text(bar.get_width() + grouped.max() * 0.02, bar.get_y() + bar.get_height()/2,
                                            _fmt_value(val), va='center', color='#e2e8f0', fontsize=9, fontweight='bold')
                                title = f'{try_val.replace("_"," ").title()} by {try_col.replace("_"," ").title()}'
                                ax.set_title(title, color='white', fontsize=16, fontweight='bold', pad=15)
                                ax.set_xlim(0, grouped.max() * 1.2)
                                chart_drawn = True
                                break
                if chart_drawn:
                    break

        if not chart_drawn:
            plt.close(fig)
            return None

        # Professional dark styling
        ax.tick_params(colors='#94a3b8', labelsize=9)
        ax.xaxis.label.set_color('#e2e8f0')
        for spine in ax.spines.values():
            spine.set_color('#334155')
        ax.grid(axis='x', color='#334155', alpha=0.5, linewidth=0.5)

        # Add NEXUS RCM watermark
        fig.text(0.99, 0.01, 'NEXUS RCM · LIDA Analytics', ha='right', va='bottom',
                 fontsize=8, color='#475569', style='italic')

        plt.tight_layout()
        buf = io.BytesIO()
        fig.savefig(buf, format='png', dpi=120, bbox_inches='tight', facecolor=fig.get_facecolor())
        plt.close(fig)
        buf.seek(0)
        result_b64 = base64.b64encode(buf.read()).decode('utf-8')

        # FIX 1: Cache the chart result
        _set_cache(f"chart:{question}", "fallback", result_b64)
        return result_b64

    except Exception as e:
        logger.error(f"Fallback chart failed: {e}")
        return None


async def answer_question(db: AsyncSession, question: str, dataset: str = "auto") -> dict:
    """Answer a natural language question about RCM data using our ontology + LIDA."""

    # Step 1: Auto-detect dataset FIRST (needed for cache key)
    if dataset == "auto":
        q_lower = question.lower()
        if any(w in q_lower for w in ['denial', 'denied', 'carc', 'root cause', 'appeal', 'deny', 'payer denial', 'payer denies']):
            dataset = "denials"
        elif any(w in q_lower for w in ['payment', 'era', 'paid', 'reimbursement', 'underpay', 'payer', 'insurer', 'top payer']):
            dataset = "payments"
        elif any(w in q_lower for w in ['ar aging', ' ar ', 'aging', 'outstanding', 'days in ar', 'a/r']):
            dataset = "ar"
        elif any(w in q_lower for w in ['reconcil', 'bank', 'float', 'variance', 'era-bank']):
            dataset = "reconciliation"
        else:
            dataset = "claims"

    # Step 2: Check cache
    cached = _get_cached(question, dataset)
    if cached:
        logger.info(f"Cache hit for question: {question[:60]}...")
        return cached

    # Step 3: Intercept standard report requests — instant, no LLM needed
    try:
        from app.services.report_templates import detect_report_type, generate_report, _format_report_as_text
        report_type = detect_report_type(question)
        if report_type:
            logger.info(f"Detected report request: {report_type}")
            report = await generate_report(db, report_type)
            if "error" not in report:
                result = {
                    "question": question,
                    "answer": _format_report_as_text(report),
                    "dataset_used": report_type,
                    "visualization": None,
                    "chart": None,
                    "ontology_context": True,
                    "ontology_enriched": True,
                    "report_data": report,
                }
                _set_cache(question, dataset, result)
                return result
    except Exception as e:
        logger.warning(f"Report template failed: {e}")

    # Step 3.5: Detect root cause / WHY questions — use dedicated engine
    if _is_root_cause_question(question):
        try:
            from app.services.root_cause_search import search_root_cause
            rc_result = await search_root_cause(db, question)
            if rc_result and rc_result.get('root_causes'):
                result = {
                    "question": question,
                    "answer": rc_result['formatted_answer'],
                    "dataset_used": dataset,
                    "method": "root_cause_search",
                    "root_causes": rc_result['root_causes'],
                    "context_data": rc_result.get('context_data', {}),
                    "suggested_actions": rc_result.get('suggested_actions', []),
                    "follow_up_questions": rc_result.get('follow_up_questions', []),
                    "entity": rc_result.get('entity', {}),
                    "ontology_context": True,
                }
                _set_cache(question, dataset, result)
                return result
        except Exception as e:
            logger.warning(f"Root cause search failed, falling through: {e}")

    # FIX 3: Classify intent complexity
    intent = _classify_intent(question)

    # Step 4: Try Text-to-SQL only for complex questions (skip for simple ones
    # to avoid wasting time on an LLM call that would timeout and block the
    # subsequent LLM call due to Ollama's sequential processing)
    if intent != 'simple':
        try:
            from app.services.text_to_sql import generate_and_execute_sql
            sql_result = await generate_and_execute_sql(db, question)
            if sql_result.get('success'):
                answer = sql_result['formatted_answer']
                result = {
                    "question": question,
                    "answer": answer,
                    "dataset_used": dataset,
                    "method": sql_result['method'],
                    "sql": sql_result.get('sql'),
                    "row_count": sql_result.get('row_count'),
                    "ontology_context": False,
                }
                _set_cache(question, dataset, result)
                return result
        except Exception as e:
            logger.warning(f"Text-to-SQL failed: {e}")
    max_tokens = _INTENT_MAX_TOKENS[intent]

    # FIX 2: Use ontology-aware context, fall back to pre-computed stats
    try:
        from app.services.ontology_context import build_chat_context
        ontology_context = await build_chat_context(db, question)
        if not ontology_context:
            ontology_context = await _get_precomputed_stats(db)
    except Exception as _oc_err:
        logger.warning("Ontology context failed, using precomputed stats: %s", _oc_err)
        ontology_context = await _get_precomputed_stats(db)

    # FIX 3: Adjust prompt based on complexity
    import httpx
    try:
        if intent == 'simple':
            prompt = f"""You are an RCM (Revenue Cycle Management) analytics assistant. Use ONLY the data context below to answer. Be concise and cite specific numbers.

RCM DATA CONTEXT:
{ontology_context}

QUESTION: {question}

DIRECT ANSWER:"""
        elif intent == 'complex':
            prompt = f"""You are an RCM (Revenue Cycle Management) analytics assistant. Use ONLY the data context below. Provide a thorough answer with specific numbers, bullet points, and actionable insights.

RCM DATA CONTEXT:
{ontology_context}

QUESTION: {question}

DETAILED ANSWER:"""
        else:
            prompt = f"""You are an RCM (Revenue Cycle Management) analytics assistant. Use ONLY the data context below to answer. Include specific numbers where available.

RCM DATA CONTEXT:
{ontology_context}

QUESTION: {question}

ANSWER:"""

        model_name = os.environ.get("OLLAMA_MODEL", "qwen3:4b")
        is_qwen3 = "qwen3" in model_name.lower()

        async with _ollama_semaphore:
          async with httpx.AsyncClient(timeout=45) as client:
            if is_qwen3:
                # Qwen3 via chat API: use thinking=false to disable reasoning
                resp = await client.post("http://localhost:11434/api/chat", json={
                    "model": model_name,
                    "messages": [{"role": "user", "content": prompt}],
                    "stream": False,
                    "think": False,
                    "options": {
                        "temperature": _INTENT_TEMPERATURE[intent],
                        "num_predict": max_tokens,
                    }
                })
                llm_resp = resp.json()
                answer_text = llm_resp.get("message", {}).get("content", "Unable to generate answer").strip()
            else:
                # Non-Qwen3 models: use generate API
                resp = await client.post("http://localhost:11434/api/generate", json={
                    "model": model_name,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": _INTENT_TEMPERATURE[intent],
                        "num_predict": max_tokens,
                    }
                })
                llm_resp = resp.json()
                answer_text = llm_resp.get("response", "Unable to generate answer").strip()

            # Strip any thinking tags
            if "<think>" in answer_text:
                answer_text = re.sub(r'<think>.*?</think>\s*', '', answer_text, flags=re.DOTALL).strip()

            # Qwen3 with think=false leaks reasoning into content.
            # Remove reasoning noise and extract the factual answer.
            if is_qwen3 and answer_text:
                # Remove reasoning sentences (lines that are clearly thinking aloud)
                lines = answer_text.split('\n')
                clean_lines = []
                reasoning_patterns = [
                    'okay', 'ok,', 'let me', 'hmm', 'first i', 'i need',
                    'the user', 'alright', 'so,', 'let\'s', 'wait,',
                    'actually,', 'hold on', 'now,', 'looking at',
                    'i should', 'i\'ll', 'so the', 'but wait',
                    'let me check', 'let me re', 'the question',
                ]
                for line in lines:
                    stripped = line.strip().lower()
                    if not stripped:
                        clean_lines.append(line)
                        continue
                    # Skip lines that are clearly reasoning
                    is_reasoning = any(stripped.startswith(p) for p in reasoning_patterns)
                    if not is_reasoning:
                        clean_lines.append(line)
                answer_text = '\n'.join(clean_lines).strip()
                # Remove any empty leading lines
                answer_text = answer_text.lstrip('\n').strip()

            logger.info(f"LLM answer (first 200 chars): {answer_text[:200]}")
            logger.info(f"LLM eval_ms: {llm_resp.get('eval_duration', 0) // 1000000}")
    except Exception as e:
        logger.error(f"LLM call failed: {type(e).__name__}: {str(e)}", exc_info=True)
        answer_text = f"LLM unavailable: {type(e).__name__}: {str(e)}"

    # Skip chart in ask() — use /lida/chart endpoint separately for charts
    viz = None
    chart_b64 = None
    if _should_try_chart(question):
        try:
            viz = await generate_visualization(db, dataset, question)
            # Extract the raster from the first chart if available
            if viz and viz.get("charts"):
                chart_b64 = viz["charts"][0].get("raster")
        except Exception as e:
            logger.warning(f"Inline chart generation skipped: {e}")

    result = {
        "question": question,
        "answer": answer_text,
        "dataset_used": dataset,
        "visualization": viz,
        "chart": chart_b64,  # Direct base64 for easy frontend access
        "ontology_context": bool(ontology_context),
        "ontology_enriched": bool(ontology_context),
        "intent_complexity": intent,
    }

    # FIX 1: Cache the successful response
    _set_cache(question, dataset, result)

    return result
