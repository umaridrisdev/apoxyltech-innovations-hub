import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import CurrentUser, get_optional_user, require_permission
from app.db.session import get_db
from app.models.cms import BlogPost as BlogPostModel
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.schemas.domain import BlogPost as BlogPostSchema
from app.schemas.domain import BlogPostCreateRequest, BlogPostUpdateRequest

router = APIRouter(tags=["Blog"])


def _slugify(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return slug or str(uuid.uuid4())[:8]


@router.get("/blog", response_model=PaginatedResponse[BlogPostSchema])
async def list_blog_posts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: CurrentUser | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(BlogPostModel)
    count_query = select(func.count()).select_from(BlogPostModel)

    is_admin_preview = user is not None and user.has_permission("blog.write")
    if not is_admin_preview:
        query = query.where(BlogPostModel.status == "published")
        count_query = count_query.where(BlogPostModel.status == "published")

    total = await db.scalar(count_query)
    rows = await db.scalars(
        query.order_by(BlogPostModel.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return PaginatedResponse(
        data=list(rows), meta=PaginationMeta(page=page, page_size=page_size, total=total or 0)
    )


@router.get("/blog/{slug}", response_model=BlogPostSchema)
async def get_blog_post(slug: str, db: AsyncSession = Depends(get_db)):
    post = await db.scalar(select(BlogPostModel).where(BlogPostModel.slug == slug))
    if not post or post.status != "published":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Blog post not found")
    return post


@router.post("/blog", response_model=BlogPostSchema, status_code=status.HTTP_201_CREATED)
async def create_blog_post(
    body: BlogPostCreateRequest,
    user: CurrentUser = Depends(require_permission("blog.write")),
    db: AsyncSession = Depends(get_db),
):
    slug = _slugify(body.title)
    post = BlogPostModel(
        author_id=user.user_id,
        title=body.title,
        slug=slug,
        body=body.body,
        status=body.status.value,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return post


@router.patch("/blog/{post_id}", response_model=BlogPostSchema)
async def update_blog_post(
    post_id: uuid.UUID,
    body: BlogPostUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("blog.write")),
):
    post = await db.get(BlogPostModel, post_id)
    if not post:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Blog post not found")

    if body.title is not None:
        post.title = body.title
        post.slug = _slugify(body.title)
    if body.body is not None:
        post.body = body.body
    if body.status is not None:
        post.status = body.status.value

    await db.commit()
    await db.refresh(post)
    return post
