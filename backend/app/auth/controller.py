import re
import secrets
from datetime import UTC, datetime, timedelta

import jwt
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.auth.dtos import (
    AcceptInviteSchema,
    LoginSchema,
    ResendVerificationSchema,
    SetPasswordSchema,
    SignupSchema,
    VerifyEmailSchema,
)
from app.auth.models import RefreshTokenModel
from app.user.models import InstructorDetailsModel, LearnerDetailsModel, UserModel
from app.utils.email import send_verification_email
from app.utils.helpers import get_password_hash, verify_password
from app.utils.settings import settings


def _create_access_token(user: UserModel) -> tuple[str, datetime]:
    exp_time = datetime.now(UTC) + timedelta(minutes=settings.EXP_TIME)
    token = jwt.encode(
        {"_id": user.id, "exp": exp_time.timestamp()},
        settings.SECRET_KEY,
        settings.ALGORITHM,
    )
    return token, exp_time


def _create_refresh_token(user: UserModel, db: Session) -> str:
    raw_token = secrets.token_urlsafe(48)
    db.add(
        RefreshTokenModel(
            user_id=user.id,
            token=raw_token,
            expires_at_utc=datetime.now(UTC)
            + timedelta(days=settings.REFRESH_EXP_DAYS),
        )
    )
    db.commit()
    return raw_token


def login_user(body: LoginSchema, db: Session) -> dict:
    user = db.scalar(select(UserModel).where(UserModel.email == body.email))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You've entered wrong email",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive"
        )
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address before signing in. Check your inbox for the verification link.",
        )
    if not verify_password(body.password, user.hash_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You've entered wrong password",
        )
    access_token, exp_time = _create_access_token(user)
    refresh_token = _create_refresh_token(user, db)
    return {
        "token": access_token,
        "access_token": access_token,
        "access_token_expires_at_utc": exp_time,
        "refresh_token": refresh_token,
        "email": user.email,
        "name": user.name,
        "role": user.role,
    }


def signup_user(body: SignupSchema, db: Session) -> UserModel:
    existing_user = db.scalar(
        select(UserModel).where(UserModel.email == body.email)
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )
    if len(body.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long",
        )
    first_name = (body.first_name or "").strip()
    last_name = (body.last_name or "").strip()
    if not first_name and not last_name and body.name:
        parts = body.name.strip().split(" ", 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ""

    full_name = f"{first_name} {last_name}".strip() or (body.name or "").strip()
    if not full_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="First name and last name are required",
        )

    verification_token = secrets.token_urlsafe(32)
    verification_expires = datetime.now(UTC) + timedelta(hours=24)

    new_user = UserModel(
        name=full_name,
        email=body.email,
        hash_password=get_password_hash(body.password),
        role="Learner",
        is_active=True,
        email_verified=False,
        email_verification_token=verification_token,
        email_verification_expires_at_utc=verification_expires,
    )
    db.add(new_user)
    db.flush()
    db.add(
        LearnerDetailsModel(
            user_id=new_user.id,
            first_name=first_name,
            last_name=last_name,
        )
    )
    db.commit()
    db.refresh(new_user)

    frontend_url = settings.FRONTEND_URL.rstrip("/")
    verification_link = f"{frontend_url}/verify-email?token={verification_token}"
    send_verification_email(new_user.email, new_user.name, verification_link)

    return new_user


def verify_email(body: VerifyEmailSchema, db: Session) -> dict:
    token = (body.token or "").strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token is required.",
        )
    user = db.scalar(
        select(UserModel).where(UserModel.email_verification_token == token)
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or already verified link. If you already verified your account, you can proceed to sign in.",
        )
    if (
        user.email_verification_expires_at_utc
        and user.email_verification_expires_at_utc < datetime.now(UTC)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This verification link has expired. Please request a new verification email.",
        )

    user.email_verified = True
    user.email_verification_token = None
    user.email_verification_expires_at_utc = None
    db.commit()
    return {
        "message": "Email verified successfully! You can now sign in.",
        "email": user.email,
    }


def resend_verification_email(body: ResendVerificationSchema, db: Session) -> dict:
    email_clean = (body.email or "").strip().lower()
    user = db.scalar(select(UserModel).where(func.lower(UserModel.email) == email_clean))

    # Anti-enumeration response: always return the same message
    generic_response = {
        "message": "If an unverified account exists with that email address, a verification link has been sent."
    }

    if not user or user.email_verified:
        return generic_response

    new_token = secrets.token_urlsafe(32)
    user.email_verification_token = new_token
    user.email_verification_expires_at_utc = datetime.now(UTC) + timedelta(hours=24)
    db.commit()

    frontend_url = settings.FRONTEND_URL.rstrip("/")
    verification_link = f"{frontend_url}/verify-email?token={new_token}"
    send_verification_email(user.email, user.name, verification_link)

    return generic_response


