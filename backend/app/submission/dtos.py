from datetime import datetime

from app.utils.dto import CamelModel


class DraftSubmissionSchema(CamelModel):
    assignment_id: int


class SubmitAssignmentSchema(CamelModel):
    assignment_id: int
    answer: str = ""
    # ── NEW ──
    private_note: str = ""
    external_url: str | None = None


class GradeSubmissionSchema(CamelModel):
    marks: int
    feedback: str | None = None


class SubmissionAttachmentResponseSchema(CamelModel):
    id: int
    file_name: str
    file_type: str
    file_size: str
    uploaded_at_utc: datetime
    kind: str
    url: str | None = None


class SubmissionActivityResponseSchema(CamelModel):
    id: int
    action: str
    actor_name: str
    timestamp_utc: datetime


class SubmissionResponseSchema(CamelModel):
    id: int
    assignment_id: int
    assignment_title: str | None = None
    course_id: int
    course_name: str | None = None
    program: str | None = None
    department: str | None = None
    session: str | None = None
    student_id: int
    student_name: str | None = None
    student_email: str | None = None
    student_academic_id: str | None = None
    student_department: str | None = None
    student_program: str | None = None
    answer: str
    status: str
    marks: int | None = None
    feedback: str | None = None
    submitted_at_utc: datetime | None = None
    created_at_utc: datetime
    graded_by_id: int | None = None
    graded_by_name: str | None = None
    graded_at_utc: datetime | None = None
    is_late: bool
    max_marks: int
    attachments: list[SubmissionAttachmentResponseSchema] = []
    activities: list[SubmissionActivityResponseSchema] = []
    # ── NEW ──
    private_note: str = ""
    external_url: str | None = None


def serialize_submission(submission) -> "SubmissionResponseSchema":
    from app.submission.models import SubmissionModel  # noqa: F401

    assignment = submission.assignment
    course = assignment.course if assignment else None
    student = submission.student
    details = student.student_details if student else None

    return SubmissionResponseSchema(
        id=submission.id,
        assignment_id=submission.assignment_id,
        assignment_title=assignment.title if assignment else None,
        course_id=course.id if course else 0,
        course_name=course.name if course else None,
        program=course.program if course else None,
        department=course.department if course else None,
        session=course.session if course else None,
        student_id=submission.student_id,
        student_name=student.name if student else None,
        student_email=student.email if student else None,
        student_academic_id=details.student_id if details else None,
        student_department=details.department if details else None,
        student_program=details.current_program if details else None,
        answer=submission.answer,
        status=submission.status,
        marks=submission.marks,
        feedback=submission.feedback,
        submitted_at_utc=submission.submitted_at_utc,
        created_at_utc=submission.created_at_utc,
        graded_by_id=submission.graded_by_id,
        graded_by_name=submission.graded_by.name if submission.graded_by else None,
        graded_at_utc=submission.graded_at_utc,
        is_late=submission.is_late,
        max_marks=assignment.max_marks if assignment else 0,
        attachments=[
            SubmissionAttachmentResponseSchema.model_validate(a)
            for a in submission.attachments
        ],
        activities=[
            SubmissionActivityResponseSchema.model_validate(x)
            for x in submission.activities
        ],
        # ── NEW ──
        private_note=submission.private_note,
        external_url=submission.external_url,
    )