from typing import Optional
from fastapi import APIRouter, Request, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.dependencies import get_current_user
from app.schemas import UserResponse, LogoutResponse, RegisterRequest, LoginRequest
from app.models import User, Role
from app.auth.password import hash_password, verify_password
from app.auth.session import sign_session

router = APIRouter(prefix="/auth")


def get_cookie_opts(request: Request):
    is_local = request.url.hostname in ("localhost", "127.0.0.1")
    is_https = request.url.scheme == "https"
    return {
        "httponly": True,
        "path": "/",
        "max_age": 365 * 24 * 60 * 60,
        "secure": is_https,
        "samesite": "Lax",
    }


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="用户名已被使用")

    if data.email:
        result = await db.execute(select(User).where(User.email == data.email))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="邮箱已被注册")

    user = User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
        name=data.name or data.username,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # 分配默认 user 角色
    result = await db.execute(select(Role).where(Role.name == "user"))
    role = result.scalar_one_or_none()
    if role:
        user.roles.append(role)
        await db.commit()
        result = await db.execute(
            select(User)
            .where(User.id == user.id)
            .options(selectinload(User.roles).selectinload(Role.permissions))
        )
        user = result.scalar_one()

    return user


@router.post("/login")
async def login(data: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == data.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="账号已被禁用")

    from datetime import datetime, timezone

    user.last_sign_in_at = datetime.now(timezone.utc)
    await db.commit()

    token = sign_session(user.id)
    cookie_opts = get_cookie_opts(request)
    response = Response(content='{"success":true}', media_type="application/json")
    response.set_cookie("kimi_sid", token, **cookie_opts)
    return response


@router.get("/me", response_model=Optional[UserResponse])
async def me(user: Optional[User] = Depends(get_current_user)):
    return user


@router.post("/logout", response_model=LogoutResponse)
async def logout(request: Request):
    cookie_opts = get_cookie_opts(request)
    response = Response(content='{"success":true}', media_type="application/json")
    response.delete_cookie(
        "kimi_sid",
        path="/",
        httponly=True,
        samesite=cookie_opts.get("samesite", "Lax"),
        secure=cookie_opts.get("secure", False),
    )
    return response
