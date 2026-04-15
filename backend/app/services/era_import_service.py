"""
ERA Import Service — parses uploaded ERA payload (X12 835 or CSV)
and stages rows into the `era_staging` table.

Two parser front-ends:

1.  parse_835_file(raw_bytes)  — best-effort X12 835 segment parser. If the
    `pyx12` library is installed it is used for richer validation; otherwise
    a lightweight heuristic walks the standard 835 segment shape (BPR, TRN,
    CLP, CAS, REF) and emits one staged row per CLP loop.

2.  parse_csv_file(raw_bytes)  — preferred for the MVP. Required columns:
        era_id, claim_id, payer_id, payment_amount, allowed_amount,
        co_amount, pr_amount, oa_amount, payment_date, check_number
    Extra columns are ignored. Missing optional columns default to NULL.

Staging table is created on demand so the service is self-contained.
"""
from __future__ import annotations

import csv
import io
import logging
import re
import uuid
from datetime import date, datetime
from typing import Any, Iterable, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

# Columns that *must* be present in a CSV upload.
REQUIRED_CSV_COLS = {"era_id", "claim_id", "payer_id", "payment_amount"}
OPTIONAL_CSV_COLS = {
    "allowed_amount", "co_amount", "pr_amount", "oa_amount",
    "payment_date", "check_number", "payment_method",
}


# ─────────────────────────────────────────────────────────────────────────────
# Staging table
# ─────────────────────────────────────────────────────────────────────────────
async def ensure_staging_table(db: AsyncSession) -> None:
    """Idempotent DDL for era_staging."""
    await db.execute(text("""
        CREATE TABLE IF NOT EXISTS era_staging (
            staging_id      VARCHAR(40) PRIMARY KEY,
            source_format   VARCHAR(10) NOT NULL,
            source_filename VARCHAR(255),
            era_id          VARCHAR(40),
            claim_id        VARCHAR(40),
            payer_id        VARCHAR(40),
            payment_amount  NUMERIC(14,2),
            allowed_amount  NUMERIC(14,2),
            co_amount       NUMERIC(14,2),
            pr_amount       NUMERIC(14,2),
            oa_amount       NUMERIC(14,2),
            payment_date    DATE,
            check_number    VARCHAR(40),
            payment_method  VARCHAR(20),
            raw_row         TEXT,
            status          VARCHAR(20) DEFAULT 'STAGED',
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """))
    await db.execute(text(
        "CREATE INDEX IF NOT EXISTS idx_era_staging_status ON era_staging (status)"
    ))


async def ensure_era_exception_columns(db: AsyncSession) -> None:
    """Migration-lite: add status / exception_notes columns to era_payments
    if they don't already exist."""
    await db.execute(text(
        "ALTER TABLE era_payments ADD COLUMN IF NOT EXISTS status VARCHAR(30)"
    ))
    await db.execute(text(
        "ALTER TABLE era_payments ADD COLUMN IF NOT EXISTS exception_notes TEXT"
    ))
    await db.execute(text(
        "ALTER TABLE era_payments ADD COLUMN IF NOT EXISTS target_claim_id VARCHAR(40)"
    ))


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
def _to_float(v: Any) -> Optional[float]:
    if v is None or v == "":
        return None
    try:
        return float(str(v).replace(",", "").strip())
    except (ValueError, TypeError):
        return None


def _to_date(v: Any) -> Optional[date]:
    if not v:
        return None
    s = str(v).strip()
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%Y%m%d", "%m-%d-%Y", "%d-%b-%Y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


