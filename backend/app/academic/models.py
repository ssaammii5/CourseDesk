from sqlalchemy.orm import Mapped, mapped_column

from app.utils.db import Base


class AcademicDepartmentModel(Base):
    __tablename__: str = "academic_department_table"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)
    code: Mapped[str] = mapped_column(unique=True)
    description: Mapped[str] = mapped_column(default="")


CategoryModel = AcademicDepartmentModel