import uuid
from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field

from app.schemas.auth import UserPublic


# ---------------------------------------------------------------- clients
class Client(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    company_name: str
    user: UserPublic | None = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------- projects
class ProjectStatus(str, Enum):
    planning = "planning"
    in_progress = "in_progress"
    on_hold = "on_hold"
    completed = "completed"
    cancelled = "cancelled"


class Project(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    name: str
    status: ProjectStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectCreateRequest(BaseModel):
    client_id: uuid.UUID
    name: str
    status: ProjectStatus = ProjectStatus.planning


class ProjectUpdateRequest(BaseModel):
    name: str | None = None
    status: ProjectStatus | None = None


class Milestone(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    title: str
    due_date: date | None = None

    model_config = {"from_attributes": True}


class ProjectDetail(Project):
    milestones: list[Milestone] = []


class ProjectFile(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    file_url: str
    uploaded_at: datetime = Field(alias="created_at")

    model_config = {"from_attributes": True, "populate_by_name": True}


# ---------------------------------------------------------------- blog
class BlogPostStatus(str, Enum):
    draft = "draft"
    published = "published"


class BlogPost(BaseModel):
    id: uuid.UUID
    author_id: uuid.UUID
    title: str
    slug: str
    body: str
    status: BlogPostStatus

    model_config = {"from_attributes": True}


class BlogPostCreateRequest(BaseModel):
    title: str
    body: str
    status: BlogPostStatus = BlogPostStatus.draft


class BlogPostUpdateRequest(BaseModel):
    title: str | None = None
    body: str | None = None
    status: BlogPostStatus | None = None


# ---------------------------------------------------------------- leads
class LeadCreateRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    message: str = Field(max_length=5000)


class LeadCreateResponse(BaseModel):
    received: bool = True


class Lead(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    phone: str | None = None
    message: str
    created_at: datetime

    model_config = {"from_attributes": True}
