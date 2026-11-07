"""Who may apply from Ghana (GH) and Nigeria (NG), from explicit evidence only (D-007).

Each country gets one of: allowed / excluded / unknown, with a short evidence
string. "Remote" on its own never means allowed. A source's "worldwide" label
is overridden when the job's own words limit it (e.g. "U.S. based" in the
title, "must reside in the United States" in the text).

Country abbreviations (US, USA, UK, EU) are matched case-sensitively so the
pronoun "us" never triggers an exclusion.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from .model import Job

COUNTRIES = ("GH", "NG")

PLACES = {
    "GH": re.compile(r"(?i)\b(ghana|accra|kumasi|tema|takoradi|tamale|cape coast)\b"),
    "NG": re.compile(r"(?i)\b(nigeria|lagos|abuja|port harcourt|ibadan|kano|warri|benin city|enugu)\b"),
}
NAMES = {"GH": {"ghana", "gh"}, "NG": {"nigeria", "ng"}}
UTC_OFFSET = {"GH": 0.0, "NG": 1.0}

WORLDWIDE = re.compile(r"(?i)\b(worldwide|world ?wide|anywhere in the world|anywhere|work from anywhere|global(ly)?|all countries)\b")
AFRICA = re.compile(r"(?i)\b(?:(south|north|east|southern|northern|eastern|central)[ -])?(?:sub-saharan |pan[ -]?)?africa\b")
# a location label that limits the job to somewhere else, e.g. "USA Only", "Latin America Only"
OTHER_ONLY = re.compile(r"(?i)\b(?!ghana|nigeria|africa|anywhere|worldwide)([a-z][a-z .]{1,30}?) only\b")

_ABBR = r"(?:U\.S\.A?\.?|USA|US|UK|EU)"
_REGION = (r"(?:" + _ABBR + r"|(?i:united states|america|united kingdom|great britain|europe|"
           r"canada|australia|latin america|latam|north america|germany|france|spain|india|brazil|mexico|philippines))")
TEXT_LIMITS = [
    # "U.S. based", "US-based", "UK only" — titles only for "-based" (a US-based company may still hire anywhere)
    ("title", re.compile(r"(?<![A-Za-z])" + _REGION + r"[- ](?i:based|only|residents?|citizens?)\b")),
    ("title", re.compile(r"\((?i:remote)?[ ,\-–]*" + _REGION + r"(?:[ ,\-–]*(?i:only|remote))?\)")),
    ("text", re.compile(r"(?<![A-Za-z])" + _REGION + r"[- ](?i:only|residents only|citizens only)\b")),
    ("text", re.compile(r"(?i:must|need to|required to|should)\s+(?i:currently\s+)?(?i:be\s+)?(?i:reside|live|located|based|resident)"
                        r"(?:\s+(?i:in|within))?\s+(?i:the\s+)?" + _REGION + r"\b")),
    ("text", re.compile(r"(?i:authori[sz]ed|eligible|legally able|permitted|right)\s+to\s+work\s+in\s+(?i:the\s+)?" + _REGION + r"\b")),
    ("text", re.compile(r"(?<![A-Za-z])(?:U\.S\.|US)\s+(?i:citizen(?:ship)?|work authori[sz]ation|persons?)\b")),
    ("text", re.compile(r"(?i)\b(green card|security clearance|active clearance)\b")),
    ("text", re.compile(r"(?i:only\s+(?:accept|consider|hir)\w*\s+(?:candidates|applicants|people)?\s*(?:based|located|living)?\s*(?:in|from)\s+(?:the\s+)?)"
                        + _REGION + r"\b")),
]


# Limits that do not name the countries ("one of the approved countries"). They cancel a
# generic "worldwide" label but do not contradict a job that names Ghana or Nigeria itself.
SOFT_LIMITS = [
    re.compile(r"(?i)\b(?:must|need to|required to)\s+be\s+(?:physically\s+)?(?:located|based|resident|residing)\s+in\s+"
               r"(?:one of\s+)?(?:the\s+)?(?:approved|eligible|listed|supported|selected|following|specified)\s+(?:countries|locations|regions)\b"),
    re.compile(r"(?i)\bonly\s+(?:open|available)\s+(?:to|in)\s+(?:candidates\s+(?:in|from)\s+)?(?:the\s+)?(?:approved|eligible|listed|supported)\s+(?:countries|locations)\b"),
]


# A line in the job's own text such as "- Based in: India, Remote" is more specific than the
# board's location labels (Welo Global lists "Remote, Worldwide" on jobs whose text says India).
STATED = re.compile(r"(?im)^[\s\-*•]*(?:based in|location|locations|job location)\s*:\s*(.{2,120})$")
REMOTE_ONLY = re.compile(r"(?i)^[\s,/()\-]*(?:fully\s+)?remote[\s,/()\-]*$")


def stated_location(text: str) -> str | None:
    """The job's own 'Based in:' / 'Location:' line, unless it only says 'Remote'."""
    m = STATED.search(text or "")
    if not m:
        return None
    value = m.group(1).strip()
    return None if REMOTE_ONLY.match(value) else value


