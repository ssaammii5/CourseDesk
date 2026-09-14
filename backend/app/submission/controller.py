from datetime import UTC, datetime

from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.assignment.models import AssignmentModel
from app.course.models import CourseModel
from app.submission.dtos import (
    GradeSubmissionSchema,
    SubmissionAttachmentResponseSchema,
    SubmissionResponseSchema,
    SubmitAssignmentSchema,
    serialize_submission,
)
from app.submission.models import (
    SubmissionActivityModel,
    SubmissionAttachmentModel,
    SubmissionModel,
)
from app.user.models import UserModel
from app.utils.helpers import save_upload_file


def _submission_stmt():
    return select(SubmissionModel).options(
        selectinload(SubmissionModel.assignment)
        .selectinload(AssignmentModel.course)
        .selectinload(CourseModel.teachers),
        selectinload(SubmissionModel.student).selectinload(UserModel.student_details),
        selectinload(SubmissionModel.graded_by),
        selectinload(SubmissionModel.attachments),
        selectinload(SubmissionModel.activities),
    )


def get_submissions(user: UserModel, db: Session) -> list[SubmissionResponseSchema]:
    stmt = _submission_stmt()
    if user.role == "Admin":
        submissions = db.scalars(stmt).all()
    elif user.role == "Teacher":
        submissions = db.scalars(
            stmt.where(CourseModel.teachers.any(UserModel.id == user.id))
        ).all()
    else:
        submissions = db.scalars(
            stmt.where(SubmissionModel.student_id == user.id)
        ).all()
    return [serialize_submission(s) for s in submissions]


def get_my_submissions(user: UserModel, db: Session) -> list[SubmissionResponseSchema]:
    if user.role != "Student":
        return []
    submissions = db.scalars(
        _submission_stmt().where(SubmissionModel.student_id == user.id)
    ).all()
    return [serialize_submission(s) for s in submissions]


def _can_view_submission(user: UserModel, submission: SubmissionModel) -> bool:
    if user.role == "Admin":
        return True
    if submission.student_id == user.id:
        return True
    if user.role == "Teacher":
        course = submission.assignment.course
        return course is not None and any(t.id == user.id for t in course.teachers)
    return False


def get_submission(
    submission_id: int, user: UserModel, db: Session
) -> SubmissionResponseSchema:
    submission = db.scalar(_submission_stmt().where(SubmissionModel.id == submission_id))
    if not submission:
        raise HTTPException(404, detail="Submission id is incorrect")
    if not _can_view_submission(user, submission):
        raise HTTPException(403, detail="You don't have access to this submission")
    return serialize_submission(submission)


def submit_assignment(
    body: SubmitAssignmentSchema, user: UserModel, db: Session
) -> SubmissionResponseSchema:
    if user.role != "Student":
        raise HTTPException(403, detail="Only students can submit work")

    assignment = db.scalar(
        select(AssignmentModel).where(AssignmentModel.id == body.assignment_id)
    )
    if not assignment:
        raise HTTPException(404, detail="Assignment id is incorrect")
    if assignment.status != "Published":
        raise HTTPException(400, detail="Assignment is not published")

    now = datetime.now(UTC)
    submission = db.scalar(
        select(SubmissionModel).where(
            SubmissionModel.assignment_id == assignment.id,
            SubmissionModel.student_id == user.id,
        )
    )
    is_new = submission is None

    if submission is None:
        submission = SubmissionModel(
            assignment_id=assignment.id, student_id=user.id
        )
        db.add(submission)

    submission.answer = body.answer
    submission.status = "Submitted"
    submission.submitted_at_utc = now
    submission.is_late = (
        assignment.deadline_utc is not None and now > assignment.deadline_utc
    )
    # ── NEW ──
    submission.private_note = body.private_note
    submission.external_url = body.external_url

    db.add(submission)
    db.flush()

    db.add(
        SubmissionActivityModel(
            submission_id=submission.id,
            action="Started submission" if is_new else "Updated submission",
            actor_name=user.name,
        )
    )
    db.add(
        SubmissionActivityModel(
            submission_id=submission.id,
            action="Submitted assignment",
            actor_name=user.name,
        )
    )

    course = db.scalar(
        select(CourseModel)
        .options(selectinload(CourseModel.teachers))
        .where(CourseModel.id == assignment.course_id)
    )
    teacher_ids = [t.id for t in course.teachers] if course and course.teachers else []
    if teacher_ids:
        from app.notification.controller import create_notifications_bulk

        create_notifications_bulk(
            db=db,
            user_ids=teacher_ids,
            title=f"New submission: {assignment.title}",
            message=f"{user.name} submitted work in {course.name if course else ''}",
            kind="submission",
            link=f"/class/{assignment.course_id}/submissions",
        )

    db.commit()
    return get_submission(submission.id, user, db)


