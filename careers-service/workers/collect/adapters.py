"""One function per source system. Each takes (fetcher, source settings) and
returns every job the source currently lists (a complete snapshot), or raises.
Field names were checked against live responses on 6 Nov 2026.

Settings come from careers.sources.settings (owner-written, never secrets).
"""
from __future__ import annotations

import email.utils
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Any, Callable

from .http import Fetcher
from .model import Job
from .text import html_to_text, one_line, summarise


# ---------- small helpers ----------

def https(url: Any) -> str | None:
    if not isinstance(url, str):
        return None
    url = url.strip()
    return url if url.startswith("https://") and len(url) <= 2000 else None


def when(value: Any) -> datetime | None:
    """Epoch seconds/milliseconds, ISO 8601, RFC 822 or YYYY-MM-DD, to aware UTC."""
    if value in (None, "", 0):
        return None
    try:
        if isinstance(value, (int, float)):
            v = float(value)
            return datetime.fromtimestamp(v / 1000 if v > 1e11 else v, tz=timezone.utc)
        s = str(value).strip()
        if s.isdigit():
            return when(int(s))
        if s[:4].isdigit() and "-" in s[:8]:
            dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        else:
            dt = email.utils.parsedate_to_datetime(s)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except (ValueError, TypeError, OverflowError):
        return None


def mode_from(*labels: Any) -> str:
    s = " ".join(str(l) for l in labels if l).lower()
    if "hybrid" in s:
        return "hybrid"
    if "remote" in s or "anywhere" in s or "worldwide" in s:
        return "remote"
    if "onsite" in s or "on-site" in s or "office" in s:
        return "onsite"
    return "unknown"


def salary(lo: Any, hi: Any, currency: Any = None, period: Any = None) -> str | None:
    def n(x):
        try:
            return f"{int(float(x)):,}" if x not in (None, "", 0) else None
        except (TypeError, ValueError):
            return None
    a, b = n(lo), n(hi)
    if not a and not b:
        return None
    amount = f"{a}–{b}" if a and b and a != b else (a or b)
    cur = f"{currency} " if currency else ""
    p = str(period or "").lower()
    p = {"yearly": "year", "annually": "year", "annual": "year", "monthly": "month", "weekly": "week",
         "daily": "day", "hourly": "hour"}.get(p, p)
    per = f" / {p}" if p else ""
    return one_line(f"{cur}{amount}{per}", 120)


def _str(v: Any, limit: int) -> str | None:
    return one_line(v, limit) if isinstance(v, str) else None


# ---------- aggregators ----------

def himalayas(f: Fetcher, s: dict) -> list[Job]:
    """Search API, 20 per page, ?page=N. Apply must use applicationLink. No key needed."""
    jobs: dict[str, Job] = {}
    for country in s.get("countries", ["GH", "NG"]):
        page = 1
        while True:
            d = f.json("https://himalayas.app/jobs/api/search", {"country": country, "page": page})
            batch = d.get("jobs") or []
            for j in batch:
                guid = j.get("guid") or j.get("applicationLink")
                apply = https(j.get("applicationLink"))
                if not guid or not apply or guid in jobs:
                    continue
                restr = []
                for r in j.get("locationRestrictions") or []:
                    restr.append(r if isinstance(r, str) else (r.get("name") or r.get("alpha2") or ""))
                text = html_to_text(j.get("description"))
                jobs[guid] = Job(
                    external_id=guid, title=j.get("title") or "", company_name=j.get("companyName") or "",
                    apply_url=apply, source_url=https(guid), company_logo_url=https(j.get("companyLogo")),
                    summary=summarise(j.get("excerpt") or text), work_mode="remote",
                    employment_type=_str(j.get("employmentType"), 60),
                    location_text=one_line(", ".join(restr) if restr else "Remote, worldwide", 300),
                    salary_text=salary(j.get("minSalary"), j.get("maxSalary"), j.get("currency"), j.get("salaryPeriod")),
                    categories=[c for c in (j.get("parentCategories") or []) if isinstance(c, str)][:5],
                    posted_at=when(j.get("pubDate")), valid_through=when(j.get("expiryDate")),
                    locations=restr, allowed_countries=restr,
                    utc_offsets=j.get("timezoneRestrictions") or None, text=text,
                )
            total = int(d.get("totalCount") or 0)
            if not batch or page * int(d.get("limit") or 20) >= total:
                break
            page += 1
    return list(jobs.values())


