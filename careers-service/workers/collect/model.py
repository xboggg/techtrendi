"""The record every adapter produces. Only the fields marked `stored` reach the
database; `text` is the full plain description, used in memory for the
eligibility and quality checks and then dropped (D-025: no full copies)."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Job:
    external_id: str
    title: str
    company_name: str
    apply_url: str
    source_url: str | None = None
    company_logo_url: str | None = None
    summary: str | None = None
    work_mode: str = "unknown"                 # remote / hybrid / onsite / unknown
    employment_type: str | None = None
    location_text: str | None = None
    salary_text: str | None = None
    categories: list[str] = field(default_factory=list)
    posted_at: datetime | None = None
    valid_through: datetime | None = None
    # evidence for eligibility, not stored as such
    locations: list[str] = field(default_factory=list)           # free-text location labels from the source
    allowed_countries: list[str] | None = None                    # structured list; [] = source says worldwide; None = not given
    utc_offsets: list[float] | None = None                        # structured timezone restriction, if any
    text: str = ""                                                # full plain description (memory only)
