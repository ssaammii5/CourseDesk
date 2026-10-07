from app.utils.dto import CamelModel


class DepartmentSchema(CamelModel):
    name: str
    code: str = ""
    description: str = ""


class DepartmentResponseSchema(DepartmentSchema):
    id: int
    course_count: int = 0


CategorySchema = DepartmentSchema
CategoryResponseSchema = DepartmentResponseSchema


class TagSchema(CamelModel):
    name: str
    description: str = ""


class TagResponseSchema(TagSchema):
    id: int
    course_count: int = 0


class TagCoursesSchema(CamelModel):
    course_ids: list[int] = []