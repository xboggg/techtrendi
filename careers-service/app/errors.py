"""Standard error body (Blueprint §17): code, safe message, request_id, optional field errors.

Never expose stack traces or SQL. Every response carries X-Request-ID.
"""
from __future__ import annotations

import logging
import uuid

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

log = logging.getLogger("careers.errors")


class ApiError(Exception):
    def __init__(self, status: int, code: str, message: str, fields: dict | None = None):
        self.status, self.code, self.message, self.fields = status, code, message, fields or None


def _body(code: str, message: str, request_id: str, fields: dict | None = None) -> dict:
    body = {"code": code, "message": message, "request_id": request_id}
    if fields:
        body["fields"] = fields
    return body


def request_id_of(request: Request) -> str:
    return getattr(request.state, "request_id", "unknown")


def install(app: FastAPI) -> None:
    @app.middleware("http")
    async def _request_id(request: Request, call_next):
        rid = request.headers.get("x-request-id") or uuid.uuid4().hex[:16]
        # bound length: a client-supplied header must not become a log-injection vector
        request.state.request_id = rid[:64]
        response = await call_next(request)
        response.headers["X-Request-ID"] = request.state.request_id
        return response

    @app.exception_handler(ApiError)
    async def _api_error(request: Request, exc: ApiError):
        return JSONResponse(status_code=exc.status, content=_body(exc.code, exc.message, request_id_of(request), exc.fields))

    @app.exception_handler(RequestValidationError)
    async def _validation(request: Request, exc: RequestValidationError):
        fields = {}
        for err in exc.errors():
            loc = ".".join(str(p) for p in err.get("loc", []) if p not in ("query", "body", "path"))
            fields[loc or "_"] = err.get("msg", "invalid")
        return JSONResponse(status_code=422, content=_body("validation_error", "Request is invalid", request_id_of(request), fields))

    @app.exception_handler(StarletteHTTPException)
    async def _http(request: Request, exc: StarletteHTTPException):
        code = {401: "unauthenticated", 403: "forbidden", 404: "not_found", 429: "rate_limited"}.get(exc.status_code, "http_error")
        headers = dict(exc.headers or {})
        return JSONResponse(status_code=exc.status_code, headers=headers,
                            content=_body(code, str(exc.detail) if exc.detail else code, request_id_of(request)))

    @app.exception_handler(Exception)
    async def _unhandled(request: Request, exc: Exception):
        log.exception("unhandled error request_id=%s", request_id_of(request))
        return JSONResponse(status_code=500, content=_body("internal_error", "Something went wrong", request_id_of(request)))
