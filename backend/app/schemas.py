from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from app.models import PostType, PostStatus


def to_camel(string: str) -> str:
    parts = string.split("_")
    return parts[0] + "".join(word.capitalize() for word in parts[1:])


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


# ─── Permission ───
class PermissionResponse(CamelModel):
    id: int
    name: str
    resource: str
    action: str
    description: Optional[str] = None


# ─── Role ───
class RoleResponse(CamelModel):
    id: int
    name: str
    description: Optional[str] = None
    permissions: List[PermissionResponse] = []


class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    permission_ids: Optional[List[int]] = None


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permission_ids: Optional[List[int]] = None


# ─── User ───
class UserResponse(CamelModel):
    id: int
    username: str
    name: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None
    is_active: bool = True
    roles: List[RoleResponse] = []
    created_at: datetime
    updated_at: datetime
    last_sign_in_at: datetime


class RegisterRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    name: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    name: Optional[str] = None
    is_active: bool = True
    role_ids: Optional[List[int]] = None


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    avatar: Optional[str] = None
    is_active: Optional[bool] = None
    role_ids: Optional[List[int]] = None


# ─── Tag ───
class TagResponse(CamelModel):
    id: int
    name: str
    color: str = "#3B82F6"


class TagCreate(BaseModel):
    name: str
    color: str = "#3B82F6"


# ─── Post ───
class PostResponse(CamelModel):
    id: int
    title: str
    content: str
    type: PostType
    slug: str
    cover_image: Optional[str] = None
    status: PostStatus
    created_at: datetime
    updated_at: datetime
    tags: List[TagResponse] = []


class PostListParams(BaseModel):
    type: Optional[PostType] = None
    status: Optional[PostStatus] = None
    limit: int = 20
    offset: int = 0


class PostCreate(BaseModel):
    title: str
    content: str
    type: PostType
    slug: str
    cover_image: Optional[str] = None
    status: PostStatus = PostStatus.published
    tag_ids: Optional[List[int]] = None


class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    type: Optional[PostType] = None
    slug: Optional[str] = None
    cover_image: Optional[str] = None
    status: Optional[PostStatus] = None
    tag_ids: Optional[List[int]] = None


# ─── Image ───
class ImageResponse(CamelModel):
    id: int
    title: str
    description: Optional[str] = None
    url: str
    album: Optional[str] = None
    sort_order: int = 0
    created_at: datetime


class ImageCreate(BaseModel):
    title: str
    description: Optional[str] = None
    url: str
    album: Optional[str] = None


class ImageListParams(BaseModel):
    album: Optional[str] = None


# ─── Contact ───
class ContactResponse(CamelModel):
    id: int
    name: str
    email: str
    message: str
    created_at: datetime


class ContactCreate(BaseModel):
    name: str
    email: str
    message: str


# ─── Auth ───
class LogoutResponse(BaseModel):
    success: bool


class PingResponse(BaseModel):
    ok: bool
    ts: int
