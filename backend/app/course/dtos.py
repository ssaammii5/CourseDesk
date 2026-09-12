from app.utils.dto import CamelModel


class CourseSchema(CamelModel):
    name: str
    subject: str = ""
    program: str
    department: str
    session: str
    is_active: bool = True
    teacher_ids: list[int] = []
    student_ids: list[int] = []


class CourseResponseSchema(CamelModel):
    id: int
    name: str
    subject: str
    program: str
    department: str
    session: str
    is_active: bool
    teacher_id: int | None = None
    teacher_name: str | None = None
    teacher_ids: list[int] = []
    teacher_names: list[str] = []
    student_ids: list[int] = []
    student_count: int = 0


class CoursePersonSchema(CamelModel):
    id: int
    name: str
    role: str
    email: str


class CoursePeopleResponseSchema(CamelModel):
    teachers: list[CoursePersonSchema] = []
    students: list[CoursePersonSchema] = []