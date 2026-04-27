from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.dependencies import require_permission
from app.models import Tag, post_tags
from app.schemas import TagResponse, TagCreate

router = APIRouter(prefix="/tags")


@router.get("", response_model=list[TagResponse])
async def list_tags(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tag))
    return result.scalars().all()


@router.post("", response_model=TagResponse, status_code=201)
async def create_tag(data: TagCreate, db: AsyncSession = Depends(get_db), user=Depends(require_permission("tags:create"))):
    tag = Tag(**data.model_dump())
    db.add(tag)
    await db.commit()
    await db.refresh(tag)
    return tag


@router.put("/{id}", response_model=TagResponse)
async def update_tag(id: int, data: TagCreate, db: AsyncSession = Depends(get_db), user=Depends(require_permission("tags:create"))):
    result = await db.execute(select(Tag).where(Tag.id == id))
    tag = result.scalar_one_or_none()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    tag.name = data.name
    tag.color = data.color
    await db.commit()
    await db.refresh(tag)
    return tag


@router.delete("/{id}")
async def delete_tag(id: int, db: AsyncSession = Depends(get_db), user=Depends(require_permission("tags:create"))):
    result = await db.execute(select(Tag).where(Tag.id == id))
    tag = result.scalar_one_or_none()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    await db.delete(tag)
    await db.commit()
    return {"success": True}


@router.get("/stats")
async def tag_stats(db: AsyncSession = Depends(get_db)):
    """返回每个标签的文章数量统计"""
    result = await db.execute(
        select(post_tags.c.tag_id, func.count(post_tags.c.post_id).label("count"))
        .group_by(post_tags.c.tag_id)
    )
    stats = {row.tag_id: row.count for row in result.all()}
    return stats
