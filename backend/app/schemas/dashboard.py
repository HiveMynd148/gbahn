from pydantic import BaseModel
from uuid import UUID
from typing import List, Optional
from datetime import datetime
from .programme import ProgrammeResponse

class DashboardProgrammeUpdate(BaseModel):
    personal_status: Optional[str] = None
    personal_notes: Optional[str] = None

class DashboardProgrammeResponse(BaseModel):
    id: UUID
    dashboard_id: UUID
    programme_id: UUID
    personal_status: str
    personal_notes: Optional[str] = None
    added_at: datetime
    programme: ProgrammeResponse

    class Config:
        from_attributes = True

class DashboardSettingsUpdate(BaseModel):
    display_currency: str

class DashboardResponse(BaseModel):
    id: UUID
    user_id: UUID
    display_currency: str
    dashboard_programmes: List[DashboardProgrammeResponse] = []

    class Config:
        from_attributes = True
