from fastapi import APIRouter, status

from app.academic import controller
from app.academic.dtos import (
    DepartmentResponseSchema,
    DepartmentSchema,
    ProgramResponseSchema,
    ProgramSchema,
    SemesterResponseSchema,
    SemesterSchema,
)
from app.utils.db import get_db
from app.utils.helpers import DbSession, IsAdmin

academic_routes = APIRouter(prefix="/api/academics", tags=["academics"])


@academic_routes.get("/programs", response_model=list[ProgramResponseSchema], status_code=status.HTTP_200_OK)
def get_programs(db: DbSession, _admin: IsAdmin):
    return controller.get_programs(db)


@academic_routes.post("/programs", response_model=ProgramResponseSchema, status_code=status.HTTP_201_CREATED)
def create_program(body: ProgramSchema, db: DbSession, _admin: IsAdmin):
    return controller.create_program(body, db)


@academic_routes.put("/programs/{program_id}", response_model=ProgramResponseSchema, status_code=status.HTTP_200_OK)
def update_program(program_id: int, body: ProgramSchema, db: DbSession, _admin: IsAdmin):
    return controller.update_program(program_id, body, db)


@academic_routes.delete("/programs/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_program(program_id: int, db: DbSession, _admin: IsAdmin):
    return controller.delete_program(program_id, db)


@academic_routes.get("/departments", response_model=list[DepartmentResponseSchema], status_code=status.HTTP_200_OK)
def get_departments(db: DbSession, _admin: IsAdmin):
    return controller.get_departments(db)


@academic_routes.post("/departments", response_model=DepartmentResponseSchema, status_code=status.HTTP_201_CREATED)
def create_department(body: DepartmentSchema, db: DbSession, _admin: IsAdmin):
    return controller.create_department(body, db)


@academic_routes.put("/departments/{department_id}", response_model=DepartmentResponseSchema, status_code=status.HTTP_200_OK)
def update_department(department_id: int, body: DepartmentSchema, db: DbSession, _admin: IsAdmin):
    return controller.update_department(department_id, body, db)


@academic_routes.delete("/departments/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(department_id: int, db: DbSession, _admin: IsAdmin):
    return controller.delete_department(department_id, db)


@academic_routes.get("/semesters", response_model=list[SemesterResponseSchema], status_code=status.HTTP_200_OK)
def get_semesters(db: DbSession, _admin: IsAdmin):
    return controller.get_semesters(db)


@academic_routes.post("/semesters", response_model=SemesterResponseSchema, status_code=status.HTTP_201_CREATED)
def create_semester(body: SemesterSchema, db: DbSession, _admin: IsAdmin):
    return controller.create_semester(body, db)


@academic_routes.put("/semesters/{semester_id}", response_model=SemesterResponseSchema, status_code=status.HTTP_200_OK)
def update_semester(semester_id: int, body: SemesterSchema, db: DbSession, _admin: IsAdmin):
    return controller.update_semester(semester_id, body, db)


@academic_routes.delete("/semesters/{semester_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_semester(semester_id: int, db: DbSession, _admin: IsAdmin):
    return controller.delete_semester(semester_id, db)