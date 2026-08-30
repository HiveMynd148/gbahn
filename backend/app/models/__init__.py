from .university import University
from .programme import Programme, Deadline, RequiredDocument, DataSource
from .user import User
from .dashboard import UserDashboard, DashboardProgramme
from .exchange_rate import ExchangeRate
from .transcript import TranscriptConfig, TranscriptSubject
from .budget import BudgetPlan

__all__ = [
    "University",
    "Programme",
    "Deadline",
    "RequiredDocument",
    "DataSource",
    "User",
    "UserDashboard",
    "DashboardProgramme",
    "ExchangeRate",
    "TranscriptConfig",
    "TranscriptSubject",
    "BudgetPlan",
]
