import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column


class UUIDPKMixin:
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )


class AuditMixin:
    """created_at / updated_at / deleted_at / created_by on every table,
    per the DDS naming convention the MVP spec explicitly preserves so
    deferred tables slot in later without a schema migration nightmare."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    @classmethod
    def created_by_column(cls):
        """Call inside a model body: created_by = AuditMixin.created_by_column()
        Kept as a helper rather than a mixin field because the FK target
        (users.id) doesn't exist yet when this mixin is defined."""
        return mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
