from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, distinct
from typing import Optional, List
import uuid
from app.database import get_db
from app.dependencies import require_permission
from app.models import Image
from app.schemas import ImageResponse, ImageCreate
from app.storage import put_object, remove_object, object_name_from_url

router = APIRouter(prefix="/images")

# 允许的图片类型
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}
# 文件大小限制（5MB）
MAX_FILE_SIZE = 5 * 1024 * 1024


def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@router.get("", response_model=list[ImageResponse])
async def list_images(album: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(Image).order_by(desc(Image.created_at))
    if album:
        query = query.where(Image.album == album)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/albums", response_model=List[str])
async def get_albums(db: AsyncSession = Depends(get_db)):
    """获取所有相册分类"""
    query = select(distinct(Image.album)).where(Image.album.isnot(None))
    result = await db.execute(query)
    albums = [album for album, in result.all() if album]
    return albums


@router.post("/upload", response_model=ImageResponse, status_code=status.HTTP_201_CREATED)
async def upload_image(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    album: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission("images:create"))
):
    """上传图片到 MinIO"""
    # 验证文件类型
    if not allowed_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail="只支持 JPG、PNG、WEBP、GIF 格式的图片"
        )

    # 验证文件大小
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="文件大小不能超过 5MB"
        )

    # 生成唯一文件名并上传 MinIO
    ext = file.filename.rsplit('.', 1)[1].lower()
    unique_filename = f"images/{uuid.uuid4()}.{ext}"
    content_type = file.content_type or "application/octet-stream"
    file_url = put_object(unique_filename, contents, content_type)

    # 创建图片记录
    image = Image(
        title=title,
        description=description,
        url=file_url,
        album=album
    )
    db.add(image)
    await db.commit()
    await db.refresh(image)
    return image


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

    # 从 MinIO 删除对象
    object_name = object_name_from_url(image.url)
    if object_name:
        remove_object(object_name)

    await db.delete(image)
    await db.commit()
    return {"success": True}
