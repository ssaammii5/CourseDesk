from fastapi import APIRouter, status

from app.announcement import controller
from app.announcement.dtos import (
    AnnouncementResponseSchema,
    AnnouncementSchema,
    AnnouncementUpdateSchema,
)
from app.utils.db import get_db
from app.utils.helpers import DbSession, IsAdminOrTeacher, IsAuthenticated

announcement_routes = APIRouter(prefix="/api/announcements", tags=["announcements"])


@announcement_routes.get(
    "/course/{course_id}",
    response_model=list[AnnouncementResponseSchema],
    status_code=status.HTTP_200_OK,
)
def get_course_announcements(course_id: int, db: DbSession, user: IsAuthenticated):
    return controller.get_course_announcements(course_id, user, db)


@announcement_routes.post(
    "",
    response_model=AnnouncementResponseSchema,
    status_code=status.HTTP_201_CREATED,
)
def create_announcement(body: AnnouncementSchema, db: DbSession, user: IsAdminOrTeacher):
    return controller.create_announcement(body, user, db)


@announcement_routes.get(
    "/{announcement_id}",
    response_model=AnnouncementResponseSchema,
    status_code=status.HTTP_200_OK,
)
def get_announcement(announcement_id: int, db: DbSession, user: IsAuthenticated):
    return controller.get_announcement(announcement_id, user, db)


@announcement_routes.put(
    "/{announcement_id}",
    response_model=AnnouncementResponseSchema,
    status_code=status.HTTP_200_OK,
)
def update_announcement(
    announcement_id: int,
    body: AnnouncementUpdateSchema,
    db: DbSession,
    user: IsAdminOrTeacher,
):
    return controller.update_announcement(announcement_id, body, user, db)


@announcement_routes.delete(
    "/{announcement_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_announcement(announcement_id: int, db: DbSession, user: IsAdminOrTeacher):
    return controller.delete_announcement(announcement_id, user, db)