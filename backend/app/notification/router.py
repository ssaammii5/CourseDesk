from fastapi import APIRouter, Query, status

from app.notification import controller
from app.notification.dtos import (
    NotificationListResponseSchema,
    NotificationPreferenceSchema,
    NotificationResponseSchema,
)
from app.utils.helpers import DbSession, IsAuthenticated

notification_routes = APIRouter(prefix="/api/notifications", tags=["notifications"])


@notification_routes.get(
    "",
    response_model=NotificationListResponseSchema,
    status_code=status.HTTP_200_OK,
)
def get_notifications(
    db: DbSession,
    user: IsAuthenticated,
    limit: int = Query(default=50, ge=1, le=100),
):
    return controller.get_user_notifications(user, db, limit=limit)


@notification_routes.patch(
    "/{notification_id}/read",
    response_model=NotificationResponseSchema,
    status_code=status.HTTP_200_OK,
)
def mark_notification_read(
    notification_id: int,
    db: DbSession,
    user: IsAuthenticated,
):
    return controller.mark_as_read(notification_id, user, db)


@notification_routes.post(
    "/read-all",
    status_code=status.HTTP_200_OK,
)
def mark_all_read(
    db: DbSession,
    user: IsAuthenticated,
):
    count = controller.mark_all_as_read(user, db)
    return {"status": "ok", "markedCount": count}


@notification_routes.delete(
    "/clear-all",
    status_code=status.HTTP_204_NO_CONTENT,
)
def clear_all(
    db: DbSession,
    user: IsAuthenticated,
):
    controller.clear_all_notifications(user, db)


@notification_routes.delete(
    "/{notification_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_notification(
    notification_id: int,
    db: DbSession,
    user: IsAuthenticated,
):
    controller.delete_notification(notification_id, user, db)


@notification_routes.get(
    "/preferences",
    response_model=NotificationPreferenceSchema,
    status_code=status.HTTP_200_OK,
)
def get_preferences(
    db: DbSession,
    user: IsAuthenticated,
):
    return controller.get_preferences(user, db)


@notification_routes.put(
    "/preferences",
    response_model=NotificationPreferenceSchema,
    status_code=status.HTTP_200_OK,
)
def update_preferences(
    body: NotificationPreferenceSchema,
    db: DbSession,
    user: IsAuthenticated,
):
    return controller.update_preferences(user, body, db)
