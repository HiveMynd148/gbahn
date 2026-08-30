from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.dependencies import get_db
from app.schemas.programme import ProgrammeResponse
from app.models.programme import Programme
from app.models.university import University
from app.models.exchange_rate import ExchangeRate

router = APIRouter()

@router.get("/federal-states", response_model=List[str])
def get_federal_states(db: Session = Depends(get_db)):
    """Return a sorted list of distinct federal states from all universities."""
    rows = db.query(University.federal_state).filter(
        University.federal_state.isnot(None),
        University.federal_state != ''
    ).distinct().all()
    return sorted([r[0] for r in rows])

@router.get("/", response_model=List[ProgrammeResponse])
def get_programmes(
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None,
    nc_status: Optional[str] = None,
    gre_required: Optional[str] = None,
    max_fee: Optional[float] = None,
    university_id: Optional[UUID] = None,
    federal_state: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Programme)
    
    needs_join = bool(search or federal_state)
    if needs_join:
        query = query.join(University)
    
    if search:
        if not needs_join:
            query = query.join(University)
        query = query.filter(
            (Programme.name.ilike(f"%{search}%")) | 
            (University.name.ilike(f"%{search}%"))
        )
    if federal_state:
        if not needs_join:
            query = query.join(University)
        query = query.filter(University.federal_state == federal_state)
    if nc_status:
        query = query.filter(Programme.nc_status == nc_status)
    if gre_required is not None:
        if "," in gre_required:
            gre_list = [g.strip() for g in gre_required.split(",")]
            query = query.filter(Programme.gre_required.in_(gre_list))
        else:
            query = query.filter(Programme.gre_required == gre_required)
    if max_fee is not None:
        query = query.filter(Programme.application_fee_eur <= max_fee)
    if university_id:
        query = query.filter(Programme.university_id == university_id)
        
    return query.offset(skip).limit(limit).all()

@router.get("/{id}", response_model=ProgrammeResponse)
def get_programme(id: UUID, db: Session = Depends(get_db)):
    programme = db.query(Programme).filter(Programme.id == id).first()
    if not programme:
        raise HTTPException(status_code=404, detail="Programme not found")
    return programme

@router.get("/{id}/cost")
def get_programme_cost(id: UUID, currency: str = "INR", db: Session = Depends(get_db)):
    programme = db.query(Programme).filter(Programme.id == id).first()
    if not programme:
        raise HTTPException(status_code=404, detail="Programme not found")
    
    fee_eur = programme.application_fee_eur or 0.0
    
    if currency == "EUR":
        return {
            "fee_eur": float(fee_eur),
            "fee_converted": float(fee_eur),
            "currency": "EUR",
            "rate": 1.0,
            "last_updated": None
        }

    rate_record = db.query(ExchangeRate).filter(
        ExchangeRate.base_currency == "EUR",
        ExchangeRate.target_currency == currency
    ).first()

    if not rate_record:
        raise HTTPException(status_code=404, detail=f"Exchange rate for {currency} not found")

    fee_converted = float(fee_eur) * float(rate_record.rate)
    
    return {
        "fee_eur": float(fee_eur),
        "fee_converted": round(fee_converted, 2),
        "currency": currency,
        "rate": float(rate_record.rate),
        "last_updated": rate_record.fetched_at
    }
