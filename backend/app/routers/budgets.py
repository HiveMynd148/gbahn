from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.budget import BudgetPlan
from app.schemas.budget import BudgetPlanCreate, BudgetPlanUpdate, BudgetPlanResponse

router = APIRouter()

MAX_BUDGETS = 5

@router.get("/", response_model=List[BudgetPlanResponse])
def get_budgets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    budgets = db.query(BudgetPlan).filter(BudgetPlan.user_id == current_user.id).all()
    return budgets

@router.post("/", response_model=BudgetPlanResponse, status_code=status.HTTP_201_CREATED)
def create_budget(
    budget_in: BudgetPlanCreate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # Check limit
    budget_count = db.query(BudgetPlan).filter(BudgetPlan.user_id == current_user.id).count()
    if budget_count >= MAX_BUDGETS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"You can only save up to {MAX_BUDGETS} budgets. Please delete one to save a new budget."
        )

    budget = BudgetPlan(
        user_id=current_user.id,
        name=budget_in.name,
        monthly_costs=budget_in.monthly_costs,
        one_time_costs=budget_in.one_time_costs
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget

@router.put("/{budget_id}", response_model=BudgetPlanResponse)
def update_budget(
    budget_id: UUID,
    budget_in: BudgetPlanUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    budget = db.query(BudgetPlan).filter(BudgetPlan.id == budget_id, BudgetPlan.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget plan not found")

    budget.name = budget_in.name
    budget.monthly_costs = budget_in.monthly_costs
    budget.one_time_costs = budget_in.one_time_costs

    db.commit()
    db.refresh(budget)
    return budget

@router.delete("/{budget_id}")
def delete_budget(
    budget_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    budget = db.query(BudgetPlan).filter(BudgetPlan.id == budget_id, BudgetPlan.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget plan not found")

    db.delete(budget)
    db.commit()
    return {"message": "Budget deleted successfully"}
