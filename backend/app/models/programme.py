import uuid
import enum
from sqlalchemy import Column, String, Integer, Numeric, Boolean, ForeignKey, DateTime, Uuid, Enum, Float, UniqueConstraint, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.database import Base

class ApplicantOrigin(str, enum.Enum):
    EU = "EU Applicants"
    NON_EU = "Non-EU Applicants"
    ALL = "All Applicants"

class NCStatus(str, enum.Enum):
    NC_FREE = "NC_FREE"
    LOCAL_NC = "LOCAL_NC"

class ApplicationRoute(str, enum.Enum):
    DIRECT = "Direct"
    UNI_ASSIST = "uni-assist"

class SemesterType(str, enum.Enum):
    WINTER = "WINTER"
    SUMMER = "SUMMER"

class GRERequirement(str, enum.Enum):
    NOT_REQUIRED = "Not Required"
    ADVISABLE = "Advisable"
    RECOMMENDED = "Recommended"
    MANDATORY = "Mandatory"

class DataSource(str, enum.Enum):
    GEMINI_EXTRACTED = "GEMINI_EXTRACTED"
    FALLBACK_GENERATED = "FALLBACK_GENERATED"
    MANUAL = "MANUAL"
    UNVERIFIED = "UNVERIFIED"

class Programme(Base):
    __tablename__ = "programmes"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    university_id = Column(Uuid, ForeignKey("universities.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    degree_type = Column(String, default="M.Sc.", nullable=False)
    nc_status = Column(Enum(NCStatus, name="nc_status_type"), nullable=False, index=True)
    application_route = Column(Enum(ApplicationRoute, name="application_route_type", values_callable=lambda x: [e.value for e in x]), nullable=False)
    application_fee_eur = Column(Numeric(precision=6, scale=2), nullable=True)

    # Language Tracking
    primary_teaching_language = Column(String, nullable=True)
    min_english_level = Column(String, nullable=True)
    min_ielts_score = Column(Float, nullable=True)
    min_german_level = Column(String, nullable=True)

    # Hard Validation Metrics
    total_ects_required = Column(Integer, nullable=True)
    min_gpa_german_scale = Column(Numeric(precision=3, scale=2), nullable=True)
    gre_required = Column(Enum(GRERequirement, name="gre_requirement_type", values_callable=lambda x: [e.value for e in x]), default=GRERequirement.NOT_REQUIRED, nullable=False, index=True)
    is_free_tuition = Column(Boolean, default=True, nullable=False)
    tuition_fee_per_semester = Column(Numeric(precision=10, scale=2), nullable=True)
    programme_website_url = Column(String, nullable=True)

    # Data provenance tracking — flags whether programme details were genuinely extracted or fallback-generated
    data_source = Column(Enum(DataSource, name="data_source_type", values_callable=lambda x: [e.value for e in x]), default=DataSource.UNVERIFIED, nullable=False, index=True)

    # New Flat Quantitative requirement columns promoted from JSONB for high performance indexing
    required_math_ects = Column(Numeric(precision=5, scale=2), nullable=True, index=True)
    required_cs_ects = Column(Numeric(precision=5, scale=2), nullable=True, index=True)

    # Standardized requirements JSONB Field
    requirements = Column(JSON().with_variant(JSONB, "postgresql"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Unique Constraint to prevent ingestion/logical duplicates
    __table_args__ = (
        UniqueConstraint('university_id', 'name', 'degree_type', name='uq_university_programme_degree'),
    )

    # Relationships
    university = relationship("University", back_populates="programmes")
    deadlines = relationship("Deadline", back_populates="programme", cascade="all, delete-orphan")
    required_documents = relationship("RequiredDocument", back_populates="programme", cascade="all, delete-orphan")


class Deadline(Base):
    __tablename__ = "deadlines"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    programme_id = Column(Uuid, ForeignKey("programmes.id", ondelete="CASCADE"), nullable=False, index=True)
    applicant_origin = Column(Enum(ApplicantOrigin, name="applicant_origin"), nullable=False)
    semester = Column(Enum(SemesterType, name="semester_type"), nullable=False)
    portal_opens = Column(DateTime(timezone=True), nullable=True)
    application_deadline = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    programme = relationship("Programme", back_populates="deadlines")


class RequiredDocument(Base):
    __tablename__ = "required_documents"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    programme_id = Column(Uuid, ForeignKey("programmes.id", ondelete="CASCADE"), nullable=False, index=True)
    document_name = Column(String, nullable=False)
    is_mandatory = Column(Boolean, default=True, nullable=False)
    notes = Column(String, nullable=True)

    # Relationships
    programme = relationship("Programme", back_populates="required_documents")
