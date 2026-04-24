from sqlalchemy import Column, Integer, String, Text, Enum, DateTime, ForeignKey, Table
from sqlalchemy.sql import func
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"


class PostType(str, enum.Enum):
    blog = "blog"
    journal = "journal"
    thought = "thought"


class PostStatus(str, enum.Enum):
    published = "published"
    draft = "draft"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    union_id = Column("unionId", String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=True)
    email = Column(String(320), nullable=True)
    avatar = Column(Text, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.user, nullable=False)
    created_at = Column("createdAt", DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column("updatedAt", DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_sign_in_at = Column("lastSignInAt", DateTime(timezone=True), server_default=func.now(), nullable=False)


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    type = Column(Enum(PostType), nullable=False)
    slug = Column(String(255), unique=True, nullable=False)
    cover_image = Column("cover_image", String(500), nullable=True)
    status = Column(Enum(PostStatus), default=PostStatus.published, nullable=False)
    created_at = Column("created_at", DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column("updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    url = Column(String(500), nullable=False)
    album = Column(String(100), nullable=True)
    sort_order = Column("sort_order", Integer, default=0, nullable=False)
    created_at = Column("created_at", DateTime(timezone=True), server_default=func.now(), nullable=False)


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)
    color = Column(String(7), default="#3B82F6", nullable=False)


post_tags = Table(
    "post_tags",
    Base.metadata,
    Column("post_id", Integer, ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(320), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column("created_at", DateTime(timezone=True), server_default=func.now(), nullable=False)
