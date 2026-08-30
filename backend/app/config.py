from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_DAYS: int
    EXCHANGE_RATE_API_URL: str
    ENV: str = "development"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Environmental security validations on startup
if settings.ENV == "production":
    if settings.SECRET_KEY == "your-secret-key-here-change-in-production":
        raise ValueError(
            "CRITICAL SECURITY ERROR: The default SECRET_KEY placeholder must NOT be used in a production environment!"
        )
    if len(settings.SECRET_KEY) < 32:
        raise ValueError(
            "CRITICAL SECURITY ERROR: The SECRET_KEY must be at least 32 characters long in a production environment!"
        )
    if "strongpassword123" in settings.DATABASE_URL:
        raise ValueError(
            "CRITICAL SECURITY ERROR: The default database password 'strongpassword123' must NOT be used in a production environment!"
        )
