from datetime import UTC, datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.utils.db import Base


class UserModel(Base):
    __tablename__: str = "user_table"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column()
    email: Mapped[str] = mapped_column(unique=True, index=True)
    hash_password: Mapped[str] = mapped_column(nullable=False)
    role: Mapped[str] = mapped_column(default="Student")  # Admin | Teacher | Student
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    student_details: Mapped[Optional["StudentDetailsModel"]] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    teacher_details: Mapped[Optional["TeacherDetailsModel"]] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class StudentDetailsModel(Base):
    __tablename__: str = "student_details_table"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("user_table.id", ondelete="CASCADE"), unique=True
    )
    fathers_name: Mapped[str] = mapped_column(default="")
    mothers_name: Mapped[str] = mapped_column(default="")
    date_of_birth: Mapped[str] = mapped_column(default="")
    mobile: Mapped[str] = mapped_column(default="")
    nationality: Mapped[str] = mapped_column(default="")
    student_id: Mapped[str] = mapped_column(default="", index=True)
    reg_no: Mapped[str] = mapped_column(default="")
    department: Mapped[str] = mapped_column(default="")
    current_program: Mapped[str] = mapped_column(default="Undergraduate")
    session: Mapped[str] = mapped_column(default="")
    semester_session: Mapped[str] = mapped_column(default="")
    street: Mapped[str] = mapped_column(default="")
    city: Mapped[str] = mapped_column(default="")
    state: Mapped[str] = mapped_column(default="")
    zip: Mapped[str] = mapped_column(default="")
    country: Mapped[str] = mapped_column(default="")

    user: Mapped["UserModel"] = relationship(back_populates="student_details")


class TeacherDetailsModel(Base):
    __tablename__: str = "teacher_details_table"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("user_table.id", ondelete="CASCADE"), unique=True
    )
    teacher_id: Mapped[str] = mapped_column(default="", index=True)
    designation: Mapped[str] = mapped_column(default="")
    department: Mapped[str] = mapped_column(default="")

    user: Mapped["UserModel"] = relationship(back_populates="teacher_details")