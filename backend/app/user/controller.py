import secrets
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.assignment.models import AssignmentModel
from app.submission.models import SubmissionModel
from app.user.dtos import (
    InstructorDetailsSchema,
    LearnerDetailsSchema,
    UserAddressSchema,
    UserResponseSchema,
    UserSchema,
    UserUpdateSchema,
)
from app.user.models import InstructorDetailsModel, LearnerDetailsModel, UserModel
from app.utils.helpers import get_password_hash


def serialize_user(user: UserModel) -> UserResponseSchema:
    learner_details: LearnerDetailsSchema | None = None
    if user.learner_details:
        d = user.learner_details
        learner_details = LearnerDetailsSchema(
            fathers_name=d.fathers_name,
            mothers_name=d.mothers_name,
            date_of_birth=d.date_of_birth,
            mobile=d.mobile,
            nationality=d.nationality,
            learner_id=d.learner_id,
            reg_no=d.reg_no,
            department=d.department,
            current_program=d.current_program,
            session=d.session,
            semester_session=d.semester_session,
            address=UserAddressSchema(
                street=d.street, city=d.city, state=d.state, zip=d.zip, country=d.country
            ),
        )
    instructor_details: InstructorDetailsSchema | None = None
    if user.instructor_details:
        t = user.instructor_details
        instructor_details = InstructorDetailsSchema(
            instructor_id=t.instructor_id, designation=t.designation, department=t.department
        )
    return UserResponseSchema(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        created_at_utc=user.created_at_utc,
        learner_details=learner_details,
        instructor_details=instructor_details,
    )


def get_users(db: Session) -> list[UserResponseSchema]:
    users = db.scalars(
        select(UserModel).options(
            selectinload(UserModel.learner_details),
            selectinload(UserModel.instructor_details),
        )
    ).all()
    return [serialize_user(u) for u in users]


def _build_learner_details(user_id: int, data: LearnerDetailsSchema) -> LearnerDetailsModel:
    return LearnerDetailsModel(
        user_id=user_id,
        fathers_name=data.fathers_name,
        mothers_name=data.mothers_name,
        date_of_birth=data.date_of_birth,
        mobile=data.mobile,
        nationality=data.nationality,
        learner_id=data.learner_id,
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


def _build_instructor_details(user_id: int, data: InstructorDetailsSchema) -> InstructorDetailsModel:
    return InstructorDetailsModel(
        user_id=user_id,
        instructor_id=data.instructor_id,
        designation=data.designation,
        department=data.department,
    )


def create_user(body: UserSchema, db: Session) -> UserResponseSchema:
    is_user = db.scalar(select(UserModel).where(UserModel.email == body.email))
    if is_user:
        raise HTTPException(400, detail="Email address already exists")

    raw_invite_token: str | None = None
    if body.password:
        hash_pass = get_password_hash(body.password)
        invite_token_hash = None
        invite_expires = None
    else:
        raw_invite_token = secrets.token_urlsafe(48)
        invite_expires = datetime.now(UTC) + timedelta(days=7)
        invite_token_hash = get_password_hash(raw_invite_token)
        hash_pass = "!UNSET_INVITED_USER"

    new_user = UserModel(
        name=body.name,
        email=body.email,
        hash_password=hash_pass,
        role=body.role,
        invite_token=invite_token_hash,
        invite_expires_at_utc=invite_expires,
    )
    db.add(new_user)
    db.flush()
    if body.learner_details:
        db.add(_build_learner_details(new_user.id, body.learner_details))
    if body.instructor_details:
        db.add(_build_instructor_details(new_user.id, body.instructor_details))
    db.commit()
    res = get_one_user(new_user.id, db)
    if raw_invite_token:
        res.invite_token = raw_invite_token
    return res


def get_one_user(user_id: int, db: Session) -> UserResponseSchema:
    user = db.scalar(
        select(UserModel)
        .options(
            selectinload(UserModel.learner_details),
            selectinload(UserModel.instructor_details),
        )
        .where(UserModel.id == user_id)
    )
    if not user:
        raise HTTPException(404, detail="User id is incorrect")
    return serialize_user(user)


def _apply_learner_details(
    user: UserModel, data: LearnerDetailsSchema, db: Session
) -> None:
    if user.learner_details:
        d = user.learner_details
        d.fathers_name = data.fathers_name
        d.mothers_name = data.mothers_name
        d.date_of_birth = data.date_of_birth
        d.mobile = data.mobile
        d.nationality = data.nationality
        d.learner_id = data.learner_id
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
        user.learner_details = _build_learner_details(user.id, data)


def _apply_instructor_details(
    user: UserModel, data: InstructorDetailsSchema, db: Session
) -> None:
    if user.instructor_details:
        user.instructor_details.instructor_id = data.instructor_id
        user.instructor_details.designation = data.designation
        user.instructor_details.department = data.department
    else:
        user.instructor_details = _build_instructor_details(user.id, data)


def update_user(user_id: int, body: UserUpdateSchema, db: Session) -> UserResponseSchema:
    user = db.scalar(
        select(UserModel)
        .options(
            selectinload(UserModel.learner_details),
            selectinload(UserModel.instructor_details),
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
    if body.learner_details is not None:
        _apply_learner_details(user, body.learner_details, db)
    if body.instructor_details is not None:
        _apply_instructor_details(user, body.instructor_details, db)
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
        select(SubmissionModel.id).where(SubmissionModel.learner_id == user_id).limit(1)
    )
    if has_assignments or has_submissions:
        raise HTTPException(
            400, detail="Cannot delete a user with existing assignments or submissions"
        )
    db.delete(user)
    db.commit()