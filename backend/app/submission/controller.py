from datetime import UTC, datetime

from fastapi import HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.assignment.controller import find_assignment
from app.assignment.models import AssignmentModel
from app.course.controller import find_course
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


def is_deadline_passed(deadline: datetime | None) -> bool:
    if not deadline:
        return False
    now = datetime.now(UTC)
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=UTC)
    return now > deadline


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


def find_submission(submission_id_or_code: int | str, db: Session) -> SubmissionModel | None:
    if isinstance(submission_id_or_code, int):
        return db.scalar(_submission_stmt().where(SubmissionModel.id == submission_id_or_code))
    s_str = str(submission_id_or_code).strip()
    if s_str.isdigit():
        s = db.scalar(_submission_stmt().where(SubmissionModel.id == int(s_str)))
        if s:
            return s
    return db.scalar(_submission_stmt().where(SubmissionModel.code == s_str))


def get_submissions(
    user: UserModel,
    db: Session,
    course_id: int | str | None = None,
    status: str | None = None,
    limit: int | None = None,
    offset: int = 0,
) -> list[SubmissionResponseSchema]:
    stmt = _submission_stmt()
    if course_id is not None:
        course = find_course(course_id, db)
        if course:
            stmt = stmt.join(SubmissionModel.assignment).where(AssignmentModel.course_id == course.id)

    if status:
        if status.lower() == "pending":
            stmt = stmt.where(SubmissionModel.status.in_(("Submitted", "Pending")))
        else:
            stmt = stmt.where(SubmissionModel.status == status)

    if user.role in ("Admin", "Coordinator", "Co-ordinator"):
        pass
    elif user.role == "Instructor":
        stmt = stmt.where(CourseModel.instructors.any(UserModel.id == user.id))
    else:
        stmt = stmt.where(SubmissionModel.learner_id == user.id)

    stmt = stmt.order_by(SubmissionModel.created_at_utc.desc())

    if offset > 0:
        stmt = stmt.offset(offset)
    if limit is not None and limit > 0:
        stmt = stmt.limit(limit)

    submissions = db.scalars(stmt).all()
    return [serialize_submission(s) for s in submissions]


def get_course_submissions(
    course_id: int | str, user: UserModel, db: Session
) -> list[SubmissionResponseSchema]:
    return get_submissions(user, db, course_id=course_id)


def get_my_submissions(user: UserModel, db: Session) -> list[SubmissionResponseSchema]:
    if user.role != "Learner":
        return []
    submissions = db.scalars(
        _submission_stmt().where(SubmissionModel.learner_id == user.id)
    ).all()
    return [serialize_submission(s) for s in submissions]


def _can_view_submission(user: UserModel, submission: SubmissionModel) -> bool:
    if user.role in ("Admin", "Coordinator", "Co-ordinator"):
        return True
    if submission.learner_id == user.id:
        return True
    if user.role == "Instructor":
        course = submission.assignment.course
        return course is not None and any(t.id == user.id for t in course.instructors)
    return False


