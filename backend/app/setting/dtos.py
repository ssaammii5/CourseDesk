from app.utils.dto import CamelModel


class AppSettingSchema(CamelModel):
    key: str
    value: str
    description: str = ""
    category: str = "General"


class AppSettingResponseSchema(AppSettingSchema):
    pass