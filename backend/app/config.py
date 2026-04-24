from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_secret: str
    database_url: str
    admin_username: str = "admin"
    admin_password: str = "admin123"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
