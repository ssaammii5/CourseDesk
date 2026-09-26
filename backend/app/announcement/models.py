from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.utils.db import Base


class AnnouncementModel(Base):
    """Course-wide broadcast / notice (pinned or regular)."""

    __tablename__: str = "announcement_table"

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(
        ForeignKey("course_table.id", ondelete="CASCADE"), index=True
    )
    author_id: Mapped[int] = mapped_column(ForeignKey("user_table.id"))
    title: Mapped[str] = mapped_column(default="")
    body: Mapped[str] = mapped_column(Text, default="")
    is_pinned: Mapped[bool] = mapped_column(default=False)
    created_at_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at_utc: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )

    course: Mapped["CourseModel"] = relationship(back_populates="announcements")  # type: ignore[name-defined]  # noqa: F821
    author: Mapped["UserModel"] = relationship()  # type: ignore[name-defined]  # noqa: F821
    comments: Mapped[list["AnnouncementCommentModel"]] = relationship(
        back_populates="announcement",
        cascade="all, delete-orphan",
        order_by="AnnouncementCommentModel.created_at_utc.asc()",
    )
    attachments: Mapped[list["AnnouncementAttachmentModel"]] = relationship(
        back_populates="announcement",
        cascade="all, delete-orphan",
        order_by="AnnouncementAttachmentModel.uploaded_at_utc.asc()",
    )


class AnnouncementAttachmentModel(Base):
    """Attachments (files, links) for course announcements."""

    __tablename__: str = "announcement_attachment_table"

    id: Mapped[int] = mapped_column(primary_key=True)
    announcement_id: Mapped[int] = mapped_column(
        ForeignKey("announcement_table.id", ondelete="CASCADE"), index=True
    )
    file_name: Mapped[str] = mapped_column()
    file_type: Mapped[str] = mapped_column(default="")
    file_size: Mapped[str] = mapped_column(default="")
    uploaded_at_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    kind: Mapped[str] = mapped_column(default="file")
    url: Mapped[str | None] = mapped_column(default=None)

    announcement: Mapped["AnnouncementModel"] = relationship(back_populates="attachments")


class AnnouncementCommentModel(Base):
    """Comments on course announcements."""

    __tablename__: str = "announcement_comment_table"

    id: Mapped[int] = mapped_column(primary_key=True)
    announcement_id: Mapped[int] = mapped_column(
        ForeignKey("announcement_table.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("user_table.id", ondelete="CASCADE"), index=True
    )
    content: Mapped[str] = mapped_column(Text)
    created_at_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at_utc: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )

    announcement: Mapped["AnnouncementModel"] = relationship(back_populates="comments")
    author: Mapped["UserModel"] = relationship(foreign_keys=[user_id])  # type: ignore[name-defined]  # noqa: F821