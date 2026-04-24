from fastapi import APIRouter, Request, Depends, Response
from app.dependencies import require_auth
from app.schemas import UserResponse, LogoutResponse
from app.models import User
from app.auth.oauth import get_cookie_opts

router = APIRouter(prefix="/auth")


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(require_auth)):
    return user


@router.post("/logout", response_model=LogoutResponse)
async def logout(request: Request):
    cookie_opts = get_cookie_opts(request)
    response = Response(content='{"success":true}', media_type="application/json")
    response.delete_cookie("kimi_sid", path="/", httponly=True, samesite=cookie_opts.get("samesite", "Lax"), secure=cookie_opts.get("secure", False))
    return response
