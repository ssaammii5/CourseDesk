import secrets
from datetime import UTC, datetime, timedelta

import jwt
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dtos import LoginSchema
from app.auth.models import RefreshTokenModel
from app.user.models import UserModel
from app.utils.helpers import verify_password
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
            expires_at_utc=datetime.now(UTC) + timedelta(days=settings.REFRESH_EXP_DAYS),
        )
    )
    db.commit()
    return raw_token


def login_user(body: LoginSchema, db: Session) -> dict:
    user = db.scalar(select(UserModel).where(UserModel.email == body.email))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="You've entered wrong email"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive"
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


def refresh_tokens(refresh_token: str, db: Session) -> dict:
    record = db.scalar(
        select(RefreshTokenModel).where(RefreshTokenModel.token == refresh_token)
    )
    if not record or record.revoked or record.expires_at_utc < datetime.now(UTC):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )
    user = db.get(UserModel, record.user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
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