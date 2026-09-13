from datetime import datetime

from app.utils.dto import CamelModel


# ── Materials ──────────────────────────────────────────────────────────────

class SessionMaterialSchema(CamelModel):
    title: str
    kind: str = "link"
    url: str | None = None
    file_name: str = ""
    file_type: str = ""
    file_size: str = ""
    description: str = ""
    sort_order: int = 0


class SessionMaterialResponseSchema(SessionMaterialSchema):
    id: int
    session_id: int
    created_at_utc: datetime


# ── Video markers ──────────────────────────────────────────────────────────

class VideoMarkerSchema(CamelModel):
    timestamp_seconds: int
    label: str


class VideoMarkerResponseSchema(VideoMarkerSchema):
    id: int


# ── Session ────────────────────────────────────────────────────────────────

class SessionSchema(CamelModel):
    course_id: int
    session_number: int = 1
    title: str
    topic: str = ""
    description: str = ""
    meeting_url: str | None = None
    meeting_provider: str = ""
    meeting_id: str = ""
    meeting_passcode: str = ""
    scheduled_at_utc: datetime | None = None
    duration_minutes: int = 90
    video_url: str | None = None
    video_provider: str = ""
    video_duration_minutes: int | None = None
    status: str = "Scheduled"


class SessionUpdateSchema(CamelModel):
    session_number: int | None = None
    title: str | None = None
    topic: str | None = None
    description: str | None = None
    meeting_url: str | None = None
    meeting_provider: str | None = None
    meeting_id: str | None = None
    meeting_passcode: str | None = None
    scheduled_at_utc: datetime | None = None
    duration_minutes: int | None = None
    video_url: str | None = None
    video_provider: str | None = None
    video_duration_minutes: int | None = None
    status: str | None = None


class SessionResponseSchema(CamelModel):
    id: int
    course_id: int
    session_number: int
    title: str
    topic: str
    description: str
    meeting_url: str | None = None
    meeting_provider: str = ""
    meeting_id: str = ""
    meeting_passcode: str = ""
    scheduled_at_utc: datetime | None = None
    duration_minutes: int = 90
    video_url: str | None = None
    video_provider: str = ""
    video_duration_minutes: int | None = None
    status: str = "Scheduled"
    created_at_utc: datetime
    materials: list[SessionMaterialResponseSchema] = []
    video_markers: list[VideoMarkerResponseSchema] = []
    assignment_ids: list[int] = []
    assignment_titles: list[str] = []