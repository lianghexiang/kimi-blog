from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.dialects.mysql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import require_permission
from app.models import SiteConfig
from app.schemas import SiteConfigResponse, SiteConfigUpdateRequest

router = APIRouter(prefix="/site-configs")

DEFAULT_CONFIGS: dict[str, Optional[str]] = {
    "hero_badge_text": "欢迎来到我的小世界",
    "hero_title_prefix": "Hey!",
    "hero_title_suffix": "你好呀",
    "hero_subtitle": "我是小桃，我在这里记录那些被风吹过的日常。无论是路边的一朵野花，还是深夜的一段旋律，都值得被记录下来。",
    "hero_button_text": "开始逛逛",
    "hero_avatar_url": "/avatar-girl.png",
    "hero_bg_image_url": None,
    "hero_title_prefix_color": "#3B82F6",
    "hero_title_suffix_color": "#111827",
    "hero_subtitle_color": "#4B5563",
    "hero_badge_color": "#1D4ED8",
    "hero_font_family": "",
    "music_playlist": '{"enabled":false,"tracks":[]}',
}


@router.get("", response_model=list[SiteConfigResponse])
async def list_configs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SiteConfig))
    rows = result.scalars().all()

    existing_keys = {row.key for row in rows}
    missing_keys = set(DEFAULT_CONFIGS.keys()) - existing_keys

    if missing_keys:
        for key in missing_keys:
            db.add(SiteConfig(key=key, value=DEFAULT_CONFIGS[key]))
        await db.commit()
        result = await db.execute(select(SiteConfig))
        rows = result.scalars().all()

    return rows


@router.put("", response_model=list[SiteConfigResponse])
async def update_configs(
    data: SiteConfigUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission("site_configs:update")),
):
    for key, value in data.configs.items():
        stmt = (
            insert(SiteConfig)
            .values(key=key, value=value)
            .on_duplicate_key_update(value=value)
        )
        await db.execute(stmt)

    await db.commit()

    result = await db.execute(select(SiteConfig))
    return result.scalars().all()
