from pydantic import BaseModel, ConfigDict
from typing import Dict, Any
from uuid import UUID
from datetime import datetime

class BudgetPlanBase(BaseModel):
    name: str
    monthly_costs: Dict[str, Any]
    one_time_costs: Dict[str, Any]

class BudgetPlanCreate(BudgetPlanBase):
    pass

class BudgetPlanUpdate(BudgetPlanBase):
    pass

class BudgetPlanResponse(BudgetPlanBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
