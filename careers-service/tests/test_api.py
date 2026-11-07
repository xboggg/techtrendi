"""API: health/ready, the public jobs list (published only, filters, cursor pages), standard errors, JWT verification."""
import importlib
import time

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
    assert body["items"] == [] and body["next_cursor"] is None and body["total"] == 0 and "source" in body["freshness_note"]


@pytest.fixture
def published(migrator, source):
    """Three jobs from one approved source: two published (one open to GH+NG, one NG only), one pending."""
    with migrator.cursor() as cur:
        cur.execute("""INSERT INTO careers.source_rights (source_id, decision, reviewed_at, reviewer, fetch_allowed,
                         display_allowed, attribution_text) VALUES (%s, 'approved', now(), 'owner', true, true, 'Job via Fixture')""", (source,))
        cur.execute("UPDATE careers.sources SET status = 'active' WHERE id = %s", (source,))
        rows = [("a", "Data Analyst 100%_off", "Acme", "published", "remote", ["GH", "NG"], "2026-11-06T10:00:00+00"),
                ("b", "Branch Manager", "Moniepoint", "published", "onsite", ["NG"], "2026-11-05T10:00:00+00"),
                ("c", "Hidden Draft", "Acme", "pending", "remote", ["GH"], "2026-11-07T10:00:00+00")]
        for eid, title, company, status, mode, countries, posted in rows:
            cur.execute("""INSERT INTO careers.jobs (origin, source_id, external_id, title, company_name, apply_url, work_mode,
                             status, posted_at, location_text) VALUES ('feed', %s, %s, %s, %s, %s, %s, %s, %s, 'Lagos, Nigeria')
                           RETURNING id""", (source, eid, title, company, f"https://jobs.example/{eid}", mode, status, posted))
            jid = cur.fetchone()["id"]
            for cc in ("GH", "NG"):
                cur.execute("INSERT INTO careers.job_eligibility (job_id, country, state) VALUES (%s, %s, %s)",
                            (jid, cc, "allowed" if cc in countries else "unknown"))
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


def test_jobs_pages_with_a_cursor_without_repeats(client, published):
    p1 = client.get(f"{PREFIX}/jobs", params={"limit": 1}).json()
    assert len(p1["items"]) == 1 and p1["next_cursor"] and p1["total"] == 2
    p2 = client.get(f"{PREFIX}/jobs", params={"limit": 1, "cursor": p1["next_cursor"]}).json()
    assert [j["title"] for j in p2["items"]] == ["Branch Manager"] and p2["next_cursor"] is None
    bad = client.get(f"{PREFIX}/jobs", params={"cursor": "not-a-cursor"})
    assert bad.status_code == 422 and bad.json()["fields"] == {"cursor": "invalid cursor"}


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
