import asyncio
import json
from typing import Annotated

import jwt
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select

from app.notification import controller
from app.notification.broadcaster import notification_broadcaster
from app.notification.dtos import (
    NotificationListResponseSchema,
    NotificationPreferenceSchema,
    NotificationResponseSchema,
)
from app.user.models import UserModel
from app.utils.helpers import DbSession, IsAuthenticated
from app.utils.settings import settings

notification_routes = APIRouter(prefix="/api/notifications", tags=["notifications"])


def get_sse_user(
    request: Request,
    db: DbSession,
    token: str | None = Query(default=None),
) -> UserModel:
    auth_header = request.headers.get("authorization")
    token_str: str | None = None
    if auth_header and auth_header.lower().startswith("bearer "):
        token_str = auth_header.split(" ", 1)[1].strip()
    elif token:
        token_str = token.strip()

    if not token_str:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, detail="You're unauthorized"
        )

    try:
        data = jwt.decode(token_str, settings.SECRET_KEY, [settings.ALGORITHM])
        raw_id = data.get("_id")
        if not isinstance(raw_id, (int, str)):
            raise HTTPException(
                status.HTTP_401_UNAUTHORIZED, detail="You're unauthorized"
            )
        user_id = int(raw_id)
        user = db.scalar(select(UserModel).where(UserModel.id == user_id))
        if not user:
            raise HTTPException(
                status.HTTP_401_UNAUTHORIZED, detail="You're unauthorized"
            )
        return user
    except Exception:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, detail="You're unauthorized"
        )


@notification_routes.get(
    "/stream",
    status_code=status.HTTP_200_OK,
)
async def stream_notifications(
    request: Request,
    user: Annotated[UserModel, Depends(get_sse_user)],
):
    user_id = user.id

    async def event_generator():
        queue = notification_broadcaster.connect(user_id)
        try:
            yield f"event: connected\ndata: {json.dumps({'status': 'connected', 'userId': user_id})}\n\n"
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=25.0)
                    yield f"event: notification\ndata: {json.dumps(event)}\n\n"
                except TimeoutError:
                    yield ": keepalive\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            notification_broadcaster.disconnect(user_id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


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
