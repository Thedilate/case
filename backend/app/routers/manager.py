from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from uuid import UUID

from app.database import get_db
from app.models import Employee, Enrollment, IDPItem, OnboardingPlan
from app.routers.auth import get_current_user
from app.schemas import EmployeeOut

router = APIRouter()


@router.get("/dashboard")
def manager_dashboard(
    db: Session = Depends(get_db),
    user: Employee = Depends(get_current_user),
):
    # Находим подчиненных текущего пользователя
    subordinates = (
        db.query(Employee)
        .options(joinedload(Employee.grade), joinedload(Employee.team))
        .filter(Employee.manager_id == user.id)
        .all()
    )

    result = []
    for emp in subordinates:
        # Прогресс обучения
        enrollments = db.query(Enrollment).filter(Enrollment.employee_id == emp.id).all()
        total_courses = len(enrollments)
        completed = sum(1 for e in enrollments if e.status == "completed")
        in_progress = sum(1 for e in enrollments if e.status == "in_progress")
        avg_progress = sum(e.progress_pct for e in enrollments) / total_courses if total_courses > 0 else 0

        # IDP
        idp_items = db.query(IDPItem).filter(IDPItem.employee_id == emp.id).all()
        active_idp = sum(1 for i in idp_items if i.status == "active")

        # Онбординг
        onboarding = (
            db.query(OnboardingPlan)
            .filter(OnboardingPlan.employee_id == emp.id)
            .first()
        )

        result.append({
            "employee": EmployeeOut.model_validate(emp),
            "stats": {
                "total_courses": total_courses,
                "completed_courses": completed,
                "in_progress_courses": in_progress,
                "avg_progress": round(avg_progress, 1),
                "active_idp": active_idp,
                "onboarding_progress": onboarding.progress_pct if onboarding else None,
                "onboarding_status": onboarding.status if onboarding else None,
            },
        })

    # Сводная статистика
    total_subs = len(subordinates)
    avg_team_progress = round(
        sum(s["stats"]["avg_progress"] for s in result) / total_subs, 1
    ) if total_subs > 0 else 0

    onboarding_count = sum(
        1 for s in result if s["stats"]["onboarding_status"] == "active"
    )

    return {
        "manager": EmployeeOut.model_validate(user),
        "summary": {
            "total_subordinates": total_subs,
            "avg_team_progress": avg_team_progress,
            "onboarding_count": onboarding_count,
            "active_idp_count": sum(s["stats"]["active_idp"] for s in result),
        },
        "subordinates": result,
    }