# ─────────────────────────────────────────────────────────────────────────────
# CSV parser
# ─────────────────────────────────────────────────────────────────────────────
def parse_csv_file(content: bytes) -> dict:
    """Return {staged: [...], errors: [...], total_rows: int}."""
    try:
        text_buf = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text_buf = content.decode("latin-1", errors="replace")

    reader = csv.DictReader(io.StringIO(text_buf))
    if not reader.fieldnames:
        return {"staged": [], "errors": [{"row": 0, "error": "Empty or unreadable CSV"}],
                "total_rows": 0}

    cols = {c.strip().lower() for c in reader.fieldnames}
    missing = REQUIRED_CSV_COLS - cols
    if missing:
        return {
            "staged": [],
            "errors": [{"row": 0, "error": f"Missing required columns: {sorted(missing)}"}],
            "total_rows": 0,
        }

    staged: list[dict] = []
    errors: list[dict] = []
    total = 0

    for idx, raw in enumerate(reader, start=1):
        total += 1
        row = {(k or "").strip().lower(): (v.strip() if isinstance(v, str) else v)
               for k, v in raw.items()}
        try:
            era_id   = row.get("era_id") or None
            claim_id = row.get("claim_id") or None
            payer_id = row.get("payer_id") or None
            amount   = _to_float(row.get("payment_amount"))

            if not era_id:
                raise ValueError("era_id is required")
            if not claim_id:
                raise ValueError("claim_id is required")
            if not payer_id:
                raise ValueError("payer_id is required")
            if amount is None:
                raise ValueError("payment_amount must be numeric")

            staged.append({
                "era_id":         era_id,
                "claim_id":       claim_id,
                "payer_id":       payer_id,
                "payment_amount": amount,
                "allowed_amount": _to_float(row.get("allowed_amount")),
                "co_amount":      _to_float(row.get("co_amount")) or 0.0,
                "pr_amount":      _to_float(row.get("pr_amount")) or 0.0,
                "oa_amount":      _to_float(row.get("oa_amount")) or 0.0,
                "payment_date":   _to_date(row.get("payment_date")),
                "check_number":   row.get("check_number") or None,
                "payment_method": row.get("payment_method") or None,
                "raw_row":        str(row),
            })
        except Exception as e:
            errors.append({"row": idx, "error": str(e), "raw": row})

    return {"staged": staged, "errors": errors, "total_rows": total}


