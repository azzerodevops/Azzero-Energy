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


settings = Settings()
