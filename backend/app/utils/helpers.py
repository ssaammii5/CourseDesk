import os
import uuid
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, Request, UploadFile, status
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.user.models import UserModel
from app.utils.db import get_db
from app.utils.settings import settings

password_hash = PasswordHash.recommended()


def get_password_hash(password: str) -> str:
    return password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)


DbSession = Annotated[Session, Depends(get_db)]


def is_authenticated(request: Request, db: DbSession) -> UserModel:
    try:
        header = request.headers.get("authorization")
        if not header or not header.lower().startswith("bearer "):
            raise HTTPException(
                status.HTTP_401_UNAUTHORIZED, detail="You're unauthorized"
            )
        token = header.split(" ", 1)[1].strip()
        data = jwt.decode(token, settings.SECRET_KEY, [settings.ALGORITHM])
        raw_id = data.get("_id")
        if not isinstance(raw_id, (int, str)):
            raise HTTPException(
                status.HTTP_401_UNAUTHORIZED, detail="You're unauthorized"
            )
        try:
            user_id = int(raw_id)
        except ValueError:
            raise HTTPException(
                status.HTTP_401_UNAUTHORIZED, detail="You're unauthorized"
            )
        user = db.scalar(
            select(UserModel)
            .options(
                selectinload(UserModel.learner_details),
                selectinload(UserModel.instructor_details),
            )
            .where(UserModel.id == user_id)
        )
        if not user:
            raise HTTPException(
                status.HTTP_401_UNAUTHORIZED, detail="You're unauthorized"
            )
        if not user.is_active:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN, detail="Account is inactive"
            )
        return user
    except InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="You're unauthorized")


def is_admin(user: Annotated[UserModel, Depends(is_authenticated)]) -> UserModel:
    if user.role != "Admin":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, detail="Admin access required"
        )
    return user


def is_admin_or_instructor(
    user: Annotated[UserModel, Depends(is_authenticated)],
) -> UserModel:
    if user.role not in ("Admin", "Instructor"):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, detail="Instructor access required"
        )
    return user


IsAuthenticated = Annotated[UserModel, Depends(is_authenticated)]
IsAdmin = Annotated[UserModel, Depends(is_admin)]
IsAdminOrInstructor = Annotated[UserModel, Depends(is_admin_or_instructor)]
IsAdminOrTeacher = IsAdminOrInstructor


def human_readable_size(num_bytes: int) -> str:
    size = float(num_bytes)
    for unit in ("B", "KB", "MB", "GB"):
        if size < 1024 or unit == "GB":
            return f"{int(size)} {unit}" if unit == "B" else f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} GB"


def save_upload_file(file: UploadFile, subdir: str) -> tuple[str, str, str]:
    """Persist an uploaded file to disk. Returns (url, file_type, file_size)."""
    target_dir = os.path.join(settings.UPLOAD_DIR, subdir)
    os.makedirs(target_dir, exist_ok=True)
    original_name = file.filename or "file"
    ext = os.path.splitext(original_name)[1]
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(target_dir, unique_name)
    contents = file.file.read()
    with open(file_path, "wb") as f:
        f.write(contents)
    file_type = (ext.lstrip(".") or "file").upper()
    return f"/uploads/{subdir}/{unique_name}", file_type, human_readable_size(len(contents))