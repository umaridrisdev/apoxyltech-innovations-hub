"""
Permission-code authorization.

Per the MVP spec: Phase 1 ships only 3 roles (admin, client, guest), but
every protected route checks a permission code (e.g. "project.read"), not a
role name directly. This is what lets Manager/Support/Instructor roles slot
in later without touching route code.

Role -> permission-code mapping lives in the database (roles,
permissions, role_permissions, user_roles tables per the ERD), seeded at
migration time. See alembic/versions/xxxx_seed_roles_permissions.py.
"""
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import decode_token

bearer_scheme = HTTPBearer(auto_error=False)


class CurrentUser:
    def __init__(self, user_id: str, permissions: list[str]):
        self.user_id = user_id
        self.permissions = permissions

    def has_permission(self, code: str) -> bool:
        return code in self.permissions


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentUser:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")

    payload = decode_token(credentials.credentials)
    if payload is None or payload.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired access token")

    return CurrentUser(user_id=payload["sub"], permissions=payload.get("permissions", []))


def require_permission(code: str):
    """FastAPI dependency factory: require_permission('project.update')"""

    async def _checker(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if not user.has_permission(code):
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                f"Missing required permission: {code}",
            )
        return user

    return _checker


async def get_optional_user(request: Request) -> CurrentUser | None:
    """For endpoints that are public but behave differently if authenticated
    (e.g. GET /blog showing drafts to an admin)."""
    auth_header = request.headers.get("authorization", "")
    if not auth_header.lower().startswith("bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        return None
    return CurrentUser(user_id=payload["sub"], permissions=payload.get("permissions", []))
