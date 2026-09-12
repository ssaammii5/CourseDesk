from fastapi import APIRouter, status

from app.setting import controller
from app.setting.dtos import AppSettingResponseSchema, AppSettingSchema
from app.utils.db import get_db
from app.utils.helpers import DbSession, IsAdmin

setting_routes = APIRouter(prefix="/api/app-settings", tags=["app-settings"])


@setting_routes.get("", response_model=list[AppSettingResponseSchema], status_code=status.HTTP_200_OK)
def get_settings(db: DbSession, _admin: IsAdmin):
    return controller.get_settings(db)


@setting_routes.put("", response_model=AppSettingResponseSchema, status_code=status.HTTP_200_OK)
def upsert_setting(body: AppSettingSchema, db: DbSession, _admin: IsAdmin):
    return controller.upsert_setting(body, db)