import uuid
from sqlalchemy import Column, String, Integer, Date, DateTime, Text, DECIMAL, Boolean, ForeignKey, JSON, Enum, SmallInteger
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import datetime


class Grade(Base):
    __tablename__ = "grades"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), nullable=False)
    level = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Department(Base):
    __tablename__ = "departments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class CenterOfCompetence(Base):
    __tablename__ = "centers_of_competence"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Team(Base):
    __tablename__ = "teams"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"))
    center_of_competence_id = Column(UUID(as_uuid=True), ForeignKey("centers_of_competence.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    department = relationship("Department")
    center_of_competence = relationship("CenterOfCompetence")


class Employee(Base):
    __tablename__ = "employees"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    grade_id = Column(UUID(as_uuid=True), ForeignKey("grades.id"))
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"))
    manager_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"))
    position = Column(String(100), nullable=True)
    hire_date = Column(Date, nullable=False)
    status = Column(String(20), default="active")
    avatar_url = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    grade = relationship("Grade")
    team = relationship("Team")
    manager = relationship("Employee", remote_side=[id])


class CourseCategory(Base):
    __tablename__ = "course_categories"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class CourseProvider(Base):
    __tablename__ = "course_providers"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Course(Base):
    __tablename__ = "courses"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    content = Column(Text)
    duration_min = Column(Integer, nullable=False)
    difficulty = Column(String(20), nullable=False)
    format = Column(String(20), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("course_categories.id"))
    provider_id = Column(UUID(as_uuid=True), ForeignKey("course_providers.id"))
    status = Column(String(20), default="published")
    rating_avg = Column(DECIMAL(3, 2), default=0)
    rating_count = Column(Integer, default=0)
    completion_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    category = relationship("CourseCategory")
    provider = relationship("CourseProvider")


class Enrollment(Base):
    __tablename__ = "enrollments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    status = Column(String(20), default="enrolled")
    progress_pct = Column(Integer, default=0)
    enrolled_at = Column(DateTime, default=datetime.datetime.utcnow)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    dropped_at = Column(DateTime)
    score = Column(Integer)
    source = Column(String(30), default="manual")

    employee = relationship("Employee")
    course = relationship("Course")


class Skill(Base):
    __tablename__ = "skills"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("course_categories.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    category = relationship("CourseCategory")


class SkillRecord(Base):
    __tablename__ = "skill_records"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    skill_id = Column(UUID(as_uuid=True), ForeignKey("skills.id"), nullable=False)
    level = Column(SmallInteger, nullable=False)
    assessed_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    source = Column(String(30), default="self_assessment")
    confidence = Column(DECIMAL(3, 2), default=1.0)

    employee = relationship("Employee")
    skill = relationship("Skill")


class CareerPath(Base):
    __tablename__ = "career_paths"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(20), nullable=False)
    is_active = Column(Boolean, default=True)


class CareerStep(Base):
    __tablename__ = "career_steps"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    path_id = Column(UUID(as_uuid=True), ForeignKey("career_paths.id"), nullable=False)
    position_name = Column(String(255), nullable=False)
    grade_level = Column(String(50), nullable=False)
    sequence_num = Column(SmallInteger, nullable=False)
    skill_requirements = Column(JSON, default={})
    avg_time_months = Column(Integer)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    path = relationship("CareerPath")


class IDPItem(Base):
    __tablename__ = "idp_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(20), default="active")
    quarter = Column(String(10), nullable=False)
    deadline = Column(Date)
    progress_pct = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    employee = relationship("Employee")


class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("Employee")
    messages = relationship("ChatMessage", order_by="ChatMessage.created_at")


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("ChatSession")


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("Employee")


class OnboardingPlan(Base):
    __tablename__ = "onboarding_plans"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), unique=True, nullable=False)
    status = Column(String(20), default="not_started")
    start_date = Column(Date, nullable=False)
    target_end_date = Column(Date, nullable=False)
    actual_end_date = Column(Date)
    progress_pct = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    employee = relationship("Employee")
    tasks = relationship("OnboardingTask", order_by="OnboardingTask.due_date")


class OnboardingTask(Base):
    __tablename__ = "onboarding_tasks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("onboarding_plans.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(20), nullable=False)
    status = Column(String(20), default="not_started")
    due_date = Column(Date)
    completed_at = Column(DateTime)
    assigned_by = Column(String(20), default="system")

    plan = relationship("OnboardingPlan")
