from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from uuid import UUID

from app.database import get_db
from app.models import Employee, SkillRecord, Skill
from app.schemas import EmployeeOut, EmployeeProfileOut

router = APIRouter()


@router.get("/me", response_model=EmployeeOut)
def get_me(db: Session = Depends(get_db)):
    # Для MVP возвращаем первого активного сотрудника как "текущего"
    emp = db.query(Employee).options(joinedload(Employee.grade), joinedload(Employee.team)).filter(Employee.status == "active").first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


@router.get("/{user_id}", response_model=EmployeeOut)
def get_user(user_id: UUID, db: Session = Depends(get_db)):
    emp = db.query(Employee).options(joinedload(Employee.grade), joinedload(Employee.team)).filter(Employee.id == user_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


@router.get("/{user_id}/profile", response_model=EmployeeProfileOut)
def get_profile(user_id: UUID, db: Session = Depends(get_db)):
    emp = (
        db.query(Employee)
        .options(
            joinedload(Employee.grade),
            joinedload(Employee.team),
            joinedload(Employee.manager),
        )
        .filter(Employee.id == user_id)
        .first()
    )
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    skills = (
        db.query(SkillRecord)
        .options(joinedload(SkillRecord.skill).joinedload(Skill.category))
        .filter(SkillRecord.employee_id == user_id)
        .all()
    )
    emp.skills = skills
    return emp
