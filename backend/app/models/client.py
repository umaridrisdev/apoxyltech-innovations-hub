import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.base import AuditMixin, UUIDPKMixin


class Client(Base, UUIDPKMixin, AuditMixin):
    __tablename__ = "clients"

    # One-to-one with users, per the ERD's key modeling decision: a client is
    # a user account with an extra profile. This is what lets Instructor/
    # Manager profiles be added later without touching the users table.
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    # NOTE: if the full data dictionary defines additional fields here (e.g.
    # billing address), add them with the same SECURITY CLASSIFICATION
    # comment style used in identity.py, and exclude from list-view schemas.

    # lazy="selectin" is required here: this relationship gets serialized
    # into API responses (ClientSchema.user), and the default lazy-load
    # strategy tries to run synchronous IO, which crashes under an async
    # SQLAlchemy session with MissingGreenlet. Same reasoning as User.roles
    # in app/models/identity.py.
    user: Mapped["User"] = relationship(back_populates="client_profile", lazy="selectin")  # noqa: F821
    documents: Mapped[list["ClientDocument"]] = relationship(
        back_populates="client", cascade="all, delete-orphan"
    )
    projects: Mapped[list["Project"]] = relationship(back_populates="client")  # noqa: F821


class ClientDocument(Base, UUIDPKMixin, AuditMixin):
    __tablename__ = "client_documents"

    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    file_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    # Signed, time-limited Cloudflare R2 URL — see app/services/storage.py.

    client: Mapped[Client] = relationship(back_populates="documents")