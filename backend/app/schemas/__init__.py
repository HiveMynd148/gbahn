from .user import UserBase, UserCreate, UserResponse
from .university import UniversityBase, UniversityResponse
from .programme import ProgrammeBase, ProgrammeResponse, DeadlineResponse, RequiredDocumentResponse
from .dashboard import DashboardResponse, DashboardProgrammeResponse, DashboardProgrammeUpdate, DashboardSettingsUpdate
from .exchange_rate import ExchangeRateResponse
from .auth import Token, TokenData

__all__ = [
    "UserBase", "UserCreate", "UserResponse",
    "UniversityBase", "UniversityResponse",
    "ProgrammeBase", "ProgrammeResponse", "DeadlineResponse", "RequiredDocumentResponse",
    "DashboardResponse", "DashboardProgrammeResponse", "DashboardProgrammeUpdate", "DashboardSettingsUpdate",
    "ExchangeRateResponse",
    "Token", "TokenData"
]
