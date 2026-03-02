import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_service_key: str = ""
    anthropic_api_key: str = ""
    solver_timeout: int = 300  # seconds
    representative_days: bool = False
    wacc_default: float = 0.05
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "noreply@azzeroco2.energy"

    model_config = {"env_prefix": "OPTIMIZER_"}


def _load_settings() -> Settings:
    """Load settings with fallback to non-prefixed env vars."""
    s = Settings()
    # Fallback: read from common env var names if OPTIMIZER_ prefixed ones are empty
    if not s.supabase_url:
        s.supabase_url = os.environ.get(
            "NEXT_PUBLIC_SUPABASE_URL",
            os.environ.get("SUPABASE_URL", ""),
        )
    if not s.supabase_service_key:
        s.supabase_service_key = os.environ.get(
            "SUPABASE_SERVICE_ROLE_KEY",
            os.environ.get("SUPABASE_SERVICE_KEY", ""),
        )
    if not s.anthropic_api_key:
        s.anthropic_api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    return s


settings = _load_settings()
