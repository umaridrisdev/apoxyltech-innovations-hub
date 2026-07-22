"""
Import every model here so Alembic's autogenerate (via env.py ->
Base.metadata) can see the full schema in one place. This mirrors the ERD's
four domains: Identity & Access, Client Management, Projects, Website CMS.
"""
from app.models.identity import (  # noqa: F401
    EmailVerification,
    PasswordReset,
    Permission,
    RefreshToken,
    Role,
    RolePermission,
    User,
    UserRole,
)
from app.models.client import Client, ClientDocument  # noqa: F401
from app.models.project import Milestone, Project, ProjectFile  # noqa: F401
from app.models.cms import BlogPost, Lead  # noqa: F401
