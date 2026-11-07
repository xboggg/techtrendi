"""Eligibility, quality and adapter parsing (no network, no database writes).

Cases come from real listings seen on 6 Nov 2026, e.g. a Himalayas job tagged
worldwide whose title said "U.S. Based".
"""
from datetime import datetime, timedelta, timezone

import pytest

from workers.collect import adapters
from workers.collect.eligibility import evaluate, is_open_to_target
from workers.collect.model import Job
from workers.collect.quality import review_reasons


def job(**kw):
    base = dict(external_id="x", title="Support Specialist", company_name="Acme", apply_url="https://acme.example/apply")
    base.update(kw)
    return Job(**base)


def states(j):
    v, reasons = evaluate(j)
    return {cc: x.state for cc, x in v.items()}, reasons


@pytest.mark.parametrize("kw, gh, ng", [
    (dict(allowed_countries=[], title="Account Manager (U.S. Based)"), "excluded", "excluded"),
    (dict(allowed_countries=[], title="Paid Media Operator"), "allowed", "allowed"),
    (dict(allowed_countries=["Ghana", "Kenya"]), "allowed", "excluded"),
    (dict(locations=["Anywhere in the World"]), "allowed", "allowed"),
    (dict(locations=["USA Only"]), "excluded", "excluded"),
    (dict(locations=["Latin America Only"]), "excluded", "excluded"),
    (dict(locations=["Lagos, Nigeria"]), "unknown", "allowed"),
    (dict(locations=["Accra, Ghana", "Nairobi, Kenya"]), "allowed", "unknown"),
    (dict(locations=["Africa"]), "allowed", "allowed"),
    (dict(locations=["South Africa"]), "unknown", "unknown"),
    (dict(locations=["Cape Town, South Africa"]), "unknown", "unknown"),
    (dict(locations=["Remote"]), "unknown", "unknown"),
    (dict(locations=["Remote, Worldwide"]), "allowed", "allowed"),
    (dict(locations=["EMEA"]), "unknown", "unknown"),
    (dict(allowed_countries=[], utc_offsets=[1, 2, 3]), "excluded", "allowed"),
    (dict(locations=["Worldwide"], text="You must reside in the United States to be considered."), "excluded", "excluded"),
    (dict(locations=["Worldwide"], text="Candidates must be authorized to work in the US."), "excluded", "excluded"),
    (dict(locations=["Worldwide"], text="Please contact us only through the form. We hire anywhere."), "allowed", "allowed"),
    (dict(locations=["Worldwide"], text="We are a US-based company hiring globally."), "allowed", "allowed"),
    (dict(locations=["Worldwide"], title="Data Annotator (Remote, US)"), "excluded", "excluded"),
])
def test_eligibility(kw, gh, ng):
    s, _ = states(job(**kw))
    assert (s["GH"], s["NG"]) == (gh, ng)


def test_unnamed_approved_countries_cancel_worldwide_but_not_a_named_country():
    # Welo Global, 6 Nov 2026: "Remote, Worldwide" plus this sentence, countries never listed
    text = "- Candidates must be physically located in one of the approved countries"
    s, reasons = states(job(locations=["India", "Remote, Worldwide"], text=text))
    assert (s["GH"], s["NG"]) == ("unknown", "unknown")
    s, reasons = states(job(locations=["Nigeria", "Remote, Worldwide"], text=text))
    assert (s["GH"], s["NG"]) == ("unknown", "allowed") and reasons == []


@pytest.mark.parametrize("line, gh, ng", [
    ("- Based in: India, Remote", "unknown", "unknown"),         # Welo Global, label said Worldwide
    ("- Based in: Nigeria, Remote", "unknown", "allowed"),
    ("- Based in: Worldwide, Remote", "allowed", "allowed"),
    ("Location: Remote", "allowed", "allowed"),                   # says nothing new: the label stands
])
def test_jobs_own_based_in_line_beats_the_board_label(line, gh, ng):
    s, _ = states(job(locations=["Remote, Worldwide"], text=f"About the role\n{line}\nWhat you will do"))
    assert (s["GH"], s["NG"]) == (gh, ng)


def test_named_country_with_conflicting_text_is_kept_but_flagged():
    s, reasons = states(job(locations=["Accra, Ghana"], text="Applicants must be authorized to work in the UK."))
    assert s["GH"] == "allowed" and "eligibility_conflict" in reasons


def test_open_to_target():
    v, _ = evaluate(job(locations=["USA Only"]))
    assert not is_open_to_target(v)
    v, _ = evaluate(job(locations=["Lagos, Nigeria"]))
    assert is_open_to_target(v)


def test_quality_flags():
    now = datetime(2026, 11, 6, tzinfo=timezone.utc)
    assert "scam_signs" in review_reasons(job(text="A small registration fee of GHS 200 is required."), None, now)
    assert "scam_signs" in review_reasons(job(text="Send your CV on WhatsApp +233 24 000 0000 today"), None, now)
    assert review_reasons(job(text="We pay a competitive salary and cover visa costs."), None, now) == []
    # M-KOPA's own warning, 6 Nov 2026, must not look like a fee demand
    notice = ("M-KOPA does not charge any money as a pre-employment requirement. This means that we never ask for "
              "'recruitment fees', 'processing fees', 'interview fees', or any other kind of money.")
    assert review_reasons(job(text=notice), None, now) == []
    assert "scam_signs" in review_reasons(job(text=notice + "\nPay the processing fee via MoMo to book your slot."), None, now)
    old = job(posted_at=now - timedelta(days=60))
    assert review_reasons(old, 45, now) == ["stale"]
    assert review_reasons(old, None, now) == []


