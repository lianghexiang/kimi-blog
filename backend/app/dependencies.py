from fastapi import Request, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import User, Role
from app.auth.session import verify_session


async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)) -> User | None:
    cookie_header = request.headers.get("cookie", "")
    token = None
    for part in cookie_header.split(";"):
        part = part.strip()
        if part.startswith("kimi_sid="):
            token = part[len("kimi_sid="):]
            break

    if not token:
        return None

    payload = verify_session(token)
    if not payload:
        return None

    result = await db.execute(
        select(User)
        .where(User.id == payload["user_id"])
        .options(selectinload(User.roles).selectinload(Role.permissions))
    )
    user = result.scalar_one_or_none()
    return user


def require_auth(user: User | None = Depends(get_current_user)) -> User:
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="请先登录")
    return user


def require_permission(permission_name: str):
    def checker(user: User = Depends(require_auth)) -> User:
        for role in user.roles:
            for perm in role.permissions:
                if perm.name == permission_name:
                    return user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"缺少权限: {permission_name}",
        )
    return checker


def require_role(role_name: str):
    def checker(user: User = Depends(require_auth)) -> User:
        for role in user.roles:
            if role.name == role_name:
                return user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"需要角色: {role_name}",
        )
    return checker
