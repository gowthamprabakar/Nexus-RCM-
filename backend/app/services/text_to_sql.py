"""
Intelligent Text-to-SQL — LLM-Powered Query Generation
========================================================
Uses Ollama to convert ANY natural language question into SQL.
No templates, no pattern matching — pure LLM intelligence with
schema context. Results are always from the real database.
"""
import os
import logging
import re
import hashlib
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

logger = logging.getLogger(__name__)

# Cache for generated SQL + results
_sql_cache = {}
_SQL_CACHE_TTL = 300  # 5 minutes

# Complete database schema for Ollama
DB_SCHEMA = """
PostgreSQL Database Schema for Revenue Cycle Management (RCM):

TABLE claims (500,000 rows):
  claim_id VARCHAR PRIMARY KEY
  patient_id VARCHAR → patients.patient_id
  payer_id VARCHAR → payer_master.payer_id
  provider_id VARCHAR → providers.provider_id
  date_of_service DATE
  submission_date DATE (can be NULL)
  total_charges FLOAT (billed amount in dollars)
  status VARCHAR: DRAFT, SUBMITTED, ACKNOWLEDGED, DENIED, PAID, WRITTEN_OFF, VOIDED
  crs_score INTEGER (0-100, claim risk score)
  crs_passed BOOLEAN

TABLE denials (56,426 rows):
  denial_id VARCHAR PRIMARY KEY
  claim_id VARCHAR → claims.claim_id
  denial_category VARCHAR: CODING, ELIGIBILITY, AUTHORIZATION, TIMELY_FILING, NON_COVERED, COB
  carc_code VARCHAR: CO-4, CO-11, CO-16, CO-18, CO-22, CO-29, CO-45, CO-50, CO-96, CO-97, CO-109, CO-119, CO-167, CO-197, PR-1, PR-2, PR-3
  denial_amount FLOAT (dollars denied)
  denial_date DATE
  root_cause_status VARCHAR: PENDING, ANALYZED
  root_cause_id VARCHAR → root_cause_analysis.rca_id

TABLE root_cause_analysis (56,426 rows):
  rca_id VARCHAR PRIMARY KEY
  denial_id VARCHAR → denials.denial_id
  claim_id VARCHAR → claims.claim_id
  payer_id VARCHAR → payer_master.payer_id
  primary_root_cause VARCHAR: MODIFIER_MISMATCH, BUNDLING_ERROR, ELIGIBILITY_LAPSE, TIMELY_FILING_MISS, AUTH_MISSING, AUTH_EXPIRED, COB_ORDER_ERROR, PAYER_BEHAVIOR_SHIFT, PROCESS_BREAKDOWN, MEDICAL_NECESSITY, DUPLICATE_CLAIM, DOCUMENTATION_DEFICIT, CONTRACT_RATE_GAP, PROVIDER_ENROLLMENT
  secondary_root_cause VARCHAR (same values as primary)
  root_cause_group VARCHAR: PROCESS, PREVENTABLE, PAYER, CLINICAL
  confidence_score INTEGER (0-95)
  financial_impact FLOAT (dollars)
  resolution_path TEXT

TABLE era_payments (315,486 rows):
  era_id VARCHAR PRIMARY KEY
  claim_id VARCHAR → claims.claim_id
  payer_id VARCHAR → payer_master.payer_id
  payment_amount FLOAT (dollars paid)
  payment_date DATE
  allowed_amount FLOAT
  co_amount FLOAT (contractual obligation adjustment)
  pr_amount FLOAT (patient responsibility)
  oa_amount FLOAT (other adjustment)

TABLE bank_reconciliation (2,797 rows):
  recon_id VARCHAR PRIMARY KEY
  payer_id VARCHAR → payer_master.payer_id
  payer_name VARCHAR
  era_received_amount FLOAT
  bank_deposit_amount FLOAT
  era_bank_variance FLOAT
  reconciliation_status VARCHAR: RECONCILED, VARIANCE
  float_days INTEGER
  week_start_date DATE

TABLE payer_master (50 rows):
  payer_id VARCHAR PRIMARY KEY
  payer_name VARCHAR (e.g., 'UnitedHealthcare (UHC)', 'Medicare FFS (CMS)', 'Humana Commercial')
  payer_group VARCHAR (e.g., G1_FEDERAL_FFS, G2_MEDICARE_ADVANTAGE, G3_COMMERCIAL_NATIONAL)
  denial_rate FLOAT
  adtp_days INTEGER (average days to pay)

TABLE providers (200 rows):
  provider_id VARCHAR PRIMARY KEY
  provider_name VARCHAR
  specialty VARCHAR
  npi VARCHAR

TABLE patients (50,000 rows):
  patient_id VARCHAR PRIMARY KEY
  first_name VARCHAR
  last_name VARCHAR

TABLE claim_lines (1,250,173 rows):
  line_id VARCHAR PRIMARY KEY
  claim_id VARCHAR → claims.claim_id
  cpt_code VARCHAR (procedure code)
  icd10_primary VARCHAR (diagnosis code)
  modifier VARCHAR
  units INTEGER
  charge_amount FLOAT

TABLE payer_contract_rate (800 rows):
  contract_rate_id VARCHAR PRIMARY KEY
  payer_id VARCHAR → payer_master.payer_id
  cpt_code VARCHAR
  expected_rate FLOAT

TABLE eligibility_271 (40,000 rows):
  elig_id VARCHAR PRIMARY KEY
  patient_id VARCHAR
  payer_id VARCHAR
  subscriber_status VARCHAR: ACTIVE, INACTIVE, TERMINATED, NOT_FOUND

TABLE prior_auth (131,445 rows):
  auth_id VARCHAR PRIMARY KEY
  claim_id VARCHAR → claims.claim_id
  status VARCHAR: APPROVED, DENIED, EXPIRED, PENDING
  expiry_date DATE
  denial_reason TEXT

TABLE appeals (24,827 rows):
  appeal_id VARCHAR PRIMARY KEY
  denial_id VARCHAR → denials.denial_id
  status VARCHAR: SUBMITTED, APPROVED, DENIED, PENDING
  outcome_date DATE
  recovered_amount FLOAT

COMMON JOINS:
  denials → claims: denials.claim_id = claims.claim_id
  claims → payer_master: claims.payer_id = payer_master.payer_id
  claims → providers: claims.provider_id = providers.provider_id
  root_cause_analysis → denials: root_cause_analysis.denial_id = denials.denial_id
  era_payments → payer_master: era_payments.payer_id = payer_master.payer_id
  claim_lines → claims: claim_lines.claim_id = claims.claim_id

IMPORTANT NOTES:
  - Use ::bigint for sum() to avoid overflow on large dollar amounts
  - Always add LIMIT (max 50) for safety
  - denial_amount and payment_amount are in dollars (FLOAT)
  - Use GROUP BY with aggregate functions
  - For percentage calculations, cast as FLOAT before dividing
"""


