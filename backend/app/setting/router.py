from fastapi import APIRouter, status

from app.setting import controller
from app.setting.dtos import (
    AppSettingResponseSchema,
    AppSettingSchema,
    SystemActivityItemSchema,
    SystemHealthResponseSchema,
)
from app.utils.helpers import DbSession, IsAdmin

setting_routes = APIRouter(prefix="/api/app-settings", tags=["app-settings"])


@setting_routes.get("", response_model=list[AppSettingResponseSchema], status_code=status.HTTP_200_OK)
def get_settings(db: DbSession, _admin: IsAdmin):
    return controller.get_settings(db)


@setting_routes.put("", response_model=AppSettingResponseSchema, status_code=status.HTTP_200_OK)
def upsert_setting(body: AppSettingSchema, db: DbSession, _admin: IsAdmin):
    return controller.upsert_setting(body, db)


@setting_routes.put("/batch", response_model=list[AppSettingResponseSchema], status_code=status.HTTP_200_OK)
def batch_upsert_settings(body: list[AppSettingSchema], db: DbSession, _admin: IsAdmin):
    return controller.batch_upsert_settings(body, db)


@setting_routes.get("/health", response_model=SystemHealthResponseSchema, status_code=status.HTTP_200_OK)
def get_system_health(db: DbSession, _admin: IsAdmin):
    return controller.get_system_health(db)


@setting_routes.get("/activities", response_model=list[SystemActivityItemSchema], status_code=status.HTTP_200_OK)
def get_system_activities(db: DbSession, _admin: IsAdmin):
    return controller.get_system_activities(db)