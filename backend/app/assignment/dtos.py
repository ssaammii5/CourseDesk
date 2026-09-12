from datetime import datetime

from app.utils.dto import CamelModel


class AssignmentSchema(CamelModel):
    course_id: int
    title: str
    description: str = ""
    topic: str = ""
    kind: str = "Assignment"
    deadline_utc: datetime
    max_marks: int = 100


class AssignmentUpdateSchema(CamelModel):
    title: str
    description: str = ""
    topic: str = ""
    kind: str = "Assignment"
    deadline_utc: datetime
    max_marks: int = 100


class AssignmentResponseSchema(CamelModel):
    id: int
    course_id: int
    course_name: str | None = None
    subject: str | None = None
    program: str | None = None
    department: str | None = None
    session: str | None = None
    title: str
    description: str
    topic: str
    kind: str
    deadline_utc: datetime
    max_marks: int
    status: str
    created_by_id: int
    created_by_name: str | None = None
    created_at_utc: datetime
    submission_count: int = 0
    my_submission_status: str | None = None


class AssignmentAttachmentResponseSchema(CamelModel):
    id: int
    file_name: str
    file_type: str
    file_size: str
    uploaded_at_utc: datetime
    kind: str
    url: str | None = None