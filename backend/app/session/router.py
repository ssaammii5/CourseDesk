from fastapi import APIRouter, Form, status

from app.session import controller
from app.session.dtos import (
    SessionMaterialResponseSchema,
    SessionResponseSchema,
    SessionSchema,
    SessionUpdateSchema,
    VideoMarkerResponseSchema,
)
from app.utils.db import get_db
from app.utils.helpers import DbSession, IsAdminOrTeacher, IsAuthenticated

session_routes = APIRouter(prefix="/api/sessions", tags=["sessions"])


@session_routes.get(
    "/course/{course_id}",
    response_model=list[SessionResponseSchema],
    status_code=status.HTTP_200_OK,
)
def get_course_sessions(course_id: int, db: DbSession, user: IsAuthenticated):
    return controller.get_course_sessions(course_id, user, db)


@session_routes.get(
    "/course/{course_id}/next",
    response_model=SessionResponseSchema | None,
    status_code=status.HTTP_200_OK,
)
def get_next_session(course_id: int, db: DbSession, user: IsAuthenticated):
    return controller.get_next_session(course_id, user, db)


@session_routes.get(
    "/{session_id}",
    response_model=SessionResponseSchema,
    status_code=status.HTTP_200_OK,
)
def get_session(session_id: int, db: DbSession, user: IsAuthenticated):
    return controller.get_session(session_id, user, db)


@session_routes.post(
    "",
    response_model=SessionResponseSchema,
    status_code=status.HTTP_201_CREATED,
)
def create_session(body: SessionSchema, db: DbSession, user: IsAdminOrTeacher):
    return controller.create_session(body, user, db)


@session_routes.put(
    "/{session_id}",
    response_model=SessionResponseSchema,
    status_code=status.HTTP_200_OK,
)
def update_session(
    session_id: int, body: SessionUpdateSchema, db: DbSession, user: IsAdminOrTeacher
):
    return controller.update_session(session_id, body, user, db)


@session_routes.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(session_id: int, db: DbSession, user: IsAdminOrTeacher):
    return controller.delete_session(session_id, user, db)


# ── Materials ──────────────────────────────────────────────────────────────

@session_routes.post(
    "/{session_id}/materials",
    response_model=SessionMaterialResponseSchema,
    status_code=status.HTTP_201_CREATED,
)
def add_material(
    session_id: int,
    db: DbSession,
    user: IsAdminOrTeacher,
    title: str = Form(...),
    kind: str = Form(default="link"),
    url: str | None = Form(default=None),
    description: str = Form(default=""),
    sort_order: int = Form(default=0),
):
    return controller.add_material(
        session_id, user, db, title, kind, url, description, sort_order
    )


@session_routes.delete(
    "/{session_id}/materials/{material_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_material(
    session_id: int, material_id: int, db: DbSession, user: IsAdminOrTeacher
):
    return controller.delete_material(session_id, material_id, user, db)


# ── Video markers ──────────────────────────────────────────────────────────

@session_routes.post(
    "/{session_id}/markers",
    response_model=VideoMarkerResponseSchema,
    status_code=status.HTTP_201_CREATED,
)
def add_video_marker(
    session_id: int,
    db: DbSession,
    user: IsAdminOrTeacher,
    timestamp_seconds: int = Form(...),
    label: str = Form(...),
):
    return controller.add_video_marker(session_id, user, db, timestamp_seconds, label)


@session_routes.delete(
    "/{session_id}/markers/{marker_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_video_marker(
    session_id: int, marker_id: int, db: DbSession, user: IsAdminOrTeacher
):
    return controller.delete_video_marker(session_id, marker_id, user, db)