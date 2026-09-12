from sqlalchemy import Column, ForeignKey, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.user.models import UserModel
from app.utils.db import Base

course_teacher_table = Table(
    "course_teacher_table",
    Base.metadata,
    Column("course_id", ForeignKey("course_table.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", ForeignKey("user_table.id", ondelete="CASCADE"), primary_key=True),
)

course_student_table = Table(
    "course_student_table",
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

    teachers: Mapped[list["UserModel"]] = relationship(
        secondary=course_teacher_table, backref="teaching_courses"
    )
    students: Mapped[list["UserModel"]] = relationship(
        secondary=course_student_table, backref="enrolled_courses"
    )
    assignments: Mapped[list["AssignmentModel"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        back_populates="course", cascade="all, delete-orphan"
    )