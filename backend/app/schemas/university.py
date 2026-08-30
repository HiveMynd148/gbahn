from pydantic import BaseModel
from uuid import UUID
from typing import Optional

class UniversityBase(BaseModel):
    name: str
    location: str
    federal_state: Optional[str] = None
    country: str
    website_url: Optional[str] = None

class UniversityResponse(UniversityBase):
    id: UUID

    class Config:
        from_attributes = True
