from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, and_, delete
from typing import Optional
from app.database import get_db
from app.dependencies import require_admin
from app.models import Post, Tag, post_tags
from app.schemas import PostResponse, PostListParams, PostCreate, PostUpdate

router = APIRouter(prefix="/posts")


@router.get("", response_model=list[PostResponse])
async def list_posts(
    type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    query = select(Post)
    filters = []
    if type:
        filters.append(Post.type == type)
    if status:
        filters.append(Post.status == status)
    if filters:
        query = query.where(and_(*filters))
    query = query.order_by(desc(Post.created_at)).limit(limit).offset(offset)
    result = await db.execute(query)
    posts = result.scalars().all()

    # Fetch tags for each post
    post_responses = []
    for post in posts:
        tag_result = await db.execute(
            select(Tag).join(post_tags, Tag.id == post_tags.c.tag_id).where(post_tags.c.post_id == post.id)
        )
        tags = tag_result.scalars().all()
        post_responses.append(PostResponse(
            **{c.name: getattr(post, c.name) for c in post.__table__.columns},
            tags=[{"id": t.id, "name": t.name, "color": t.color} for t in tags],
        ))
    return post_responses


@router.get("/{slug}", response_model=PostResponse)
async def get_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Post).where(Post.slug == slug))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    tag_result = await db.execute(
        select(Tag).join(post_tags, Tag.id == post_tags.c.tag_id).where(post_tags.c.post_id == post.id)
    )
    tags = tag_result.scalars().all()
    return PostResponse(
        **{c.name: getattr(post, c.name) for c in post.__table__.columns},
        tags=[{"id": t.id, "name": t.name, "color": t.color} for t in tags],
    )


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(data: PostCreate, db: AsyncSession = Depends(get_db), user=Depends(require_admin)):
    post = Post(
        title=data.title,
        content=data.content,
        type=data.type,
        slug=data.slug,
        cover_image=data.cover_image,
        status=data.status,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)

    if data.tag_ids:
        for tag_id in data.tag_ids:
            await db.execute(post_tags.insert().values(post_id=post.id, tag_id=tag_id))
        await db.commit()

    return PostResponse(
        **{c.name: getattr(post, c.name) for c in post.__table__.columns},
        tags=[],
    )


@router.put("/{id}", response_model=PostResponse)
async def update_post(id: int, data: PostUpdate, db: AsyncSession = Depends(get_db), user=Depends(require_admin)):
    result = await db.execute(select(Post).where(Post.id == id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    update_data = data.model_dump(exclude_unset=True, exclude={"tag_ids"})
    for key, value in update_data.items():
        setattr(post, key, value)

    if data.tag_ids is not None:
        await db.execute(delete(post_tags).where(post_tags.c.post_id == id))
        for tag_id in data.tag_ids:
            await db.execute(post_tags.insert().values(post_id=id, tag_id=tag_id))

    await db.commit()
    await db.refresh(post)

    tag_result = await db.execute(
        select(Tag).join(post_tags, Tag.id == post_tags.c.tag_id).where(post_tags.c.post_id == post.id)
    )
    tags = tag_result.scalars().all()
    return PostResponse(
        **{c.name: getattr(post, c.name) for c in post.__table__.columns},
        tags=[{"id": t.id, "name": t.name, "color": t.color} for t in tags],
    )


@router.delete("/{id}")
async def delete_post(id: int, db: AsyncSession = Depends(get_db), user=Depends(require_admin)):
    result = await db.execute(select(Post).where(Post.id == id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    await db.execute(delete(post_tags).where(post_tags.c.post_id == id))
    await db.delete(post)
    await db.commit()
    return {"success": True}
