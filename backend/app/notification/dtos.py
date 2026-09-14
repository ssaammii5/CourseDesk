from datetime import datetime

from app.utils.dto import CamelModel


class NotificationResponseSchema(CamelModel):
    id: int
    user_id: int
    title: str
    message: str = ""
    kind: str = "system"
    link: str | None = None
    is_read: bool = False
    created_at_utc: datetime


class NotificationListResponseSchema(CamelModel):
    items: list[NotificationResponseSchema]
    unread_count: int


class NotificationPreferenceSchema(CamelModel):
    email_notifications: bool = True
    assignment_notifications: bool = True
    grade_notifications: bool = True
    announcement_notifications: bool = True
    due_date_reminders: bool = True
