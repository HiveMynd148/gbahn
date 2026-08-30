import uuid
from sqlalchemy import Column, String, Numeric, DateTime, UniqueConstraint, Uuid
from sqlalchemy.sql import func
from app.database import Base

class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    base_currency = Column(String, default="EUR", nullable=False)
    target_currency = Column(String, nullable=False)
    rate = Column(Numeric(precision=12, scale=6), nullable=False)
    fetched_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint('base_currency', 'target_currency', name='uq_base_target_currency'),
    )
