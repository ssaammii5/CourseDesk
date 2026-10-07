from fastapi import HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.academic.dtos import (
    DepartmentResponseSchema,
    DepartmentSchema,
    TagResponseSchema,
    TagSchema,
)
from app.academic.models import AcademicDepartmentModel, AcademicTagModel
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


# ── Tags ─────────────────────────────────────────────────────────────────────
def get_tags(db: Session) -> list[TagResponseSchema]:
    tags = list(db.scalars(select(AcademicTagModel).order_by(AcademicTagModel.name)).all())
    courses = list(db.scalars(select(CourseModel)).all())
    results: list[TagResponseSchema] = []
    for t in tags:
        c_count = sum(
            1 for c in courses if c.tags and any(ct.lower() == t.name.lower() for ct in c.tags)
        )
        results.append(
            TagResponseSchema(
                id=t.id,
                name=t.name,
                description=t.description,
                course_count=c_count,
            )
        )
    return results


def create_tag(body: TagSchema, db: Session) -> TagResponseSchema:
    cleaned_name = body.name.strip().replace("#", "")
    if not cleaned_name:
        raise HTTPException(400, detail="Tag name cannot be empty")
    exists = db.scalar(
        select(AcademicTagModel).where(func.lower(AcademicTagModel.name) == cleaned_name.lower())
    )
    if exists:
        raise HTTPException(400, detail="A tag with this name already exists")
    tag = AcademicTagModel(name=cleaned_name, description=body.description.strip())
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return TagResponseSchema(
        id=tag.id,
        name=tag.name,
        description=tag.description,
        course_count=0,
    )


def update_tag(tag_id: int, body: TagSchema, db: Session) -> TagResponseSchema:
    tag = db.get(AcademicTagModel, tag_id)
    if not tag:
        raise HTTPException(404, detail="Tag not found")
    cleaned_name = body.name.strip().replace("#", "")
    if not cleaned_name:
        raise HTTPException(400, detail="Tag name cannot be empty")
    dup = db.scalar(
        select(AcademicTagModel).where(
            (AcademicTagModel.id != tag_id)
            & (func.lower(AcademicTagModel.name) == cleaned_name.lower())
        )
    )
    if dup:
        raise HTTPException(400, detail="A tag with this name already exists")

    old_name = tag.name
    tag.name = cleaned_name
    tag.description = body.description.strip()
    db.add(tag)

    if old_name.lower() != cleaned_name.lower():
        # Update tags inside courses that used old tag name
        courses = list(db.scalars(select(CourseModel)).all())
        for c in courses:
            if c.tags and any(t.lower() == old_name.lower() for t in c.tags):
                updated = [cleaned_name if t.lower() == old_name.lower() else t for t in c.tags]
                c.tags = updated
                db.add(c)

    db.commit()
    db.refresh(tag)

    courses = list(db.scalars(select(CourseModel)).all())
    count = sum(
        1 for c in courses if c.tags and any(ct.lower() == tag.name.lower() for ct in c.tags)
    )
    return TagResponseSchema(
        id=tag.id,
        name=tag.name,
        description=tag.description,
        course_count=count,
    )


def delete_tag(tag_id: int, db: Session) -> None:
    tag = db.get(AcademicTagModel, tag_id)
    if not tag:
        raise HTTPException(404, detail="Tag not found")
    db.delete(tag)
    db.commit()


def set_tag_courses(tag_id: int, course_ids: list[int], db: Session) -> TagResponseSchema:
    tag = db.get(AcademicTagModel, tag_id)
    if not tag:
        raise HTTPException(404, detail="Tag not found")
    tag_name = tag.name
    courses = list(db.scalars(select(CourseModel)).all())
    target_set = set(course_ids)
    for c in courses:
        current_tags = list(c.tags or [])
        has_tag = any(t.lower() == tag_name.lower() for t in current_tags)
        should_have = c.id in target_set
        if should_have and not has_tag:
            current_tags.append(tag_name)
            c.tags = current_tags
            db.add(c)
        elif not should_have and has_tag:
            c.tags = [t for t in current_tags if t.lower() != tag_name.lower()]
            db.add(c)
    db.commit()

    courses_after = list(db.scalars(select(CourseModel)).all())
    count = sum(
        1 for c in courses_after if c.tags and any(t.lower() == tag.name.lower() for t in c.tags)
    )
    return TagResponseSchema(
        id=tag.id,
        name=tag.name,
        description=tag.description,
        course_count=count,
    )