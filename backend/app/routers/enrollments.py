from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from uuid import UUID

from app.database import get_db
from app.models import Enrollment, Employee
from app.schemas import EnrollmentOut
from app.routers.auth import get_current_user_id

router = APIRouter()


@router.get("", response_model=list[EnrollmentOut])
def my_enrollments(db: Session = Depends(get_db)):
    user_id = get_current_user_id(db)
    enrollments = (
        db.query(Enrollment)
        .options(joinedload(Enrollment.course).joinedload(Enrollment.course.property.mapper.class_.category))
    )
    # SQLAlchemy joinedload для course с category
    from app.models import Course, CourseCategory
    enrollments = (
        db.query(Enrollment)
        .options(
            joinedload(Enrollment.course).joinedload(Course.category),
            joinedload(Enrollment.course).joinedload(Course.provider),
        )
        .filter(Enrollment.employee_id == user_id)
        .order_by(Enrollment.enrolled_at.desc())
        .all()
    )
    return enrollments


@router.get("/progress")
def enrollment_progress(db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    total = db.query(Enrollment).filter(Enrollment.employee_id == user_id).count()
    completed = (
        db.query(Enrollment)
        .filter(Enrollment.employee_id == user_id, Enrollment.status == "completed")
        .count()
    )
    in_progress = (
        db.query(Enrollment)
        .filter(Enrollment.employee_id == user_id, Enrollment.status == "in_progress")
        .count()
    )
    return {
        "total": total,
        "completed": completed,
        "in_progress": in_progress,
        "completion_rate": round(completed / total * 100, 1) if total > 0 else 0,
    }