async def generate_and_execute_sql(db: AsyncSession, question: str) -> dict:
    """
    Use Ollama to generate SQL from natural language, then execute it.
    Caches results for 5 minutes.
    """
    # Check cache
    cache_key = hashlib.md5(question.lower().strip().encode()).hexdigest()
    if cache_key in _sql_cache:
        entry = _sql_cache[cache_key]
        if (datetime.now() - entry['ts']).total_seconds() < _SQL_CACHE_TTL:
            cached = entry['data'].copy()
            cached['from_cache'] = True
            return cached

    # Generate SQL via Ollama
    import httpx

    prompt = f"""Generate a PostgreSQL SELECT query. Return ONLY SQL, no explanation.

{DB_SCHEMA}

RULES: Use ::bigint for sum(). LIMIT 50. ORDER BY DESC for "top"/"highest". ROUND for percentages.

QUESTION: {question}

SELECT"""

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post("http://localhost:11434/api/generate", json={
                "model": os.environ.get("OLLAMA_MODEL", "qwen3:4b"),
                "prompt": prompt,
                "stream": False,
                "raw": True,
                "options": {"temperature": 0.1, "num_predict": 500}
            })
            raw_sql = resp.json().get("response", "").strip()
    except Exception as e:
        return {"success": False, "error": f"Ollama unavailable: {e}", "method": "llm_sql"}

    # Clean the SQL
    sql = _clean_generated_sql(raw_sql)

    if not sql:
        return {"success": False, "error": "Could not generate valid SQL", "raw": raw_sql, "method": "llm_sql"}

    # Safety check — SELECT only
    sql_upper = sql.upper().strip()
    if not sql_upper.startswith('SELECT'):
        return {"success": False, "error": "Only SELECT queries allowed", "sql": sql, "method": "llm_sql"}

    dangerous = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'CREATE', 'GRANT']
    for word in dangerous:
        if f' {word} ' in f' {sql_upper} ' or sql_upper.startswith(word):
            return {"success": False, "error": f"Dangerous operation detected: {word}", "method": "llm_sql"}

    # Add LIMIT if missing
    if 'LIMIT' not in sql_upper:
        sql += ' LIMIT 50'

    # Execute
    try:
        result = await db.execute(text(sql))
        rows = result.all()
        columns = list(result.keys())

        # Serialize results
        serialized_rows = []
        for row in rows:
            serialized_rows.append({col: _safe_serialize(val) for col, val in zip(columns, row)})

        # Format as readable text
        formatted = _format_results_as_text(columns, rows, question)

        response = {
            "success": True,
            "method": "llm_sql",
            "question": question,
            "sql": sql,
            "columns": columns,
            "results": serialized_rows,
            "row_count": len(rows),
            "formatted_answer": formatted,
            "from_cache": False,
        }

        # Cache it
        _sql_cache[cache_key] = {'data': response, 'ts': datetime.now()}

        return response

    except Exception as e:
        error_msg = str(e)
        # Try to extract the useful part of the error
        if 'UndefinedColumn' in error_msg:
            error_msg = f"Column not found in database. SQL: {sql}"
        elif 'UndefinedTable' in error_msg:
            error_msg = f"Table not found in database. SQL: {sql}"

        return {"success": False, "error": error_msg, "sql": sql, "method": "llm_sql"}


