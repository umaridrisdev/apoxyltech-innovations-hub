"""
Central settings for the ApoxylTech Phase 1 API.

All values are read from environment variables (see .env.example at repo
root). Nothing here should ever contain a real secret — this file defines
shape and defaults only.
"""
from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- App ---
    app_name: str = "ApoxylTech Phase 1 API"
    environment: str = Field(default="development")  # development | staging | production
    debug: bool = False

    # --- Database ---
    database_url: str = Field(
        default="postgresql+asyncpg://apoxyltech:apoxyltech@localhost:5432/apoxyltech"
    )

    @field_validator("database_url")
    @classmethod
    def _use_asyncpg_driver(cls, v: str) -> str:
        # Managed hosts (Railway, Render, Heroku-style) commonly inject a
        # plain "postgresql://" or "postgres://" URL, but SQLAlchemy's async
        # engine requires the explicit "+asyncpg" driver suffix. Rewriting
        # it here means we don't have to fight each host's variable UI to
        # produce our exact expected format.
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    # --- Auth / JWT ---
    jwt_secret_key: str = Field(default="change-me-in-env")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30

    # --- Password hashing (Argon2) ---
    argon2_time_cost: int = 3
    argon2_memory_cost: int = 65536  # 64 MB
    argon2_parallelism: int = 2

    # --- Redis (rate limiting; only stood up when needed per MVP spec) ---
    redis_url: str | None = None

    # --- Cloudflare R2 (S3-compatible) ---
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = "apoxyltech-phase1"
    r2_public_url_base: str = ""

    # --- Email (transactional: verification, password reset, lead notifications) ---
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    email_from_address: str = "no-reply@apoxyltech.com"

    # --- Sentry ---
    sentry_dsn: str | None = None

    # --- CORS ---
    cors_allowed_origins: list[str] = ["http://localhost:3000"]

    # --- Leads / NDPR retention ---
    leads_retention_days: int = 365  # adjust to match the data dictionary's NDPR retention note


@lru_cache
def get_settings() -> Settings:
    return Settings()