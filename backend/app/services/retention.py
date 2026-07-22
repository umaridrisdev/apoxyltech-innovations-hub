"""
NDPR-driven retention for the leads table.

The MVP spec flags this as a compliance gap in the original six documents:
the leads table holds contact-form PII with no stated retention policy.
This job hard-deletes leads older than settings.leads_retention_days.

Run on a schedule (cron, GitHub Actions scheduled workflow, or a simple
APScheduler job inside the app) — not wired to a specific scheduler here
since that's a hosting-environment decision, not an app-code one.
"""
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.cms import Lead

settings = get_settings()


async def purge_expired_leads(db: AsyncSession) -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(days=settings.leads_retention_days)
    result = await db.execute(delete(Lead).where(Lead.created_at < cutoff))
    await db.commit()
    return result.rowcount or 0
