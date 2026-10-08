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
    if not hashed_password or hashed_password.startswith("!"):
        return False
    try:
        return password_hash.verify(plain_password, hashed_password)
    except Exception:
        return False


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


def is_admin_or_coordinator(
    user: Annotated[UserModel, Depends(is_authenticated)],
) -> UserModel:
    if user.role not in ("Admin", "Coordinator", "Co-ordinator"):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, detail="Admin or Coordinator access required"
        )
    return user


def is_admin_or_instructor_or_coordinator(
    user: Annotated[UserModel, Depends(is_authenticated)],
) -> UserModel:
    if user.role not in ("Admin", "Instructor", "Teacher", "Coordinator", "Co-ordinator"):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, detail="Staff access required"
        )
    return user


IsAuthenticated = Annotated[UserModel, Depends(is_authenticated)]
IsAdmin = Annotated[UserModel, Depends(is_admin)]
IsAdminOrInstructor = Annotated[UserModel, Depends(is_admin_or_instructor)]
IsAdminOrTeacher = IsAdminOrInstructor
IsAdminOrCoordinator = Annotated[UserModel, Depends(is_admin_or_coordinator)]
IsAdminOrInstructorOrCoordinator = Annotated[UserModel, Depends(is_admin_or_instructor_or_coordinator)]


def human_readable_size(num_bytes: int) -> str:
    size = float(num_bytes)
    for unit in ("B", "KB", "MB", "GB"):
        if size < 1024 or unit == "GB":
            return f"{int(size)} {unit}" if unit == "B" else f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} GB"


def save_upload_file(file: UploadFile, subdir: str, max_size_bytes: int = 50 * 1024 * 1024) -> tuple[str, str, str]:
    """Persist an uploaded file to disk securely. Returns (url, file_type, file_size)."""
    clean_subdir = os.path.normpath(subdir).lstrip("/\\")
    base_upload_dir = os.path.abspath(settings.UPLOAD_DIR)
    target_dir = os.path.abspath(os.path.join(base_upload_dir, clean_subdir))
    
    # Ensure directory boundary check to prevent path traversal
    if not target_dir.startswith(base_upload_dir + os.path.sep) and target_dir != base_upload_dir:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid destination path")
    
    os.makedirs(target_dir, exist_ok=True)
    safe_name = os.path.basename(file.filename or "file")
    raw_ext = os.path.splitext(safe_name)[1].lower()
    # Strip any directory traversal characters from extension
    ext = "".join(c for c in raw_ext if c.isalnum() or c == ".")
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(target_dir, unique_name)
    
    # Chunked read to protect server memory against massive uploads crashing RAM
    total_read = 0
    chunk_size = 1024 * 1024  # 1MB chunk
    
    status_413 = getattr(status, "HTTP_413_CONTENT_TOO_LARGE", status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)
    
    with open(file_path, "wb") as f:
        while True:
            chunk = file.file.read(chunk_size)
            if not chunk:
                break
            total_read += len(chunk)
            if total_read > max_size_bytes:
                # Remove partially written file if it exceeds limit
                f.close()
                if os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                    except OSError:
                        pass
                raise HTTPException(
                    status_413,
                    detail=f"File exceeds maximum allowed size of {human_readable_size(max_size_bytes)}",
                )
            f.write(chunk)
    
    file_type = (ext.lstrip(".") or "FILE").upper()
    return f"/uploads/{clean_subdir}/{unique_name}", file_type, human_readable_size(total_read)