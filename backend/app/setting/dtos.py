from app.utils.dto import CamelModel


class AppSettingSchema(CamelModel):
    key: str
    value: str
    description: str = ""
    category: str = "General"


class AppSettingResponseSchema(AppSettingSchema):
    pass


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