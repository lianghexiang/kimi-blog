from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.dependencies import require_permission
from app.models import Role, Permission
from app.schemas import RoleResponse, RoleCreate, RoleUpdate, PermissionResponse

router = APIRouter(prefix="/roles")


@router.get("", response_model=list[RoleResponse])
async def list_roles(
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission("roles:read")),
):
    result = await db.execute(select(Role))
    return result.scalars().all()


@router.get("/permissions", response_model=list[PermissionResponse])
async def list_permissions(
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission("roles:read")),
):
    result = await db.execute(select(Permission))
    return result.scalars().all()


@router.post("", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    data: RoleCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission("roles:create")),
):
    role = Role(name=data.name, description=data.description)
    db.add(role)
    await db.commit()
    await db.refresh(role)

    if data.permission_ids:
        perms_result = await db.execute(select(Permission).where(Permission.id.in_(data.permission_ids)))
        perms = perms_result.scalars().all()
        role.permissions.extend(perms)
        await db.commit()

    return role


@router.put("/{id}", response_model=RoleResponse)
async def update_role(
    id: int,
    data: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission("roles:update")),
):
    result = await db.execute(select(Role).where(Role.id == id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="角色不存在")

    if data.name is not None:
        role.name = data.name
    if data.description is not None:
        role.description = data.description

    if data.permission_ids is not None:
        perms_result = await db.execute(select(Permission).where(Permission.id.in_(data.permission_ids)))
        perms = perms_result.scalars().all()
        role.permissions = list(perms)

    await db.commit()
    await db.refresh(role)
    return role


@router.delete("/{id}")
async def delete_role(
    id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission("roles:delete")),
):
    result = await db.execute(select(Role).where(Role.id == id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="角色不存在")

    await db.delete(role)
    await db.commit()
    return {"success": True}
