import requests
from sqlalchemy.orm import Session
from app.models.exchange_rate import ExchangeRate
from app.config import settings
import logging

logger = logging.getLogger(__name__)

def update_exchange_rates(db: Session):
    try:
        response = requests.get(settings.EXCHANGE_RATE_API_URL)
        response.raise_for_status()
        data = response.json()
        
        base = data.get("base", "EUR")
        rates = data.get("rates", {})
        
        for target, rate in rates.items():
            db_rate = db.query(ExchangeRate).filter(
                ExchangeRate.base_currency == base,
                ExchangeRate.target_currency == target
            ).first()
            
            if db_rate:
                db_rate.rate = rate
            else:
                new_rate = ExchangeRate(base_currency=base, target_currency=target, rate=rate)
                db.add(new_rate)
        
        db.commit()
        logger.info(f"Updated {len(rates)} exchange rates successfully.")
    except Exception as e:
        logger.error(f"Error fetching exchange rates: {e}")
        db.rollback()
