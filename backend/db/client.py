"""Supabase client — service role for backend ops."""
from functools import lru_cache
from urllib.parse import urlsplit

from supabase import create_client, Client
from pydantic_settings import BaseSettings
from pydantic import field_validator

# The only origin this app will attach a CALL-E bearer token to. `calle_base_url`
# exists so a future official host can be selected, not so the endpoint can be
# pointed anywhere: whoever can set one env var must not be able to redirect the
# API key to a host they control.
OFFICIAL_CALLE_ORIGINS = frozenset({"https://api.heycall-e.com"})


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_role_key: str
    calle_api_key: str
    calle_base_url: str = "https://api.heycall-e.com"
    # CALL-E webhooks are unsigned, so the callback lives on an unguessable
    # path and the receiver re-fetches the call before acting on it.
    calle_webhook_token: str = "change-me"
    resend_api_key: str = ""
    resend_from_email: str = "refcheck@yourdomain.com"
    app_url: str = "http://localhost:3000"
    api_url: str = "http://localhost:8000"
    admin_email: str = ""
    polar_webhook_secret: str = ""
    # Optional dial allowlist (comma-separated E.164). Empty in production,
    # where recruiters supply referee numbers; set it in dev and staging so a
    # misconfigured environment cannot call real people.
    calle_dial_allowlist: str = ""

    @field_validator("calle_base_url")
    @classmethod
    def _pin_calle_origin(cls, value: str) -> str:
        """Refuse to send the API key anywhere but the official HTTPS origin.

        Parsed rather than string-matched, so a suffix look-alike such as
        `https://api.heycall-e.com.evil.example` is rejected.
        """
        parts = urlsplit(value.strip())
        if parts.scheme != "https":
            raise ValueError("CALLE_BASE_URL must use https")
        if parts.username or parts.password:
            raise ValueError("CALLE_BASE_URL must not embed credentials")
        if parts.path.rstrip("/") or parts.query or parts.fragment:
            raise ValueError("CALLE_BASE_URL must be a bare origin")
        origin = f"{parts.scheme}://{parts.netloc}"
        if origin not in OFFICIAL_CALLE_ORIGINS:
            raise ValueError(
                f"Refusing to send CALL-E credentials to {origin!r}. "
                f"Allowed: {', '.join(sorted(OFFICIAL_CALLE_ORIGINS))}"
            )
        return origin

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


@lru_cache()
def get_supabase() -> Client:
    s = get_settings()
    return create_client(s.supabase_url, s.supabase_service_role_key)


# ── Convenience helpers ──────────────────────────────────────────────────────

def db() -> Client:
    return get_supabase()