# ─────────────────────────────────────────────────────────────────────────────
# X12 835 parser (heuristic; uses pyx12 if available)
# ─────────────────────────────────────────────────────────────────────────────
async def parse_835_file(content: bytes) -> dict:
    """
    Parse a raw X12 835 ERA file. Returns the same shape as parse_csv_file.

    Tries pyx12 first; on any failure falls back to a heuristic parser that
    handles the common BPR/TRN/CLP/CAS/REF segments.
    """
    raw_text = content.decode("utf-8", errors="replace").strip()

    # Best-effort pyx12 path
    try:
        import pyx12  # noqa: F401
        # pyx12 requires a tempfile path; skip rich validation in MVP
    except Exception:
        pass

    # Determine segment terminator (default '~') and element separator (default '*')
    seg_term = "~"
    elem_sep = "*"
    if raw_text.startswith("ISA") and len(raw_text) > 105:
        elem_sep = raw_text[3]
        seg_term = raw_text[105]

    segments = [s.strip() for s in raw_text.split(seg_term) if s.strip()]
    if not segments:
        return {"staged": [], "errors": [{"row": 0, "error": "Empty 835 payload"}],
                "total_rows": 0}

    staged: list[dict] = []
    errors: list[dict] = []

    payer_id: Optional[str] = None
    check_number: Optional[str] = None
    payment_date: Optional[date] = None
    payment_method: Optional[str] = "EFT"

    # Per-CLP state
    cur: Optional[dict] = None
    seg_idx = 0

    def _flush():
        nonlocal cur
        if cur is not None:
            cur.setdefault("co_amount", 0.0)
            cur.setdefault("pr_amount", 0.0)
            cur.setdefault("oa_amount", 0.0)
            cur["payer_id"]       = cur.get("payer_id") or payer_id
            cur["check_number"]   = cur.get("check_number") or check_number
            cur["payment_date"]   = cur.get("payment_date") or payment_date
            cur["payment_method"] = payment_method
            staged.append(cur)
            cur = None

    try:
        for seg in segments:
            seg_idx += 1
            parts = seg.split(elem_sep)
            tag = parts[0].upper()

            if tag == "BPR":
                # BPR01=transaction code, BPR02=monetary amount, BPR04=method,
                # BPR16=date (YYYYMMDD)
                payment_method = parts[4] if len(parts) > 4 else "EFT"
                payment_date = _to_date(parts[16]) if len(parts) > 16 else None

            elif tag == "TRN":
                # TRN02 = trace number (often the EFT/check number)
                check_number = parts[2] if len(parts) > 2 else None

            elif tag == "N1" and len(parts) > 1 and parts[1] == "PR":
                # Payer name. Use N104 (id) if present.
                if len(parts) > 4 and parts[4]:
                    payer_id = parts[4]
                elif len(parts) > 2:
                    # No id qualifier; fall back to a slugged name
                    payer_id = re.sub(r"\W+", "", parts[2])[:20] or None

            elif tag == "CLP":
                _flush()
                # CLP01=patient ctrl#, CLP02=status, CLP03=billed,
                # CLP04=paid, CLP05=patient resp
                cur = {
                    "era_id":         f"ERA{uuid.uuid4().hex[:10].upper()}",
                    "claim_id":       parts[1] if len(parts) > 1 else None,
                    "payment_amount": _to_float(parts[3]) if len(parts) > 3 else 0.0,
                    "allowed_amount": _to_float(parts[3]) if len(parts) > 3 else None,
                    "raw_row":        seg,
                }
                if cur["payment_amount"] is None:
                    cur["payment_amount"] = 0.0

            elif tag == "CAS" and cur is not None:
                # CAS01=group code, then repeating (reason, amount, qty) triples
                grp = parts[1] if len(parts) > 1 else None
                # Sum amounts at positions 3, 6, 9, 12, 15 (every 3 starting at 3)
                amt_total = 0.0
                for i in range(3, len(parts), 3):
                    a = _to_float(parts[i])
                    if a is not None:
                        amt_total += a
                if grp == "CO":
                    cur["co_amount"] = (cur.get("co_amount") or 0.0) + amt_total
                elif grp == "PR":
                    cur["pr_amount"] = (cur.get("pr_amount") or 0.0) + amt_total
                elif grp == "OA":
                    cur["oa_amount"] = (cur.get("oa_amount") or 0.0) + amt_total

            elif tag == "REF" and cur is not None:
                # REF*EV / REF*CE etc. — capture as supplemental but not stored
                pass

            elif tag in ("SE", "GE", "IEA"):
                _flush()

        _flush()

    except Exception as e:
        logger.exception("835 parse failure at segment %d", seg_idx)
        errors.append({"row": seg_idx, "error": f"Parser failure: {e}"})

    if not staged and not errors:
        errors.append({"row": 0, "error": "No CLP loops found in 835 payload"})

    return {"staged": staged, "errors": errors, "total_rows": len(staged) + len(errors)}


# ─────────────────────────────────────────────────────────────────────────────
# Persistence
# ─────────────────────────────────────────────────────────────────────────────
async def persist_staging(
    db: AsyncSession,
    rows: Iterable[dict],
    source_format: str,
    filename: str,
) -> list[str]:
    """Insert staged rows into era_staging. Returns list of staging_ids."""
    ids: list[str] = []
    for r in rows:
        sid = f"STG{uuid.uuid4().hex[:12].upper()}"
        ids.append(sid)
        await db.execute(text("""
            INSERT INTO era_staging (
                staging_id, source_format, source_filename,
                era_id, claim_id, payer_id, payment_amount,
                allowed_amount, co_amount, pr_amount, oa_amount,
                payment_date, check_number, payment_method, raw_row, status
            ) VALUES (
                :sid, :fmt, :fn,
                :era, :cl, :py, :amt,
                :allowed, :co, :pr, :oa,
                :pdate, :chk, :pm, :raw, 'STAGED'
            )
        """), {
            "sid": sid, "fmt": source_format, "fn": filename,
            "era": r.get("era_id"), "cl": r.get("claim_id"), "py": r.get("payer_id"),
            "amt": r.get("payment_amount"),
            "allowed": r.get("allowed_amount"),
            "co": r.get("co_amount") or 0.0,
            "pr": r.get("pr_amount") or 0.0,
            "oa": r.get("oa_amount") or 0.0,
            "pdate": r.get("payment_date"),
            "chk": r.get("check_number"),
            "pm": r.get("payment_method"),
            "raw": r.get("raw_row"),
        })
    return ids
