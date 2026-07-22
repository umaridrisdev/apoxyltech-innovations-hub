"""seed roles and permissions

Revision ID: 0002_seed_roles_permissions
Revises: 0001_initial_schema
Create Date: 2026-07-17

"""
import uuid
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002_seed_roles_permissions"
down_revision: Union[str, None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Every permission code referenced by the OpenAPI spec's x-permission fields.
PERMISSION_CODES = [
    "user.read",
    "user.update",
    "client.read",
    "project.read",
    "project.create",
    "project.update",
    "blog.read",
    "blog.write",
    "lead.read",
]

# Role -> permission codes. Admin gets everything; client gets only what the
# MVP spec's client portal needs (own-scope enforced in route code, not here).
ROLE_PERMISSIONS = {
    "admin": PERMISSION_CODES,
    "client": ["user.read", "user.update", "project.read", "blog.read"],
    "guest": ["blog.read"],
}

roles_table = sa.table("roles", sa.column("id", postgresql.UUID), sa.column("name", sa.String))
permissions_table = sa.table(
    "permissions", sa.column("id", postgresql.UUID), sa.column("code", sa.String)
)
role_permissions_table = sa.table(
    "role_permissions",
    sa.column("role_id", postgresql.UUID),
    sa.column("permission_id", postgresql.UUID),
)


def upgrade() -> None:
    conn = op.get_bind()

    role_ids: dict[str, uuid.UUID] = {}
    for name in ROLE_PERMISSIONS:
        role_id = uuid.uuid4()
        role_ids[name] = role_id
        conn.execute(roles_table.insert().values(id=role_id, name=name))

    permission_ids: dict[str, uuid.UUID] = {}
    for code in PERMISSION_CODES:
        perm_id = uuid.uuid4()
        permission_ids[code] = perm_id
        conn.execute(permissions_table.insert().values(id=perm_id, code=code))

    for role_name, codes in ROLE_PERMISSIONS.items():
        for code in codes:
            conn.execute(
                role_permissions_table.insert().values(
                    role_id=role_ids[role_name], permission_id=permission_ids[code]
                )
            )


def downgrade() -> None:
    op.execute("DELETE FROM role_permissions")
    op.execute("DELETE FROM permissions")
    op.execute("DELETE FROM roles")
