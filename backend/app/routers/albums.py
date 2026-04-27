from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.dependencies import require_permission
from app.models import Album
from app.schemas import AlbumResponse, AlbumCreate

router = APIRouter(prefix="/albums")


@router.get("", response_model=list[AlbumResponse])
async def list_albums(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Album).order_by(Album.created_at.desc()))
    return result.scalars().all()


@router.post("", response_model=AlbumResponse, status_code=status.HTTP_201_CREATED)
async def create_album(
    data: AlbumCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission("images:create")),
):
    result = await db.execute(select(Album).where(Album.name == data.name))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="相册分类已存在")
    album = Album(name=data.name)
    db.add(album)
    await db.commit()
    await db.refresh(album)
    return album


@router.delete("/{id}")
async def delete_album(
    id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission("images:delete")),
):
    result = await db.execute(select(Album).where(Album.id == id))
    album = result.scalar_one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    await db.delete(album)
    await db.commit()
    return {"success": True}
