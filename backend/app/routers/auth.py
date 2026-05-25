from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session, joinedload
from uuid import UUID

from app.database import get_db
from app.models import Employee
from app.schemas import EmployeeOut

router = APIRouter()


def get_current_user(
    db: Session = Depends(get_db),
    x_user_id: str = Header(None),
) -> Employee:
    user_id = x_user_id
    if not user_id:
        # Fallback для обратной совместимости
        emp = db.query(Employee).filter(Employee.status == "active").first()
        if not emp:
            raise HTTPException(status_code=404, detail="No active employee found")
        return emp
    try:
        uid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user_id UUID")
    emp = db.query(Employee).filter(Employee.id == uid).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


def get_current_user_id(
    db: Session = Depends(get_db),
    x_user_id: str = Header(None),
) -> UUID:
    return get_current_user(db, x_user_id).id


@router.post("/login")
def login(email: str, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.email == email).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"user": EmployeeOut.model_validate(emp), "token": str(emp.id)}


@router.get("/me", response_model=EmployeeOut)
def me(user: Employee = Depends(get_current_user)):
    return user


@router.post("/guest")
def guest_login(db: Session = Depends(get_db)):
    # Гость — первый активный сотрудник, но помечаем как гостевой режим
    emp = db.query(Employee).filter(Employee.status == "active").first()
    if not emp:
        raise HTTPException(status_code=404, detail="No active employee found")
    return {
        "user": EmployeeOut.model_validate(emp),
        "token": str(emp.id),
        "is_guest": True,
    }
