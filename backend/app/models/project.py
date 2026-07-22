import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.base import AuditMixin, UUIDPKMixin


class Project(Base, UUIDPKMixin, AuditMixin):
    __tablename__ = "projects"

    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="planning")
    # planning | in_progress | on_hold | completed | cancelled

    client: Mapped["Client"] = relationship(back_populates="projects")  # noqa: F821
    milestones: Mapped[list["Milestone"]] = relationship(
        back_populates="project", cascade="all, delete-orphan", order_by="Milestone.due_date"
    )
    files: Mapped[list["ProjectFile"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )


class Milestone(Base, UUIDPKMixin, AuditMixin):
    __tablename__ = "milestones"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    # Read-only via API in Phase 1 — no dedicated create/update route yet;
    # managed by admins through the project workflow. See OpenAPI spec note.

    project: Mapped[Project] = relationship(back_populates="milestones")


class ProjectFile(Base, UUIDPKMixin, AuditMixin):
    __tablename__ = "project_files"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    file_url: Mapped[str] = mapped_column(String(1024), nullable=False)

    project: Mapped[Project] = relationship(back_populates="files")
