from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_id: str
    app_secret: str
    database_url: str
    kimi_auth_url: str = "https://kimi-auth.example.com"
    kimi_open_url: str = "https://kimi-open.example.com"
    owner_union_id: str = ""

    class Config:
        env_file = "../app/.env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
