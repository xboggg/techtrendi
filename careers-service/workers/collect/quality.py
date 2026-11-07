"""Reasons a collected job must wait for a human instead of going live.

Kept deliberately short and conservative: anything here sends the job to
'review'; nothing here deletes or hides a job by itself.
"""
from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone

from .model import Job

SCAM = [
    re.compile(r"(?i)\b(registration|application|processing|training|onboarding|medical|visa)\s+fees?\b"),
    re.compile(r"(?i)\bpay\s+(?:a|the|an)?\s*(?:small\s+)?(?:fee|deposit|refundable)\b"),
    re.compile(r"(?i)\b(western union|moneygram|send money|gift cards?)\b"),
    re.compile(r"(?i)\bwhats\s?app\b[^.\n]{0,30}\+?\d[\d \-]{7,}"),
    re.compile(r"(?i)\btelegram\b[^.\n]{0,20}@\w{4,}"),
    re.compile(r"(?i)\b(earn|make)\s+\$?\d[\d,]*\s*(?:-|to)?\s*\$?\d*[\d,]*\s*(per|a|/)\s*(day|week)\b"),
]


# Employers' own anti-scam notices ("we never ask for recruitment fees") must not count.
WARNING = re.compile(r"(?i)\b(never|not|no|don'?t|won'?t|doesn'?t|without|free of charge|at no cost|beware|scam|fraud\w*)\b")


def scam_sign(text: str) -> str | None:
    """The first scam-like phrase that is not part of a warning sentence, if any."""
    for rx in SCAM:
        for m in rx.finditer(text):
            start = max(text.rfind(".", 0, m.start()), text.rfind("\n", 0, m.start())) + 1
            ends = [i for i in (text.find(".", m.end()), text.find("\n", m.end())) if i != -1]
            sentence = text[start:min(ends) if ends else len(text)]
            if not WARNING.search(sentence):
                return m.group(0)
    return None


def review_reasons(job: Job, max_age_days: int | None, now: datetime | None = None) -> list[str]:
    now = now or datetime.now(timezone.utc)
    reasons: list[str] = []
    if scam_sign(f"{job.title}\n{job.text}"):
        reasons.append("scam_signs")
    if max_age_days and job.posted_at and job.posted_at < now - timedelta(days=max_age_days):
        reasons.append("stale")
    if job.posted_at and job.posted_at > now + timedelta(days=2):
        reasons.append("future_date")
    return reasons