def _can_grade(user: UserModel, submission: SubmissionModel) -> bool:
    if user.role == "Admin":
        return True
    if user.role == "Teacher":
        course = submission.assignment.course
        return course is not None and any(t.id == user.id for t in course.teachers)
    return False


def grade_submission(
    submission_id: int, body: GradeSubmissionSchema, user: UserModel, db: Session
) -> SubmissionResponseSchema:
    submission = db.scalar(_submission_stmt().where(SubmissionModel.id == submission_id))
    if not submission:
        raise HTTPException(404, detail="Submission id is incorrect")
    if not _can_grade(user, submission):
        raise HTTPException(403, detail="You cannot grade this submission")
    if not submission.submitted_at_utc:
        raise HTTPException(400, detail="Cannot grade work that has not been submitted")

    assignment = submission.assignment
    if body.marks < 0 or body.marks > assignment.max_marks:
        raise HTTPException(
            400, detail=f"Marks must be between 0 and {assignment.max_marks}"
        )

    submission.status = "Graded"
    submission.marks = body.marks
    submission.feedback = body.feedback
    submission.graded_by_id = user.id
    submission.graded_at_utc = datetime.now(UTC)
    db.add(submission)
    db.flush()

    db.add(
        SubmissionActivityModel(
            submission_id=submission.id,
            action=f"Graded — {body.marks}/{assignment.max_marks}",
            actor_name=user.name,
        )
    )

    from app.notification.controller import create_notification

    fb = f" • Feedback: {body.feedback}" if body.feedback else ""
    create_notification(
        db=db,
        user_id=submission.student_id,
        title=f"Graded: {assignment.title}",
        message=f"Score: {body.marks}/{assignment.max_marks}{fb}",
        kind="grade",
        link=f"/class/{assignment.course_id}/classwork",
    )

    db.commit()
    return get_submission(submission_id, user, db)


def _can_modify_submission(user: UserModel, submission: SubmissionModel) -> bool:
    if user.role == "Admin":
        return True
    if submission.student_id == user.id:
        return True
    if user.role == "Teacher":
        course = submission.assignment.course
        return course is not None and any(t.id == user.id for t in course.teachers)
    return False


def add_submission_attachment(
    submission_id: int,
    user: UserModel,
    db: Session,
    file: UploadFile | None,
    link_url: str | None,
    link_title: str | None,
) -> SubmissionAttachmentResponseSchema:
    submission = db.scalar(_submission_stmt().where(SubmissionModel.id == submission_id))
    if not submission:
        raise HTTPException(404, detail="Submission id is incorrect")
    if not _can_modify_submission(user, submission):
        raise HTTPException(403, detail="You cannot modify this submission")

    if link_url:
        attachment = SubmissionAttachmentModel(
            submission_id=submission.id,
            file_name=link_title or link_url,
            file_type="Link",
            file_size="—",
            kind="link",
            url=link_url,
        )
    elif file is not None:
        url, file_type, file_size = save_upload_file(file, f"submissions/{submission.id}")
        attachment = SubmissionAttachmentModel(
            submission_id=submission.id,
            file_name=file.filename or "file",
            file_type=file_type,
            file_size=file_size,
            kind="file",
            url=url,
        )
    else:
        raise HTTPException(400, detail="No file or link provided")

    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return SubmissionAttachmentResponseSchema.model_validate(attachment)


def delete_submission_attachment(
    submission_id: int, attachment_id: int, user: UserModel, db: Session
) -> None:
    submission = db.scalar(_submission_stmt().where(SubmissionModel.id == submission_id))
    if not submission:
        raise HTTPException(404, detail="Submission id is incorrect")
    if not _can_modify_submission(user, submission):
        raise HTTPException(403, detail="You cannot modify this submission")

    attachment = db.get(SubmissionAttachmentModel, attachment_id)
    if not attachment or attachment.submission_id != submission_id:
        raise HTTPException(404, detail="Attachment id is incorrect")

    db.delete(attachment)
    db.commit()