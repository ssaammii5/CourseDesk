from datetime import UTC, datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.utils.db import Base


class AssignmentModel(Base):
    __tablename__: str = "assignment_table"

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(
        ForeignKey("course_table.id", ondelete="CASCADE"), index=True
    )
    # ── NEW: link assignment to a session ──
    session_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("session_table.id", ondelete="SET NULL"), default=None, index=True
    )
    title: Mapped[str] = mapped_column()
    description: Mapped[str] = mapped_column(Text, default="")
    topic: Mapped[str] = mapped_column(default="")
    kind: Mapped[str] = mapped_column(default="Assignment")
    # Assignment | Material | Quiz | Recording
    deadline_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    max_marks: Mapped[int] = mapped_column(default=100)
    status: Mapped[str] = mapped_column(default="Draft")
    # Draft | Published | Archived
    created_by_id: Mapped[int] = mapped_column(ForeignKey("user_table.id"))
    created_at_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    # ── NEW: submission format criteria ──
    submission_formats: Mapped[str] = mapped_column(default="file_upload")
    # comma-separated: file_upload, github_link, live_url, figma_link, text

    course: Mapped["CourseModel"] = relationship(back_populates="assignments")  # type: ignore[name-defined]  # noqa: F821
    session: Mapped[Optional["SessionModel"]] = relationship(back_populates="assignments")  # type: ignore[name-defined]  # noqa: F821
    created_by: Mapped["UserModel"] = relationship()  # type: ignore[name-defined]  # noqa: F821
    attachments: Mapped[list["AssignmentAttachmentModel"]] = relationship(
        back_populates="assignment", cascade="all, delete-orphan"
    )
    submissions: Mapped[list["SubmissionModel"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="assignment", cascade="all, delete-orphan"
    )
    comments: Mapped[list["CommentModel"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="assignment", cascade="all, delete-orphan"
    )



class AssignmentAttachmentModel(Base):
    __tablename__: str = "assignment_attachment_table"

    id: Mapped[int] = mapped_column(primary_key=True)
    assignment_id: Mapped[int] = mapped_column(
        ForeignKey("assignment_table.id", ondelete="CASCADE"), index=True
    )
    file_name: Mapped[str] = mapped_column()
    file_type: Mapped[str] = mapped_column(default="")
    file_size: Mapped[str] = mapped_column(default="")
    uploaded_at_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    kind: Mapped[str] = mapped_column(default="file")
    # file | link | video
    url: Mapped[Optional[str]] = mapped_column(default=None)

    assignment: Mapped["AssignmentModel"] = relationship(back_populates="attachments")