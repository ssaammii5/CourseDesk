from sqlalchemy.orm import Mapped, mapped_column

from app.utils.db import Base


class AcademicProgramModel(Base):
    __tablename__: str = "academic_program_table"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)
    description: Mapped[str] = mapped_column(default="")


class AcademicDepartmentModel(Base):
    __tablename__: str = "academic_department_table"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)
    code: Mapped[str] = mapped_column(unique=True)


class AcademicSemesterModel(Base):
    __tablename__: str = "academic_semester_table"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)