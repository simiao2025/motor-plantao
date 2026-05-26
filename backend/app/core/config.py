
from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App Config
    APP_NAME: str = "Motor de Plantão IA"
    DEBUG: bool = False
    PORT: int = 8000
    PUBLIC_URL: str = "https://your-public-url.com" # Importante para Webhooks
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Supabase (Obrigatórios)
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: SecretStr
    SUPABASE_SERVICE_ROLE_KEY: SecretStr

    # Evolution API (Obrigatórios)
    EVOLUTION_API_URL: str
    EVOLUTION_GLOBAL_API_KEY: SecretStr

    # AI Config
    LLM_PROVIDER: str = "openai" # "openai" ou "groq"
    LLM_MODEL: str = "gpt-4o"
    OPENAI_API_KEY: SecretStr = Field(default=None)
    GROQ_API_KEY: SecretStr = Field(default=None)

    # Email / Resend
    RESEND_API_KEY: str = None
    RESEND_FROM_EMAIL: str = "onboarding@resend.dev"

    # Security
    SECRET_KEY: SecretStr
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

# Instância global de configurações
settings = Settings()
