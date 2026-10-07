from fastapi import HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.academic.dtos import (
    DepartmentResponseSchema,
    DepartmentSchema,
)
from app.academic.models import AcademicDepartmentModel
from app.course.models import CourseModel


def get_departments(db: Session) -> list[DepartmentResponseSchema]:
    depts = list(db.scalars(select(AcademicDepartmentModel).order_by(AcademicDepartmentModel.name)).all())
    results: list[DepartmentResponseSchema] = []
    for d in depts:
        # Count courses belonging to this department/category by name or code
        count = db.scalar(
            select(func.count(CourseModel.id)).where(
                or_(
                    CourseModel.department == d.name,
                    CourseModel.department == d.code,
                )
            )
        ) or 0
        results.append(
            DepartmentResponseSchema(
                id=d.id,
                name=d.name,
                code=d.code,
                description=d.description,
                course_count=count,
            )
        )
    return results


def create_department(body: DepartmentSchema, db: Session) -> DepartmentResponseSchema:
    exists = db.scalar(
        select(AcademicDepartmentModel).where(
            (AcademicDepartmentModel.name == body.name)
            | (
                (AcademicDepartmentModel.code != "")
                & (AcademicDepartmentModel.code == body.code)
            )
        )
    )
    if exists:
        raise HTTPException(400, detail="Category name or code already exists")
    dept = AcademicDepartmentModel(name=body.name, code=body.code, description=body.description)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return DepartmentResponseSchema(
        id=dept.id,
        name=dept.name,
        code=dept.code,
        description=dept.description,
        course_count=0,
    )


def update_department(department_id: int, body: DepartmentSchema, db: Session) -> DepartmentResponseSchema:
    dept = db.get(AcademicDepartmentModel, department_id)
    if not dept:
        raise HTTPException(404, detail="Category id is incorrect")
    # Check duplicate on another record
    dup = db.scalar(
        select(AcademicDepartmentModel).where(
            (AcademicDepartmentModel.id != department_id)
            & (
                (AcademicDepartmentModel.name == body.name)
                | (
                    (AcademicDepartmentModel.code != "")
                    & (AcademicDepartmentModel.code == body.code)
                )
            )
        )
    )
    if dup:
        raise HTTPException(400, detail="Category name or code already exists")

    # If name or code changed, cascade update CourseModel.department
    old_name = dept.name
    old_code = dept.code
    dept.name = body.name
    dept.code = body.code
    dept.description = body.description
    db.add(dept)

    if old_name != body.name or (old_code and old_code != body.code):
        # Update courses referencing the old name/code to the new name
        courses = list(
            db.scalars(
                select(CourseModel).where(
                    or_(
                        CourseModel.department == old_name,
                        CourseModel.department == old_code,
                    )
                )
            ).all()
        )
        for c in courses:
            c.department = body.name
            db.add(c)

    db.commit()
    db.refresh(dept)

    count = db.scalar(
        select(func.count(CourseModel.id)).where(
            or_(
                CourseModel.department == dept.name,
                CourseModel.department == dept.code,
            )
        )
    ) or 0

    return DepartmentResponseSchema(
        id=dept.id,
        name=dept.name,
        code=dept.code,
        description=dept.description,
        course_count=count,
    )


def delete_department(department_id: int, db: Session) -> None:
    dept = db.get(AcademicDepartmentModel, department_id)
    if not dept:
        raise HTTPException(404, detail="Category id is incorrect")
    db.delete(dept)
    db.commit()