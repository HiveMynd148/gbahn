from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.dependencies import get_db
from app.schemas.university import UniversityResponse
from app.models.university import University
from app.models.programme import Programme
from app.schemas.programme import ProgrammeResponse

router = APIRouter()

@router.get("/", response_model=List[UniversityResponse])
def get_universities(
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    query = db.query(University)
    if search:
        query = query.filter(University.name.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()

@router.get("/{id}", response_model=UniversityResponse)
def get_university(id: UUID, db: Session = Depends(get_db)):
    university = db.query(University).filter(University.id == id).first()
    if not university:
        raise HTTPException(status_code=404, detail="University not found")
    return university

@router.get("/{id}/programmes", response_model=List[ProgrammeResponse])
def get_university_programmes(id: UUID, db: Session = Depends(get_db)):
    university = db.query(University).filter(University.id == id).first()
    if not university:
        raise HTTPException(status_code=404, detail="University not found")
    return university.programmes
