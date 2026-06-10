from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "TurnoIA"
    ENVIRONMENT: str = "development"

    # Base de datos
    DATABASE_URL: str

    # Twilio (C1 — WhatsApp webhook)
    # TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN cubren twilio_account_sid/twilio_auth_token (mismo env var)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_NUMBER: str = ""
    twilio_whatsapp_from: str = ""  # número en formato whatsapp:+14155238886

    # JWT (S1)
    JWT_SECRET_KEY: str = "dev_secret_change_me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
