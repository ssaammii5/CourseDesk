from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.academic.dtos import (
    DepartmentSchema,
    ProgramSchema,
    SemesterSchema,
)
from app.academic.models import (
    AcademicDepartmentModel,
    AcademicProgramModel,
    AcademicSemesterModel,
)


# ── Programs ────────────────────────────────────────────────────────────────
def get_programs(db: Session):
    return list(db.scalars(select(AcademicProgramModel)).all())


def create_program(body: ProgramSchema, db: Session):
    exists = db.scalar(
        select(AcademicProgramModel).where(AcademicProgramModel.name == body.name)
    )
    if exists:
        raise HTTPException(400, detail="Program already exists")
    program = AcademicProgramModel(name=body.name, description=body.description)
    db.add(program)
    db.commit()
    db.refresh(program)
    return program


def update_program(program_id: int, body: ProgramSchema, db: Session):
    program = db.get(AcademicProgramModel, program_id)
    if not program:
        raise HTTPException(404, detail="Program id is incorrect")
    program.name = body.name
    program.description = body.description
    db.add(program)
    db.commit()
    db.refresh(program)
    return program


def delete_program(program_id: int, db: Session) -> None:
    program = db.get(AcademicProgramModel, program_id)
    if not program:
        raise HTTPException(404, detail="Program id is incorrect")
    db.delete(program)
    db.commit()


# ── Departments ─────────────────────────────────────────────────────────────
def get_departments(db: Session):
    return list(db.scalars(select(AcademicDepartmentModel)).all())


def create_department(body: DepartmentSchema, db: Session):
    exists = db.scalar(
        select(AcademicDepartmentModel).where(
            (AcademicDepartmentModel.name == body.name)
            | (AcademicDepartmentModel.code == body.code)
        )
    )
    if exists:
        raise HTTPException(400, detail="Department name or code already exists")
    department = AcademicDepartmentModel(name=body.name, code=body.code)
    db.add(department)
    db.commit()
    db.refresh(department)
    return department


def update_department(department_id: int, body: DepartmentSchema, db: Session):
    department = db.get(AcademicDepartmentModel, department_id)
    if not department:
        raise HTTPException(404, detail="Department id is incorrect")
    department.name = body.name
    department.code = body.code
    db.add(department)
    db.commit()
    db.refresh(department)
    return department


def delete_department(department_id: int, db: Session) -> None:
    department = db.get(AcademicDepartmentModel, department_id)
    if not department:
        raise HTTPException(404, detail="Department id is incorrect")
    db.delete(department)
    db.commit()


# ── Semesters ───────────────────────────────────────────────────────────────
def get_semesters(db: Session):
    return list(db.scalars(select(AcademicSemesterModel)).all())


def create_semester(body: SemesterSchema, db: Session):
    exists = db.scalar(
        select(AcademicSemesterModel).where(AcademicSemesterModel.name == body.name)
    )
    if exists:
        raise HTTPException(400, detail="Semester already exists")
    semester = AcademicSemesterModel(name=body.name)
    db.add(semester)
    db.commit()
    db.refresh(semester)
    return semester


def update_semester(semester_id: int, body: SemesterSchema, db: Session):
    semester = db.get(AcademicSemesterModel, semester_id)
    if not semester:
        raise HTTPException(404, detail="Semester id is incorrect")
    semester.name = body.name
    db.add(semester)
    db.commit()
    db.refresh(semester)
    return semester


def delete_semester(semester_id: int, db: Session) -> None:
    semester = db.get(AcademicSemesterModel, semester_id)
    if not semester:
        raise HTTPException(404, detail="Semester id is incorrect")
    db.delete(semester)
    db.commit()