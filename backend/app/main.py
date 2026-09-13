import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.utils.db import Base, engine
from app.utils.settings import settings

# Ensure all SQLAlchemy models are registered in the declarative registry
import app.academic.models  # noqa: F401
import app.announcement.models  # noqa: F401
import app.assignment.models  # noqa: F401
import app.auth.models  # noqa: F401
import app.course.models  # noqa: F401
import app.session.models  # noqa: F401
import app.setting.models  # noqa: F401
import app.submission.models  # noqa: F401
import app.user.models  # noqa: F401

from app.academic.router import academic_routes
from app.announcement.router import announcement_routes
from app.assignment.router import assignment_routes
from app.auth.router import auth_routes
from app.course.router import course_routes
from app.dashboard.router import dashboard_routes
from app.session.router import session_routes
from app.setting.router import setting_routes
from app.submission.router import submission_routes
from app.user.router import user_routes

Base.metadata.create_all(engine)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="CourseDesk API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(auth_routes)
app.include_router(user_routes)
app.include_router(academic_routes)
app.include_router(course_routes)
app.include_router(assignment_routes)
app.include_router(submission_routes)
app.include_router(setting_routes)
app.include_router(dashboard_routes)
# ── NEW ──
app.include_router(session_routes)
app.include_router(announcement_routes)


@app.get("/", tags=["health"])
def health_check():
    return {"status": "ok", "app": "CourseDesk API"}