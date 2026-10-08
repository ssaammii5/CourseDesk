from pathlib import Path
from typing import ClassVar

from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config: ClassVar[SettingsConfigDict] = SettingsConfigDict(
        env_file=(_BACKEND_DIR / ".env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Core Security & Database
    DB_CONNECTION: str
    SECRET_KEY: str
    ALGORITHM: str
    EXP_TIME: int
    REFRESH_EXP_DAYS: int

    # App & Storage Configuration
    ALLOWED_ORIGINS: str
    FRONTEND_URL: str
    UPLOAD_DIR: str

    # Email Service Configuration (Resend)
    RESEND_API_KEY: str = ""
    RESEND_FROM: str = ""

    # Optional SMTP Configuration
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""


settings = Settings()  # pyright: ignore[reportCallIssue]