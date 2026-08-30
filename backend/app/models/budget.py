import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Uuid, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class BudgetPlan(Base):
    __tablename__ = "budget_plans"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    
    # Store the breakdown as JSON
    monthly_costs = Column(JSON, nullable=False, default=dict)
    one_time_costs = Column(JSON, nullable=False, default=dict)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", backref="budget_plans")
