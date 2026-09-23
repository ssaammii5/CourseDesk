from datetime import UTC, datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.utils.db import Base


class CommentModel(Base):
    __tablename__: str = "comment_table"

    id: Mapped[int] = mapped_column(primary_key=True)
    assignment_id: Mapped[int] = mapped_column(
        ForeignKey("assignment_table.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("user_table.id", ondelete="CASCADE"), index=True
    )
    # For private comments, learner_id identifies which learner's conversation this is.
    # For public class comments, learner_id is None.
    learner_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("user_table.id", ondelete="CASCADE"), nullable=True, default=None, index=True
    )
    content: Mapped[str] = mapped_column(Text)
    is_private: Mapped[bool] = mapped_column(default=False, index=True)
    created_at_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at_utc: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )

    assignment: Mapped["AssignmentModel"] = relationship(back_populates="comments")  # type: ignore[name-defined]  # noqa: F821
    author: Mapped["UserModel"] = relationship(foreign_keys=[user_id])  # type: ignore[name-defined]  # noqa: F821
    learner: Mapped[Optional["UserModel"]] = relationship(foreign_keys=[learner_id])  # type: ignore[name-defined]  # noqa: F821
