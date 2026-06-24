from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc
from typing import Optional, List
import uuid
from app.database import get_db
from app.dependencies import require_permission
from app.models import AboutCarousel
from app.schemas import (
    AboutCarouselResponse,
    AboutCarouselCreate,
    AboutCarouselUpdate,
    AboutCarouselReorderRequest,
)
from app.storage import put_object, remove_object, object_name_from_url

router = APIRouter(prefix="/about-carousel")

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024


def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@router.get("", response_model=list[AboutCarouselResponse])
async def list_carousel(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AboutCarousel).order_by(asc(AboutCarousel.sort_order)))
    return result.scalars().all()


@router.post("", response_model=AboutCarouselResponse, status_code=status.HTTP_201_CREATED)
async def create_carousel(
    data: AboutCarouselCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission("about_carousel:create")),
):
    # 自动放到末尾
    if data.sort_order is None:
        result = await db.execute(select(AboutCarousel).order_by(asc(AboutCarousel.sort_order)))
        items = result.scalars().all()
        data.sort_order = len(items)

    item = AboutCarousel(**data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.post("/upload", response_model=AboutCarouselResponse, status_code=status.HTTP_201_CREATED)
async def upload_carousel_image(
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission("about_carousel:create")),
):
    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="只支持 JPG、PNG、WEBP、GIF 格式的图片")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="文件大小不能超过 5MB")

    ext = file.filename.rsplit('.', 1)[1].lower()
    unique_filename = f"about-carousel/{uuid.uuid4()}.{ext}"
    content_type = file.content_type or "application/octet-stream"
    image_url = put_object(unique_filename, contents, content_type)

    result = await db.execute(select(AboutCarousel).order_by(asc(AboutCarousel.sort_order)))
    sort_order = len(result.scalars().all())

    item = AboutCarousel(image_url=image_url, caption=caption, sort_order=sort_order)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.put("/{id}", response_model=AboutCarouselResponse)
async def update_carousel(
    id: int,
    data: AboutCarouselUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission("about_carousel:update")),
):
    result = await db.execute(select(AboutCarousel).where(AboutCarousel.id == id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Carousel item not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)

    await db.commit()
    await db.refresh(item)
    return item


@router.put("/reorder", response_model=list[AboutCarouselResponse])
async def reorder_carousel(
    data: AboutCarouselReorderRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission("about_carousel:update")),
):
    for item_data in data.items:
        result = await db.execute(select(AboutCarousel).where(AboutCarousel.id == item_data.id))
        item = result.scalar_one_or_none()
        if item:
            item.sort_order = item_data.sort_order
    await db.commit()

    result = await db.execute(select(AboutCarousel).order_by(asc(AboutCarousel.sort_order)))
    return result.scalars().all()


@router.delete("/{id}")
async def delete_carousel(
    id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission("about_carousel:delete")),
):
    result = await db.execute(select(AboutCarousel).where(AboutCarousel.id == id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Carousel item not found")

    object_name = object_name_from_url(item.image_url)
    if object_name:
        remove_object(object_name)

    await db.delete(item)
    await db.commit()
    return {"success": True}
