from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from pydantic import BaseModel

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.dashboard import UserDashboard, DashboardProgramme
from app.models.programme import Programme
from app.schemas.dashboard import DashboardResponse, DashboardProgrammeResponse, DashboardProgrammeUpdate, DashboardSettingsUpdate

router = APIRouter()

class AddProgrammeRequest(BaseModel):
    programme_id: UUID

@router.get("/", response_model=DashboardResponse)
def get_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    dashboard = db.query(UserDashboard).filter(UserDashboard.user_id == current_user.id).first()
    if not dashboard:
        dashboard = UserDashboard(user_id=current_user.id)
        db.add(dashboard)
        db.commit()
        db.refresh(dashboard)
    return dashboard

@router.post("/programmes", response_model=DashboardProgrammeResponse)
def add_programme_to_dashboard(
    request: AddProgrammeRequest, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    dashboard = db.query(UserDashboard).filter(UserDashboard.user_id == current_user.id).first()
    
    # Check if programme exists
    programme = db.query(Programme).filter(Programme.id == request.programme_id).first()
    if not programme:
        raise HTTPException(status_code=404, detail="Programme not found")

    # Check if already in dashboard
    existing = db.query(DashboardProgramme).filter(
        DashboardProgramme.dashboard_id == dashboard.id,
        DashboardProgramme.programme_id == request.programme_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Programme already in dashboard")

    dp = DashboardProgramme(dashboard_id=dashboard.id, programme_id=request.programme_id)
    db.add(dp)
    db.commit()
    db.refresh(dp)
    return dp

@router.delete("/programmes/{programme_id}")
def remove_programme_from_dashboard(
    programme_id: UUID, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    dashboard = db.query(UserDashboard).filter(UserDashboard.user_id == current_user.id).first()
    dp = db.query(DashboardProgramme).filter(
        DashboardProgramme.dashboard_id == dashboard.id,
        DashboardProgramme.programme_id == programme_id
    ).first()
    
    if not dp:
        raise HTTPException(status_code=404, detail="Programme not found in dashboard")

    db.delete(dp)
    db.commit()
    return {"message": "Removed successfully"}

@router.patch("/programmes/{programme_id}", response_model=DashboardProgrammeResponse)
def update_dashboard_programme(
    programme_id: UUID, 
    update_data: DashboardProgrammeUpdate,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    dashboard = db.query(UserDashboard).filter(UserDashboard.user_id == current_user.id).first()
    dp = db.query(DashboardProgramme).filter(
        DashboardProgramme.dashboard_id == dashboard.id,
        DashboardProgramme.programme_id == programme_id
    ).first()
    
    if not dp:
        raise HTTPException(status_code=404, detail="Programme not found in dashboard")

    if update_data.personal_status is not None:
        dp.personal_status = update_data.personal_status
    if update_data.personal_notes is not None:
        dp.personal_notes = update_data.personal_notes

    db.commit()
    db.refresh(dp)
    return dp

@router.patch("/settings")
def update_dashboard_settings(
    settings_data: DashboardSettingsUpdate,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    dashboard = db.query(UserDashboard).filter(UserDashboard.user_id == current_user.id).first()
    dashboard.display_currency = settings_data.display_currency
    db.commit()
    db.refresh(dashboard)
    return {"message": "Settings updated"}
