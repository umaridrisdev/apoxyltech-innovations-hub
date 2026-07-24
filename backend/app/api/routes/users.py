from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import get_current_user, require_permission
from app.core.security import hash_password
from app.db.session import get_db
from app.models.identity import Role, User
from app.schemas.auth import RolePublic, UserPrivate, UserRoleUpdateRequest, UserUpdateRequest
from app.schemas.common import PaginatedResponse, PaginationMeta

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=PaginatedResponse[UserPrivate])
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    # "client.read" is used as the established admin-only proxy permission
    # elsewhere in this codebase (see projects.py, clients.py) — Phase 1's
    # 3-role model doesn't have a dedicated "user.read.all" code, and
    # plain "user.read" is intentionally shared with the client role for
    # self-service /users/me access, so it can't be reused here.
    _=Depends(require_permission("client.read")),
):
    total = await db.scalar(select(func.count()).select_from(User))
    rows = await db.scalars(
        select(User).offset((page - 1) * page_size).limit(page_size)
    )
    data = [
        UserPrivate(
            id=u.id,
            email=u.email,
            status=u.status,
            roles=[r.name for r in u.roles],
            created_at=u.created_at,
        )
        for u in rows
    ]
    return PaginatedResponse(
        data=data, meta=PaginationMeta(page=page, page_size=page_size, total=total or 0)
    )


@router.get("/roles", response_model=list[RolePublic])
async def list_roles(
    _=Depends(require_permission("client.read")),
    db: AsyncSession = Depends(get_db),
):
    rows = await db.scalars(select(Role).order_by(Role.name))
    return [RolePublic(name=role.name) for role in rows]


@router.patch("/{user_id}/roles", response_model=UserPrivate)
async def update_user_roles(
    user_id: str,
    body: UserRoleUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("client.read")),
):
    target = await db.get(User, user_id)
    if not target:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    unique_roles = list(dict.fromkeys(body.roles))
    roles = await db.scalars(select(Role).where(Role.name.in_(unique_roles)))
    roles_by_name = {role.name: role for role in roles}
    missing_roles = sorted(role for role in unique_roles if role not in roles_by_name)
    if missing_roles:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"Unknown role(s): {', '.join(missing_roles)}",
        )

    current_role_names = {role.name for role in target.roles}
    if "admin" in current_role_names and "admin" not in unique_roles:
        admin_count = await db.scalar(
            select(func.count())
            .select_from(User)
            .join(User.roles)
            .where(Role.name == "admin")
        )
        if (admin_count or 0) <= 1:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "At least one admin account must remain assigned to the admin role",
            )

    target.roles = [roles_by_name[name] for name in unique_roles]
    await db.commit()
    return UserPrivate(
        id=target.id,
        email=target.email,
        status=target.status,
        roles=unique_roles,
        created_at=target.created_at,
    )


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