def get_submission(
    submission_id: int | str, user: UserModel, db: Session
) -> SubmissionResponseSchema:
    submission = find_submission(submission_id, db)
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

    assignment = find_assignment(body.assignment_id, db)
    if not assignment:
        raise HTTPException(404, detail="Assignment id is incorrect")
    if assignment.status != "Published":
        raise HTTPException(400, detail="Assignment is not published")

    now = datetime.now(UTC)
    deadline = assignment.deadline_utc
    deadline_passed = is_deadline_passed(deadline)
    allow_late = getattr(assignment, "allow_late_submissions", True)
    if allow_late is None:
        allow_late = True

    if deadline_passed and not allow_late:
        raise HTTPException(
            400,
            detail="Submission deadline has passed. This assignment is not accepting late submissions."
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
    submission.is_late = deadline_passed
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
    submission_id: int | str, body: GradeSubmissionSchema, user: UserModel, db: Session
) -> SubmissionResponseSchema:
    submission = find_submission(submission_id, db)
    if not submission:
        raise HTTPException(404, detail="Submission id is incorrect")
    if not _can_grade(user, submission):
        raise HTTPException(403, detail="You cannot grade this submission")
    if not submission.submitted_at_utc:
        submission.submitted_at_utc = datetime.now(UTC)

    assignment = submission.assignment
    if body.marks < 0 or (assignment.max_marks > 0 and body.marks > assignment.max_marks):
        raise HTTPException(
            400, detail=f"Marks must be between 0 and {assignment.max_marks}"
        )

    submission.status = "Graded"
    submission.marks = body.marks if assignment.max_marks > 0 else 0
    submission.feedback = body.feedback
    submission.graded_by_id = user.id
    submission.graded_at_utc = datetime.now(UTC)
    db.add(submission)
    db.flush()

    action_text = (
        f"Graded — {body.marks}/{assignment.max_marks}"
        if assignment.max_marks > 0
        else "Reviewed submission"
    )
    db.add(
        SubmissionActivityModel(
            submission_id=submission.id,
            action=action_text,
            actor_name=user.name,
        )
    )

    from app.notification.controller import create_notification

    fb = f" • Feedback: {body.feedback}" if body.feedback else ""
    msg = (
        f"Score: {body.marks}/{assignment.max_marks}{fb}"
        if assignment.max_marks > 0
        else f"Reviewed by instructor{fb}"
    )
    course = assignment.course if assignment else None
    course_ref = course.code or course.id if course else assignment.course_id
    asg_ref = assignment.code or assignment.id
    create_notification(
        db=db,
        user_id=submission.learner_id,
        title=f"Reviewed: {assignment.title}" if assignment.max_marks == 0 else f"Graded: {assignment.title}",
        message=msg,
        kind="grade",
        link=f"/course/{course_ref}/assignments/{asg_ref}",
    )

    db.commit()
    return get_submission(submission.id, user, db)


def ungrade_submission(
    submission_id: int | str, user: UserModel, db: Session
) -> SubmissionResponseSchema:
    submission = find_submission(submission_id, db)
    if not submission:
        raise HTTPException(404, detail="Submission id is incorrect")
    if not _can_grade(user, submission):
        raise HTTPException(403, detail="You cannot ungrade this submission")

    has_work = bool(submission.attachments and len(submission.attachments) > 0) or bool(
        submission.answer and submission.answer.strip() and submission.answer != "Submitted via file attachment"
    ) or bool(submission.external_url and submission.external_url.strip())

    submission.status = "Submitted" if submission.submitted_at_utc else ("Draft" if has_work else "Assigned")
    submission.marks = None
    submission.graded_by_id = None
    submission.graded_at_utc = None
    db.add(submission)
    db.add(
        SubmissionActivityModel(
            submission_id=submission.id,
            action="Marked as ungraded",
            actor_name=user.name,
        )
    )
    db.commit()
    return get_submission(submission.id, user, db)


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
    submission_id: int | str,
    user: UserModel,
    db: Session,
    file: UploadFile | None,
    link_url: str | None,
    link_title: str | None,
) -> SubmissionAttachmentResponseSchema:
    submission = find_submission(submission_id, db)
    if not submission:
        raise HTTPException(404, detail="Submission id is incorrect")
    if not _can_modify_submission(user, submission):
        raise HTTPException(403, detail="You cannot edit this submission")
    if submission.status == "Graded":
        raise HTTPException(400, detail="Cannot edit a submission that has already been graded")
    if submission.status in ("Submitted", "Turned in"):
        raise HTTPException(400, detail="Cannot edit a submission that has already been turned in. Please unsubmit first.")

    assignment = submission.assignment
    if assignment:
        deadline_passed = is_deadline_passed(assignment.deadline_utc)
        allow_late = getattr(assignment, "allow_late_submissions", True)
        if allow_late is None:
            allow_late = True
        if deadline_passed and not allow_late:
            raise HTTPException(400, detail="Submission deadline has passed. Submissions are closed.")

    now = datetime.now(UTC)
    if link_url:
        parsed_title = (link_title or "").strip() or link_url
        attachment = SubmissionAttachmentModel(
            submission_id=submission.id,
            file_name=parsed_title,
            file_type="link",
            file_size="0 B",
            kind="link",
            url=link_url,
            uploaded_at_utc=now,
        )
    elif file:
        file_path, file_mime, file_size_str = save_upload_file(file, f"submissions/{submission.id}")
        attachment = SubmissionAttachmentModel(
            submission_id=submission.id,
            file_name=file.filename or "attachment",
            file_type=file_mime,
            file_size=file_size_str,
            kind="file",
            url=file_path,
            uploaded_at_utc=now,
        )
    else:
        raise HTTPException(400, detail="Must provide either a file or a link")

    if submission.status not in ("Submitted", "Graded"):
        submission.status = "Draft"
        db.add(submission)

    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return SubmissionAttachmentResponseSchema.model_validate(attachment)


