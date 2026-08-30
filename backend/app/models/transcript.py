import uuid
from sqlalchemy import Column, String, Numeric, ForeignKey, Uuid, Text, UniqueConstraint
from sqlalchemy.orm import relationship, backref
from app.database import Base

class TranscriptConfig(Base):
    __tablename__ = "transcript_configs"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    degree_years = Column(Numeric(precision=4, scale=2), nullable=False, default=4.00)
    total_local_credits = Column(Numeric(precision=5, scale=2), nullable=False, default=160.00)
    n_max = Column(Numeric(precision=4, scale=2), nullable=False, default=10.00)
    n_min = Column(Numeric(precision=4, scale=2), nullable=False, default=4.00)

    # Relationship using backref for seamless User model compatibility
    user = relationship(
        "User", 
        backref=backref("transcript_config", uselist=False, cascade="all, delete-orphan")
    )


class TranscriptSubject(Base):
    __tablename__ = "transcript_subjects"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    credits = Column(Numeric(precision=5, scale=2), nullable=False)
    grade = Column(Numeric(precision=4, scale=2), nullable=False)
    category = Column(String, nullable=False)
    
    # Text field holding detailed syllabus descriptions evaluated by Gemini LLM compatibility engine
    description = Column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint('user_id', 'name', name='uq_user_subject_name'),
    )

    # Relationship using backref for seamless User model compatibility
    user = relationship(
        "User", 
        backref=backref("transcript_subjects", cascade="all, delete-orphan")
    )
