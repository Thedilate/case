from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from uuid import UUID

from app.database import get_db
from app.models import (
    CareerPath, CareerStep, IDPItem, SkillRecord, Skill, Employee, Course
)
from app.schemas import (
    CareerPathOut, CareerStepOut, IDPItemOut, GapAnalysisOut, GapAnalysisItem, CourseOut
)
from app.routers.auth import get_current_user_id

router = APIRouter()


@router.get("/my-path")
def my_career_path(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    emp = db.query(Employee).options(joinedload(Employee.grade)).filter(Employee.id == user_id).first()
    # Для MVP привязываем к Backend Engineer треку
    path = db.query(CareerPath).filter(CareerPath.name == "Backend Engineer").first()
    if not path:
        path = db.query(CareerPath).first()
    steps = (
        db.query(CareerStep)
        .filter(CareerStep.path_id == path.id)
        .order_by(CareerStep.sequence_num)
        .all()
    ) if path else []
    return {
        "path": CareerPathOut.model_validate(path) if path else None,
        "steps": [CareerStepOut.model_validate(s) for s in steps],
        "current_grade": emp.grade.name if emp.grade else None,
    }


@router.get("/gap-analysis", response_model=GapAnalysisOut)
def gap_analysis(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    emp = db.query(Employee).options(joinedload(Employee.grade)).filter(Employee.id == user_id).first()
    
    current_grade = emp.grade.name if emp.grade else "Middle"
    target_grade = "Senior"
    
    # Получаем скиллы сотрудника
    skill_records = (
        db.query(SkillRecord)
        .options(joinedload(SkillRecord.skill))
        .filter(SkillRecord.employee_id == user_id)
        .all()
    )
    skill_map = {str(sr.skill_id): sr.level for sr in skill_records}
    
    # Определяем гэпы (упрощённо)
    gaps = []
    required_skills = [
        ("System Design", 4, "high", 3),
        ("Kubernetes", 4, "high", 2),
        ("Go", 3, "medium", 2),
    ]
    
    for skill_name, req_level, priority, months in required_skills:
        skill = db.query(Skill).filter(Skill.name == skill_name).first()
        current_level = skill_map.get(str(skill.id), 1) if skill else 1
        if current_level < req_level:
            # Рекомендуем курсы
            courses = (
                db.query(Course)
                .filter(Course.title.ilike(f"%{skill_name}%"))
                .limit(2)
                .all()
            )
            gaps.append(GapAnalysisItem(
                skill=skill_name,
                current_level=current_level,
                required_level=req_level,
                priority=priority,
                estimated_time_months=months,
                recommended_courses=[CourseOut.model_validate(c) for c in courses],
            ))
    
    readiness = max(0.1, 1 - len(gaps) * 0.2)
    return GapAnalysisOut(
        current_position=f"{current_grade} Backend Developer",
        target_position="Senior Backend Developer",
        gaps=gaps,
        overall_readiness=round(readiness, 2),
        estimated_time_to_promotion="8-10 months",
        ai_recommendations="Сфокусируйтесь на System Design в Q1, затем углубите знания Kubernetes и Go.",
    )


@router.get("/idp", response_model=list[IDPItemOut])
def my_idp(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    items = (
        db.query(IDPItem)
        .filter(IDPItem.employee_id == user_id)
        .order_by(IDPItem.created_at.desc())
        .all()
    )
    return items
