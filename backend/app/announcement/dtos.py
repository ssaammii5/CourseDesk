from datetime import datetime

from app.utils.dto import CamelModel


class AnnouncementSchema(CamelModel):
    course_id: int
    title: str = ""
    body: str = ""
    is_pinned: bool = False


class AnnouncementUpdateSchema(CamelModel):
    title: str | None = None
    body: str | None = None
    is_pinned: bool | None = None


class AnnouncementResponseSchema(CamelModel):
    id: int
    course_id: int
    author_id: int
    author_name: str | None = None
    title: str
    body: str
    is_pinned: bool
    created_at_utc: datetime
    updated_at_utc: datetime | None = None