import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import CurrentUser, get_current_user, require_permission
from app.db.session import get_db
from app.models.client import Client as ClientModel
from app.models.project import Milestone as MilestoneModel
from app.models.project import Project as ProjectModel
from app.models.project import ProjectFile as ProjectFileModel
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.schemas.domain import (
    Project as ProjectSchema,
)
from app.schemas.domain import (
    ProjectCreateRequest,
    ProjectDetail,
    ProjectFile as ProjectFileSchema,
    ProjectUpdateRequest,
)
from app.services.storage import upload_file

router = APIRouter(prefix="/projects", tags=["Projects"])


async def _client_id_for_user(db: AsyncSession, user_id: str) -> uuid.UUID | None:
    client = await db.scalar(select(ClientModel).where(ClientModel.user_id == user_id))
    return client.id if client else None


async def _assert_project_access(db: AsyncSession, user: CurrentUser, project: ProjectModel) -> None:
    """Admins (project.read on any project) pass automatically via the
    permission dependency upstream in list/get; here we additionally check
    that a client-scoped caller owns the project they're requesting."""
    if user.has_permission("client.read"):  # proxy for "is admin" in Phase 1's 3-role model
        return
    own_client_id = await _client_id_for_user(db, user.user_id)
    if own_client_id != project.client_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your project")


@router.get("", response_model=PaginatedResponse[ProjectSchema])
async def list_projects(
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: CurrentUser = Depends(require_permission("project.read")),
    db: AsyncSession = Depends(get_db),
):
    query = select(ProjectModel)
    count_query = select(func.count()).select_from(ProjectModel)

    if not user.has_permission("client.read"):  # not an admin -> scope to own client
        own_client_id = await _client_id_for_user(db, user.user_id)
        query = query.where(ProjectModel.client_id == own_client_id)
        count_query = count_query.where(ProjectModel.client_id == own_client_id)

    if status_filter:
        query = query.where(ProjectModel.status == status_filter)
        count_query = count_query.where(ProjectModel.status == status_filter)

    total = await db.scalar(count_query)
    rows = await db.scalars(query.offset((page - 1) * page_size).limit(page_size))
    return PaginatedResponse(
        data=list(rows), meta=PaginationMeta(page=page, page_size=page_size, total=total or 0)
    )


@router.post("", response_model=ProjectSchema, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreateRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("project.create")),
):
    client = await db.get(ClientModel, body.client_id)
    if not client:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "client_id does not exist")

    project = ProjectModel(client_id=body.client_id, name=body.name, status=body.status.value)
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectDetail)
async def get_project(
    project_id: uuid.UUID,
    user: CurrentUser = Depends(require_permission("project.read")),
    db: AsyncSession = Depends(get_db),
):
    project = await db.get(ProjectModel, project_id)
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    await _assert_project_access(db, user, project)

    milestones = await db.scalars(
        select(MilestoneModel).where(MilestoneModel.project_id == project_id)
    )
    return ProjectDetail(
        id=project.id,
        client_id=project.client_id,
        name=project.name,
        status=project.status,
        created_at=project.created_at,
        updated_at=project.updated_at,
        milestones=list(milestones),
    )


@router.patch("/{project_id}", response_model=ProjectSchema)
async def update_project(
    project_id: uuid.UUID,
    body: ProjectUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("project.update")),
):
    project = await db.get(ProjectModel, project_id)
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")

    if body.name is not None:
        project.name = body.name
    if body.status is not None:
        project.status = body.status.value

    await db.commit()
    await db.refresh(project)
    return project


@router.post(
    "/{project_id}/files", response_model=ProjectFileSchema, status_code=status.HTTP_201_CREATED
)
async def upload_project_file(
    project_id: uuid.UUID,
    file: UploadFile = File(...),
    user: CurrentUser = Depends(require_permission("project.update")),
    db: AsyncSession = Depends(get_db),
):
    project = await db.get(ProjectModel, project_id)
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    await _assert_project_access(db, user, project)

    contents = await file.read()
    url = await upload_file(contents, file.filename, file.content_type or "application/octet-stream")

    record = ProjectFileModel(project_id=project_id, file_url=url)
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


@router.get("/{project_id}/files", response_model=PaginatedResponse[ProjectFileSchema])
async def list_project_files(
    project_id: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: CurrentUser = Depends(require_permission("project.read")),
    db: AsyncSession = Depends(get_db),
):
    project = await db.get(ProjectModel, project_id)
    if not project:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    await _assert_project_access(db, user, project)

    total = await db.scalar(
        select(func.count()).select_from(ProjectFileModel).where(ProjectFileModel.project_id == project_id)
    )
    rows = await db.scalars(
        select(ProjectFileModel)
        .where(ProjectFileModel.project_id == project_id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return PaginatedResponse(
        data=list(rows), meta=PaginationMeta(page=page, page_size=page_size, total=total or 0)
    )
