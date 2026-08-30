import uuid
import enum
from sqlalchemy import Column, String, DateTime, Uuid, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class InstitutionType(str, enum.Enum):
    UNI = "University"
    TU = "Technical University"
    FH = "University of Applied Sciences"

class University(Base):
    __tablename__ = "universities"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    location = Column(String, nullable=False)
    federal_state = Column(String, nullable=True)
    country = Column(String, default="Germany", nullable=False)
    institution_type = Column(Enum(InstitutionType, name="institution_type"), nullable=False)
    website_url = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    programmes = relationship("Programme", back_populates="university", cascade="all, delete-orphan")
