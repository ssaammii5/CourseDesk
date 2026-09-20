from typing import Optional

from sqlalchemy import Column, ForeignKey, Table, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.user.models import UserModel
from app.utils.db import Base

course_instructor_table = Table(
    "course_instructor_table",
    Base.metadata,
    Column("course_id", ForeignKey("course_table.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", ForeignKey("user_table.id", ondelete="CASCADE"), primary_key=True),
)

course_learner_table = Table(
    "course_learner_table",
    Base.metadata,
    Column("course_id", ForeignKey("course_table.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", ForeignKey("user_table.id", ondelete="CASCADE"), primary_key=True),
)


class CourseModel(Base):
    __tablename__: str = "course_table"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column()
    subject: Mapped[str] = mapped_column(default="")
    program: Mapped[str] = mapped_column(default="")
    department: Mapped[str] = mapped_column(default="")
    session: Mapped[str] = mapped_column(default="")
    is_active: Mapped[bool] = mapped_column(default=True)

    # ── NEW: Live-class / meeting configuration ──
    meeting_provider: Mapped[str] = mapped_column(default="")
    # zoom | meet | teams | other
    meeting_url: Mapped[Optional[str]] = mapped_column(default=None)
    meeting_id: Mapped[str] = mapped_column(default="")
    meeting_passcode: Mapped[str] = mapped_column(default="")
    schedule_notes: Mapped[str] = mapped_column(Text, default="")
    # e.g. "Every Monday & Wednesday, 7:00 PM – 9:00 PM (GMT+6)"

    instructors: Mapped[list["UserModel"]] = relationship(
        secondary=course_instructor_table, backref="instructing_courses"
    )
    learners: Mapped[list["UserModel"]] = relationship(
        secondary=course_learner_table, backref="enrolled_courses"
    )
    assignments: Mapped[list["AssignmentModel"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="course", cascade="all, delete-orphan"
    )
    sessions: Mapped[list["SessionModel"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="course", cascade="all, delete-orphan"
    )
    announcements: Mapped[list["AnnouncementModel"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="course", cascade="all, delete-orphan"
    )