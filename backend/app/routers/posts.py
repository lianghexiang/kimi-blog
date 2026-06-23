from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, and_, delete
from typing import Optional
from app.database import get_db
from app.dependencies import require_permission
from app.models import Post, Tag, post_tags
from app.schemas import PostResponse, PostListParams, PostCreate, PostUpdate
from app.storage import put_object, get_object, remove_object

router = APIRouter(prefix="/posts")


def _post_object_name(slug: str) -> str:
    return f"posts/{slug}.md"


def _read_markdown(slug: str) -> str:
    try:
        return get_object(_post_object_name(slug)).decode("utf-8")
    except Exception:
        return ""


def _write_markdown(slug: str, content: str) -> None:
    put_object(_post_object_name(slug), content.encode("utf-8"), "text/markdown")


def _delete_markdown(slug: str) -> None:
    remove_object(_post_object_name(slug))


def _serialize_post(post: Post, include_content: bool = True) -> dict:
    data = {c.name: getattr(post, c.name) for c in post.__table__.columns}
    if include_content:
        data["content"] = _read_markdown(post.slug)
    else:
        data["content"] = ""
    return data


@router.get("", response_model=list[PostResponse])
async def list_posts(
    type: Optional[str] = None,
    status: Optional[str] = None,
    tag: Optional[str] = None,
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

    post_responses = []
    for post in posts:
        tag_result = await db.execute(
            select(Tag).join(post_tags, Tag.id == post_tags.c.tag_id).where(post_tags.c.post_id == post.id)
        )
        tags = tag_result.scalars().all()
        post_responses.append(PostResponse(
            **_serialize_post(post, include_content=False),
            tags=[{"id": t.id, "name": t.name, "color": t.color, "created_at": t.created_at} for t in tags],
        ))

    if tag:
        post_responses = [p for p in post_responses if any(t.name == tag for t in p.tags)]

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
        **_serialize_post(post, include_content=True),
        tags=[{"id": t.id, "name": t.name, "color": t.color, "created_at": t.created_at} for t in tags],
    )


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(data: PostCreate, db: AsyncSession = Depends(get_db), user=Depends(require_permission("posts:create"))):
    # 先把 Markdown 正文写入 MinIO
    _write_markdown(data.slug, data.content)

    post = Post(
        title=data.title,
        content=_post_object_name(data.slug),
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
        **_serialize_post(post, include_content=True),
        tags=[],
    )


@router.put("/{id}", response_model=PostResponse)
async def update_post(id: int, data: PostUpdate, db: AsyncSession = Depends(get_db), user=Depends(require_permission("posts:update"))):
    result = await db.execute(select(Post).where(Post.id == id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    old_slug = post.slug
    new_slug = data.slug if data.slug is not None else old_slug

    update_data = data.model_dump(exclude_unset=True, exclude={"tag_ids", "content"})
    for key, value in update_data.items():
        setattr(post, key, value)

    # 如果 slug 变化，删除旧 Markdown 对象
    if data.slug is not None and data.slug != old_slug:
        _delete_markdown(old_slug)

    # 如果内容有变更，写入新的 Markdown 对象
    if data.content is not None:
        _write_markdown(new_slug, data.content)
        post.content = _post_object_name(new_slug)
    elif data.slug is not None and data.slug != old_slug:
        # slug 变了但内容没传：把旧内容迁移到新对象名
        try:
            old_content = get_object(_post_object_name(old_slug)).decode("utf-8")
            _write_markdown(new_slug, old_content)
            post.content = _post_object_name(new_slug)
        except Exception:
            post.content = _post_object_name(new_slug)

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
        **_serialize_post(post, include_content=True),
        tags=[{"id": t.id, "name": t.name, "color": t.color, "created_at": t.created_at} for t in tags],
    )


@router.delete("/{id}")
async def delete_post(id: int, db: AsyncSession = Depends(get_db), user=Depends(require_permission("posts:delete"))):
    result = await db.execute(select(Post).where(Post.id == id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # 先删除 MinIO 中的 Markdown
    _delete_markdown(post.slug)

    await db.execute(delete(post_tags).where(post_tags.c.post_id == id))
    await db.delete(post)
    await db.commit()
    return {"success": True}
