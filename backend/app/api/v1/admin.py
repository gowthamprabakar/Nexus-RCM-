"""
Sprint 20 — Admin Router
System health, ETL status, and user management endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any
from datetime import datetime

from app.core.deps import get_db

router = APIRouter()

# Tables to track for ETL status
TRACKED_TABLES = [
    "claims", "denials", "appeals", "claim_lines", "prior_auth",
    "eligibility_271", "era_payments", "payment_forecast",
    "bank_reconciliation", "evv_visits", "ar_aging", "collection_queue",
    "collection_alerts", "payer_master", "providers", "patients",
    "insurance_coverage", "forecast_training_weekly", "forecast_training_daily",
    "diagnostic_finding",
]


@router.get("/system-health")
async def system_health(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """DB status including active connections and table row counts."""
    try:
        # Database connectivity check
        db_ok = False
        try:
            await db.execute(text("SELECT 1"))
            db_ok = True
        except Exception:
            pass

        # Active connections (pg_stat_activity)
        try:
            conn_query = text("""
                SELECT COUNT(*) as active_connections,
                       COUNT(CASE WHEN state = 'active' THEN 1 END) as active_queries,
                       COUNT(CASE WHEN state = 'idle' THEN 1 END) as idle_connections
                FROM pg_stat_activity
                WHERE datname = current_database()
            """)
            conn_res = await db.execute(conn_query)
            conn_row = conn_res.fetchone()
            connections = {
                "total": conn_row[0] or 0,
                "active_queries": conn_row[1] or 0,
                "idle": conn_row[2] or 0,
            }
        except Exception:
            connections = {"total": 0, "active_queries": 0, "idle": 0}

        # Database size
        try:
            size_query = text("SELECT pg_size_pretty(pg_database_size(current_database()))")
            size_res = await db.execute(size_query)
            db_size = size_res.scalar() or "unknown"
        except Exception:
            db_size = "unknown"

        # Table row counts (top-level summary)
        table_counts = {}
        for table in TRACKED_TABLES:
            try:
                count_res = await db.execute(text(f"SELECT COUNT(*) FROM {table}"))
                table_counts[table] = count_res.scalar() or 0
            except Exception:
                table_counts[table] = -1  # table doesn't exist or error

        total_rows = sum(v for v in table_counts.values() if v >= 0)

        return {
            "status": "healthy" if db_ok else "degraded",
            "database_connected": db_ok,
            "database_size": db_size,
            "connections": connections,
            "total_rows": total_rows,
            "table_counts": table_counts,
            "checked_at": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"System health error: {str(e)}")


@router.get("/etl-status")
async def etl_status(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Row counts for all major tables with approximate last update timestamps."""
    try:
        etl_tables = []

        for table in TRACKED_TABLES:
            try:
                # Row count
                count_res = await db.execute(text(f"SELECT COUNT(*) FROM {table}"))
                row_count = count_res.scalar() or 0

                # Try to get last update from created_at or similar timestamp column
                last_updated = None
                for ts_col in ["created_at", "updated_at", "triggered_at", "inquiry_date", "visit_date", "payment_date"]:
                    try:
                        ts_query = text(f"SELECT MAX({ts_col}) FROM {table}")
                        ts_res = await db.execute(ts_query)
                        ts_val = ts_res.scalar()
                        if ts_val:
                            last_updated = str(ts_val)
                            break
                    except Exception:
                        continue

                etl_tables.append({
                    "table_name": table,
                    "row_count": row_count,
                    "last_updated": last_updated,
                    "status": "OK" if row_count > 0 else "EMPTY",
                })
            except Exception:
                etl_tables.append({
                    "table_name": table,
                    "row_count": -1,
                    "last_updated": None,
                    "status": "ERROR",
                })

        populated = sum(1 for t in etl_tables if t["row_count"] > 0)
        empty = sum(1 for t in etl_tables if t["row_count"] == 0)
        errored = sum(1 for t in etl_tables if t["row_count"] == -1)

        return {
            "summary": {
                "total_tables": len(etl_tables),
                "populated": populated,
                "empty": empty,
                "errored": errored,
            },
            "tables": etl_tables,
            "checked_at": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ETL status error: {str(e)}")


@router.get("/users")
async def list_users() -> Any:
    """Return synthetic user list for admin panel."""
    users = [
        {"id": 1, "username": "admin", "email": "admin@rcmpulse.com", "role": "ADMIN", "is_active": True, "department": "IT"},
        {"id": 2, "username": "billing_mgr", "email": "billing@rcmpulse.com", "role": "MANAGER", "is_active": True, "department": "Billing"},
        {"id": 3, "username": "coder_1", "email": "coder1@rcmpulse.com", "role": "CODER", "is_active": True, "department": "Medical Coding"},
        {"id": 4, "username": "collector_1", "email": "collector1@rcmpulse.com", "role": "COLLECTOR", "is_active": True, "department": "Collections"},
        {"id": 5, "username": "analyst_1", "email": "analyst1@rcmpulse.com", "role": "ANALYST", "is_active": True, "department": "Revenue Analytics"},
        {"id": 6, "username": "front_desk", "email": "frontdesk@rcmpulse.com", "role": "STAFF", "is_active": True, "department": "Patient Access"},
        {"id": 7, "username": "compliance_off", "email": "compliance@rcmpulse.com", "role": "COMPLIANCE", "is_active": True, "department": "Compliance"},
        {"id": 8, "username": "provider_1", "email": "provider1@rcmpulse.com", "role": "PROVIDER", "is_active": False, "department": "Clinical"},
    ]
    return {"total": len(users), "users": users}
