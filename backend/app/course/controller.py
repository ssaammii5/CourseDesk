from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.course.dtos import (
    CoursePeopleResponseSchema,
    CoursePersonSchema,
    CourseResponseSchema,
    CourseSchema,
)
from app.course.models import CourseModel
from app.user.models import UserModel


def serialize_course(course: CourseModel) -> CourseResponseSchema:
    instructors = sorted(course.instructors, key=lambda t: t.id)
    first_instructor = instructors[0] if instructors else None
    return CourseResponseSchema(
        id=course.id,
        name=course.name,
        subject=course.subject,
        program=course.program,
        department=course.department,
        session=course.session,
        is_active=course.is_active,
        instructor_id=first_instructor.id if first_instructor else None,
        instructor_name=first_instructor.name if first_instructor else None,
        instructor_ids=[t.id for t in instructors],
        instructor_names=[t.name for t in instructors],
        learner_ids=sorted(s.id for s in course.learners),
        learner_count=len(course.learners),
        teacher_id=first_instructor.id if first_instructor else None,
        teacher_name=first_instructor.name if first_instructor else None,
        teacher_ids=[t.id for t in instructors],
        teacher_names=[t.name for t in instructors],
        student_ids=sorted(s.id for s in course.learners),
        student_count=len(course.learners),
        # ── NEW ──
        meeting_provider=course.meeting_provider,
        meeting_url=course.meeting_url,
        meeting_id=course.meeting_id,
        meeting_passcode=course.meeting_passcode,
        schedule_notes=course.schedule_notes,
    )


def _course_stmt():
    return select(CourseModel).options(
        selectinload(CourseModel.instructors), selectinload(CourseModel.learners)
    )


def get_courses(db: Session) -> list[CourseResponseSchema]:
    courses = db.scalars(_course_stmt()).all()
    return [serialize_course(c) for c in courses]


def get_my_courses(user: UserModel, db: Session) -> list[CourseResponseSchema]:
    stmt = _course_stmt()
    if user.role == "Admin":
        courses = db.scalars(stmt).all()
    elif user.role == "Instructor":
        courses = db.scalars(
            stmt.where(CourseModel.instructors.any(UserModel.id == user.id))
        ).all()
    else:
        courses = db.scalars(
            stmt.where(CourseModel.learners.any(UserModel.id == user.id))
        ).all()
    return [serialize_course(c) for c in courses]


def get_one_course(course_id: int, db: Session) -> CourseResponseSchema:
    course = db.scalar(_course_stmt().where(CourseModel.id == course_id))
    if not course:
        raise HTTPException(404, detail="Course id is incorrect")
    return serialize_course(course)


def get_course_people(course_id: int, db: Session) -> CoursePeopleResponseSchema:
    course = db.scalar(_course_stmt().where(CourseModel.id == course_id))
    if not course:
        raise HTTPException(404, detail="Course id is incorrect")
    instructors = [
        CoursePersonSchema(id=t.id, name=t.name, role="Instructor", email=t.email)
        for t in course.instructors
    ]
    learners = [
        CoursePersonSchema(id=s.id, name=s.name, role="Learner", email=s.email)
        for s in course.learners
    ]
    return CoursePeopleResponseSchema(
        instructors=instructors,
        learners=learners,
        teachers=instructors,
        students=learners,
    )


def _fetch_users(ids: list[int], db: Session) -> list[UserModel]:
    if not ids:
        return []
    users = list(db.scalars(select(UserModel).where(UserModel.id.in_(ids))).all())
    if len(users) != len(set(ids)):
        raise HTTPException(400, detail="One or more user ids are invalid")
    return users


def create_course(body: CourseSchema, db: Session) -> CourseResponseSchema:
    course = CourseModel(
        name=body.name,
        subject=body.subject,
        program=body.program,
        department=body.department,
        session=body.session,
        is_active=body.is_active,
        meeting_provider=body.meeting_provider,
        meeting_url=body.meeting_url,
        meeting_id=body.meeting_id,
        meeting_passcode=body.meeting_passcode,
        schedule_notes=body.schedule_notes,
    )
    inst_ids = body.instructor_ids or body.teacher_ids
    learn_ids = body.learner_ids or body.student_ids
    course.instructors = _fetch_users(inst_ids, db)
    course.learners = _fetch_users(learn_ids, db)
    db.add(course)
    db.flush()

    from app.notification.controller import create_notifications_bulk

    if learn_ids:
        create_notifications_bulk(
            db=db,
            user_ids=learn_ids,
            title=f"Enrolled in {course.name}",
            message=f"You have been enrolled in {course.name} ({course.subject})",
            kind="system",
            link=f"/course/{course.id}",
        )
    if inst_ids:
        create_notifications_bulk(
            db=db,
            user_ids=inst_ids,
            title=f"Assigned to instruct {course.name}",
            message=f"You are assigned as an instructor for {course.name}",
            kind="system",
            link=f"/course/{course.id}",
        )

    db.commit()
    return get_one_course(course.id, db)


def update_course(course_id: int, body: CourseSchema, db: Session) -> CourseResponseSchema:
    course = db.scalar(_course_stmt().where(CourseModel.id == course_id))
    if not course:
        raise HTTPException(404, detail="Course id is incorrect")
    course.name = body.name
    course.subject = body.subject
    course.program = body.program
    course.department = body.department
    course.session = body.session
    course.is_active = body.is_active
    course.meeting_provider = body.meeting_provider
    course.meeting_url = body.meeting_url
    course.meeting_id = body.meeting_id
    course.meeting_passcode = body.meeting_passcode
    course.schedule_notes = body.schedule_notes
    course.instructors = _fetch_users(body.instructor_ids or body.teacher_ids, db)
    course.learners = _fetch_users(body.learner_ids or body.student_ids, db)
    db.add(course)
    db.commit()
    return get_one_course(course_id, db)


def delete_course(course_id: int, db: Session) -> None:
    course = db.get(CourseModel, course_id)
    if not course:
        raise HTTPException(404, detail="Course id is incorrect")
    db.delete(course)
    db.commit()