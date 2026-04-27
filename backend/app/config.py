from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── Required ──
    app_secret: str
    database_url: str

    # ── OAuth / Kimi ──
    app_id: str = ""
    kimi_auth_url: str = ""
    kimi_open_url: str = ""

    # ── Admin ──
    admin_username: str = "admin"
    admin_password: str = "admin123"
    owner_union_id: str = ""

    # ── CORS (comma-separated origins) ──
    cors_origins: str = ""


settings = Settings()
