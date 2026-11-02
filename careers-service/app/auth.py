"""Supabase Auth JWT verification (Blueprint §14: validate signature, issuer, audience, expiry).

Supports HS256 with the project JWT secret (self-hosted default) or asymmetric
keys via a JWKS URL. Verification never trusts the token header's `alg` beyond
the configured family.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Annotated

import jwt
from fastapi import Depends, Header

from .config import Settings, get_settings
from .errors import ApiError

_jwks_client: jwt.PyJWKClient | None = None


@dataclass(frozen=True)
class CurrentUser:
    id: str
    role: str
    email_verified: bool


def _decode(token: str, settings: Settings) -> dict:
    global _jwks_client
    options = {"require": ["exp", "sub", "aud"]}
    kwargs: dict = {"audience": settings.jwt_audience}
    if settings.jwt_issuer:
        kwargs["issuer"] = settings.jwt_issuer
    if settings.jwt_secret:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"], options=options, **kwargs)
    if settings.jwks_url:
        if _jwks_client is None:
            _jwks_client = jwt.PyJWKClient(settings.jwks_url, cache_keys=True, lifespan=3600)
        key = _jwks_client.get_signing_key_from_jwt(token).key
        return jwt.decode(token, key, algorithms=["RS256", "ES256"], options=options, **kwargs)
    raise ApiError(503, "auth_unavailable", "Authentication is not configured")


def _bearer(authorization: str | None) -> str | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise ApiError(401, "unauthenticated", "Malformed Authorization header")
    return token


def optional_user(
    authorization: Annotated[str | None, Header()] = None,
    settings: Settings = Depends(get_settings),
) -> CurrentUser | None:
    token = _bearer(authorization)
    if token is None:
        return None
    try:
        claims = _decode(token, settings)
    except jwt.ExpiredSignatureError:
        raise ApiError(401, "token_expired", "Session has expired")
    except jwt.PyJWTError:
        raise ApiError(401, "unauthenticated", "Invalid token")
    return CurrentUser(
        id=str(claims["sub"]),
        role=str(claims.get("role", "authenticated")),
        email_verified=bool(claims.get("user_metadata", {}).get("email_verified", False)),
    )


def require_user(user: CurrentUser | None = Depends(optional_user)) -> CurrentUser:
    if user is None:
        raise ApiError(401, "unauthenticated", "Sign in required")
    return user
