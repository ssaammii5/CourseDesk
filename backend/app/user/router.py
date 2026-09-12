from fastapi import APIRouter, status

from app.user import controller
from app.user.dtos import UserResponseSchema, UserSchema, UserUpdateSchema
from app.utils.db import get_db
from app.utils.helpers import DbSession, IsAdmin

user_routes = APIRouter(prefix="/api/users", tags=["users"])


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