def jobicy(f: Fetcher, s: dict) -> list[Job]:
    """Public jobs API (7-day window), cursor pages of up to 100. Apply = Jobicy listing URL."""
    out: list[Job] = []
    params: dict[str, Any] = {"count": 100, "geo": s.get("geo", "anywhere")}
    while True:
        d = f.json("https://jobicy.com/api/jobs", params)
        for j in d.get("jobs") or []:
            url = https(j.get("url"))
            if not url or not j.get("id"):
                continue
            text = html_to_text(j.get("jobDescription"))
            out.append(Job(
                external_id=str(j["id"]), title=html_to_text(j.get("jobTitle")), company_name=j.get("companyName") or "",
                apply_url=url, source_url=url, company_logo_url=https(j.get("companyLogo")),
                summary=summarise(html_to_text(j.get("jobExcerpt")) or text), work_mode="remote",
                employment_type=_str(", ".join(j.get("jobType") or []), 60),
                location_text=_str(j.get("jobGeo"), 300),
                salary_text=salary(j.get("salaryMin") or j.get("annualSalaryMin"), j.get("salaryMax") or j.get("annualSalaryMax"),
                                   j.get("salaryCurrency"), j.get("salaryPeriod")),
                categories=[c for c in (j.get("jobIndustry") or []) if isinstance(c, str)][:5],
                posted_at=when(j.get("pubDate")), locations=[j.get("jobGeo") or ""], text=text,
            ))
        cursor = d.get("nextCursor")
        if not cursor or not d.get("hasMore"):
            break
        params = {**params, "cursor": cursor}
    return out


def weworkremotely(f: Fetcher, s: dict) -> list[Job]:
    """RSS feed of all categories; title is 'Company: Role'; <region> holds who may apply."""
    root = ET.fromstring(f.text(s.get("feed", "https://weworkremotely.com/remote-jobs.rss")))
    out: list[Job] = []
    for it in root.iter("item"):
        link = https(it.findtext("link") or it.findtext("guid"))
        raw = (it.findtext("title") or "").strip()
        if not link or not raw:
            continue
        company, _, title = raw.partition(": ")
        if not title:
            company, title = "", raw
        region = (it.findtext("region") or "").strip()
        text = html_to_text(it.findtext("description"))
        out.append(Job(
            external_id=it.findtext("guid") or link, title=title, company_name=company,
            apply_url=link, source_url=link, summary=summarise(text), work_mode="remote",
            employment_type=_str(it.findtext("type"), 60), location_text=_str(region, 300),
            categories=[c for c in [(it.findtext("category") or "").strip()] if c],
            posted_at=when(it.findtext("pubDate")), valid_through=when(it.findtext("expires_at")),
            locations=[region], text=text,
        ))
    return out


def remoteok(f: Fetcher, s: dict) -> list[Job]:
    """Public API; element 0 is the legal notice. Must link back (followed) to the Remote OK URL."""
    d = f.json("https://remoteok.com/api")
    out: list[Job] = []
    for j in d[1:] if isinstance(d, list) else []:
        url = https(j.get("url"))
        if not url or not j.get("id"):
            continue
        text = html_to_text(j.get("description"))
        loc = j.get("location") or ""
        out.append(Job(
            external_id=str(j["id"]), title=j.get("position") or "", company_name=j.get("company") or "",
            apply_url=url, source_url=url, company_logo_url=https(j.get("company_logo")),
            summary=summarise(text), work_mode="remote", location_text=_str(loc, 300),
            salary_text=salary(j.get("salary_min"), j.get("salary_max"), "USD", "year"),
            categories=[t for t in (j.get("tags") or []) if isinstance(t, str)][:5],
            posted_at=when(j.get("date") or j.get("epoch")), locations=[loc], text=text,
        ))
    return out


def remotive(f: Fetcher, s: dict) -> list[Job]:
    """Public API, at most 4 calls a day. Not to be passed on to Google Jobs or other boards."""
    d = f.json("https://remotive.com/api/remote-jobs")
    out: list[Job] = []
    for j in d.get("jobs") or []:
        url = https(j.get("url"))
        if not url or not j.get("id"):
            continue
        text = html_to_text(j.get("description"))
        loc = j.get("candidate_required_location") or ""
        out.append(Job(
            external_id=str(j["id"]), title=j.get("title") or "", company_name=j.get("company_name") or "",
            apply_url=url, source_url=url, company_logo_url=https(j.get("company_logo") or j.get("company_logo_url")),
            summary=summarise(text), work_mode="remote", employment_type=_str(j.get("job_type"), 60),
            location_text=_str(loc, 300), salary_text=_str(j.get("salary"), 120),
            categories=[c for c in [j.get("category")] if isinstance(c, str) and c],
            posted_at=when(j.get("publication_date")), locations=[loc], text=text,
        ))
    return out


# ---------- employers' own job boards ----------

def greenhouse(f: Fetcher, s: dict) -> list[Job]:
    d = f.json(f"https://boards-api.greenhouse.io/v1/boards/{s['board']}/jobs")
    out: list[Job] = []
    for j in d.get("jobs") or []:
        url = https(j.get("absolute_url"))
        if not url or not j.get("id"):
            continue
        loc = (j.get("location") or {}).get("name") or ""
        etype = next((m.get("value") for m in j.get("metadata") or []
                      if (m.get("name") or "").lower() == "employment type" and isinstance(m.get("value"), str)), None)
        out.append(Job(
            external_id=str(j["id"]), title=j.get("title") or "", company_name=s.get("company") or j.get("company_name") or "",
            apply_url=url, source_url=url, work_mode=mode_from(loc), employment_type=_str(etype, 60),
            location_text=_str(loc, 300), posted_at=when(j.get("first_published") or j.get("updated_at")),
            valid_through=when(j.get("application_deadline")), locations=[loc],
        ))
    return out


