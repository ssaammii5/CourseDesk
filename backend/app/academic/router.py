from fastapi import APIRouter, status

from app.academic import controller
from app.academic.dtos import (
    DepartmentResponseSchema,
    DepartmentSchema,
)
from app.utils.helpers import DbSession, IsAdmin, IsAdminOrCoordinator

academic_routes = APIRouter(prefix="/api/academics", tags=["academics"])


# ── Departments / Categories ────────────────────────────────────────────────
@academic_routes.get(
    "/departments", response_model=list[DepartmentResponseSchema], status_code=status.HTTP_200_OK
)
@academic_routes.get(
    "/categories", response_model=list[DepartmentResponseSchema], status_code=status.HTTP_200_OK
)
def get_departments(db: DbSession, _user: IsAdminOrCoordinator):
    return controller.get_departments(db)


@academic_routes.post(
    "/departments", response_model=DepartmentResponseSchema, status_code=status.HTTP_201_CREATED
)
@academic_routes.post(
    "/categories", response_model=DepartmentResponseSchema, status_code=status.HTTP_201_CREATED
)
def create_department(body: DepartmentSchema, db: DbSession, _admin: IsAdmin):
    return controller.create_department(body, db)


@academic_routes.put(
    "/departments/{department_id}",
    response_model=DepartmentResponseSchema,
    status_code=status.HTTP_200_OK,
)
@academic_routes.put(
    "/categories/{department_id}",
    response_model=DepartmentResponseSchema,
    status_code=status.HTTP_200_OK,
)
def update_department(department_id: int, body: DepartmentSchema, db: DbSession, _admin: IsAdmin):
    return controller.update_department(department_id, body, db)


@academic_routes.delete("/departments/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
@academic_routes.delete("/categories/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(department_id: int, db: DbSession, _admin: IsAdmin):
    return controller.delete_department(department_id, db)