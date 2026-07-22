import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.base import AuditMixin, UUIDPKMixin


class BlogPost(Base, UUIDPKMixin, AuditMixin):
    __tablename__ = "blog_posts"

    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    # draft | published

    author: Mapped["User"] = relationship()  # noqa: F821


class Lead(Base, UUIDPKMixin, AuditMixin):
    """Contact-form submissions.

    NDPR NOTE: this table holds PII (name, email, phone, free-text message)
    submitted by non-users. Per the MVP spec's compliance note, this table
    needs an explicit retention policy — see
    app.services.retention.purge_expired_leads(), scheduled via the
    settings.leads_retention_days value. This is the one Phase 1 table where
    retention directly shapes what the admin GET /leads endpoint can return
    over time.
    """

    __tablename__ = "leads"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(320), nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
