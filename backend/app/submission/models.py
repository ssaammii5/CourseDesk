from datetime import UTC, datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.utils.db import Base


class SubmissionModel(Base):
    __tablename__: str = "submission_table"

    id: Mapped[int] = mapped_column(primary_key=True)
    assignment_id: Mapped[int] = mapped_column(
        ForeignKey("assignment_table.id", ondelete="CASCADE"), index=True
    )
    student_id: Mapped[int] = mapped_column(
        ForeignKey("user_table.id", ondelete="CASCADE"), index=True
    )
    answer: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(default="Draft")  # Draft | Submitted | Graded
    marks: Mapped[Optional[int]] = mapped_column(default=None)
    feedback: Mapped[Optional[str]] = mapped_column(Text, default=None)
    submitted_at_utc: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), default=None
    )
    created_at_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    graded_by_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("user_table.id"), default=None
    )
    graded_at_utc: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), default=None
    )
    is_late: Mapped[bool] = mapped_column(default=False)

    assignment: Mapped["AssignmentModel"] = relationship(back_populates="submissions")  # type: ignore[name-defined]  # noqa: F821
    student: Mapped["UserModel"] = relationship(foreign_keys=[student_id])  # type: ignore[name-defined]  # noqa: F821
    graded_by: Mapped[Optional["UserModel"]] = relationship(foreign_keys=[graded_by_id])  # type: ignore[name-defined]  # noqa: F821
    attachments: Mapped[list["SubmissionAttachmentModel"]] = relationship(
        back_populates="submission", cascade="all, delete-orphan"
    )
    activities: Mapped[list["SubmissionActivityModel"]] = relationship(
        back_populates="submission", cascade="all, delete-orphan"
    )


class SubmissionAttachmentModel(Base):
    __tablename__: str = "submission_attachment_table"

    id: Mapped[int] = mapped_column(primary_key=True)
    submission_id: Mapped[int] = mapped_column(
        ForeignKey("submission_table.id", ondelete="CASCADE"), index=True
    )
    file_name: Mapped[str] = mapped_column()
    file_type: Mapped[str] = mapped_column(default="")
    file_size: Mapped[str] = mapped_column(default="")
    uploaded_at_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    kind: Mapped[str] = mapped_column(default="file")  # file | link
    url: Mapped[Optional[str]] = mapped_column(default=None)

    submission: Mapped["SubmissionModel"] = relationship(back_populates="attachments")


class SubmissionActivityModel(Base):
    __tablename__: str = "submission_activity_table"

    id: Mapped[int] = mapped_column(primary_key=True)
    submission_id: Mapped[int] = mapped_column(
        ForeignKey("submission_table.id", ondelete="CASCADE"), index=True
    )
    action: Mapped[str] = mapped_column()
    actor_name: Mapped[str] = mapped_column(default="")
    timestamp_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    submission: Mapped["SubmissionModel"] = relationship(back_populates="activities")