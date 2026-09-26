from datetime import UTC, datetime

from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.assignment.models import AssignmentModel
from app.course.models import CourseModel
from app.submission.dtos import (
    DraftSubmissionSchema,
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
        .selectinload(CourseModel.instructors),
        selectinload(SubmissionModel.learner).selectinload(UserModel.learner_details),
        selectinload(SubmissionModel.graded_by),
        selectinload(SubmissionModel.attachments),
        selectinload(SubmissionModel.activities),
    )


def get_submissions(user: UserModel, db: Session) -> list[SubmissionResponseSchema]:
    stmt = _submission_stmt()
    if user.role == "Admin":
        submissions = db.scalars(stmt).all()
    elif user.role == "Instructor":
        submissions = db.scalars(
            stmt.where(CourseModel.instructors.any(UserModel.id == user.id))
        ).all()
    else:
        submissions = db.scalars(
            stmt.where(SubmissionModel.learner_id == user.id)
        ).all()
    return [serialize_submission(s) for s in submissions]


def get_my_submissions(user: UserModel, db: Session) -> list[SubmissionResponseSchema]:
    if user.role != "Learner":
        return []
    submissions = db.scalars(
        _submission_stmt().where(SubmissionModel.learner_id == user.id)
    ).all()
    return [serialize_submission(s) for s in submissions]


def _can_view_submission(user: UserModel, submission: SubmissionModel) -> bool:
    if user.role == "Admin":
        return True
    if submission.learner_id == user.id:
        return True
    if user.role == "Instructor":
        course = submission.assignment.course
        return course is not None and any(t.id == user.id for t in course.instructors)
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
    if user.role != "Learner":
        raise HTTPException(403, detail="Only learners can submit work")

    assignment = db.scalar(
        select(AssignmentModel).where(AssignmentModel.id == body.assignment_id)
    )
    if not assignment:
        raise HTTPException(404, detail="Assignment id is incorrect")
    if assignment.status != "Published":
        raise HTTPException(400, detail="Assignment is not published")

    now = datetime.now(UTC)
    if assignment.deadline_utc is not None and now > assignment.deadline_utc:
        raise HTTPException(
            400,
            detail="Submission deadline has passed. This assignment is missed and cannot be submitted."
        )

    submission = db.scalar(
        select(SubmissionModel).where(
            SubmissionModel.assignment_id == assignment.id,
            SubmissionModel.learner_id == user.id,
        )
    )
    is_new = submission is None

    if submission is None:
        submission = SubmissionModel(
            assignment_id=assignment.id, learner_id=user.id
        )
        db.add(submission)

    submission.answer = body.answer
    submission.status = "Submitted"
    submission.submitted_at_utc = now
    submission.is_late = False
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
        .options(selectinload(CourseModel.instructors))
        .where(CourseModel.id == assignment.course_id)
    )
    instructor_ids = [t.id for t in course.instructors] if course and course.instructors else []
    if instructor_ids:
        from app.notification.controller import create_notifications_bulk

        create_notifications_bulk(
            db=db,
            user_ids=instructor_ids,
            title=f"New submission: {assignment.title}",
            message=f"{user.name} submitted work in {course.name if course else ''}",
            kind="submission",
            link=f"/course/{assignment.course_id}/assignments/{assignment.id}",
        )

    db.commit()
    return get_submission(submission.id, user, db)


def _can_grade(user: UserModel, submission: SubmissionModel) -> bool:
    if user.role == "Admin":
        return True
    if user.role == "Instructor":
        course = submission.assignment.course
        return course is not None and any(t.id == user.id for t in course.instructors)
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
        user_id=submission.learner_id,
        title=f"Graded: {assignment.title}",
        message=f"Score: {body.marks}/{assignment.max_marks}{fb}",
        kind="grade",
        link=f"/course/{assignment.course_id}/assignments/{assignment.id}",
    )

    db.commit()
    return get_submission(submission_id, user, db)


