from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Optional
from app.database import get_db
from app.dependencies import require_permission
from app.models import Image
from app.schemas import ImageResponse, ImageCreate

router = APIRouter(prefix="/images")


@router.get("", response_model=list[ImageResponse])
async def list_images(album: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(Image).order_by(desc(Image.created_at))
    if album:
        query = query.where(Image.album == album)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=ImageResponse, status_code=status.HTTP_201_CREATED)
async def create_image(data: ImageCreate, db: AsyncSession = Depends(get_db), user=Depends(require_permission("images:create"))):
    image = Image(**data.model_dump())
    db.add(image)
    await db.commit()
    await db.refresh(image)
    return image


@router.delete("/{id}")
async def delete_image(id: int, db: AsyncSession = Depends(get_db), user=Depends(require_permission("images:delete"))):
    result = await db.execute(select(Image).where(Image.id == id))
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    await db.delete(image)
    await db.commit()
    return {"success": True}
