from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from uuid import UUID
from typing import Optional

from app.database import get_db
from app.models import Course, CourseCategory, Enrollment
from app.schemas import CourseOut

router = APIRouter()


@router.get("", response_model=list[CourseOut])
def list_courses(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category_id: Optional[UUID] = Query(None),
    difficulty: Optional[str] = Query(None),
    format: Optional[str] = Query(None),
    duration_min: Optional[int] = Query(None),
    duration_max: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Course).options(joinedload(Course.category), joinedload(Course.provider)).filter(Course.status == "published")

    if category_id:
        q = q.filter(Course.category_id == category_id)
    if difficulty:
        q = q.filter(Course.difficulty == difficulty)
    if format:
        q = q.filter(Course.format == format)
    if duration_min is not None:
        q = q.filter(Course.duration_min >= duration_min)
    if duration_max is not None:
        q = q.filter(Course.duration_min <= duration_max)
    if search:
        q = q.filter(or_(Course.title.ilike(f"%{search}%"), Course.description.ilike(f"%{search}%")))

    total = q.count()
    courses = q.offset((page - 1) * limit).limit(limit).all()
    return courses


@router.get("/recommended", response_model=list[CourseOut])
def recommended_courses(db: Session = Depends(get_db)):
    # MVP: возвращаем топ-курсы по рейтингу как "рекомендации"
    courses = (
        db.query(Course)
        .options(joinedload(Course.category), joinedload(Course.provider))
        .filter(Course.status == "published")
        .order_by(Course.rating_avg.desc())
        .limit(6)
        .all()
    )
    return courses


@router.get("/search")
def search_courses(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    courses = (
        db.query(Course)
        .options(joinedload(Course.category), joinedload(Course.provider))
        .filter(Course.status == "published")
        .filter(or_(Course.title.ilike(f"%{q}%"), Course.description.ilike(f"%{q}%")))
        .all()
    )
    return {"results": courses, "total": len(courses)}


@router.get("/{course_id}", response_model=CourseOut)
def get_course(course_id: UUID, db: Session = Depends(get_db)):
    course = (
        db.query(Course)
        .options(joinedload(Course.category), joinedload(Course.provider))
        .filter(Course.id == course_id)
        .first()
    )
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course
