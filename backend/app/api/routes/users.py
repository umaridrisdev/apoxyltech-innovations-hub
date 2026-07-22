from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import CurrentUser, get_current_user
from app.core.security import hash_password
from app.db.session import get_db
from app.models.identity import User
from app.schemas.auth import UserPrivate, UserUpdateRequest

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserPrivate)
async def get_me(user: CurrentUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    db_user = await db.get(User, user.user_id)
    return UserPrivate(
        id=db_user.id,
        email=db_user.email,
        status=db_user.status,
        roles=[r.name for r in db_user.roles],
        created_at=db_user.created_at,
    )


@router.patch("/me", response_model=UserPrivate)
async def update_me(
    body: UserUpdateRequest,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    db_user = await db.get(User, user.user_id)
    if body.email:
        db_user.email = body.email
    if body.password:
        db_user.password_hash = hash_password(body.password)
    await db.commit()
    await db.refresh(db_user)
    return UserPrivate(
        id=db_user.id,
        email=db_user.email,
        status=db_user.status,
        roles=[r.name for r in db_user.roles],
        created_at=db_user.created_at,
    )
