import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import users, courses, enrollments, career, chat, analytics, auth, manager

app = FastAPI(
    title="T&D Platform API",
    description="AI-powered Training & Development Platform for Gazprom Neft IT Cluster",
    version="1.0.0",
)

# Разрешаем все origins для Codespaces / local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(courses.router, prefix="/api/v1/courses", tags=["Courses"])
app.include_router(enrollments.router, prefix="/api/v1/enrollments", tags=["Enrollments"])
app.include_router(career.router, prefix="/api/v1/career", tags=["Career"])
app.include_router(chat.router, prefix="/api/v1/agents/tutor", tags=["Tutor Agent"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(manager.router, prefix="/api/v1/manager", tags=["Manager"])


@app.get("/health")
def health_check():
    return {"status": "healthy"}
