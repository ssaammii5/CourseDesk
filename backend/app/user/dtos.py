from datetime import datetime

from pydantic import EmailStr

from app.utils.dto import CamelModel


class UserAddressSchema(CamelModel):
    street: str = ""
    city: str = ""
    state: str = ""
    zip: str = ""
    country: str = ""


class InstructorLinkSchema(CamelModel):
    title: str = ""
    url: str = ""


UserLinkSchema = InstructorLinkSchema


class LearnerDetailsSchema(CamelModel):
    learner_id: str = ""
    first_name: str = ""
    last_name: str = ""
    email: str = ""
    avatar: str = ""
    short_bio: str = ""
    timezone: str = "UTC"
    links: list[InstructorLinkSchema] = []
    fathers_name: str = ""
    mothers_name: str = ""
    date_of_birth: str = ""
    mobile: str = ""
    nationality: str = ""
    reg_no: str = ""
    address: UserAddressSchema = UserAddressSchema()


class InstructorDetailsSchema(CamelModel):
    instructor_id: str = ""
    first_name: str = ""
    last_name: str = ""
    email: str = ""
    avatar: str = ""
    professional_headline: str = ""
    headline: str = ""
    timezone: str = "UTC"
    links: list[InstructorLinkSchema] = []


# Backwards compatibility aliases
StudentDetailsSchema = LearnerDetailsSchema
TeacherDetailsSchema = InstructorDetailsSchema


class UserSchema(CamelModel):
    name: str
    email: EmailStr
    password: str | None = None
    role: str = "Learner"
    learner_details: LearnerDetailsSchema | None = None
    instructor_details: InstructorDetailsSchema | None = None


class UserUpdateSchema(CamelModel):
    name: str
    email: EmailStr
    role: str
    is_active: bool = True
    password: str | None = None
    learner_details: LearnerDetailsSchema | None = None
    instructor_details: InstructorDetailsSchema | None = None


class UserResponseSchema(CamelModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    created_at_utc: datetime
    invite_token: str | None = None
    learner_details: LearnerDetailsSchema | None = None
    instructor_details: InstructorDetailsSchema | None = None


class InviteInstructorSchema(CamelModel):
    email: EmailStr


InviteLearnerSchema = InviteInstructorSchema


class PendingInvitationSchema(CamelModel):
    id: int
    email: str
    role: str
    created_at_utc: datetime
    expires_at_utc: datetime
    invite_token: str | None = None