from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime, date
from uuid import UUID


class GradeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    level: int


class TeamOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str


class EmployeeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    email: str
    full_name: str
    first_name: str
    last_name: str
    grade: Optional[GradeOut] = None
    team: Optional[TeamOut] = None
    position: Optional[str] = None
    hire_date: date
    status: str
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class EmployeeProfileOut(EmployeeOut):
    manager: Optional[EmployeeOut] = None
    skills: List["SkillRecordOut"] = []


class CourseCategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str


class CourseProviderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str


class CourseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    title: str
    description: Optional[str] = None
    duration_min: int
    difficulty: str
    format: str
    category: Optional[CourseCategoryOut] = None
    provider: Optional[CourseProviderOut] = None
    status: str
    rating_avg: Optional[float] = None
    rating_count: int
    completion_count: int
    created_at: datetime


class EnrollmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    employee_id: UUID
    course: Optional[CourseOut] = None
    status: str
    progress_pct: int
    enrolled_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    score: Optional[int] = None
    source: str


class SkillOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    category: Optional[CourseCategoryOut] = None


class SkillRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    skill: Optional[SkillOut] = None
    level: int
    assessed_at: datetime
    source: str
    confidence: Optional[float] = None


class CareerPathOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    description: Optional[str] = None
    category: str
    is_active: bool


class CareerStepOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    position_name: str
    grade_level: str
    sequence_num: int
    skill_requirements: Optional[dict] = None
    avg_time_months: Optional[int] = None


class IDPItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    title: str
    description: Optional[str] = None
    status: str
    quarter: str
    deadline: Optional[date] = None
    progress_pct: int
    created_at: datetime


class ChatMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    role: str
    content: str
    created_at: datetime


class ChatSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    user_id: UUID
    messages: List[ChatMessageOut] = []
    created_at: datetime
    updated_at: datetime


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    type: str
    title: str
    message: Optional[str] = None
    is_read: bool
    created_at: datetime


class OnboardingTaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    title: str
    description: Optional[str] = None
    category: str
    status: str
    due_date: Optional[date] = None
    completed_at: Optional[datetime] = None
    assigned_by: str


class OnboardingPlanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    status: str
    start_date: date
    target_end_date: date
    actual_end_date: Optional[date] = None
    progress_pct: int
    tasks: List[OnboardingTaskOut] = []


class DashboardOut(BaseModel):
    user: EmployeeOut
    learning_progress: dict
    career_track: Optional[CareerPathOut] = None
    career_steps: List[CareerStepOut] = []
    idp_items: List[IDPItemOut] = []
    my_courses: List[EnrollmentOut] = []
    notifications: List[NotificationOut] = []
    onboarding: Optional[OnboardingPlanOut] = None
    heatmap_data: List[dict] = []


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[UUID] = None


class ChatResponse(BaseModel):
    message: ChatMessageOut
    session_id: UUID


class GapAnalysisItem(BaseModel):
    skill: str
    current_level: int
    required_level: int
    priority: str
    estimated_time_months: Optional[int] = None
    recommended_courses: List[CourseOut] = []


class GapAnalysisOut(BaseModel):
    current_position: str
    target_position: str
    gaps: List[GapAnalysisItem] = []
    overall_readiness: float
    estimated_time_to_promotion: str
    ai_recommendations: str


class CourseFilter(BaseModel):
    category_id: Optional[UUID] = None
    difficulty: Optional[str] = None
    format: Optional[str] = None
    duration_min: Optional[int] = None
    duration_max: Optional[int] = None
    search: Optional[str] = None
