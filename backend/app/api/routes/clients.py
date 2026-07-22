import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_permission
from app.db.session import get_db
from app.models.client import Client as ClientModel
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.schemas.domain import Client as ClientSchema

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.get("", response_model=PaginatedResponse[ClientSchema])
async def list_clients(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("client.read")),
):
    total = await db.scalar(select(func.count()).select_from(ClientModel))
    rows = await db.scalars(
        select(ClientModel).offset((page - 1) * page_size).limit(page_size)
    )
    return PaginatedResponse(
        data=list(rows),
        meta=PaginationMeta(page=page, page_size=page_size, total=total or 0),
    )


@router.get("/{client_id}", response_model=ClientSchema)
async def get_client(
    client_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("client.read")),
):
    client = await db.get(ClientModel, client_id)
    if not client:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Client not found")
    return client
