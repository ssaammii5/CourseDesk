from app.utils.dto import CamelModel


class ProgramSchema(CamelModel):
    name: str
    description: str = ""


class ProgramResponseSchema(ProgramSchema):
    id: int


class DepartmentSchema(CamelModel):
    name: str
    code: str


class DepartmentResponseSchema(DepartmentSchema):
    id: int


class SemesterSchema(CamelModel):
    name: str


class SemesterResponseSchema(SemesterSchema):
    id: int