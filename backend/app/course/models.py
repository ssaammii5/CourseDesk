from datetime import UTC, datetime
from typing import Optional

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Table, Text
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
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)

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


class UserCoursePreferenceModel(Base):
    __tablename__: str = "user_course_preference_table"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("user_table.id", ondelete="CASCADE"), unique=True, index=True
    )
    hidden_course_ids: Mapped[list[int]] = mapped_column(JSON, default=list)
    course_order: Mapped[list[int]] = mapped_column(JSON, default=list)
    sort_mode: Mapped[str] = mapped_column(default="custom")
    view_mode: Mapped[str] = mapped_column(default="grid")
    updated_at_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    user: Mapped["UserModel"] = relationship(back_populates="course_preferences")