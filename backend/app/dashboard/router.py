from fastapi import APIRouter, status

from app.dashboard import controller
from app.dashboard.dtos import DashboardStatsSchema
from app.utils.db import get_db
from app.utils.helpers import DbSession, IsAdmin

dashboard_routes = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@dashboard_routes.get("/stats", response_model=DashboardStatsSchema, status_code=status.HTTP_200_OK)
def get_dashboard_stats(db: DbSession, _admin: IsAdmin):
    return controller.get_stats(db)