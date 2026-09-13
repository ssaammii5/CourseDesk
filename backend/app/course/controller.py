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
    teachers = sorted(course.teachers, key=lambda t: t.id)
    first_teacher = teachers[0] if teachers else None
    return CourseResponseSchema(
        id=course.id,
        name=course.name,
        subject=course.subject,
        program=course.program,
        department=course.department,
        session=course.session,
        is_active=course.is_active,
        teacher_id=first_teacher.id if first_teacher else None,
        teacher_name=first_teacher.name if first_teacher else None,
        teacher_ids=[t.id for t in teachers],
        teacher_names=[t.name for t in teachers],
        student_ids=sorted(s.id for s in course.students),
        student_count=len(course.students),
        # ── NEW ──
        meeting_provider=course.meeting_provider,
        meeting_url=course.meeting_url,
        meeting_id=course.meeting_id,
        meeting_passcode=course.meeting_passcode,
        schedule_notes=course.schedule_notes,
    )


def _course_stmt():
    return select(CourseModel).options(
        selectinload(CourseModel.teachers), selectinload(CourseModel.students)
    )


def get_courses(db: Session) -> list[CourseResponseSchema]:
    courses = db.scalars(_course_stmt()).all()
    return [serialize_course(c) for c in courses]


def get_my_courses(user: UserModel, db: Session) -> list[CourseResponseSchema]:
    stmt = _course_stmt()
    if user.role == "Admin":
        courses = db.scalars(stmt).all()
    elif user.role == "Teacher":
        courses = db.scalars(
            stmt.where(CourseModel.teachers.any(UserModel.id == user.id))
        ).all()
    else:
        courses = db.scalars(
            stmt.where(CourseModel.students.any(UserModel.id == user.id))
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
    teachers = [
        CoursePersonSchema(id=t.id, name=t.name, role="Teacher", email=t.email)
        for t in course.teachers
    ]
    students = [
        CoursePersonSchema(id=s.id, name=s.name, role="Student", email=s.email)
        for s in course.students
    ]
    return CoursePeopleResponseSchema(teachers=teachers, students=students)


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
    course.teachers = _fetch_users(body.teacher_ids, db)
    course.students = _fetch_users(body.student_ids, db)
    db.add(course)
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
    course.teachers = _fetch_users(body.teacher_ids, db)
    course.students = _fetch_users(body.student_ids, db)
    db.add(course)
    db.commit()
    return get_one_course(course_id, db)


def delete_course(course_id: int, db: Session) -> None:
    course = db.get(CourseModel, course_id)
    if not course:
        raise HTTPException(404, detail="Course id is incorrect")
    db.delete(course)
    db.commit()