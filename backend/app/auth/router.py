from fastapi import APIRouter, status

from app.auth import controller
from app.auth.dtos import (
    AcceptInviteSchema,
    LoginResponseSchema,
    LoginSchema,
    MeResponseSchema,
    RefreshResponseSchema,
    RefreshSchema,
    ResendVerificationResponseSchema,
    ResendVerificationSchema,
    SetPasswordResponseSchema,
    SetPasswordSchema,
    SignupResponseSchema,
    SignupSchema,
    VerifyEmailResponseSchema,
    VerifyEmailSchema,
    VerifyInviteResponseSchema,
)
from app.user.controller import (
    change_user_password,
    serialize_user,
    update_current_user_profile,
)
from app.user.dtos import (
    ChangePasswordResponseSchema,
    ChangePasswordSchema,
    UpdateProfileSchema,
)
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


@auth_routes.put(
    "/me",
    response_model=MeResponseSchema,
    status_code=status.HTTP_200_OK,
)
def update_me(
    body: UpdateProfileSchema,
    db: DbSession,
    user: IsAuthenticated,
):
    return update_current_user_profile(user, body, db)


@auth_routes.post(
    "/change-password",
    response_model=ChangePasswordResponseSchema,
    status_code=status.HTTP_200_OK,
)
def change_password(
    body: ChangePasswordSchema,
    db: DbSession,
    user: IsAuthenticated,
):
    return change_user_password(user, body, db)


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


@auth_routes.get(
    "/invitation",
    response_model=VerifyInviteResponseSchema,
    status_code=status.HTTP_200_OK,
)
def verify_invitation(token: str, db: DbSession):
    return controller.verify_invite_token(token, db)


@auth_routes.post(
    "/accept-invite",
    response_model=LoginResponseSchema,
    status_code=status.HTTP_200_OK,
)
def accept_invite(body: AcceptInviteSchema, db: DbSession):
    return controller.accept_invite(body, db)


@auth_routes.post(
    "/verify-email",
    response_model=VerifyEmailResponseSchema,
    status_code=status.HTTP_200_OK,
)
def verify_email(body: VerifyEmailSchema, db: DbSession):
    return controller.verify_email(body, db)


@auth_routes.post(
    "/resend-verification",
    response_model=ResendVerificationResponseSchema,
    status_code=status.HTTP_200_OK,
)
def resend_verification(body: ResendVerificationSchema, db: DbSession):
    return controller.resend_verification_email(body, db)