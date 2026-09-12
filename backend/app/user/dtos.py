from datetime import datetime

from pydantic import EmailStr

from app.utils.dto import CamelModel


class UserAddressSchema(CamelModel):
    street: str = ""
    city: str = ""
    state: str = ""
    zip: str = ""
    country: str = ""


class StudentDetailsSchema(CamelModel):
    fathers_name: str = ""
    mothers_name: str = ""
    date_of_birth: str = ""
    mobile: str = ""
    nationality: str = ""
    student_id: str = ""
    reg_no: str = ""
    department: str = ""
    current_program: str = "Undergraduate"
    session: str = ""
    semester_session: str = ""
    address: UserAddressSchema = UserAddressSchema()


class TeacherDetailsSchema(CamelModel):
    teacher_id: str = ""
    designation: str = ""
    department: str = ""


class UserSchema(CamelModel):
    name: str
    email: EmailStr
    password: str
    role: str = "Student"
    student_details: StudentDetailsSchema | None = None
    teacher_details: TeacherDetailsSchema | None = None


class UserUpdateSchema(CamelModel):
    name: str
    email: EmailStr
    role: str
    is_active: bool = True
    password: str | None = None
    student_details: StudentDetailsSchema | None = None
    teacher_details: TeacherDetailsSchema | None = None


class UserResponseSchema(CamelModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    created_at_utc: datetime
    student_details: StudentDetailsSchema | None = None
    teacher_details: TeacherDetailsSchema | None = None