import secrets
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.assignment.models import AssignmentModel
from app.submission.models import SubmissionModel
from app.user.dtos import (
    InstructorDetailsSchema,
    InstructorLinkSchema,
    LearnerDetailsSchema,
    UserAddressSchema,
    UserResponseSchema,
    UserSchema,
    UserUpdateSchema,
)
from app.user.models import InstructorDetailsModel, LearnerDetailsModel, UserModel
from app.utils.helpers import get_password_hash


def _normalize_links(links: list) -> list[dict]:
    out = []
    for item in links:
        if isinstance(item, dict):
            out.append({"title": item.get("title", ""), "url": item.get("url", "")})
        elif isinstance(item, str):
            out.append({"title": "", "url": item})
        elif hasattr(item, "model_dump"):
            out.append(item.model_dump())
    return out


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
            address=UserAddressSchema(
                street=d.street, city=d.city, state=d.state, zip=d.zip, country=d.country
            ),
        )
    instructor_details: InstructorDetailsSchema | None = None
    if user.instructor_details:
        t = user.instructor_details
        f_name = t.first_name or ""
        l_name = t.last_name or ""
        if not f_name and not l_name and user.name:
            parts = user.name.strip().split(" ", 1)
            f_name = parts[0]
            l_name = parts[1] if len(parts) > 1 else ""

        p_headline = t.professional_headline or getattr(t, "headline", "") or ""

        raw_links = t.links or []
        normalized_links = []
        for l in raw_links:
            if isinstance(l, dict):
                normalized_links.append(InstructorLinkSchema(title=l.get("title", ""), url=l.get("url", "")))
            elif isinstance(l, str):
                normalized_links.append(InstructorLinkSchema(title="", url=l))
            elif isinstance(l, InstructorLinkSchema):
                normalized_links.append(l)

        instructor_details = InstructorDetailsSchema(
            instructor_id=t.instructor_id,
            first_name=f_name,
            last_name=l_name,
            email=user.email,
            avatar=t.avatar or "",
            professional_headline=p_headline,
            headline=p_headline,
            timezone=t.timezone or "UTC",
            links=normalized_links,
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
        reg_no=data.reg_no,
        street=data.address.street,
        city=data.address.city,
        state=data.address.state,
        zip=data.address.zip,
        country=data.address.country,
    )


def _build_instructor_details(
    user_id: int, data: InstructorDetailsSchema, user_name: str = ""
) -> InstructorDetailsModel:
    f_name = (data.first_name or "").strip()
    l_name = (data.last_name or "").strip()
    if not f_name and not l_name and user_name:
        parts = user_name.strip().split(" ", 1)
        f_name = parts[0]
        l_name = parts[1] if len(parts) > 1 else ""

    p_headline = (data.professional_headline or data.headline or "").strip()
    return InstructorDetailsModel(
        user_id=user_id,
        first_name=f_name,
        last_name=l_name,
        avatar=data.avatar or "",
        professional_headline=p_headline,
        timezone=data.timezone or "UTC",
        links=_normalize_links(data.links or []),
    )


def create_user(body: UserSchema, db: Session) -> UserResponseSchema:
    name = body.name
    email = body.email
    if body.role == "Instructor" or body.instructor_details is not None:
        if body.instructor_details:
            f_name = (body.instructor_details.first_name or "").strip()
            l_name = (body.instructor_details.last_name or "").strip()
            if f_name or l_name:
                name = f"{f_name} {l_name}".strip()
            if body.instructor_details.email:
                email = body.instructor_details.email

    is_user = db.scalar(select(UserModel).where(UserModel.email == email))
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
        name=name,
        email=email,
        hash_password=hash_pass,
        role=body.role,
        invite_token=invite_token_hash,
        invite_expires_at_utc=invite_expires,
    )
    db.add(new_user)
    db.flush()
    if body.role == "Learner" or body.learner_details is not None:
        db.add(_build_learner_details(new_user.id, body.learner_details or LearnerDetailsSchema()))
    if body.role == "Instructor" or body.instructor_details is not None:
        db.add(
            _build_instructor_details(
                new_user.id, body.instructor_details or InstructorDetailsSchema(), name
            )
        )
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
        # learner_id is auto-generated by PostgreSQL default and not modifiable
        d.reg_no = data.reg_no
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
        t = user.instructor_details
        if data.first_name or data.last_name:
            t.first_name = (data.first_name or "").strip()
            t.last_name = (data.last_name or "").strip()
        elif user.name and not t.first_name and not t.last_name:
            parts = user.name.strip().split(" ", 1)
            t.first_name = parts[0]
            t.last_name = parts[1] if len(parts) > 1 else ""

        if data.avatar is not None:
            t.avatar = data.avatar
        if data.professional_headline or data.headline:
            t.professional_headline = (data.professional_headline or data.headline or "").strip()
        if data.timezone:
            t.timezone = data.timezone
        if data.links is not None:
            t.links = _normalize_links(data.links)
    else:
        user.instructor_details = _build_instructor_details(user.id, data, user.name)


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

    user_name = body.name
    user_email = body.email
    if body.instructor_details:
        f_name = (body.instructor_details.first_name or "").strip()
        l_name = (body.instructor_details.last_name or "").strip()
        if f_name or l_name:
            user_name = f"{f_name} {l_name}".strip()
        if body.instructor_details.email:
            user_email = body.instructor_details.email

    if user_email != user.email:
        existing = db.scalar(
            select(UserModel).where(UserModel.email == user_email, UserModel.id != user_id)
        )
        if existing:
            raise HTTPException(400, detail="Email address already exists")

    user.name = user_name
    user.email = user_email
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