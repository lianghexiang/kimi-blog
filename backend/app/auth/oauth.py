import base64
from fastapi import Request
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.database import _get_session_local
from app.models import User, UserRole
from app.auth.session import sign_session
import httpx

TOKEN_URL = f"{settings.kimi_auth_url}/api/oauth/token"
JWKS_URL = f"{settings.kimi_auth_url}/api/.well-known/jwks.json"
PROFILE_URL = f"{settings.kimi_open_url}/v1/users/me/profile"


def is_localhost(request: Request) -> bool:
    host = request.headers.get("host", "")
    return host.startswith("localhost:") or host.startswith("127.0.0.1:")


def get_cookie_opts(request: Request):
    localhost = is_localhost(request)
    return {
        "httponly": True,
        "path": "/",
        "samesite": "Lax" if localhost else "None",
        "secure": not localhost,
        "max_age": 365 * 24 * 60 * 60,
    }


async def exchange_auth_code(code: str, redirect_uri: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": settings.app_id,
                "redirect_uri": redirect_uri,
                "client_secret": settings.app_secret,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
    if resp.status_code != 200:
        raise RuntimeError(f"Token exchange failed ({resp.status_code}): {resp.text}")
    return resp.json()


async def verify_access_token(access_token: str) -> dict:
    from jose.jwt import get_unverified_header
    from jose import jwt as jose_jwt
    import json

    async with httpx.AsyncClient() as client:
        jwks_resp = await client.get(JWKS_URL)
    jwks = jwks_resp.json()

    header = get_unverified_header(access_token)
    kid = header.get("kid")

    key = None
    for k in jwks.get("keys", []):
        if k.get("kid") == kid:
            key = k
            break

    if not key:
        raise RuntimeError("Matching JWKS key not found")

    from jose.backends import RSAKey
    rsa_key = RSAKey(key, algorithm=header.get("alg", "RS256"))
    payload = jose_jwt.decode(access_token, rsa_key, algorithms=[header.get("alg", "RS256")])

    user_id = payload.get("user_id")
    client_id = payload.get("client_id")
    if not user_id:
        raise RuntimeError("user_id missing from access token")
    return {"user_id": user_id, "client_id": client_id}


async def get_user_profile(access_token: str) -> dict | None:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            PROFILE_URL,
            headers={
                "Accept": "application/json",
                "Authorization": f"Bearer {access_token}",
            },
        )
    if resp.status_code != 200:
        return None
    return resp.json()


async def upsert_user(union_id: str, name: str | None, avatar: str | None) -> User:
    async with _get_session_local()() as db:
        result = await db.execute(select(User).where(User.union_id == union_id))
        user = result.scalar_one_or_none()

        role = UserRole.admin if union_id == settings.owner_union_id else UserRole.user

        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)

        if user:
            user.name = name
            user.avatar = avatar
            user.last_sign_in_at = now
            if user.role != UserRole.admin and union_id == settings.owner_union_id:
                user.role = UserRole.admin
            await db.commit()
            await db.refresh(user)
            return user
        else:
            new_user = User(
                union_id=union_id,
                name=name,
                avatar=avatar,
                role=role,
                last_sign_in_at=now,
            )
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            return new_user


async def oauth_callback(request: Request):
    code = request.query_params.get("code")
    state = request.query_params.get("state")
    error = request.query_params.get("error")
    error_description = request.query_params.get("error_description")

    if error:
        if error == "access_denied":
            return RedirectResponse(url="/", status_code=302)
        return JSONResponse(
            status_code=400,
            content={"error": error, "error_description": error_description},
        )

    if not code or not state:
        return JSONResponse(status_code=400, content={"error": "code and state are required"})

    try:
        redirect_uri = base64.b64decode(state).decode("utf-8")
    except Exception:
        return JSONResponse(status_code=400, content={"error": "invalid state"})

    try:
        token_resp = await exchange_auth_code(code, redirect_uri)
        access_token = token_resp.get("access_token")

        token_claims = await verify_access_token(access_token)
        user_id = token_claims["user_id"]
        client_id = token_claims["client_id"]

        profile = await get_user_profile(access_token)
        if not profile:
            raise RuntimeError("Failed to fetch user profile from Kimi Open")

        await upsert_user(user_id, profile.get("name"), profile.get("avatar_url"))

        session_token = sign_session({"union_id": user_id, "client_id": client_id})

        cookie_opts = get_cookie_opts(request)
        response = RedirectResponse(url="/", status_code=302)
        response.set_cookie("kimi_sid", session_token, **cookie_opts)
        return response

    except Exception as e:
        print("[OAuth] Callback failed", e)
        return JSONResponse(status_code=500, content={"error": "OAuth callback failed"})
