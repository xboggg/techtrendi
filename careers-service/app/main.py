"""FastAPI application: TechTrendi Careers API.

Endpoints (prefix /api/careers/v1):
  GET /health   — process is up; no database, no secrets
  GET /ready    — database answers through the API role
  GET /jobs     — published jobs (careers.public_jobs only), newest first, numbered pages, filters
  GET /share/{id} — tiny page with the job's title for WhatsApp/Facebook link previews; sends people
                  on to the board (nginx serves it at techtrendi.com/careers/job/{id})
  GET /me       — proves JWT verification works; returns the caller's id only
"""
from __future__ import annotations

import html
import logging
import re
import time
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Query, Response
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel

from .auth import CurrentUser, require_user
from .config import get_settings
from .db import close_pool, connection, ready_check
from .errors import ApiError
from .errors import install as install_errors
from .skills import SKILL_TEXT, SKILLS, job_skills

VERSION = "0.4.0"


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
    skills: list[str]                    # SKILLS keys found in the title or categories


class JobPage(BaseModel):
    items: list[JobSummary]
    total: int
    page: int
    pages: int
    freshness_note: str
    skill_counts: dict[str, int] | None = None   # only with facets=true: jobs per skill, other filters kept


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

# Counts are worked out here from the matching jobs' titles and categories: 23 regexes per row
# in PostgreSQL cost ~0.45 s on staging, in Python a few milliseconds.
FACETS_SQL = "SELECT title, categories FROM careers.public_jobs WHERE {where}"


# Skill counts for the same filters are kept for 5 minutes (as long as browsers keep the answer):
# counting runs the patterns over every matching job (~0.35 s for all ~2,400).
FACETS_TTL = 300
_facets_cache: dict[str, tuple[float, dict[str, int]]] = {}


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


UUID_RE = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")


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
    skill: str | None = Query(default=None, max_length=300),
    ids: str | None = Query(default=None, max_length=50 * 37),
    pay: bool = Query(default=False),
    posted: str | None = Query(default=None, pattern="^(day|week|month)$"),
    facets: bool = Query(default=False),
    limit: int = Query(default=20, ge=1, le=settings.max_page_size),
    page: int = Query(default=1, ge=1, le=MAX_PAGE),
) -> JobPage:
    where, params = ["true"], {"limit": limit, "offset": (page - 1) * limit}
    if ids is not None:
        # Shared links and the reader's saved jobs: up to 50 job ids; closed ones simply don't come back.
        wanted = [v.strip().lower() for v in ids.split(",") if v.strip()]
        if not wanted or len(wanted) > 50 or any(not UUID_RE.fullmatch(v) for v in wanted):
            raise ApiError(422, "validation_error", "Request is invalid", {"ids": "use up to 50 job ids, comma separated"})
        where.append("id = ANY(%(ids)s::uuid[])")
        params["ids"] = wanted
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
    # Skill counts keep every other filter but not the skill one, so the reader sees what each
    # skill would give before tapping it.
    facets_where = " AND ".join(where)
    picked_skills = _choices("skill", skill, tuple(SKILLS))
    if picked_skills:
        where.append(f"{SKILL_TEXT} ~* %(skill_re)s")
        params["skill_re"] = "|".join(f"({SKILLS[k]})" for k in picked_skills)
    sql_where = " AND ".join(where)

    skill_counts = None
    with connection() as conn, conn.cursor() as cur:
        cur.execute(LIST_SQL.format(where=sql_where), params)
        rows = cur.fetchall()
        cur.execute(COUNT_SQL.format(where=sql_where), params)
        total = cur.fetchone()["n"]
        if facets:
            key = facets_where + repr(sorted((k, str(v)) for k, v in params.items() if k not in ("limit", "offset", "skill_re")))
            hit = _facets_cache.get(key)
            if hit and time.monotonic() - hit[0] < FACETS_TTL:
                skill_counts = hit[1]
            else:
                cur.execute(FACETS_SQL.format(where=facets_where), params)
                skill_counts = dict.fromkeys(SKILLS, 0)
                for r in cur.fetchall():
                    for k in job_skills(r["title"], list(r["categories"] or [])):
                        skill_counts[k] += 1
                if len(_facets_cache) >= 500:
                    _facets_cache.clear()
                _facets_cache[key] = (time.monotonic(), skill_counts)
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
        skills=job_skills(r["title"], list(r["categories"] or [])),
    ) for r in rows]
    # Public, identical for everyone: let nginx/Cloudflare and browsers keep it for a few minutes.
    response.headers["Cache-Control"] = "public, max-age=300"
    response.headers["X-Robots-Tag"] = "noindex"
    return JobPage(items=items, total=total, page=page, pages=max(1, -(-total // limit)), freshness_note=FRESHNESS,
                   skill_counts=skill_counts)


SITE = "https://techtrendi.com"
COUNTRY_WORDS = {"GH": "Ghana", "NG": "Nigeria"}
# Plain page (no CSS, no script): crawlers read the tags, people are sent straight to the board.
SHARE_HTML = """<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="robots" content="noindex, follow">
<meta name="description" content="{desc}">
<link rel="canonical" href="{board}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="TechTrendi">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{image}">
<meta http-equiv="refresh" content="0; url={board}">
</head><body>
<p><a href="{board}">See this job on TechTrendi Careers</a></p>
</body></html>
"""


def share_page(job_id: str, row: dict | None) -> str:
    if row:
        title = f"{row['title']} at {row['company_name']} | TechTrendi Jobs"
        where = "Work from home" if row["work_mode"] == "remote" else (row["location_text"] or "")
        open_to = " and ".join(COUNTRY_WORDS[c] for c in (row["open_to"] or []) if c in COUNTRY_WORDS)
        bits = [row["salary_text"] or "", where, f"Open to people in {open_to}" if open_to else ""]
        desc = " · ".join(b for b in bits if b) + ". Free to apply on the employer's own page."
        board = f"{SITE}/careers?job={job_id}"
    else:
        title = "This job is no longer listed | TechTrendi Jobs"
        desc = "See the latest jobs open to people in Ghana and Nigeria."
        board = f"{SITE}/careers"
    e = lambda s: html.escape(s, quote=True)
    return SHARE_HTML.format(title=e(title), desc=e(desc), board=e(board), url=e(f"{SITE}/careers/job/{job_id}"),
                             image=e(f"{SITE}/og-careers.jpg"))


@app.get(f"{settings.api_prefix}/share/{{job_id}}", response_class=HTMLResponse, tags=["jobs"])
def share(job_id: str) -> HTMLResponse:
    row = None
    jid = job_id.strip().lower()
    if UUID_RE.fullmatch(jid):
        with connection() as conn, conn.cursor() as cur:
            cur.execute("SELECT title, company_name, salary_text, work_mode, location_text, open_to "
                        "FROM careers.public_jobs WHERE id = %s", (jid,))
            row = cur.fetchone()
            conn.rollback()
    else:
        jid = ""
    return HTMLResponse(share_page(jid, row), headers={"Cache-Control": "public, max-age=300", "X-Robots-Tag": "noindex"})


@app.get(f"{settings.api_prefix}/me", tags=["account"])
def me(user: CurrentUser = Depends(require_user)) -> dict:
    return {"id": user.id, "role": user.role}
