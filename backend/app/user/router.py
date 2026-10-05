import os
from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.user import controller
from app.user.dtos import UserResponseSchema, UserSchema, UserUpdateSchema
from app.utils.db import get_db
from app.utils.helpers import DbSession, IsAdmin, IsAuthenticated, save_upload_file

user_routes = APIRouter(prefix="/api/users", tags=["users"])


@user_routes.post("/avatar", status_code=status.HTTP_200_OK)
def upload_avatar(file: UploadFile = File(...), _user: IsAuthenticated = None):
    allowed_exts = {".jpg", ".jpeg", ".png", ".webp"}
    raw_ext = os.path.splitext(file.filename or "")[1].lower()
    if raw_ext not in allowed_exts:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Only .jpg, .jpeg, .png, or .webp images are allowed for avatars.",
        )
    url, _, _ = save_upload_file(file, subdir="avatars", max_size_bytes=2 * 1024 * 1024)
    return {"url": url}


@user_routes.get("", response_model=list[UserResponseSchema], status_code=status.HTTP_200_OK)
def get_all_users(db: DbSession, _admin: IsAdmin):
    return controller.get_users(db)


@user_routes.post("", response_model=UserResponseSchema, status_code=status.HTTP_201_CREATED)
def create_user(body: UserSchema, db: DbSession, _admin: IsAdmin):
    return controller.create_user(body, db)


@user_routes.put("/{user_id}", response_model=UserResponseSchema, status_code=status.HTTP_200_OK)
def update_user(user_id: int, body: UserUpdateSchema, db: DbSession, _admin: IsAdmin):
    return controller.update_user(user_id, body, db)


@user_routes.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: DbSession, _admin: IsAdmin):
    return controller.delete_user(user_id, db)


instructor_routes = APIRouter(prefix="/api/instructors", tags=["instructors"])


@instructor_routes.post("/invite", status_code=status.HTTP_201_CREATED)
def invite_instructor(
    body: controller.InviteInstructorSchema, db: DbSession, _admin: IsAdmin
):
    return controller.invite_instructor(body, db)


@instructor_routes.get("/invitations", status_code=status.HTTP_200_OK)
def get_pending_invitations(db: DbSession, _admin: IsAdmin):
    return controller.get_pending_instructor_invitations(db)


@instructor_routes.delete("/invitations/{user_id}", status_code=status.HTTP_200_OK)
def revoke_invitation(user_id: int, db: DbSession, _admin: IsAdmin):
    return controller.revoke_instructor_invitation(user_id, db)