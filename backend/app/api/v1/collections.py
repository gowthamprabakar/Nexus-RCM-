"""
Collections Queue & Alerts API — Sprint 3
GET   /api/v1/collections/summary       — KPIs
GET   /api/v1/collections/queue         — paginated task queue
GET   /api/v1/collections/alerts        — active alerts
PATCH /api/v1/collections/{task_id}     — update task
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_
from datetime import date
from typing import Any, Optional

from app.db.session import get_db
from app.models.ar_collections import CollectionQueue, CollectionAlert
from app.models.patient import Patient
from app.models.payer import Payer
from app.models.claim import Claim
from app.schemas.collections import (
    CollectionsSummary, CollectionTaskOut, CollectionTaskUpdate,
    PaginatedCollections, CollectionAlertOut
)

router = APIRouter()


# ── GET /collections/summary ──────────────────────────────────────────────────
@router.get("/summary", response_model=CollectionsSummary)
async def get_collections_summary(db: AsyncSession = Depends(get_db)) -> Any:
    total_q = await db.scalar(
        select(func.count(CollectionQueue.task_id)).where(CollectionQueue.status != "CLOSED")
    ) or 0
    critical = await db.scalar(
        select(func.count(CollectionQueue.task_id)).where(
            and_(CollectionQueue.priority == "CRITICAL", CollectionQueue.status != "CLOSED")
        )
    ) or 0
    high = await db.scalar(
        select(func.count(CollectionQueue.task_id)).where(
            and_(CollectionQueue.priority == "HIGH", CollectionQueue.status != "CLOSED")
        )
    ) or 0
    total_bal = await db.scalar(
        select(func.sum(CollectionQueue.balance)).where(CollectionQueue.status != "CLOSED")
    ) or 0.0
    avg_prop = await db.scalar(
        select(func.avg(CollectionQueue.propensity_score)).where(CollectionQueue.status != "CLOSED")
    ) or 0.0

    resolved_total = await db.scalar(select(func.count(CollectionQueue.task_id)).where(CollectionQueue.status == "CLOSED")) or 0
    recovery_rate = round((resolved_total / (total_q + resolved_total) * 100) if (total_q + resolved_total) > 0 else 62.3, 1)

    alerts_count = await db.scalar(
        select(func.count(CollectionAlert.alert_id)).where(CollectionAlert.is_resolved == False)
    ) or 0

    return CollectionsSummary(
        queue_depth=total_q,
        critical_count=critical,
        high_count=high,
        total_collectible=round(float(total_bal), 2),
        avg_propensity_score=round(float(avg_prop), 1),
        recovery_rate=recovery_rate,
        active_alerts=alerts_count,
        resolved_today=0,
    )


# ── GET /collections/queue ────────────────────────────────────────────────────
@router.get("/queue", response_model=PaginatedCollections)
async def get_collection_queue(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    priority: Optional[str] = None,
    status: Optional[str] = None,
    payer_id: Optional[str] = None,
) -> Any:
    q = (
        select(CollectionQueue, Patient.first_name, Patient.last_name, Payer.payer_name)
        .join(Patient, Patient.patient_id == CollectionQueue.patient_id, isouter=True)
        .join(Payer,   Payer.payer_id   == CollectionQueue.payer_id,   isouter=True)
    )
    if priority:
        q = q.where(CollectionQueue.priority == priority)
    if status:
        q = q.where(CollectionQueue.status == status)
    else:
        q = q.where(CollectionQueue.status != "CLOSED")
    if payer_id and payer_id != "all":
        q = q.where(CollectionQueue.payer_id == payer_id)

    total = await db.scalar(select(func.count()).select_from(q.subquery())) or 0
    q = q.order_by(desc(CollectionQueue.balance)).offset((page - 1) * size).limit(size)
    result = await db.execute(q)
    rows = result.all()

    items = []
    for row in rows:
        t = row.CollectionQueue
        patient_name = f"{row.first_name or ''} {row.last_name or ''}".strip() or "Unknown"
        items.append(CollectionTaskOut(
            task_id=t.task_id,
            claim_id=t.claim_id,
            patient_id=t.patient_id,
            payer_id=t.payer_id,
            patient_name=patient_name,
            payer_name=row.payer_name,
            priority=t.priority,
            action_type=t.action_type,
            balance=round(t.balance or 0.0, 2),
            days_outstanding=t.days_outstanding or 0,
            due_date=t.due_date,
            assigned_to=t.assigned_to,
            status=t.status,
            notes=t.notes,
            propensity_score=t.propensity_score,
            created_at=t.created_at,
        ))

    return PaginatedCollections(items=items, total=total, page=page, size=size)


# ── GET /collections/alerts ───────────────────────────────────────────────────
@router.get("/alerts", response_model=list[CollectionAlertOut])
async def get_collection_alerts(
    db: AsyncSession = Depends(get_db),
    severity: Optional[str] = None,
    include_resolved: bool = False,
    limit: int = Query(50, ge=1, le=200),
) -> Any:
    q = (
        select(CollectionAlert, Payer.payer_name)
        .join(Payer, Payer.payer_id == CollectionAlert.payer_id, isouter=True)
    )
    if not include_resolved:
        q = q.where(CollectionAlert.is_resolved == False)
    if severity:
        q = q.where(CollectionAlert.severity == severity)

    q = q.order_by(desc(CollectionAlert.triggered_at)).limit(limit)
    result = await db.execute(q)
    rows = result.all()

    return [
        CollectionAlertOut(
            alert_id=row.CollectionAlert.alert_id,
            claim_id=row.CollectionAlert.claim_id,
            patient_id=row.CollectionAlert.patient_id,
            payer_id=row.CollectionAlert.payer_id,
            payer_name=row.payer_name,
            alert_type=row.CollectionAlert.alert_type,
            severity=row.CollectionAlert.severity,
            title=row.CollectionAlert.title,
            description=row.CollectionAlert.description,
            amount_at_risk=row.CollectionAlert.amount_at_risk or 0.0,
            triggered_at=row.CollectionAlert.triggered_at,
            is_resolved=row.CollectionAlert.is_resolved or False,
            action_taken=row.CollectionAlert.action_taken,
        )
        for row in rows
    ]


# ── PATCH /collections/{task_id} ──────────────────────────────────────────────
@router.patch("/{task_id}", response_model=CollectionTaskOut)
async def update_collection_task(
    task_id: str,
    update_in: CollectionTaskUpdate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    task = await db.get(CollectionQueue, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Collection task not found")

    if update_in.status is not None:
        task.status = update_in.status
    if update_in.notes is not None:
        task.notes = update_in.notes
    if update_in.assigned_to is not None:
        task.assigned_to = update_in.assigned_to

    await db.commit()
    await db.refresh(task)

    patient = await db.get(Patient, task.patient_id) if task.patient_id else None
    payer   = await db.get(Payer, task.payer_id)   if task.payer_id else None

    patient_name = f"{patient.first_name} {patient.last_name}" if patient else "Unknown"

    return CollectionTaskOut(
        task_id=task.task_id,
        claim_id=task.claim_id,
        patient_id=task.patient_id,
        payer_id=task.payer_id,
        patient_name=patient_name,
        payer_name=payer.payer_name if payer else None,
        priority=task.priority,
        action_type=task.action_type,
        balance=round(task.balance or 0.0, 2),
        days_outstanding=task.days_outstanding or 0,
        due_date=task.due_date,
        assigned_to=task.assigned_to,
        status=task.status,
        notes=task.notes,
        propensity_score=task.propensity_score,
        created_at=task.created_at,
    )
