from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    secret_key: str = "returnshield-secret-key-competition-2026-very-secure"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480
    database_url: str = "sqlite:///./returnshield.db"

    class Config:
        env_file = ".env"


settings = Settings()
