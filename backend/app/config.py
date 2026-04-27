from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_secret: str
    database_url: str
    admin_username: str = "admin"
    admin_password: str = "admin123"


settings = Settings()
