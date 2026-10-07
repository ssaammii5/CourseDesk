from app.utils.dto import CamelModel


class AppSettingSchema(CamelModel):
    key: str
    value: str
    description: str = ""
    category: str = "General"


class AppSettingResponseSchema(AppSettingSchema):
    pass


class PublicPlatformSettingsSchema(CamelModel):
    platform_name: str = "CourseDesk"
    site_name: str = "CourseDesk"
    platform_tagline: str = "Modern Learning & Assessment Management Platform"
    brand_logo_light: str = ""
    brand_logo_dark: str = ""
    brand_favicon: str = "/favicon.ico"
    maintenance_mode: bool = False
    maintenance_banner_message: str = "CourseDesk is currently undergoing scheduled maintenance. Normal access will resume shortly."


class SystemHealthResponseSchema(CamelModel):
    total_courses: int
    total_assignments: int
    total_submissions: int
    total_learners: int
    total_instructors: int
    estimated_storage_mb: float
    storage_quota_mb: float = 51200.0
    status: str = "Healthy"
    database_status: str = "Connected"


class SystemActivityItemSchema(CamelModel):
    id: int | str
    action: str
    details: str
    actor: str
    timestamp: str
    category: str = "system"


class PaginatedSystemActivitiesSchema(CamelModel):
    items: list[SystemActivityItemSchema]
    total: int
    has_more: bool
    offset: int
    limit: int
    retention_days: int = 30