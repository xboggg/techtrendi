"""API: health/ready, the public jobs list (published only, filters, numbered pages), standard errors, JWT verification."""
import importlib
import time
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi.testclient import TestClient

PREFIX = "/api/careers/v1"
SECRET = "test-only-secret-not-used-anywhere-else"


@pytest.fixture
def client(urls, monkeypatch):
    monkeypatch.setenv("CAREERS_DATABASE_URL", urls["api"])
    monkeypatch.setenv("CAREERS_JWT_SECRET", SECRET)
    monkeypatch.setenv("CAREERS_JWT_ISSUER", "https://auth.test/auth/v1")
    monkeypatch.setenv("CAREERS_ENV", "test")
    import app.config as config
    config.get_settings.cache_clear()
    import app.db as db
    db.close_pool()
    import app.main as main
    importlib.reload(main)
    with TestClient(main.app) as c:
        yield c
    db.close_pool()
    config.get_settings.cache_clear()


def _token(**over):
    claims = {"sub": "11111111-2222-3333-4444-555555555555", "aud": "authenticated", "role": "authenticated",
              "iss": "https://auth.test/auth/v1", "exp": int(time.time()) + 300}
    claims.update(over)
    return jwt.encode(claims, SECRET, algorithm="HS256")


def test_health_has_no_secrets(client):
    r = client.get(f"{PREFIX}/health")
    assert r.status_code == 200
    assert set(r.json()) == {"status", "version", "env"}
    assert "X-Request-ID" in r.headers


def test_ready_hits_database_with_api_role(client):
    r = client.get(f"{PREFIX}/ready")
    assert r.status_code == 200 and r.json()["database"] == "ok"


def test_jobs_empty_page_shape(client):
    r = client.get(f"{PREFIX}/jobs", params={"country": "GH", "work_mode": "remote", "limit": 10})
    assert r.status_code == 200
    body = r.json()
    assert body["items"] == [] and body["total"] == 0 and body["page"] == 1 and body["pages"] == 1
    assert "source" in body["freshness_note"]


@pytest.fixture
def published(migrator, source):
    """Three jobs from one approved source: two published (one open to GH+NG, one NG only), one pending.
    a: data contract job with pay, posted an hour ago; b: senior sales job, posted 10 days ago."""
    now = datetime.now(timezone.utc)
    with migrator.cursor() as cur:
        cur.execute("""INSERT INTO careers.source_rights (source_id, decision, reviewed_at, reviewer, fetch_allowed,
                         display_allowed, attribution_text) VALUES (%s, 'approved', now(), 'owner', true, true, 'Job via Fixture')""", (source,))
        cur.execute("UPDATE careers.sources SET status = 'active' WHERE id = %s", (source,))
        rows = [("a", "Data Analyst 100%_off", "Acme", "published", "remote", ["GH", "NG"], now - timedelta(hours=1),
                 "Contractor", [], "USD 10 / hour"),
                ("b", "Branch Manager", "Moniepoint", "published", "onsite", ["NG"], now - timedelta(days=10),
                 "Full-Time", ["Sales"], None),
                ("c", "Hidden Draft", "Acme", "pending", "remote", ["GH"], now, None, [], None)]
        for eid, title, company, status, mode, countries, posted, emp, cats, pay in rows:
            cur.execute("""INSERT INTO careers.jobs (origin, source_id, external_id, title, company_name, apply_url, work_mode,
                             status, posted_at, location_text, employment_type, categories, salary_text, valid_through)
                           VALUES ('feed', %s, %s, %s, %s, %s, %s, %s, %s, 'Lagos, Nigeria', %s, %s, %s, now() + interval '9 days')
                           RETURNING id""", (source, eid, title, company, f"https://jobs.example/{eid}", mode, status, posted,
                                             emp, cats, pay))
            jid = cur.fetchone()["id"]
            for cc in ("GH", "NG"):
                cur.execute("INSERT INTO careers.job_eligibility (job_id, country, state, evidence) VALUES (%s, %s, %s, %s)",
                            (jid, cc, "allowed" if cc in countries else "unknown", f"listed: {cc}"))
    migrator.commit()
    yield


def test_jobs_lists_only_published_newest_first_with_credit(client, published):
    r = client.get(f"{PREFIX}/jobs")
    body = r.json()
    assert r.status_code == 200 and body["total"] == 2
    assert [j["title"] for j in body["items"]] == ["Data Analyst 100%_off", "Branch Manager"]
    first = body["items"][0]
    assert first["source_name"] == "Fixture source" and first["attribution"] == "Job via Fixture"
    assert first["apply_url"] == "https://jobs.example/a" and first["open_to"] == ["GH", "NG"]
    assert r.headers["Cache-Control"] == "public, max-age=300" and r.headers["X-Robots-Tag"] == "noindex"


def test_jobs_filters(client, published):
    assert [j["title"] for j in client.get(f"{PREFIX}/jobs", params={"country": "gh"}).json()["items"]] == ["Data Analyst 100%_off"]
    assert client.get(f"{PREFIX}/jobs", params={"country": "NG"}).json()["total"] == 2
    assert [j["company"] for j in client.get(f"{PREFIX}/jobs", params={"work_mode": "onsite"}).json()["items"]] == ["Moniepoint"]
    assert client.get(f"{PREFIX}/jobs", params={"q": "monie"}).json()["total"] == 1
    # LIKE wildcards in the search box are plain characters, not patterns
    assert client.get(f"{PREFIX}/jobs", params={"q": "100%_off"}).json()["total"] == 1
    assert client.get(f"{PREFIX}/jobs", params={"q": "%"}).json()["total"] == 1
    # "Jobs in Nigeria": located there and not remote (both rows say Lagos; only b is on-site)
    assert [j["title"] for j in client.get(f"{PREFIX}/jobs", params={"located": "NG"}).json()["items"]] == ["Branch Manager"]
    assert client.get(f"{PREFIX}/jobs", params={"located": "GH"}).json()["total"] == 0
    assert client.get(f"{PREFIX}/jobs", params={"located": "KE"}).status_code == 422


