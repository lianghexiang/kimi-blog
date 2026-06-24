import logging
from sqlalchemy import insert, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.database import async_session_maker
from app.models import Role, Permission, User, SiteConfig, role_permissions
from app.auth.password import hash_password

logger = logging.getLogger(__name__)

DEFAULT_PERMISSIONS = [
    {"name": "users:read", "resource": "users", "action": "read", "description": "查看用户列表"},
    {"name": "users:create", "resource": "users", "action": "create", "description": "创建用户"},
    {"name": "users:update", "resource": "users", "action": "update", "description": "更新用户信息"},
    {"name": "users:delete", "resource": "users", "action": "delete", "description": "删除用户"},
    {"name": "roles:read", "resource": "roles", "action": "read", "description": "查看角色列表"},
    {"name": "roles:create", "resource": "roles", "action": "create", "description": "创建角色"},
    {"name": "roles:update", "resource": "roles", "action": "update", "description": "更新角色"},
    {"name": "roles:delete", "resource": "roles", "action": "delete", "description": "删除角色"},
    {"name": "posts:create", "resource": "posts", "action": "create", "description": "创建文章"},
    {"name": "posts:update", "resource": "posts", "action": "update", "description": "更新文章"},
    {"name": "posts:delete", "resource": "posts", "action": "delete", "description": "删除文章"},
    {"name": "images:create", "resource": "images", "action": "create", "description": "上传图片"},
    {"name": "images:delete", "resource": "images", "action": "delete", "description": "删除图片"},
    {"name": "tags:create", "resource": "tags", "action": "create", "description": "创建标签"},
    {"name": "contacts:read", "resource": "contacts", "action": "read", "description": "查看留言"},
    {"name": "site_configs:update", "resource": "site_configs", "action": "update", "description": "更新站点配置"},
    {"name": "about_carousel:create", "resource": "about_carousel", "action": "create", "description": "添加关于页轮播图"},
    {"name": "about_carousel:update", "resource": "about_carousel", "action": "update", "description": "编辑关于页轮播图"},
    {"name": "about_carousel:delete", "resource": "about_carousel", "action": "delete", "description": "删除关于页轮播图"},
]

DEFAULT_ROLES = [
    {"name": "admin", "description": "超级管理员，拥有所有权限"},
    {"name": "user", "description": "普通用户"},
]


DEFAULT_SITE_CONFIGS = {
    "hero_badge_text": "欢迎来到我的小世界",
    "hero_title_prefix": "Hey!",
    "hero_title_suffix": "你好呀",
    "hero_subtitle": "我是小桃，我在这里记录那些被风吹过的日常。无论是路边的一朵野花，还是深夜的一段旋律，都值得被记录下来。",
    "hero_button_text": "开始逛逛",
    "hero_avatar_url": "/avatar-girl.png",
    "hero_bg_image_url": None,
}


async def ensure_defaults():
    async with async_session_maker() as db:
        await _ensure_permissions(db)
        await _ensure_roles(db)
        await _ensure_site_configs(db)
        await _ensure_admin_user(db)
        await db.commit()
        logger.info("Seed data ensured.")


async def _ensure_permissions(db: AsyncSession):
    for perm_data in DEFAULT_PERMISSIONS:
        result = await db.execute(select(Permission).where(Permission.name == perm_data["name"]))
        existing = result.scalar_one_or_none()
        if not existing:
            perm = Permission(**perm_data)
            db.add(perm)
            logger.info(f"Created permission: {perm_data['name']}")


async def _ensure_roles(db: AsyncSession):
    # Fetch all permissions for admin role
    result = await db.execute(select(Permission))
    all_permissions = result.scalars().all()

    for role_data in DEFAULT_ROLES:
        result = await db.execute(select(Role).where(Role.name == role_data["name"]))
        role = result.scalar_one_or_none()
        if not role:
            role = Role(name=role_data["name"], description=role_data["description"])
            db.add(role)
            await db.flush()
            logger.info(f"Created role: {role_data['name']}")

        if role_data["name"] == "admin":
            # Avoid async lazy-loading on relationship access during startup.
            current_perm_result = await db.execute(
                select(Permission.name)
                .join(role_permissions, Permission.id == role_permissions.c.permission_id)
                .where(role_permissions.c.role_id == role.id)
            )
            current_perm_names = set(current_perm_result.scalars().all())
            for perm in all_permissions:
                if perm.name not in current_perm_names:
                    await db.execute(
                        insert(role_permissions).values(
                            role_id=role.id,
                            permission_id=perm.id,
                        )
                    )
                    logger.info(f"Granted {perm.name} to admin")


async def _ensure_site_configs(db: AsyncSession):
    for key, value in DEFAULT_SITE_CONFIGS.items():
        result = await db.execute(select(SiteConfig).where(SiteConfig.key == key))
        existing = result.scalar_one_or_none()
        if not existing:
            db.add(SiteConfig(key=key, value=value))
            logger.info(f"Created site config: {key}")


async def _ensure_admin_user(db: AsyncSession):
    result = await db.execute(select(User).where(User.username == "admin"))
    existing = result.scalar_one_or_none()
    if existing:
        return

    # Get admin role
    result = await db.execute(select(Role).where(Role.name == "admin").options(selectinload(Role.users)))
    admin_role = result.scalar_one_or_none()
    if not admin_role:
        logger.warning("Admin role not found, skipping default admin user creation")
        return

    admin = User(
        username="admin",
        email="admin@example.com",
        password_hash=hash_password("admin123"),
        name="管理员",
        is_active=True,
    )
    admin.roles.append(admin_role)
    db.add(admin)
    logger.info("Created default admin user (admin / admin123)")
