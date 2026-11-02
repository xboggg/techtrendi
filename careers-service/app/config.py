"""Configuration from environment variables only. No secrets have defaults."""
from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="CAREERS_", env_file=None, extra="ignore")

    env: str = "development"
    database_url: str = Field(default="", description="API role connection string")
    worker_database_url: str = Field(default="", description="Worker role connection string")
    migrator_database_url: str = Field(default="", description="Migrator role connection string")

    jwt_secret: str = ""
    jwks_url: str = ""
    jwt_audience: str = "authenticated"
    jwt_issuer: str = ""

    bind_host: str = "127.0.0.1"
    bind_port: int = 0
    log_level: str = "INFO"

    api_prefix: str = "/api/careers/v1"
    max_page_size: int = 50

    @property
    def auth_configured(self) -> bool:
        return bool(self.jwt_secret or self.jwks_url)


@lru_cache
def get_settings() -> Settings:
    return Settings()