@dataclass
class Verdict:
    state: str          # allowed / excluded / unknown
    evidence: str | None


def _short(s: str, n: int = 120) -> str:
    s = re.sub(r"\s+", " ", s).strip()
    return s if len(s) <= n else s[: n - 1] + "…"


def text_limit(job: Job) -> str | None:
    """The first phrase in the job's own words that limits who can apply, if any."""
    for where, rx in TEXT_LIMITS:
        hay = job.title if where == "title" else f"{job.title}\n{job.text}"
        m = rx.search(hay)
        if m:
            return m.group(0)
    return None


def soft_limit(job: Job) -> str | None:
    for rx in SOFT_LIMITS:
        m = rx.search(f"{job.title}\n{job.text}")
        if m:
            return m.group(0)
    return None


def evaluate(job: Job) -> tuple[dict[str, Verdict], list[str]]:
    """Return a verdict per country and any review reasons (conflicting evidence)."""
    labels = [l for l in job.locations if l]
    stated = stated_location(job.text)
    if stated:
        labels = [stated]
    joined = " | ".join(labels)
    allowed_list = None if job.allowed_countries is None else {c.strip().lower() for c in job.allowed_countries}
    limit = text_limit(job)
    soft = None if limit else soft_limit(job)
    reasons: list[str] = []
    out: dict[str, Verdict] = {}

    for cc in COUNTRIES:
        named_place = PLACES[cc].search(joined)
        named_in_list = allowed_list is not None and bool(allowed_list & NAMES[cc])

        if named_place or named_in_list:
            v = Verdict("allowed", _short(f"listed: {named_place.group(0) if named_place else cc}"))
            if limit:
                reasons.append("eligibility_conflict")
            out[cc] = v
            continue

        if limit:
            out[cc] = Verdict("excluded", _short(f"says: {limit}"))
            continue

        if soft:
            out[cc] = Verdict("unknown", _short(f"says: {soft}"))
            continue

        if job.utc_offsets and UTC_OFFSET[cc] not in {float(x) for x in job.utc_offsets}:
            out[cc] = Verdict("excluded", f"timezones exclude UTC+{UTC_OFFSET[cc]:g}")
            continue

        if allowed_list is not None and allowed_list:
            out[cc] = Verdict("excluded", _short("limited to: " + ", ".join(sorted(job.allowed_countries or []))))
            continue

        world = WORLDWIDE.search(joined)
        africa = next((m for m in AFRICA.finditer(joined) if not m.group(1)), None)
        other_only = OTHER_ONLY.search(joined)
        if allowed_list is not None and not allowed_list and not other_only:
            out[cc] = Verdict("allowed", "source: open worldwide")
        elif world and not other_only:
            out[cc] = Verdict("allowed", _short(f"listed: {world.group(0)}"))
        elif africa and not other_only:
            out[cc] = Verdict("allowed", _short(f"listed: {africa.group(0)}"))
        elif other_only:
            out[cc] = Verdict("excluded", _short(f"listed: {other_only.group(0)}"))
        else:
            out[cc] = Verdict("unknown", None)

    return out, sorted(set(reasons))


def is_open_to_target(verdicts: dict[str, Verdict]) -> bool:
    return any(v.state == "allowed" for v in verdicts.values())
