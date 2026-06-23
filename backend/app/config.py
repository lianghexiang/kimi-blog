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

    # ── MinIO 对象存储 ──
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = ""
    minio_secret_key: str = ""
    minio_bucket: str = "blog-uploads"
    minio_secure: bool = False
    # 自定义公网访问地址，为空时自动生成 http(s)://endpoint/bucket/object
    minio_public_url: str = ""


settings = Settings()
