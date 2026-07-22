from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.permissions import require_permission
from app.db.session import get_db
from app.models.cms import Lead as LeadModel
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.schemas.domain import Lead as LeadSchema
from app.schemas.domain import LeadCreateRequest, LeadCreateResponse
from app.services.email import send_lead_notification_email

router = APIRouter(prefix="/leads", tags=["Leads"])
settings = get_settings()


@router.post("", response_model=LeadCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_lead(body: LeadCreateRequest, db: AsyncSession = Depends(get_db)):
    lead = LeadModel(name=body.name, email=body.email, phone=body.phone, message=body.message)
    db.add(lead)
    await db.commit()

    # Admin notification address should come from settings/config, not be
    # hardcoded — placeholder here for scaffold clarity.
    send_lead_notification_email(
        admin_to=settings.email_from_address,
        lead_name=body.name,
        lead_email=body.email,
        message=body.message,
    )
    return LeadCreateResponse()


@router.get("", response_model=PaginatedResponse[LeadSchema])
async def list_leads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("lead.read")),
):
    # Rows past the NDPR retention window are purged by a scheduled job
    # (app.services.retention) rather than filtered here, so this list
    # reflects what's actually still lawfully retained.
    total = await db.scalar(select(func.count()).select_from(LeadModel))
    rows = await db.scalars(
        select(LeadModel)
        .order_by(LeadModel.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return PaginatedResponse(
        data=list(rows), meta=PaginationMeta(page=page, page_size=page_size, total=total or 0)
    )
