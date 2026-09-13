from datetime import UTC, datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.utils.db import Base


class SessionModel(Base):
    """A single live-class session / weekly module inside a course.

    Acts as the *container* that groups:
      - the lecture replay (video_url)
      - session materials (slides, code, links)
      - the paired assignment (via AssignmentModel.session_id)
    """

    __tablename__: str = "session_table"

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(
        ForeignKey("course_table.id", ondelete="CASCADE"), index=True
    )
    session_number: Mapped[int] = mapped_column(Integer, default=1)
    title: Mapped[str] = mapped_column()
    topic: Mapped[str] = mapped_column(default="")
    description: Mapped[str] = mapped_column(Text, default="")

    # ── live meeting info (per-session override of course defaults) ──
    meeting_url: Mapped[Optional[str]] = mapped_column(default=None)
    meeting_provider: Mapped[str] = mapped_column(default="")  # zoom | meet | teams | other
    meeting_id: Mapped[str] = mapped_column(default="")
    meeting_passcode: Mapped[str] = mapped_column(default="")

    # ── scheduling ──
    scheduled_at_utc: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), default=None
    )
    duration_minutes: Mapped[int] = mapped_column(default=90)

    # ── recording / replay ──
    video_url: Mapped[Optional[str]] = mapped_column(default=None)
    video_provider: Mapped[str] = mapped_column(default="")  # youtube | vimeo | zoom | direct
    video_duration_minutes: Mapped[Optional[int]] = mapped_column(default=None)

    # ── status ──
    status: Mapped[str] = mapped_column(default="Scheduled")
    # Scheduled | Live | Completed | Cancelled

    created_at_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    # ── relationships ──
    course: Mapped["CourseModel"] = relationship(back_populates="sessions")  # type: ignore[name-defined]  # noqa: F821
    materials: Mapped[list["SessionMaterialModel"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )
    assignments: Mapped[list["AssignmentModel"]] = relationship(back_populates="session")  # type: ignore[name-defined]  # noqa: F821


class SessionMaterialModel(Base):
    """Downloadable / linkable resource attached to a session."""

    __tablename__: str = "session_material_table"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("session_table.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column()
    kind: Mapped[str] = mapped_column(default="link")
    # slides | code | reading | cheat_sheet | link | file
    url: Mapped[Optional[str]] = mapped_column(default=None)
    file_name: Mapped[str] = mapped_column(default="")
    file_type: Mapped[str] = mapped_column(default="")
    file_size: Mapped[str] = mapped_column(default="")
    description: Mapped[str] = mapped_column(default="")
    sort_order: Mapped[int] = mapped_column(default=0)
    created_at_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    session: Mapped["SessionModel"] = relationship(back_populates="materials")


class SessionVideoMarkerModel(Base):
    """Timestamp markers inside a session recording."""

    __tablename__: str = "session_video_marker_table"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("session_table.id", ondelete="CASCADE"), index=True
    )
    timestamp_seconds: Mapped[int] = mapped_column()
    label: Mapped[str] = mapped_column()

    session: Mapped["SessionModel"] = relationship()