from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.assignment.dtos import (
    AssignmentAttachmentResponseSchema,
    AssignmentResponseSchema,
    AssignmentSchema,
    AssignmentUpdateSchema,
)
from app.assignment.models import AssignmentAttachmentModel, AssignmentModel
from app.course.models import CourseModel
from app.submission.dtos import SubmissionResponseSchema, serialize_submission
from app.submission.models import SubmissionModel
from app.user.models import UserModel
from app.utils.helpers import save_upload_file


def serialize_assignment(
    assignment: AssignmentModel, my_status: str | None = None
) -> AssignmentResponseSchema:
    course = assignment.course
    subs = assignment.submissions or []
    turned_in = len([s for s in subs if s.submitted_at_utc and s.status != "Graded"])
    graded = len([s for s in subs if s.status == "Graded"])
    total_learners = len(course.learners) if course and course.learners else 0
    assigned = max(0, total_learners - turned_in - graded)

    return AssignmentResponseSchema(
        id=assignment.id,
        course_id=assignment.course_id,
        course_name=course.name if course else None,
        subject=course.subject if course else None,
        program=course.program if course else None,
        department=course.department if course else None,
        session=course.session if course else None,
        title=assignment.title,
        description=assignment.description,
        topic=assignment.topic,
        kind=assignment.kind,
        deadline_utc=assignment.deadline_utc,
        max_marks=assignment.max_marks,
        status=assignment.status,
        created_by_id=assignment.created_by_id,
        created_by_name=assignment.created_by.name if assignment.created_by else None,
        created_at_utc=assignment.created_at_utc,
        submission_count=len([s for s in subs if s.submitted_at_utc]),
        turned_in_count=turned_in,
        graded_count=graded,
        assigned_count=assigned,
        learner_count=total_learners,
        student_count=total_learners,
        my_submission_status=my_status,
        # ── NEW ──
        session_id=assignment.session_id,
        submission_formats=assignment.submission_formats,
        attachments=[
            AssignmentAttachmentResponseSchema.model_validate(att)
            for att in (assignment.attachments or [])
        ],
    )


def _assignment_stmt():
    return select(AssignmentModel).options(
        selectinload(AssignmentModel.course).selectinload(CourseModel.instructors),
        selectinload(AssignmentModel.course).selectinload(CourseModel.learners),
        selectinload(AssignmentModel.created_by),
        selectinload(AssignmentModel.submissions),
        selectinload(AssignmentModel.attachments),
    )


def _can_manage_course(user: UserModel, course: CourseModel) -> bool:
    if user.role == "Admin":
        return True
    if user.role == "Instructor":
        return any(t.id == user.id for t in course.instructors)
    return False


def _my_submission_status(assignment: AssignmentModel, user: UserModel) -> str | None:
    if user.role != "Learner":
        return None
    mine = next((s for s in assignment.submissions if s.learner_id == user.id), None)
    if not mine or not mine.submitted_at_utc:
        return "Assigned"
    return "Graded" if mine.status == "Graded" else "Submitted"


def get_assignments(user: UserModel, db: Session) -> list[AssignmentResponseSchema]:
    stmt = _assignment_stmt()
    if user.role == "Admin":
        assignments = db.scalars(stmt).all()
    elif user.role == "Instructor":
        assignments = db.scalars(
            stmt.where(CourseModel.instructors.any(UserModel.id == user.id))
        ).all()
    else:
        assignments = db.scalars(
            stmt.where(
                CourseModel.learners.any(UserModel.id == user.id),
                AssignmentModel.status == "Published",
            )
        ).all()
    return [serialize_assignment(a, _my_submission_status(a, user)) for a in assignments]


def get_course_assignments(
    course_id: int, user: UserModel, db: Session
) -> list[AssignmentResponseSchema]:
    course = db.scalar(
        select(CourseModel)
        .options(selectinload(CourseModel.instructors), selectinload(CourseModel.learners))
        .where(CourseModel.id == course_id)
    )
    if not course:
        raise HTTPException(404, detail="Course id is incorrect")

    stmt = _assignment_stmt().where(AssignmentModel.course_id == course_id)
    if user.role == "Learner":
        if not any(s.id == user.id for s in course.learners):
            raise HTTPException(403, detail="You are not enrolled in this course")
        stmt = stmt.where(AssignmentModel.status == "Published")
    elif user.role == "Instructor":
        if not any(t.id == user.id for t in course.instructors):
            raise HTTPException(403, detail="You do not teach this course")

    assignments = db.scalars(stmt).all()
    return [serialize_assignment(a, _my_submission_status(a, user)) for a in assignments]


def _check_assignment_visible(assignment: AssignmentModel, user: UserModel) -> None:
    if user.role == "Admin":
        return
    course = assignment.course
    if user.role == "Instructor" and any(t.id == user.id for t in course.instructors):
        return
    if (
        user.role == "Learner"
        and assignment.status == "Published"
        and any(s.id == user.id for s in course.learners)
    ):
        return
    raise HTTPException(403, detail="You don't have access to this assignment")


