from datetime import datetime

from pydantic import EmailStr

from app.utils.dto import CamelModel


class UserAddressSchema(CamelModel):
    street: str = ""
    city: str = ""
    state: str = ""
    zip: str = ""
    country: str = ""


class LearnerDetailsSchema(CamelModel):
    fathers_name: str = ""
    mothers_name: str = ""
    date_of_birth: str = ""
    mobile: str = ""
    nationality: str = ""
    learner_id: str = ""
    reg_no: str = ""
    department: str = ""
    current_program: str = "Undergraduate"
    session: str = ""
    semester_session: str = ""
    address: UserAddressSchema = UserAddressSchema()


class InstructorDetailsSchema(CamelModel):
    instructor_id: str = ""
    designation: str = ""
    department: str = ""


# Backwards compatibility aliases
StudentDetailsSchema = LearnerDetailsSchema
TeacherDetailsSchema = InstructorDetailsSchema


class UserSchema(CamelModel):
    name: str
    email: EmailStr
    password: str
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
    learner_details: LearnerDetailsSchema | None = None
    instructor_details: InstructorDetailsSchema | None = None