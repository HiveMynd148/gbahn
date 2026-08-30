from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.dependencies import get_db, get_current_user
from app.models.exchange_rate import ExchangeRate
from app.models.user import User
from app.schemas.exchange_rate import ExchangeRateResponse
from app.services.exchange_rate_service import update_exchange_rates

router = APIRouter()

@router.get("/", response_model=List[ExchangeRateResponse])
def get_exchange_rates(db: Session = Depends(get_db)):
    return db.query(ExchangeRate).all()

@router.get("/{currency}", response_model=ExchangeRateResponse)
def get_exchange_rate(currency: str, db: Session = Depends(get_db)):
    rate = db.query(ExchangeRate).filter(
        ExchangeRate.base_currency == "EUR",
        ExchangeRate.target_currency == currency
    ).first()
    if not rate:
        raise HTTPException(status_code=404, detail="Exchange rate not found")
    return rate

@router.post("/refresh")
def refresh_exchange_rates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    update_exchange_rates(db)
    return {"message": "Exchange rates refreshed successfully"}
