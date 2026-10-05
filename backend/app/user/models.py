from datetime import UTC, datetime
from typing import Optional

from sqlalchemy import JSON, DateTime, ForeignKey, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.utils.db import Base


class UserModel(Base):
    __tablename__: str = "user_table"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column()
    email: Mapped[str] = mapped_column(unique=True, index=True)
    hash_password: Mapped[str] = mapped_column(nullable=False)
    role: Mapped[str] = mapped_column(default="Learner")  # Admin | Instructor | Learner
    is_active: Mapped[bool] = mapped_column(default=True)
    avatar: Mapped[str] = mapped_column(Text, default="", server_default="")
    created_at_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    invite_token: Mapped[Optional[str]] = mapped_column(unique=True, index=True, nullable=True)
    invite_expires_at_utc: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    email_verified: Mapped[bool] = mapped_column(default=False)
    email_verification_token: Mapped[Optional[str]] = mapped_column(
        unique=True, index=True, nullable=True
    )
    email_verification_expires_at_utc: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    email_verification_attempts: Mapped[int] = mapped_column(default=0)

    learner_details: Mapped[Optional["LearnerDetailsModel"]] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    instructor_details: Mapped[Optional["InstructorDetailsModel"]] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    course_preferences: Mapped[Optional["UserCoursePreferenceModel"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "UserCoursePreferenceModel", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class LearnerDetailsModel(Base):
    __tablename__: str = "learner_details_table"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("user_table.id", ondelete="CASCADE"), unique=True
    )
    learner_id: Mapped[str] = mapped_column(
        server_default=text("generate_base32_id('LRN', 6)"),
        unique=True,
        index=True,
    )
    first_name: Mapped[str] = mapped_column(default="")
    last_name: Mapped[str] = mapped_column(default="")
    avatar: Mapped[str] = mapped_column(Text, default="")
    short_bio: Mapped[str] = mapped_column(Text, default="")
    timezone: Mapped[str] = mapped_column(default="UTC")
    links: Mapped[list[dict]] = mapped_column(JSON, default=list)

    fathers_name: Mapped[str] = mapped_column(default="")
    mothers_name: Mapped[str] = mapped_column(default="")
    date_of_birth: Mapped[str] = mapped_column(default="")
    mobile: Mapped[str] = mapped_column(default="")
    nationality: Mapped[str] = mapped_column(default="")
    reg_no: Mapped[str] = mapped_column(default="")
    street: Mapped[str] = mapped_column(default="")
    city: Mapped[str] = mapped_column(default="")
    state: Mapped[str] = mapped_column(default="")
    zip: Mapped[str] = mapped_column(default="")
    country: Mapped[str] = mapped_column(default="")

    user: Mapped["UserModel"] = relationship(back_populates="learner_details")


class InstructorDetailsModel(Base):
    __tablename__: str = "instructor_details_table"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("user_table.id", ondelete="CASCADE"), unique=True
    )
    instructor_id: Mapped[str] = mapped_column(
        server_default=text("generate_base32_id('INS', 6)"),
        unique=True,
        index=True,
    )
    first_name: Mapped[str] = mapped_column(default="")
    last_name: Mapped[str] = mapped_column(default="")
    avatar: Mapped[str] = mapped_column(Text, default="")
    professional_headline: Mapped[str] = mapped_column(default="")
    short_bio: Mapped[str] = mapped_column(Text, default="")
    timezone: Mapped[str] = mapped_column(default="UTC")
    links: Mapped[list[dict]] = mapped_column(JSON, default=list)

    user: Mapped["UserModel"] = relationship(back_populates="instructor_details")