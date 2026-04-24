import asyncio
from sqlalchemy import select
from app.database import _get_session_local
from app.models import Role, Permission, User
from app.auth.password import hash_password
from app.config import settings

PERMISSIONS_DATA = [
    # posts
    {"name": "posts:read", "resource": "posts", "action": "read", "description": "浏览文章"},
    {"name": "posts:create", "resource": "posts", "action": "create", "description": "创建文章"},
    {"name": "posts:update", "resource": "posts", "action": "update", "description": "更新文章"},
    {"name": "posts:delete", "resource": "posts", "action": "delete", "description": "删除文章"},
    # images
    {"name": "images:read", "resource": "images", "action": "read", "description": "浏览图片"},
    {"name": "images:create", "resource": "images", "action": "create", "description": "上传图片"},
    {"name": "images:delete", "resource": "images", "action": "delete", "description": "删除图片"},
    # tags
    {"name": "tags:read", "resource": "tags", "action": "read", "description": "浏览标签"},
    {"name": "tags:create", "resource": "tags", "action": "create", "description": "创建标签"},
    {"name": "tags:delete", "resource": "tags", "action": "delete", "description": "删除标签"},
    # contacts
    {"name": "contacts:read", "resource": "contacts", "action": "read", "description": "查看留言"},
    {"name": "contacts:delete", "resource": "contacts", "action": "delete", "description": "删除留言"},
    # users
    {"name": "users:read", "resource": "users", "action": "read", "description": "查看用户"},
    {"name": "users:create", "resource": "users", "action": "create", "description": "创建用户"},
    {"name": "users:update", "resource": "users", "action": "update", "description": "更新用户"},
    {"name": "users:delete", "resource": "users", "action": "delete", "description": "删除用户"},
    # roles
    {"name": "roles:read", "resource": "roles", "action": "read", "description": "查看角色"},
    {"name": "roles:create", "resource": "roles", "action": "create", "description": "创建角色"},
    {"name": "roles:update", "resource": "roles", "action": "update", "description": "更新角色"},
    {"name": "roles:delete", "resource": "roles", "action": "delete", "description": "删除角色"},
]

ROLE_PERMISSIONS_MAP = {
    "admin": [p["name"] for p in PERMISSIONS_DATA],
    "editor": [
        "posts:read", "posts:create", "posts:update", "posts:delete",
        "images:read", "images:create", "images:delete",
        "tags:read", "tags:create", "tags:delete",
        "contacts:read",
    ],
    "user": [
        "posts:read", "images:read", "tags:read",
    ],
}


async def seed():
    async with _get_session_local()() as db:
        # 1. Create permissions
        perm_map = {}
        for pdata in PERMISSIONS_DATA:
            result = await db.execute(select(Permission).where(Permission.name == pdata["name"]))
            perm = result.scalar_one_or_none()
            if not perm:
                perm = Permission(**pdata)
                db.add(perm)
                await db.commit()
                await db.refresh(perm)
            perm_map[perm.name] = perm

        # 2. Create roles
        role_map = {}
        for role_name in ["admin", "editor", "user"]:
            result = await db.execute(select(Role).where(Role.name == role_name))
            role = result.scalar_one_or_none()
            if not role:
                role = Role(name=role_name)
                db.add(role)
                await db.commit()
                await db.refresh(role)
            role_map[role_name] = role

        # 3. Assign permissions to roles
        for role_name, perm_names in ROLE_PERMISSIONS_MAP.items():
            role = role_map[role_name]
            role.permissions = [perm_map[name] for name in perm_names]
            await db.commit()

        # 4. Create admin user
        result = await db.execute(select(User).where(User.username == settings.admin_username))
        admin = result.scalar_one_or_none()
        if not admin:
            admin = User(
                username=settings.admin_username,
                password_hash=hash_password(settings.admin_password),
                name="管理员",
                email=None,
            )
            db.add(admin)
            await db.commit()
            await db.refresh(admin)
            admin.roles.append(role_map["admin"])
            await db.commit()

        print("Seed completed successfully.")


if __name__ == "__main__":
    asyncio.run(seed())