def test_jobs_facets_and_details(client, published):
    a, b = client.get(f"{PREFIX}/jobs").json()["items"]
    assert (a["field"], a["job_type"], a["level"]) == ("data", "contract", "mid")      # field from the title
    assert (b["field"], b["job_type"], b["level"]) == ("sales", "full_time", "senior")  # field from the category
    assert a["open_evidence"] == {"GH": "listed: GH", "NG": "listed: NG"} and b["open_evidence"] == {"NG": "listed: NG"}
    assert b["categories"] == ["Sales"]
    # A real closing date is passed on; the fixture source has no default_valid_days
    assert a["closes_at"] is not None


def test_jobs_closing_date_hidden_when_only_estimated(client, published, migrator, source):
    with migrator.cursor() as cur:
        cur.execute("""UPDATE careers.sources SET settings = '{"default_valid_days": 30}' WHERE id = %s""", (source,))
    migrator.commit()
    assert [j["closes_at"] for j in client.get(f"{PREFIX}/jobs").json()["items"]] == [None, None]


def test_jobs_new_filters(client, published):
    def titles(**p):
        return [j["title"] for j in client.get(f"{PREFIX}/jobs", params=p).json()["items"]]
    assert titles(field="sales") == ["Branch Manager"]
    assert titles(field="sales,data") == ["Data Analyst 100%_off", "Branch Manager"]
    assert titles(job_type="contract") == ["Data Analyst 100%_off"]
    assert titles(level="senior") == ["Branch Manager"]
    assert titles(level="entry") == []
    assert titles(pay="true") == ["Data Analyst 100%_off"]
    assert titles(posted="week") == ["Data Analyst 100%_off"]
    assert titles(posted="month") == ["Data Analyst 100%_off", "Branch Manager"]
    assert titles(country="NG", field="data", pay="1") == ["Data Analyst 100%_off"]
    for bad in ({"field": "plumbing"}, {"field": ","}, {"job_type": "full_time,gig"}, {"level": "x"}, {"posted": "year"}):
        r = client.get(f"{PREFIX}/jobs", params=bad)
        assert r.status_code == 422 and r.json()["code"] == "validation_error", bad


def test_jobs_numbered_pages_without_repeats(client, published):
    p1 = client.get(f"{PREFIX}/jobs", params={"limit": 1}).json()
    assert [j["title"] for j in p1["items"]] == ["Data Analyst 100%_off"]
    assert (p1["page"], p1["pages"], p1["total"]) == (1, 2, 2)
    p2 = client.get(f"{PREFIX}/jobs", params={"limit": 1, "page": 2}).json()
    assert [j["title"] for j in p2["items"]] == ["Branch Manager"] and p2["page"] == 2
    p3 = client.get(f"{PREFIX}/jobs", params={"limit": 1, "page": 3}).json()
    assert p3["items"] == [] and p3["total"] == 2
    assert client.get(f"{PREFIX}/jobs", params={"page": 0}).status_code == 422
    assert client.get(f"{PREFIX}/jobs", params={"page": 501}).status_code == 422


def test_jobs_rejects_bad_filters_with_standard_error_body(client):
    r = client.get(f"{PREFIX}/jobs", params={"country": "Ghana", "limit": 500})
    assert r.status_code == 422
    body = r.json()
    assert body["code"] == "validation_error" and "request_id" in body
    assert "country" in body["fields"] and "limit" in body["fields"]


def test_me_requires_valid_token(client):
    assert client.get(f"{PREFIX}/me").status_code == 401
    assert client.get(f"{PREFIX}/me", headers={"Authorization": "Bearer nonsense"}).json()["code"] == "unauthenticated"
    expired = _token(exp=int(time.time()) - 10)
    assert client.get(f"{PREFIX}/me", headers={"Authorization": f"Bearer {expired}"}).json()["code"] == "token_expired"
    wrong_aud = _token(aud="anon")
    assert client.get(f"{PREFIX}/me", headers={"Authorization": f"Bearer {wrong_aud}"}).status_code == 401
    wrong_iss = _token(iss="https://evil.test")
    assert client.get(f"{PREFIX}/me", headers={"Authorization": f"Bearer {wrong_iss}"}).status_code == 401
    forged = jwt.encode({"sub": "x", "aud": "authenticated", "exp": int(time.time()) + 60}, "other-secret", algorithm="HS256")
    assert client.get(f"{PREFIX}/me", headers={"Authorization": f"Bearer {forged}"}).status_code == 401


def test_me_returns_only_id_and_role(client):
    r = client.get(f"{PREFIX}/me", headers={"Authorization": f"Bearer {_token()}"})
    assert r.status_code == 200
    assert r.json() == {"id": "11111111-2222-3333-4444-555555555555", "role": "authenticated"}


def test_unknown_route_uses_standard_error_body(client):
    r = client.get(f"{PREFIX}/does-not-exist")
    assert r.status_code == 404 and r.json()["code"] == "not_found"
