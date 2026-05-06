from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, SecretStr
import os

class Settings(BaseSettings):
    # App Config
    APP_NAME: str = "Motor de Plantão IA"
    DEBUG: bool = False
    PORT: int = 8000
    PUBLIC_URL: str = "https://your-public-url.com" # Importante para Webhooks

    # Supabase (Obrigatórios)
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: SecretStr
    SUPABASE_SERVICE_ROLE_KEY: SecretStr

    # Evolution API (Obrigatórios)
    EVOLUTION_API_URL: str
    EVOLUTION_GLOBAL_API_KEY: SecretStr

    # AI Config
    OPENAI_API_KEY: SecretStr

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
