from datetime import datetime

from pydantic import EmailStr

from app.utils.dto import CamelModel


class LoginSchema(CamelModel):
    email: EmailStr
    password: str


class SignupSchema(CamelModel):
    first_name: str = ""
    last_name: str = ""
    email: EmailStr
    password: str
    name: str | None = None


class RefreshSchema(CamelModel):
    refresh_token: str


class SetPasswordSchema(CamelModel):
    token: str
    email: EmailStr
    password: str


class SetPasswordResponseSchema(CamelModel):
    message: str = "Password set successfully"


class VerifyInviteResponseSchema(CamelModel):
    valid: bool
    role: str
    email: str | None = None


class AcceptInviteSchema(CamelModel):
    token: str
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    professional_headline: str = ""
    short_bio: str = ""
    timezone: str = "UTC"
    avatar: str | None = None
    links: list[dict] = []




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


class SignupResponseSchema(CamelModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    created_at_utc: datetime


from app.user.dtos import (
    InstructorDetailsSchema,
    LearnerDetailsSchema,
    StudentDetailsSchema,
    TeacherDetailsSchema,
)


class MeResponseSchema(CamelModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool = True
    learner_details: LearnerDetailsSchema | None = None
    instructor_details: InstructorDetailsSchema | None = None
    student_details: StudentDetailsSchema | None = None
    teacher_details: TeacherDetailsSchema | None = None