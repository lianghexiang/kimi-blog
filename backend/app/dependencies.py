from fastapi import Request, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User
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

    result = await db.execute(select(User).where(User.union_id == payload["union_id"]))
    user = result.scalar_one_or_none()
    return user


def require_auth(user: User | None = Depends(get_current_user)) -> User:
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return user


def require_admin(user: User = Depends(require_auth)) -> User:
    if user.role.value != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    return user