class FakeFetcher:
    def __init__(self, pages):
        self.pages = list(pages)
        self.requests = 0
        self.calls = []

    def json(self, url, params=None):
        self.requests += 1
        self.calls.append((url, params))
        return self.pages.pop(0)

    def text(self, url, params=None):
        self.requests += 1
        return self.pages.pop(0)


def test_himalayas_pages_until_total_and_dedupes_across_countries():
    j1 = {"guid": "https://himalayas.app/c/a/jobs/1", "applicationLink": "https://himalayas.app/c/a/jobs/1?utm_source=api",
          "title": "Writer", "companyName": "A", "locationRestrictions": [], "pubDate": 1793281205,
          "expiryDate": 1795855939, "minSalary": 3000, "maxSalary": 6000, "currency": "USD", "salaryPeriod": "monthly",
          "description": "<p>Hello <b>world</b></p>"}
    j2 = dict(j1, guid="https://himalayas.app/c/b/jobs/2", applicationLink="https://himalayas.app/c/b/jobs/2",
              locationRestrictions=["Ghana"])
    f = FakeFetcher([
        {"jobs": [j1], "totalCount": 2, "limit": 1},          # GH page 1
        {"jobs": [j2], "totalCount": 2, "limit": 1},          # GH page 2 (total reached)
        {"jobs": [j1], "totalCount": 1, "limit": 1},          # NG page 1: same job again
    ])
    out = adapters.himalayas(f, {"countries": ["GH", "NG"]})
    assert [j.external_id for j in out] == [j1["guid"], j2["guid"]]
    assert f.requests == 3
    assert out[0].salary_text == "USD 3,000–6,000 / month"
    assert out[0].allowed_countries == [] and out[1].allowed_countries == ["Ghana"]
    assert out[0].text == "Hello world"


def test_wwr_splits_company_and_reads_region():
    rss = """<?xml version="1.0"?><rss><channel><item>
      <title>OpenTrain AI: Full-Stack Engineer</title><region>Anywhere in the World</region>
      <type>Contract</type><category>Programming</category>
      <description>&lt;p&gt;Build things&lt;/p&gt;</description>
      <pubDate>Fri, 06 Nov 2026 20:13:18 +0000</pubDate><expires_at>Sun, 06 Dec 2026 20:13:18 +0000</expires_at>
      <guid>https://weworkremotely.com/remote-jobs/x</guid><link>https://weworkremotely.com/remote-jobs/x</link>
    </item></channel></rss>"""
    out = adapters.weworkremotely(FakeFetcher([rss]), {})
    assert len(out) == 1
    j = out[0]
    assert (j.company_name, j.title, j.locations) == ("OpenTrain AI", "Full-Stack Engineer", ["Anywhere in the World"])
    assert j.valid_through == datetime(2026, 12, 6, 20, 13, 18, tzinfo=timezone.utc)


def test_employer_boards_parse_locations():
    wk = {"name": "FairMoney", "jobs": [{"title": "Android Engineer", "shortcode": "BD654", "telecommuting": False,
          "url": "https://apply.workable.com/j/BD654", "application_url": "https://apply.workable.com/j/BD654/apply",
          "published_on": "2026-11-05", "country": "Nigeria", "city": "Lagos",
          "locations": [{"country": "Nigeria", "city": "Lagos", "hidden": False}]}]}
    out = adapters.workable(FakeFetcher([wk]), {"account": "fairmoney"})
    assert out[0].locations == ["Lagos, Nigeria"] and out[0].company_name == "FairMoney"
    # FairMoney's widget repeats a job once per city (54 rows, 23 jobs on 7 Nov 2026)
    again = dict(wk["jobs"][0], city="Abuja", locations=[{"country": "Nigeria", "city": "Abuja", "hidden": False}])
    out = adapters.workable(FakeFetcher([{**wk, "jobs": [wk["jobs"][0], again]}]), {"account": "fairmoney"})
    assert len(out) == 1 and out[0].locations == ["Lagos, Nigeria", "Abuja, Nigeria"]

    lv = [{"id": "abc", "text": "QA Coordinator", "hostedUrl": "https://jobs.lever.co/weloglobal/abc",
           "applyUrl": "https://jobs.lever.co/weloglobal/abc/apply", "workplaceType": "remote", "createdAt": 1675993015566,
           "categories": {"location": "Remote, Worldwide", "allLocations": ["Remote, Worldwide"], "commitment": "Remote"},
           "descriptionPlain": "Work from anywhere."}]
    out = adapters.lever(FakeFetcher([lv]), {"site": "weloglobal", "company": "Welo Global"})
    assert out[0].locations == ["Remote, Worldwide"] and out[0].work_mode == "remote"
    assert out[0].posted_at.year == 2023

    ab = {"jobs": [{"id": "b7", "title": "National Service Recruitment", "location": "Ghana", "secondaryLocations": [],
          "isListed": True, "jobUrl": "https://jobs.ashbyhq.com/M-KOPA/b7", "applyUrl": "https://jobs.ashbyhq.com/M-KOPA/b7/application",
          "publishedAt": "2026-11-04T13:56:48.606+00:00", "address": {"postalAddress": {"addressCountry": "Ghana"}}},
          {"id": "hidden", "title": "Hidden", "isListed": False, "jobUrl": "https://jobs.ashbyhq.com/M-KOPA/h"}]}
    out = adapters.ashby(FakeFetcher([ab]), {"board": "m-kopa", "company": "M-KOPA"})
    assert [j.external_id for j in out] == ["b7"] and out[0].locations == ["Ghana"]


def test_non_https_links_are_dropped():
    gh = {"jobs": [{"id": 1, "title": "X", "absolute_url": "http://insecure.example/1", "location": {"name": "Accra"}}]}
    assert adapters.greenhouse(FakeFetcher([gh]), {"board": "x", "company": "X"}) == []
