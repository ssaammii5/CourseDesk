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

    course: Mapped["CourseModel"] = relationship(back_populates="announcements")  # type: ignore[name-defined]  # noqa: F821
    author: Mapped["UserModel"] = relationship()  # type: ignore[name-defined]  # noqa: F821