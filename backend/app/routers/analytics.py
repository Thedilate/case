from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime, timedelta
import random

from app.database import get_db
from app.models import (
    Employee, Enrollment, Course, IDPItem, Notification, OnboardingPlan,
    OnboardingTask, CareerPath, CareerStep, ChatMessage
)
from app.schemas import DashboardOut
from app.routers.auth import get_current_user_id

router = APIRouter()


@router.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    user_id = Depends(get_current_user_id),
):
    emp = (
        db.query(Employee)
        .options(joinedload(Employee.grade), joinedload(Employee.team))
        .filter(Employee.id == user_id)
        .first()
    )

    # Learning progress
    total_enrollments = db.query(Enrollment).filter(Enrollment.employee_id == user_id).count()
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

    # Career track
    path = db.query(CareerPath).filter(CareerPath.name == "Backend Engineer").first()
    steps = []
    if path:
        steps = (
            db.query(CareerStep)
            .filter(CareerStep.path_id == path.id)
            .order_by(CareerStep.sequence_num)
            .all()
        )

    # IDP
    idp_items = (
        db.query(IDPItem)
        .filter(IDPItem.employee_id == user_id)
        .order_by(IDPItem.created_at.desc())
        .all()
    )

    # My courses
    my_courses = (
        db.query(Enrollment)
        .options(
            joinedload(Enrollment.course)
        )
        .filter(Enrollment.employee_id == user_id)
        .order_by(Enrollment.enrolled_at.desc())
        .limit(5)
        .all()
    )

    # Notifications
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(5)
        .all()
    )

    # Onboarding
    onboarding = (
        db.query(OnboardingPlan)
        .options(joinedload(OnboardingPlan.tasks))
        .filter(OnboardingPlan.employee_id == user_id)
        .first()
    )

    # Heatmap data (mock last 90 days)
    heatmap_data = []
    for i in range(90):
        day = datetime.now() - timedelta(days=i)
        count = random.choice([0, 0, 1, 2, 3, 4]) if i % 7 < 5 else 0
        heatmap_data.append({
            "date": day.strftime("%Y-%m-%d"),
            "count": count,
        })
    heatmap_data.reverse()

    return {
        "user": emp,
        "learning_progress": {
            "total": total_enrollments,
            "completed": completed,
            "in_progress": in_progress,
            "completion_rate": round(completed / total_enrollments * 100, 1) if total_enrollments > 0 else 0,
        },
        "career_track": path,
        "career_steps": steps,
        "idp_items": idp_items,
        "my_courses": my_courses,
        "notifications": notifications,
        "onboarding": onboarding,
        "heatmap_data": heatmap_data,
    }


@router.get("/dashboard/hr")
def hr_dashboard(db: Session = Depends(get_db)):
    total_employees = db.query(Employee).count()
    total_courses = db.query(Course).count()
    total_enrollments = db.query(Enrollment).count()
    avg_progress = db.query(func.avg(Enrollment.progress_pct)).scalar() or 0
    return {
        "total_employees": total_employees,
        "total_courses": total_courses,
        "total_enrollments": total_enrollments,
        "avg_progress": round(float(avg_progress), 1),
    }
