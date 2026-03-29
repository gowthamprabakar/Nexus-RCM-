from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc, asc
from typing import Any, Optional
import uuid

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.claim import Claim
from app.schemas.claim import ClaimCreate, ClaimUpdate, ClaimOut, PaginatedClaims

router = APIRouter()


@router.get("", response_model=PaginatedClaims)
async def list_claims(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    payer_id: Optional[str] = None,
    min_amount: Optional[float] = None,
    sort_by: str = "created_at",
    sort_desc: bool = True
) -> Any:
    query = select(Claim)

    if status:
        query = query.filter(Claim.status == status)
    if payer_id and payer_id != "all":
        query = query.filter(Claim.payer_id == payer_id)
    if min_amount:
        query = query.filter(Claim.total_charges >= min_amount)

    order_col = getattr(Claim, sort_by, Claim.created_at)
    query = query.order_by(desc(order_col) if sort_desc else asc(order_col))

    offset = (page - 1) * size
    query  = query.offset(offset).limit(size)

    result = await db.execute(query)
    claims = result.scalars().all()

    count_query = select(func.count(Claim.claim_id))
    if status:
        count_query = count_query.filter(Claim.status == status)
    if payer_id and payer_id != "all":
        count_query = count_query.filter(Claim.payer_id == payer_id)
    if min_amount:
        count_query = count_query.filter(Claim.total_charges >= min_amount)

    total = (await db.execute(count_query)).scalar()

    return {"total": total, "page": page, "size": size, "items": claims}


@router.get("/{claim_id}", response_model=ClaimOut)
async def get_claim(
    claim_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    result = await db.execute(select(Claim).filter(Claim.claim_id == claim_id))
    claim  = result.scalars().first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim


@router.post("", response_model=ClaimOut)
async def create_claim(
    claim_in: ClaimCreate,
    db: AsyncSession = Depends(get_db)
) -> Any:
    new_id = f"CLM-{str(uuid.uuid4().int)[:8]}"
    db_obj = Claim(
        claim_id=new_id,
        patient_id=claim_in.patient_id,
        provider_id=claim_in.provider_id,
        payer_id=claim_in.payer_id,
        coverage_id=claim_in.coverage_id,
        claim_type=claim_in.claim_type,
        date_of_service=claim_in.date_of_service,
        total_charges=claim_in.total_charges,
        status="DRAFT",
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj


@router.put("/{claim_id}", response_model=ClaimOut)
async def update_claim(
    claim_id: str,
    claim_in: ClaimUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    result = await db.execute(select(Claim).filter(Claim.claim_id == claim_id))
    db_obj = result.scalars().first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Claim not found")

    for field, value in claim_in.dict(exclude_unset=True).items():
        setattr(db_obj, field, value)

    await db.commit()
    await db.refresh(db_obj)
    return db_obj
