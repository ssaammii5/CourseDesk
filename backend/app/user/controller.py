from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.assignment.models import AssignmentModel
from app.submission.models import SubmissionModel
from app.user.dtos import (
    StudentDetailsSchema,
    TeacherDetailsSchema,
    UserAddressSchema,
    UserResponseSchema,
    UserSchema,
    UserUpdateSchema,
)
from app.user.models import StudentDetailsModel, TeacherDetailsModel, UserModel
from app.utils.helpers import get_password_hash


def serialize_user(user: UserModel) -> UserResponseSchema:
    student_details: StudentDetailsSchema | None = None
    if user.student_details:
        d = user.student_details
        student_details = StudentDetailsSchema(
            fathers_name=d.fathers_name,
            mothers_name=d.mothers_name,
            date_of_birth=d.date_of_birth,
            mobile=d.mobile,
            nationality=d.nationality,
            student_id=d.student_id,
            reg_no=d.reg_no,
            department=d.department,
            current_program=d.current_program,
            session=d.session,
            semester_session=d.semester_session,
            address=UserAddressSchema(
                street=d.street, city=d.city, state=d.state, zip=d.zip, country=d.country
            ),
        )
    teacher_details: TeacherDetailsSchema | None = None
    if user.teacher_details:
        t = user.teacher_details
        teacher_details = TeacherDetailsSchema(
            teacher_id=t.teacher_id, designation=t.designation, department=t.department
        )
    return UserResponseSchema(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        created_at_utc=user.created_at_utc,
        student_details=student_details,
        teacher_details=teacher_details,
    )


def get_users(db: Session) -> list[UserResponseSchema]:
    users = db.scalars(
        select(UserModel).options(
            selectinload(UserModel.student_details),
            selectinload(UserModel.teacher_details),
        )
    ).all()
    return [serialize_user(u) for u in users]


def _build_student_details(user_id: int, data: StudentDetailsSchema) -> StudentDetailsModel:
    return StudentDetailsModel(
        user_id=user_id,
        fathers_name=data.fathers_name,
        mothers_name=data.mothers_name,
        date_of_birth=data.date_of_birth,
        mobile=data.mobile,
        nationality=data.nationality,
        student_id=data.student_id,
        reg_no=data.reg_no,
        department=data.department,
        current_program=data.current_program,
        session=data.session,
        semester_session=data.semester_session,
        street=data.address.street,
        city=data.address.city,
        state=data.address.state,
        zip=data.address.zip,
        country=data.address.country,
    )


def _build_teacher_details(user_id: int, data: TeacherDetailsSchema) -> TeacherDetailsModel:
    return TeacherDetailsModel(
        user_id=user_id,
        teacher_id=data.teacher_id,
        designation=data.designation,
        department=data.department,
    )


def create_user(body: UserSchema, db: Session) -> UserResponseSchema:
    is_user = db.scalar(select(UserModel).where(UserModel.email == body.email))
    if is_user:
        raise HTTPException(400, detail="Email address already exists")
    new_user = UserModel(
        name=body.name,
        email=body.email,
        hash_password=get_password_hash(body.password),
        role=body.role,
    )
    db.add(new_user)
    db.flush()
    if body.student_details:
        db.add(_build_student_details(new_user.id, body.student_details))
    if body.teacher_details:
        db.add(_build_teacher_details(new_user.id, body.teacher_details))
    db.commit()
    return get_one_user(new_user.id, db)


def get_one_user(user_id: int, db: Session) -> UserResponseSchema:
    user = db.scalar(
        select(UserModel)
        .options(
            selectinload(UserModel.student_details),
            selectinload(UserModel.teacher_details),
        )
        .where(UserModel.id == user_id)
    )
    if not user:
        raise HTTPException(404, detail="User id is incorrect")
    return serialize_user(user)


def _apply_student_details(
    user: UserModel, data: StudentDetailsSchema, db: Session
) -> None:
    if user.student_details:
        d = user.student_details
        d.fathers_name = data.fathers_name
        d.mothers_name = data.mothers_name
        d.date_of_birth = data.date_of_birth
        d.mobile = data.mobile
        d.nationality = data.nationality
        d.student_id = data.student_id
        d.reg_no = data.reg_no
        d.department = data.department
        d.current_program = data.current_program
        d.session = data.session
        d.semester_session = data.semester_session
        d.street = data.address.street
        d.city = data.address.city
        d.state = data.address.state
        d.zip = data.address.zip
        d.country = data.address.country
    else:
        user.student_details = _build_student_details(user.id, data)


def _apply_teacher_details(
    user: UserModel, data: TeacherDetailsSchema, db: Session
) -> None:
    if user.teacher_details:
        user.teacher_details.teacher_id = data.teacher_id
        user.teacher_details.designation = data.designation
        user.teacher_details.department = data.department
    else:
        user.teacher_details = _build_teacher_details(user.id, data)


def update_user(user_id: int, body: UserUpdateSchema, db: Session) -> UserResponseSchema:
    user = db.scalar(
        select(UserModel)
        .options(
            selectinload(UserModel.student_details),
            selectinload(UserModel.teacher_details),
        )
        .where(UserModel.id == user_id)
    )
    if not user:
        raise HTTPException(404, detail="User id is incorrect")

    if body.email != user.email:
        existing = db.scalar(
            select(UserModel).where(UserModel.email == body.email, UserModel.id != user_id)
        )
        if existing:
            raise HTTPException(400, detail="Email address already exists")

    user.name = body.name
    user.email = body.email
    user.role = body.role
    user.is_active = body.is_active
    if body.password:
        user.hash_password = get_password_hash(body.password)
    if body.student_details is not None:
        _apply_student_details(user, body.student_details, db)
    if body.teacher_details is not None:
        _apply_teacher_details(user, body.teacher_details, db)
    db.commit()
    return get_one_user(user_id, db)


def delete_user(user_id: int, db: Session) -> None:
    user = db.get(UserModel, user_id)
    if not user:
        raise HTTPException(404, detail="User id is incorrect")
    has_assignments = db.scalar(
        select(AssignmentModel.id).where(AssignmentModel.created_by_id == user_id).limit(1)
    )
    has_submissions = db.scalar(
        select(SubmissionModel.id).where(SubmissionModel.student_id == user_id).limit(1)
    )
    if has_assignments or has_submissions:
        raise HTTPException(
            400, detail="Cannot delete a user with existing assignments or submissions"
        )
    db.delete(user)
    db.commit()