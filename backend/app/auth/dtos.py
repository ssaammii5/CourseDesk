from datetime import datetime

from pydantic import EmailStr

from app.utils.dto import CamelModel


class LoginSchema(CamelModel):
    email: EmailStr
    password: str


class RefreshSchema(CamelModel):
    refresh_token: str


class LoginResponseSchema(CamelModel):
    token: str
    access_token: str
    access_token_expires_at_utc: datetime
    refresh_token: str
    email: str
    name: str
    role: str


class RefreshResponseSchema(CamelModel):
    token: str
    access_token: str
    access_token_expires_at_utc: datetime
    refresh_token: str
    email: str | None = None
    name: str | None = None
    role: str | None = None


class MeResponseSchema(CamelModel):
    id: int
    name: str
    email: str
    role: str