# Backward-compatible alias for existing callers
async def execute_text_to_sql(db: AsyncSession, question: str) -> dict:
    """Alias for generate_and_execute_sql (backward compatibility)."""
    return await generate_and_execute_sql(db, question)


def _clean_generated_sql(raw: str) -> Optional[str]:
    """Extract clean SQL from LLM output. Simple approach — don't over-filter."""
    if not raw:
        return None

    # Remove markdown code blocks
    raw = re.sub(r'```sql\s*\n?', '', raw)
    raw = re.sub(r'```\s*', '', raw)

    # Find SELECT and take everything from there
    match = re.search(r'(SELECT\s.+)', raw, re.IGNORECASE | re.DOTALL)
    if not match:
        return None
    sql = match.group(1)

    # Take first statement only (split on semicolon)
    if ';' in sql:
        sql = sql.split(';')[0]

    # Remove trailing natural language (starts with common English words)
    lines = sql.split('\n')
    clean_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped and re.match(r'^(This |Note:|The above|Here |In this|I |It |You |We |Let me)', stripped, re.IGNORECASE):
            break
        clean_lines.append(line)

    result = '\n'.join(clean_lines).strip()
    return result if result and len(result) > 10 else None


def _safe_serialize(val):
    """Make any value JSON-serializable."""
    if val is None: return None
    if isinstance(val, (int, float, str, bool)): return val
    if isinstance(val, bytes): return val.decode('utf-8', errors='replace')
    return str(val)


def _format_results_as_text(columns: list, rows: list, question: str) -> str:
    """Format SQL results as human-readable text."""
    if not rows:
        return "No results found."

    lines = []

    # Single row, single value — direct answer
    if len(rows) == 1 and len(columns) == 1:
        val = rows[0][0]
        if isinstance(val, (int, float)) and abs(val) > 1000:
            lines.append(f"{columns[0]}: ${val:,.0f}" if abs(val) > 10000 else f"{columns[0]}: {val:,.0f}")
        else:
            lines.append(f"{columns[0]}: {val}")
        return '\n'.join(lines)

    # Single row, multiple values — key-value format
    if len(rows) == 1:
        for col, val in zip(columns, rows[0]):
            if val is None: continue
            if isinstance(val, (int, float)) and abs(val) > 10000:
                lines.append(f"  {col}: ${val:,.0f}")
            elif isinstance(val, (int, float)):
                lines.append(f"  {col}: {val:,.1f}" if isinstance(val, float) else f"  {col}: {val:,}")
            else:
                lines.append(f"  {col}: {val}")
        return '\n'.join(lines)

    # Multiple rows — table format
    # Determine column widths
    col_widths = [len(str(c)) for c in columns]
    formatted_rows = []
    for row in rows[:30]:
        formatted_row = []
        for i, val in enumerate(row):
            if val is None:
                s = '--'
            elif isinstance(val, float) and abs(val) > 10000:
                s = f'${val:,.0f}'
            elif isinstance(val, float):
                s = f'{val:,.1f}'
            elif isinstance(val, int) and abs(val) > 1000:
                s = f'{val:,}'
            else:
                s = str(val)[:35]
            formatted_row.append(s)
            col_widths[i] = max(col_widths[i], len(s))
        formatted_rows.append(formatted_row)

    # Header
    header = ' | '.join(col.ljust(col_widths[i]) for i, col in enumerate(columns))
    lines.append(header)
    lines.append('-' * len(header))

    # Rows
    for row in formatted_rows:
        lines.append(' | '.join(val.ljust(col_widths[i]) for i, val in enumerate(row)))

    if len(rows) > 30:
        lines.append(f'... and {len(rows) - 30} more rows')

    return '\n'.join(lines)
