import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint, Uuid
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class UserDashboard(Base):
    __tablename__ = "user_dashboard"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    display_currency = Column(String, default="INR")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", backref="dashboard")
    dashboard_programmes = relationship("DashboardProgramme", back_populates="dashboard", cascade="all, delete-orphan")

class DashboardProgramme(Base):
    __tablename__ = "dashboard_programmes"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    dashboard_id = Column(Uuid, ForeignKey("user_dashboard.id", ondelete="CASCADE"), nullable=False)
    programme_id = Column(Uuid, ForeignKey("programmes.id", ondelete="CASCADE"), nullable=False, index=True)
    personal_status = Column(String, default="CONSIDERING") # 'CONSIDERING', 'APPLYING', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'
    personal_notes = Column(String, nullable=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint('dashboard_id', 'programme_id', name='uq_dashboard_programme'),
    )

    dashboard = relationship("UserDashboard", back_populates="dashboard_programmes")
    programme = relationship("Programme")