def lever(f: Fetcher, s: dict) -> list[Job]:
    d = f.json(f"https://api.lever.co/v0/postings/{s['site']}", {"mode": "json"})
    out: list[Job] = []
    for j in d if isinstance(d, list) else []:
        url = https(j.get("hostedUrl"))
        if not url or not j.get("id"):
            continue
        cat = j.get("categories") or {}
        locs = [l for l in [cat.get("location"), *(cat.get("allLocations") or [])] if isinstance(l, str)]
        locs = list(dict.fromkeys(locs))
        text = html_to_text(j.get("descriptionPlain") or j.get("description"))
        wt = (j.get("workplaceType") or "").lower()
        out.append(Job(
            external_id=j["id"], title=j.get("text") or "", company_name=s.get("company") or "",
            apply_url=https(j.get("applyUrl")) or url, source_url=url, summary=summarise(text),
            work_mode=wt if wt in ("remote", "hybrid", "onsite") else mode_from(*locs),
            employment_type=_str(cat.get("commitment"), 60), location_text=one_line(" · ".join(locs), 300),
            categories=[c for c in [cat.get("department"), cat.get("team")] if isinstance(c, str) and c][:5],
            posted_at=when(j.get("createdAt")), locations=locs, text=text,
        ))
    return out


def ashby(f: Fetcher, s: dict) -> list[Job]:
    d = f.json(f"https://api.ashbyhq.com/posting-api/job-board/{s['board']}")
    out: list[Job] = []
    for j in d.get("jobs") or []:
        url = https(j.get("jobUrl"))
        if not url or not j.get("id") or j.get("isListed") is False:
            continue
        locs = [l for l in [j.get("location"), *[(x or {}).get("location") for x in j.get("secondaryLocations") or []]]
                if isinstance(l, str) and l]
        country = (((j.get("address") or {}).get("postalAddress") or {}).get("addressCountry"))
        if isinstance(country, str) and country and country not in locs:
            locs.append(country)
        text = html_to_text(j.get("descriptionPlain") or j.get("descriptionHtml"))
        wt = (j.get("workplaceType") or "").lower().replace("-", "")
        mode = {"remote": "remote", "hybrid": "hybrid", "onsite": "onsite"}.get(wt) or ("remote" if j.get("isRemote") else mode_from(*locs))
        out.append(Job(
            external_id=j["id"], title=j.get("title") or "", company_name=s.get("company") or "",
            apply_url=https(j.get("applyUrl")) or url, source_url=url, summary=summarise(text), work_mode=mode,
            employment_type=_str(j.get("employmentType"), 60), location_text=one_line(" · ".join(locs), 300),
            categories=[c for c in [j.get("department"), j.get("team")] if isinstance(c, str) and c][:5],
            posted_at=when(j.get("publishedAt")), locations=locs, text=text,
        ))
    return out


def workable(f: Fetcher, s: dict) -> list[Job]:
    d = f.json(f"https://apply.workable.com/api/v1/widget/accounts/{s['account']}")
    company = s.get("company") or d.get("name") or ""
    out: dict[str, Job] = {}
    for j in d.get("jobs") or []:
        url = https(j.get("url") or j.get("shortlink"))
        if not url or not j.get("shortcode"):
            continue
        locs = []
        for l in j.get("locations") or []:
            if not l.get("hidden"):
                locs.append(", ".join(x for x in [l.get("city"), l.get("country")] if x))
        if not locs:
            locs = [", ".join(x for x in [j.get("city"), j.get("country")] if x)]
        locs = [l for l in dict.fromkeys(locs) if l]
        if j["shortcode"] in out:            # the widget repeats a job once per city: merge the cities
            prev = out[j["shortcode"]]
            prev.locations = list(dict.fromkeys(prev.locations + locs))
            prev.location_text = one_line(" · ".join(prev.locations), 300)
            continue
        out[j["shortcode"]] = (Job(
            external_id=j["shortcode"], title=j.get("title") or "", company_name=company,
            apply_url=https(j.get("application_url")) or url, source_url=url,
            work_mode="remote" if j.get("telecommuting") else mode_from(*locs),
            employment_type=_str(j.get("employment_type"), 60), location_text=one_line(" · ".join(locs), 300),
            categories=[c for c in [j.get("department") or j.get("function")] if isinstance(c, str) and c],
            posted_at=when(j.get("published_on") or j.get("created_at")), locations=locs,
        ))
    return list(out.values())


ADAPTERS: dict[str, Callable[[Fetcher, dict], list[Job]]] = {
    "himalayas": himalayas,
    "jobicy": jobicy,
    "weworkremotely": weworkremotely,
    "remoteok": remoteok,
    "remotive": remotive,
    "greenhouse": greenhouse,
    "lever": lever,
    "ashby": ashby,
    "workable": workable,
}
