import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ---------------------------------------------------------------- requests
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12)
    company_name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class VerifyEmailRequest(BaseModel):
    token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=12, alias="new_password")


class UserUpdateRequest(BaseModel):
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=12)


# ---------------------------------------------------------------- responses
# password_hash is intentionally absent from every schema below — see
# SECURITY CLASSIFICATION comment on User.password_hash in app/models/identity.py.
class UserPublic(BaseModel):
    id: uuid.UUID
    email: EmailStr
    status: str

    model_config = {"from_attributes": True}


class UserPrivate(UserPublic):
    roles: list[str]
    created_at: datetime


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    # Refresh token is never in this body — set only as a secure, HttpOnly,
    # SameSite cookie by the route handler.