def refresh_tokens(refresh_token: str, db: Session) -> dict:
    record = db.scalar(
        select(RefreshTokenModel).where(RefreshTokenModel.token == refresh_token)
    )
    if not record or record.revoked or record.expires_at_utc < datetime.now(UTC):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    user = db.get(UserModel, record.user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    record.revoked = True
    access_token, exp_time = _create_access_token(user)
    new_refresh = _create_refresh_token(user, db)
    return {
        "token": access_token,
        "access_token": access_token,
        "access_token_expires_at_utc": exp_time,
        "refresh_token": new_refresh,
        "email": user.email,
        "name": user.name,
        "role": user.role,
    }


def logout_user(user: UserModel, db: Session) -> None:
    tokens = db.scalars(
        select(RefreshTokenModel).where(
            RefreshTokenModel.user_id == user.id,
            RefreshTokenModel.revoked.is_(False),
        )
    ).all()
    for token in tokens:
        token.revoked = True
        db.add(token)
    db.commit()


def validate_password_strength(password: str) -> None:
    if (
        len(password) < 8
        or not re.search(r"[A-Z]", password)
        or not re.search(r"\d", password)
        or not re.search(r"[!@#$%^&*()_+\-=[\]{};':\"\\|,.<>/?]", password)
    ):
        raise HTTPException(
            status_code=422,
            detail="Password must be at least 8 characters long, contain an uppercase letter, a number, and a special character",
        )


def _find_invited_user_by_token(token: str, db: Session) -> UserModel | None:
    if not token or not token.strip():
        return None
    token = token.strip()
    now = datetime.now(UTC)

    # 1. Direct match for raw URL-safe token (Fast O(1) indexed lookup)
    user = db.scalar(
        select(UserModel)
        .options(selectinload(UserModel.instructor_details))
        .where(
            UserModel.invite_token == token,
            UserModel.invite_expires_at_utc > now,
        )
    )
    if user:
        return user

    # 2. Fallback for legacy hashed tokens
    candidates = db.scalars(
        select(UserModel)
        .options(selectinload(UserModel.instructor_details))
        .where(
            UserModel.invite_token.is_not(None),
            UserModel.invite_expires_at_utc > now,
        )
    ).all()
    for candidate in candidates:
        if (
            candidate.invite_token
            and candidate.invite_token.startswith("$2b$")
            and verify_password(token, candidate.invite_token)
        ):
            return candidate
    return None


def verify_invite_token(token: str, db: Session) -> dict:
    user = _find_invited_user_by_token(token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation link is invalid, expired, or has been revoked.",
        )
    return {
        "valid": True,
        "role": user.role,
    }


def set_password_via_token(body: SetPasswordSchema, db: Session) -> dict:
    validate_password_strength(body.password)

    user = _find_invited_user_by_token(body.token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired invitation token",
        )

    typed_email = (body.email or "").strip().lower()
    if typed_email != user.email.lower().strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The provided email address does not match this invitation.",
        )

    user.hash_password = get_password_hash(body.password)
    user.invite_token = None
    user.invite_expires_at_utc = None
    user.is_active = True
    db.commit()

    return {"message": "Password set successfully"}


def accept_invite(body: AcceptInviteSchema, db: Session) -> dict:
    first_name = (body.first_name or "").strip()
    last_name = (body.last_name or "").strip()
    headline = (body.professional_headline or "").strip()
    typed_email = (body.email or "").strip().lower()

    if not typed_email:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Email is required.")
    if not first_name:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail="First name is required.")
    if not last_name:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Last name is required.")

    validate_password_strength(body.password)

    user = _find_invited_user_by_token(body.token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation link is invalid, expired, or has been revoked.",
        )

    if typed_email != user.email.lower().strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The provided email address does not match this invitation.",
        )

    # Set password & activate
    user.name = f"{first_name} {last_name}".strip()
    user.hash_password = get_password_hash(body.password)
    user.invite_token = None
    user.invite_expires_at_utc = None
    user.is_active = True
    user.email_verified = True
    user.email_verification_token = None
    user.email_verification_expires_at_utc = None

    # Normalize links
    from app.user.controller import _normalize_links
    normalized_links = _normalize_links(body.links or [])

    if user.role in ("Learner", "Student"):
        bio = (body.short_bio or body.professional_headline or "").strip()
        learner = user.learner_details
        if not learner:
            learner = LearnerDetailsModel(
                user_id=user.id,
                first_name=first_name,
                last_name=last_name,
                avatar=body.avatar or "",
                short_bio=bio,
                timezone=(body.timezone or "").strip() or "UTC",
                links=normalized_links,
            )
            db.add(learner)
        else:
            learner.first_name = first_name
            learner.last_name = last_name
            learner.short_bio = bio
            learner.timezone = (body.timezone or "").strip() or "UTC"
            if body.avatar is not None:
                learner.avatar = body.avatar
            learner.links = normalized_links
    else:
        inst = user.instructor_details
        if not inst:
            inst = InstructorDetailsModel(
                user_id=user.id,
                first_name=first_name,
                last_name=last_name,
                avatar=body.avatar or "",
                professional_headline=headline,
                timezone=(body.timezone or "").strip() or "UTC",
                links=normalized_links,
            )
            db.add(inst)
        else:
            inst.first_name = first_name
            inst.last_name = last_name
            inst.professional_headline = headline
            inst.timezone = (body.timezone or "").strip() or "UTC"
            if body.avatar is not None:
                inst.avatar = body.avatar
            inst.links = normalized_links

    db.commit()
    db.refresh(user)

    access_token, exp_time = _create_access_token(user)
    refresh_token = _create_refresh_token(user, db)

    return {
        "token": access_token,
        "access_token": access_token,
        "access_token_expires_at_utc": exp_time,
        "refresh_token": refresh_token,
        "email": user.email,
        "name": user.name,
        "role": user.role,
    }