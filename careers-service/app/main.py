"""FastAPI application: TechTrendi Careers API.

Endpoints (prefix /api/careers/v1):
  GET /health   — process is up; no database, no secrets
  GET /ready    — database answers through the API role
  GET /jobs     — published jobs (careers.public_jobs only), newest first, numbered pages, filters
  GET /me       — proves JWT verification works; returns the caller's id only
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Query, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from .auth import CurrentUser, require_user
from .config import get_settings
from .db import close_pool, connection, ready_check
from .errors import ApiError
from .errors import install as install_errors

VERSION = "0.3.0"


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
    company: str
    company_logo_url: str | None
    summary: str | None
    apply_url: str                       # always the source's own page (source rules)
    source_url: str | None
    source_name: str | None              # credit line shown on every card
    source_home: str | None
    attribution: str | None
    work_mode: str
    employment_type: str | None
    location: str | None
    salary: str | None
    posted_at: str | None
    closes_at: str | None                # None when the date is only our estimate (feeds without one)
    open_to: list[str]                   # countries with explicit evidence: "GH", "NG"
    open_evidence: dict[str, str]        # per country, why we say it is open ("listed: Ghana")
    field: str                           # area of work (FIELDS), from categories then title
    job_type: str | None                 # JOB_TYPES, from the source's employment type
    level: str                           # LEVELS, from the title's own words
    categories: list[str]


class JobPage(BaseModel):
    items: list[JobSummary]
    total: int
    page: int
    pages: int
    freshness_note: str


FRESHNESS = "Every job shows where it came from. Apply on the source's own page. Lists are re-checked several times a day."

# Filter values, as computed by careers.job_field / job_type / job_level (migration 007).
FIELDS = ("tech", "data", "sales", "marketing", "support", "design", "finance", "hr", "ops", "writing", "education", "other")
JOB_TYPES = ("full_time", "part_time", "contract", "internship")
LEVELS = ("entry", "mid", "senior")
POSTED = {"day": "1 day", "week": "7 days", "month": "30 days"}
MAX_PAGE = 500

LIST_SQL = """
SELECT id, title, company_name, company_logo_url, summary, apply_url, source_url, source_name, source_home,
       attribution_text, work_mode, employment_type, location_text, salary_text, posted_at, valid_through, open_to,
       open_evidence, field, job_type, level, categories, closes_estimated
  FROM careers.public_jobs
 WHERE {where}
 ORDER BY posted_at DESC NULLS LAST, id DESC
 LIMIT %(limit)s OFFSET %(offset)s
"""
COUNT_SQL = "SELECT count(*) AS n FROM careers.public_jobs WHERE {where}"


def _choices(name: str, raw: str | None, allowed: tuple[str, ...]) -> list[str]:
    """Comma list of known values ("tech,data"); anything else is a 422 with the standard body."""
    if not raw:
        return []
    picked = [v.strip().lower() for v in raw.split(",") if v.strip()]
    if not picked or any(v not in allowed for v in picked):
        raise ApiError(422, "validation_error", "Request is invalid", {name: f"use: {', '.join(allowed)}"})
    return sorted(set(picked))


# "Jobs in Ghana / in Nigeria": the job's own location names a place there.
# Same places as workers/collect/eligibility.py PLACES (keep the two lists in step).
PLACES = {
    "GH": r"\m(ghana|accra|kumasi|tema|takoradi|tamale|cape coast)\M",
    "NG": r"\m(nigeria|lagos|abuja|port harcourt|ibadan|kano|warri|benin city|enugu)\M",
}


def _like(q: str) -> str:
    return "%" + q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"


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
    response: Response,
    q: str | None = Query(default=None, max_length=200),
    country: str | None = Query(default=None, min_length=2, max_length=2, pattern="^[A-Za-z]{2}$"),
    work_mode: str | None = Query(default=None, pattern="^(remote|hybrid|onsite)$"),
    located: str | None = Query(default=None, pattern="^(GH|NG|gh|ng)$"),
    field: str | None = Query(default=None, max_length=120),
    job_type: str | None = Query(default=None, max_length=60),
    level: str | None = Query(default=None, max_length=40),
    pay: bool = Query(default=False),
    posted: str | None = Query(default=None, pattern="^(day|week|month)$"),
    limit: int = Query(default=20, ge=1, le=settings.max_page_size),
    page: int = Query(default=1, ge=1, le=MAX_PAGE),
) -> JobPage:
    where, params = ["true"], {"limit": limit, "offset": (page - 1) * limit}
    if country:
        where.append("%(country)s = ANY(open_to)")
        params["country"] = country.upper()
    if located:
        where.append("location_text ~* %(place)s AND work_mode <> 'remote'")
        params["place"] = PLACES[located.upper()]
    if work_mode:
        where.append("work_mode = %(work_mode)s")
        params["work_mode"] = work_mode
    if q and q.strip():
        where.append("(title ILIKE %(q)s OR company_name ILIKE %(q)s OR location_text ILIKE %(q)s)")
        params["q"] = _like(q.strip())
    for name, raw, allowed in (("field", field, FIELDS), ("job_type", job_type, JOB_TYPES), ("level", level, LEVELS)):
        picked = _choices(name, raw, allowed)
        if picked:
            where.append(f"{name} = ANY(%({name})s)")       # name is one of the three literals above
            params[name] = picked
    if pay:
        where.append("salary_text IS NOT NULL")
    if posted:
        where.append("posted_at >= now() - %(posted)s::interval")
        params["posted"] = POSTED[posted]
    sql_where = " AND ".join(where)

    with connection() as conn, conn.cursor() as cur:
        cur.execute(LIST_SQL.format(where=sql_where), params)
        rows = cur.fetchall()
        cur.execute(COUNT_SQL.format(where=sql_where), params)
        total = cur.fetchone()["n"]
        conn.rollback()      # read-only; nothing to keep

    items = [JobSummary(
        id=str(r["id"]), title=r["title"], company=r["company_name"], company_logo_url=r["company_logo_url"],
        summary=r["summary"], apply_url=r["apply_url"], source_url=r["source_url"], source_name=r["source_name"],
        source_home=r["source_home"], attribution=r["attribution_text"], work_mode=r["work_mode"],
        employment_type=r["employment_type"], location=r["location_text"], salary=r["salary_text"],
        posted_at=r["posted_at"].isoformat() if r["posted_at"] else None,
        closes_at=r["valid_through"].isoformat() if r["valid_through"] and not r["closes_estimated"] else None,
        open_to=list(r["open_to"] or []), open_evidence=dict(r["open_evidence"] or {}),
        field=r["field"], job_type=r["job_type"], level=r["level"], categories=list(r["categories"] or [])[:3],
    ) for r in rows]
    # Public, identical for everyone: let nginx/Cloudflare and browsers keep it for a few minutes.
    response.headers["Cache-Control"] = "public, max-age=300"
    response.headers["X-Robots-Tag"] = "noindex"
    return JobPage(items=items, total=total, page=page, pages=max(1, -(-total // limit)), freshness_note=FRESHNESS)


@app.get(f"{settings.api_prefix}/me", tags=["account"])
def me(user: CurrentUser = Depends(require_user)) -> dict:
    return {"id": user.id, "role": user.role}