def get_assignment(
    assignment_id: int, user: UserModel, db: Session
) -> AssignmentResponseSchema:
    assignment = db.scalar(_assignment_stmt().where(AssignmentModel.id == assignment_id))
    if not assignment:
        raise HTTPException(404, detail="Assignment id is incorrect")
    _check_assignment_visible(assignment, user)
    return serialize_assignment(assignment, _my_submission_status(assignment, user))


def _get_manageable_assignment(
    assignment_id: int, user: UserModel, db: Session
) -> AssignmentModel:
    assignment = db.scalar(_assignment_stmt().where(AssignmentModel.id == assignment_id))
    if not assignment:
        raise HTTPException(404, detail="Assignment id is incorrect")
    if not _can_manage_course(user, assignment.course):
        raise HTTPException(403, detail="You cannot manage this assignment")
    return assignment


def create_assignment(body: AssignmentSchema, user: UserModel, db: Session) -> AssignmentModel:
    course = db.scalar(
        select(CourseModel)
        .options(selectinload(CourseModel.instructors))
        .where(CourseModel.id == body.course_id)
    )
    if not course:
        raise HTTPException(404, detail="Course id is incorrect")
    if not _can_manage_course(user, course):
        raise HTTPException(403, detail="You cannot create assignments in this course")

    assignment = AssignmentModel(
        course_id=course.id,
        title=body.title,
        description=body.description,
        topic=body.topic,
        kind=body.kind,
        deadline_utc=body.deadline_utc,
        max_marks=body.max_marks,
        status="Draft",
        created_by_id=user.id,
        # ── NEW ──
        session_id=body.session_id,
        submission_formats=body.submission_formats,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


def update_assignment(
    assignment_id: int, body: AssignmentUpdateSchema, user: UserModel, db: Session
) -> None:
    assignment = _get_manageable_assignment(assignment_id, user, db)
    assignment.title = body.title
    assignment.description = body.description
    assignment.topic = body.topic
    assignment.kind = body.kind
    assignment.deadline_utc = body.deadline_utc
    assignment.max_marks = body.max_marks
    assignment.session_id = body.session_id
    assignment.submission_formats = body.submission_formats
    db.add(assignment)
    db.commit()


def delete_assignment(assignment_id: int, user: UserModel, db: Session) -> None:
    assignment = _get_manageable_assignment(assignment_id, user, db)
    db.delete(assignment)
    db.commit()


def publish_assignment(assignment_id: int, user: UserModel, db: Session) -> None:
    assignment = _get_manageable_assignment(assignment_id, user, db)
    assignment.status = "Published"
    db.add(assignment)
    db.flush()

    course = db.scalar(
        select(CourseModel)
        .options(selectinload(CourseModel.learners))
        .where(CourseModel.id == assignment.course_id)
    )
    existing_ids = set(
        db.scalars(
            select(SubmissionModel.learner_id).where(
                SubmissionModel.assignment_id == assignment.id
            )
        ).all()
    )
    learner_ids = [learner.id for learner in (course.learners if course else [])]
    for l_id in learner_ids:
        if l_id not in existing_ids:
            db.add(
                SubmissionModel(
                    assignment_id=assignment.id, learner_id=l_id, status="Draft"
                )
            )

    if learner_ids:
        from app.notification.controller import create_notifications_bulk

        deadline_str = (
            assignment.deadline_utc.strftime("%b %d, %Y at %I:%M %p")
            if assignment.deadline_utc
            else ""
        )
        msg = f"Posted in {course.name}" + (f" • Due {deadline_str}" if deadline_str else "")
        create_notifications_bulk(
            db=db,
            user_ids=learner_ids,
            title=f"New assignment: {assignment.title}",
            message=msg,
            kind="assignment",
            link=f"/course/{assignment.course_id}/assignments/{assignment.id}",
        )

    db.commit()


def get_assignment_submissions(
    assignment_id: int, user: UserModel, db: Session
) -> list[SubmissionResponseSchema]:
    assignment = _get_manageable_assignment(assignment_id, user, db)
    from app.submission.controller import _submission_stmt

    submissions = db.scalars(
        _submission_stmt().where(SubmissionModel.assignment_id == assignment.id)
    ).all()
    return [serialize_submission(s) for s in submissions]


def add_attachment(
    assignment_id: int,
    user: UserModel,
    db: Session,
    file: UploadFile | None,
    link_url: str | None,
    link_title: str | None,
) -> AssignmentAttachmentResponseSchema:
    assignment = _get_manageable_assignment(assignment_id, user, db)

    if link_url:
        attachment = AssignmentAttachmentModel(
            assignment_id=assignment.id,
            file_name=link_title or link_url,
            file_type="Link",
            file_size="—",
            kind="link",
            url=link_url,
        )
    elif file is not None:
        url, file_type, file_size = save_upload_file(file, f"assignments/{assignment.id}")
        attachment = AssignmentAttachmentModel(
            assignment_id=assignment.id,
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
    return AssignmentAttachmentResponseSchema.model_validate(attachment)


def delete_attachment(
    assignment_id: int, attachment_id: int, user: UserModel, db: Session
) -> None:
    assignment = _get_manageable_assignment(assignment_id, user, db)
    attachment = db.get(AssignmentAttachmentModel, attachment_id)
    if not attachment or attachment.assignment_id != assignment.id:
        raise HTTPException(404, detail="Attachment id is incorrect")
    db.delete(attachment)
    db.commit()