def _can_modify_submission(user: UserModel, submission: SubmissionModel) -> bool:
    if user.role == "Admin":
        return True
    if submission.learner_id == user.id:
        return True
    if user.role == "Instructor":
        course = submission.assignment.course
        return course is not None and any(t.id == user.id for t in course.instructors)
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
        raise HTTPException(403, detail="You cannot edit this submission")
    if submission.status == "Graded":
        raise HTTPException(400, detail="Cannot edit a submission that has already been graded")

    now = datetime.now(UTC)
    if link_url:
        parsed_title = (link_title or "").strip() or link_url
        attachment = SubmissionAttachmentModel(
            submission_id=submission_id,
            file_name=parsed_title,
            file_type="link",
            file_size="0 B",
            kind="link",
            url=link_url,
            uploaded_at_utc=now,
        )
    elif file:
        file_path, file_size_str, file_mime = _save_upload(file, f"submissions/{submission_id}")
        attachment = SubmissionAttachmentModel(
            submission_id=submission_id,
            file_name=file.filename or "attachment",
            file_type=file_mime,
            file_size=file_size_str,
            kind="file",
            url=file_path,
            uploaded_at_utc=now,
        )
    else:
        raise HTTPException(400, detail="Must provide either a file or a link")

    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return serialize_attachment(attachment)


def delete_submission_attachment(
    submission_id: int, attachment_id: int, user: UserModel, db: Session
) -> None:
    submission = db.scalar(_submission_stmt().where(SubmissionModel.id == submission_id))
    if not submission:
        raise HTTPException(404, detail="Submission id is incorrect")
    if not _can_modify_submission(user, submission):
        raise HTTPException(403, detail="You cannot edit this submission")
    if submission.status == "Graded":
        raise HTTPException(400, detail="Cannot edit a submission that has already been graded")

    attachment = db.get(SubmissionAttachmentModel, attachment_id)
    if not attachment or attachment.submission_id != submission_id:
        raise HTTPException(404, detail="Attachment id is incorrect")

    db.delete(attachment)
    db.commit()


def get_or_create_draft_submission(
    assignment_id: int, user: UserModel, db: Session
) -> SubmissionResponseSchema:
    if user.role != "Learner":
        raise HTTPException(403, detail="Only learners can create draft submissions")

    assignment = db.scalar(
        select(AssignmentModel)
        .options(selectinload(AssignmentModel.course).selectinload(CourseModel.learners))
        .where(AssignmentModel.id == assignment_id)
    )
    if not assignment:
        raise HTTPException(404, detail="Assignment id is incorrect")

    if assignment.course and not any(s.id == user.id for s in assignment.course.learners):
        raise HTTPException(403, detail="You are not enrolled in this course")

    submission = db.scalar(
        _submission_stmt().where(
            SubmissionModel.assignment_id == assignment.id,
            SubmissionModel.learner_id == user.id,
        )
    )
    if submission is None:
        submission = SubmissionModel(
            assignment_id=assignment.id,
            learner_id=user.id,
            status="Draft",
            answer="",
        )
        db.add(submission)
        db.flush()
        db.add(
            SubmissionActivityModel(
                submission_id=submission.id,
                action="Started draft",
                actor_name=user.name,
            )
        )
        db.commit()
        db.refresh(submission)
        submission = db.scalar(
            _submission_stmt().where(SubmissionModel.id == submission.id)
        )

    return serialize_submission(submission)


def unsubmit_assignment(
    submission_id: int, user: UserModel, db: Session
) -> SubmissionResponseSchema:
    submission = db.scalar(_submission_stmt().where(SubmissionModel.id == submission_id))
    if not submission:
        raise HTTPException(404, detail="Submission id is incorrect")
    if user.role != "Admin" and submission.learner_id != user.id:
        raise HTTPException(403, detail="You cannot unsubmit this submission")
    if submission.status == "Graded":
        raise HTTPException(400, detail="Cannot unsubmit work that has already been graded")

    now = datetime.now(UTC)
    if submission.assignment and submission.assignment.deadline_utc is not None and now > submission.assignment.deadline_utc:
        raise HTTPException(400, detail="Cannot unsubmit work after the deadline has passed.")

    submission.status = "Draft"
    submission.submitted_at_utc = None
    db.add(submission)
    db.add(
        SubmissionActivityModel(
            submission_id=submission.id,
            action="Unsubmitted assignment",
            actor_name=user.name,
        )
    )
    db.commit()
    db.refresh(submission)
    return serialize_submission(submission)