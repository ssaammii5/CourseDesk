from app.utils.dto import CamelModel


class CourseSchema(CamelModel):
    name: str
    subject: str = ""
    program: str = ""
    department: str = ""
    session: str = ""
    is_active: bool = True
    instructor_ids: list[int] = []
    learner_ids: list[int] = []
    teacher_ids: list[int] = []
    student_ids: list[int] = []


class CourseResponseSchema(CamelModel):
    id: int
    name: str
    subject: str = ""
    program: str = ""
    department: str = ""
    session: str = ""
    is_active: bool = True
    instructor_id: int | None = None
    instructor_name: str | None = None
    instructor_ids: list[int] = []
    instructor_names: list[str] = []
    learner_ids: list[int] = []
    learner_count: int = 0
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
    instructors: list[CoursePersonSchema] = []
    learners: list[CoursePersonSchema] = []
    teachers: list[CoursePersonSchema] = []
    students: list[CoursePersonSchema] = []


class CourseInstructorAllotmentSchema(CamelModel):
    instructor_ids: list[int] = []


class CourseLearnerAllotmentSchema(CamelModel):
    learner_ids: list[int] = []


class CourseLearnerBatchSchema(CamelModel):
    add_learner_ids: list[int] = []
    remove_learner_ids: list[int] = []


class CoursePreferencesSchema(CamelModel):
    hidden_course_ids: list[int] = []
    course_order: list[int] = []
    sort_mode: str = "custom"
    view_mode: str = "grid"