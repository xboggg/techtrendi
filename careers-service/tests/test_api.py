"""API skeleton: health/ready, empty jobs page shape, standard errors, JWT verification."""
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
    assert body["items"] == [] and body["next_cursor"] is None and "source" in body["freshness_note"]


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
