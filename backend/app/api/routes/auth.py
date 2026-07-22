import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.permissions import get_current_user, CurrentUser
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.client import Client
from app.models.identity import EmailVerification, PasswordReset, RefreshToken, Role, User
from app.schemas.auth import (
    AuthTokenResponse,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    UserPublic,
    VerifyEmailRequest,
)
from app.services.email import send_password_reset_email, send_verification_email

router = APIRouter(prefix="/auth", tags=["Auth"])
settings = get_settings()

REFRESH_COOKIE_NAME = "apoxyltech_refresh_token"


def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


async def _permissions_for_user(db: AsyncSession, user: User) -> list[str]:
    codes: set[str] = set()
    for role in user.roles:
        for perm in role.permissions:
            codes.add(perm.code)
    return sorted(codes)


async def _issue_tokens(db: AsyncSession, user: User, response: Response) -> AuthTokenResponse:
    permissions = await _permissions_for_user(db, user)
    access_token = create_access_token(str(user.id), permissions)
    raw_refresh, expires_at = create_refresh_token(str(user.id))

    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=_hash_token(raw_refresh),
            expires_at=expires_at,
        )
    )
    await db.commit()

    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=raw_refresh,
        httponly=True,
        secure=settings.environment != "development",
        samesite="strict",
        max_age=settings.refresh_token_expire_days * 24 * 3600,
        path="/api/auth",
    )

    return AuthTokenResponse(
        access_token=access_token,
        expires_in=settings.access_token_expire_minutes * 60,
    )


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.scalar(select(User).where(User.email == body.email))
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    user = User(email=body.email, password_hash=hash_password(body.password))

    guest_role = await db.scalar(select(Role).where(Role.name == "client"))
    if guest_role:
        user.roles.append(guest_role)

    db.add(user)
    await db.flush()

    # Every Phase 1 user gets a Client profile at registration — per the
    # ERD's 1:1 users<->clients design ("a client is a user account with an
    # extra profile"). company_name defaults to the email's local part if
    # not supplied; the client can rename it later via PATCH /users/me or a
    # future dedicated client-profile endpoint.
    company_name = body.company_name or body.email.split("@")[0]
    db.add(Client(user_id=user.id, company_name=company_name))

    raw_token = secrets.token_urlsafe(32)
    db.add(
        EmailVerification(
            user_id=user.id,
            token=raw_token,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
        )
    )
    await db.commit()
    await db.refresh(user)

    send_verification_email(user.email, raw_token)
    return user


@router.post("/login", response_model=AuthTokenResponse)
async def login(body: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == body.email))
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    if user.status != "active":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account is not active")

    return await _issue_tokens(db, user, response)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    response: Response,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    # Revoke all active refresh tokens for this user's session on logout.
    tokens = await db.scalars(
        select(RefreshToken).where(RefreshToken.user_id == user.user_id, RefreshToken.revoked.is_(False))
    )
    for token in tokens:
        token.revoked = True
    await db.commit()
    response.delete_cookie(REFRESH_COOKIE_NAME, path="/api/auth")


@router.post("/refresh", response_model=AuthTokenResponse)
async def refresh(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    raw_token = request.cookies.get(REFRESH_COOKIE_NAME)
    if not raw_token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing refresh token")

    payload = decode_token(raw_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")

    token_hash = _hash_token(raw_token)
    record = await db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    if (
        not record
        or record.revoked
        or record.expires_at < datetime.now(timezone.utc)
    ):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh token expired or revoked")

    user = await db.get(User, record.user_id)
    if not user or user.status != "active":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account is not active")

    # Rotate: revoke the used refresh token and issue a fresh pair.
    record.revoked = True
    await db.commit()

    return await _issue_tokens(db, user, response)


@router.post("/verify-email", response_model=UserPublic)
async def verify_email(body: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    record = await db.scalar(
        select(EmailVerification).where(EmailVerification.token == body.token)
    )
    if not record or record.used_at or record.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Token invalid, expired, or already used")

    user = await db.get(User, record.user_id)
    user.status = "active"
    record.used_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
async def forgot_password(body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == body.email))
    if user:
        raw_token = secrets.token_urlsafe(32)
        db.add(
            PasswordReset(
                user_id=user.id,
                token=raw_token,
                expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
            )
        )
        await db.commit()
        send_password_reset_email(user.email, raw_token)
    # Always 202, regardless of whether the email exists — avoids leaking
    # account existence, per the OpenAPI spec.
    return None


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    record = await db.scalar(select(PasswordReset).where(PasswordReset.token == body.token))
    if not record or record.used_at or record.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Token invalid, expired, or already used")

    user = await db.get(User, record.user_id)
    user.password_hash = hash_password(body.new_password)
    record.used_at = datetime.now(timezone.utc)

    # Revoke all existing refresh tokens on password change.
    tokens = await db.scalars(
        select(RefreshToken).where(RefreshToken.user_id == user.id, RefreshToken.revoked.is_(False))
    )
    for token in tokens:
        token.revoked = True

    await db.commit()
    return {"message": "Password updated"}