from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.dependencies import require_auth, require_permission
from app.models import User, Role
from app.schemas import UserResponse, UserCreate, UserUpdate
from app.auth.password import hash_password

router = APIRouter(prefix="/users")


def _is_admin(user: User) -> bool:
    return any(r.name == "admin" for r in user.roles)


@router.get("", response_model=list[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission("users:read")),
):
    result = await db.execute(select(User))
    return result.scalars().all()


@router.get("/{id}", response_model=UserResponse)
async def get_user(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_auth),
):
    result = await db.execute(select(User).where(User.id == id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="用户不存在")

    if not _is_admin(current_user) and current_user.id != id:
        raise HTTPException(status_code=403, detail="无权访问")

    return target


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission("users:create")),
):
    result = await db.execute(select(User).where(User.username == data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="用户名已被使用")

    new_user = User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
        name=data.name or data.username,
        is_active=data.is_active,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    if data.role_ids:
        roles_result = await db.execute(select(Role).where(Role.id.in_(data.role_ids)))
        roles = roles_result.scalars().all()
        new_user.roles.extend(roles)
        await db.commit()

    return new_user


@router.put("/{id}", response_model=UserResponse)
async def update_user(
    id: int,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_auth),
):
    result = await db.execute(select(User).where(User.id == id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="用户不存在")

    is_admin = _is_admin(current_user)
    if not is_admin and current_user.id != id:
        raise HTTPException(status_code=403, detail="无权修改")

    update_data = data.model_dump(exclude_unset=True, exclude={"role_ids"})
    for key, value in update_data.items():
        setattr(target, key, value)

    if data.role_ids is not None and is_admin:
        roles_result = await db.execute(select(Role).where(Role.id.in_(data.role_ids)))
        roles = roles_result.scalars().all()
        target.roles = list(roles)

    await db.commit()
    await db.refresh(target)
    return target


@router.delete("/{id}")
async def delete_user(
    id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission("users:delete")),
):
    result = await db.execute(select(User).where(User.id == id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="用户不存在")

    await db.delete(target)
    await db.commit()
    return {"success": True}
