from pydantic import BaseModel
from uuid import UUID
from typing import List, Optional, Any
from datetime import datetime, date
from .university import UniversityResponse
from app.models.programme import DataSource


class DeadlineResponse(BaseModel):
    id: UUID
    semester: str
    portal_opens: Optional[datetime] = None
    application_deadline: Optional[datetime] = None

    class Config:
        from_attributes = True

class RequiredDocumentResponse(BaseModel):
    id: UUID
    document_name: str
    is_mandatory: bool
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class ProgrammeBase(BaseModel):
    name: str
    degree_type: str
    nc_status: str
    application_route: str
    application_fee_eur: Optional[float] = None
    requirements: Optional[Any] = None
    total_ects_required: Optional[int] = None
    min_gpa_german_scale: Optional[float] = None
    gre_required: str
    is_free_tuition: Optional[bool] = True
    tuition_fee: Optional[str] = None
    programme_website_url: Optional[str] = None
    data_source: Optional[DataSource] = DataSource.UNVERIFIED

class ProgrammeResponse(ProgrammeBase):
    id: UUID
    university_id: UUID
    university: Optional[UniversityResponse] = None
    deadlines: List[DeadlineResponse] = []
    required_documents: List[RequiredDocumentResponse] = []

    class Config:
        from_attributes = True
