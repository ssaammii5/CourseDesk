from datetime import UTC, datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.user.models import UserModel
from app.utils.db import Base


class NotificationModel(Base):
    __tablename__: str = "notification_table"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("user_table.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column()
    message: Mapped[str] = mapped_column(Text, default="")
    kind: Mapped[str] = mapped_column(default="system")
    # kind can be: assignment | grade | announcement | submission | due | session | system
    link: Mapped[Optional[str]] = mapped_column(default=None)
    is_read: Mapped[bool] = mapped_column(default=False, index=True)
    created_at_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), index=True
    )

    user: Mapped["UserModel"] = relationship()  # type: ignore[name-defined]  # noqa: F821


class NotificationPreferenceModel(Base):
    __tablename__: str = "notification_preference_table"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("user_table.id", ondelete="CASCADE"), primary_key=True
    )
    email_notifications: Mapped[bool] = mapped_column(default=True)
    assignment_notifications: Mapped[bool] = mapped_column(default=True)
    grade_notifications: Mapped[bool] = mapped_column(default=True)
    announcement_notifications: Mapped[bool] = mapped_column(default=True)
    due_date_reminders: Mapped[bool] = mapped_column(default=True)

    user: Mapped["UserModel"] = relationship()  # type: ignore[name-defined]  # noqa: F821