def delete_submission_attachment(
    submission_id: int | str, attachment_id: int, user: UserModel, db: Session
) -> None:
    submission = find_submission(submission_id, db)
    if not submission:
        raise HTTPException(404, detail="Submission id is incorrect")
    if not _can_modify_submission(user, submission):
        raise HTTPException(403, detail="You cannot edit this submission")
    if submission.status == "Graded":
        raise HTTPException(400, detail="Cannot edit a submission that has already been graded")
    if submission.status in ("Submitted", "Turned in"):
        raise HTTPException(400, detail="Cannot edit a submission that has already been turned in. Please unsubmit first.")

    assignment = submission.assignment
    if assignment:
        deadline_passed = is_deadline_passed(assignment.deadline_utc)
        allow_late = getattr(assignment, "allow_late_submissions", True)
        if allow_late is None:
            allow_late = True
        if deadline_passed and not allow_late:
            raise HTTPException(400, detail="Submission deadline has passed. Submissions are closed.")

    attachment = db.get(SubmissionAttachmentModel, attachment_id)
    if not attachment or attachment.submission_id != submission.id:
        raise HTTPException(404, detail="Attachment id is incorrect")

    if submission.attachments and attachment in submission.attachments:
        submission.attachments.remove(attachment)
    db.delete(attachment)

    has_work = bool(submission.attachments and len(submission.attachments) > 0) or bool(
        submission.answer and submission.answer.strip() and submission.answer != "Submitted via file attachment"
    ) or bool(submission.external_url and submission.external_url.strip())
    if submission.status == "Draft" and not has_work:
        submission.status = "Assigned"

    db.commit()


def get_or_create_draft_submission(
    assignment_id: int | str, user: UserModel, db: Session
) -> SubmissionResponseSchema:
    if user.role != "Learner":
        raise HTTPException(403, detail="Only learners can create draft submissions")

    assignment = find_assignment(assignment_id, db)
    if not assignment:
        raise HTTPException(404, detail="Assignment id is incorrect")

    if assignment.course and not any(s.id == user.id for s in assignment.course.learners):
        raise HTTPException(403, detail="You are not enrolled in this course")

    deadline_passed = is_deadline_passed(assignment.deadline_utc)
    allow_late = getattr(assignment, "allow_late_submissions", True)
    if allow_late is None:
        allow_late = True
    if deadline_passed and not allow_late:
        raise HTTPException(400, detail="Submission deadline has passed. Submissions are closed.")

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
    submission_id: int | str, user: UserModel, db: Session
) -> SubmissionResponseSchema:
    submission = find_submission(submission_id, db)
    if not submission:
        raise HTTPException(404, detail="Submission id is incorrect")
    if user.role != "Admin" and submission.learner_id != user.id:
        raise HTTPException(403, detail="You cannot unsubmit this submission")
    if submission.status == "Graded":
        raise HTTPException(400, detail="Cannot unsubmit work that has already been graded")

    deadline = submission.assignment.deadline_utc if submission.assignment else None
    if is_deadline_passed(deadline):
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


def grade_learner_assignment(
    assignment_id: int | str,
    learner_id: int,
    body: GradeSubmissionSchema,
    user: UserModel,
    db: Session,
) -> SubmissionResponseSchema:
    assignment = find_assignment(assignment_id, db)
    if not assignment:
        raise HTTPException(404, detail="Assignment not found")

    course = assignment.course
    can_grade = user.role == "Admin" or (course is not None and any(t.id == user.id for t in course.instructors))
    if not can_grade:
        raise HTTPException(403, detail="You cannot grade this assignment")

    learner = db.get(UserModel, learner_id)
    if not learner:
        raise HTTPException(404, detail="Learner not found")

    submission = db.scalar(
        select(SubmissionModel).where(
            SubmissionModel.assignment_id == assignment.id,
            SubmissionModel.learner_id == learner_id,
        )
    )
    if not submission:
        submission = SubmissionModel(
            assignment_id=assignment.id,
            learner_id=learner_id,
            answer="",
            status="Assigned",
            submitted_at_utc=datetime.now(UTC),
        )
        db.add(submission)
        db.flush()

    return grade_submission(submission.id, body, user, db)