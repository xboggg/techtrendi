"""Polite, budgeted HTTP for one source run (standard library only).

  * identifies itself with a contact URL;
  * keeps at least `gap_ms` between requests to the same run;
  * stops with BudgetExceeded after `quota` requests (the run is then partial,
    so no absence-based expiry happens);
  * refuses bodies over `max_bytes`;
  * renews the work lease before every request and stops if it was lost.
"""
from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Callable

USER_AGENT = "TechTrendi-Careers/1.0 (+https://techtrendi.com/careers)"


class BudgetExceeded(Exception):
    """The run used its request quota before reaching the end of the source."""


class LeaseLost(Exception):
    """Another worker may now own this item; stop without writing more."""


class FetchError(Exception):
    def __init__(self, url: str, status: int | None, detail: str = ""):
        host = urllib.parse.urlsplit(url).netloc
        super().__init__(f"{host} returned {status or 'no response'} {detail}".strip())
        self.status = status


class Fetcher:
    def __init__(self, quota: int, gap_ms: int, heartbeat: Callable[[], bool] | None = None,
                 timeout: float = 25.0, max_bytes: int = 25 * 1024 * 1024):
        self.quota = quota
        self.gap = gap_ms / 1000.0
        self.heartbeat = heartbeat
        self.timeout = timeout
        self.max_bytes = max_bytes
        self.requests = 0
        self._last = 0.0

    def _open(self, url: str, params: dict[str, Any] | None, accept: str) -> bytes:
        if self.requests >= self.quota:
            raise BudgetExceeded(f"quota of {self.quota} requests reached")
        if self.heartbeat is not None and not self.heartbeat():
            raise LeaseLost("work lease lost")
        wait = self._last + self.gap - time.monotonic()
        if wait > 0:
            time.sleep(wait)
        if params:
            url = f"{url}{'&' if '?' in url else '?'}{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": accept})
        self.requests += 1
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as res:  # noqa: S310 — https URLs from the source registry
                body = res.read(self.max_bytes + 1)
        except urllib.error.HTTPError as exc:
            retry = exc.headers.get("Retry-After", "") if exc.headers else ""
            raise FetchError(url, exc.code, f"retry-after={retry}" if retry else "") from None
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            raise FetchError(url, None, type(exc).__name__) from None
        finally:
            self._last = time.monotonic()
        if len(body) > self.max_bytes:
            raise FetchError(url, 200, "body too large")
        return body

    def json(self, url: str, params: dict[str, Any] | None = None) -> Any:
        body = self._open(url, params, "application/json")
        try:
            return json.loads(body)
        except ValueError:
            raise FetchError(url, 200, "not JSON") from None

    def text(self, url: str, params: dict[str, Any] | None = None) -> str:
        return self._open(url, params, "application/rss+xml, application/xml, text/xml;q=0.9").decode("utf-8", "replace")
