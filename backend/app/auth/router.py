from fastapi import APIRouter, status

from app.auth import controller
from app.auth.dtos import (
    LoginResponseSchema,
    LoginSchema,
    MeResponseSchema,
    RefreshResponseSchema,
    RefreshSchema,
    SetPasswordResponseSchema,
    SetPasswordSchema,
    SignupResponseSchema,
    SignupSchema,
)
from app.user.controller import serialize_user
from app.utils.db import get_db
from app.utils.helpers import DbSession, IsAuthenticated

auth_routes = APIRouter(prefix="/api/auth", tags=["auth"])


@auth_routes.post(
    "/login",
    response_model=LoginResponseSchema,
    status_code=status.HTTP_200_OK,
)
def login(body: LoginSchema, db: DbSession):
    return controller.login_user(body, db)


@auth_routes.post(
    "/signup",
    response_model=SignupResponseSchema,
    status_code=status.HTTP_201_CREATED,
)
def signup(body: SignupSchema, db: DbSession):
    return controller.signup_user(body, db)


@auth_routes.get(
    "/me",
    response_model=MeResponseSchema,
    status_code=status.HTTP_200_OK,
)
def me(user: IsAuthenticated):
    return serialize_user(user)


@auth_routes.post(
    "/refresh",
    response_model=RefreshResponseSchema,
    status_code=status.HTTP_200_OK,
)
def refresh(body: RefreshSchema, db: DbSession):
    return controller.refresh_tokens(body.refresh_token, db)


@auth_routes.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(db: DbSession, user: IsAuthenticated):
    return controller.logout_user(user, db)


@auth_routes.post(
    "/set-password",
    response_model=SetPasswordResponseSchema,
    status_code=status.HTTP_200_OK,
)
def set_password(body: SetPasswordSchema, db: DbSession):
    return controller.set_password_via_token(body, db)