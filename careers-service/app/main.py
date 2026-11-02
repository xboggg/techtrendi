"""FastAPI application: TechTrendi Careers API, Phase 1 skeleton.

Endpoints (prefix /api/careers/v1):
  GET /health   — process is up; no database, no secrets
  GET /ready    — database answers through the API role
  GET /jobs     — public job list; empty but correctly shaped until Phase 2
  GET /me       — proves JWT verification works; returns the caller's id only
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from .auth import CurrentUser, require_user
from .config import get_settings
from .db import close_pool, ready_check
from .errors import install as install_errors

VERSION = "0.1.0-phase1"


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logging.basicConfig(level=settings.log_level.upper(), format="%(asctime)s %(levelname)s %(name)s %(message)s")
    yield
    close_pool()


settings = get_settings()
app = FastAPI(
    title="TechTrendi Careers API",
    version=VERSION,
    docs_url=f"{settings.api_prefix}/docs" if settings.env != "production" else None,
    redoc_url=None,
    openapi_url=f"{settings.api_prefix}/openapi.json",
    lifespan=lifespan,
)
install_errors(app)


class JobSummary(BaseModel):
    id: str
    title: str
    organisation: str | None
    work_mode: str | None
    locations: list[str]
    eligibility: dict[str, str]          # country code -> allowed | excluded | unknown
    source_name: str
    source_url: str
    first_seen: str
    last_verified: str | None
    closes_at: str | None


class JobPage(BaseModel):
    items: list[JobSummary]
    next_cursor: str | None
    freshness_note: str


@app.get(f"{settings.api_prefix}/health", tags=["ops"])
def health() -> dict:
    return {"status": "ok", "version": VERSION, "env": settings.env}


@app.get(f"{settings.api_prefix}/ready", tags=["ops"])
def ready():
    if ready_check():
        return {"status": "ready", "database": "ok"}
    return JSONResponse(status_code=503, content={"status": "not_ready", "database": "unavailable"})


@app.get(f"{settings.api_prefix}/jobs", response_model=JobPage, tags=["jobs"])
def list_jobs(
    q: str | None = Query(default=None, max_length=200),
    country: str | None = Query(default=None, min_length=2, max_length=2, pattern="^[A-Za-z]{2}$"),
    work_mode: str | None = Query(default=None, pattern="^(remote|hybrid|onsite)$"),
    limit: int = Query(default=20, ge=1, le=settings.max_page_size),
    cursor: str | None = Query(default=None, max_length=200),
) -> JobPage:
    # Phase 1: no jobs exist and no source is active. The shape is final; the
    # query arrives in Phase 2 together with the jobs tables.
    return JobPage(items=[], next_cursor=None,
                   freshness_note="No approved sources are active yet. Listings will show their source and last-verified time.")


@app.get(f"{settings.api_prefix}/me", tags=["account"])
def me(user: CurrentUser = Depends(require_user)) -> dict:
    return {"id": user.id, "role": user.role}
