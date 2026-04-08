import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "BrainVision API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "postgresql://brainvision:brainvision@db:5432/brainvision"
    )

    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production-super-secret-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # ML Model
    MODEL_PATH: str = os.getenv("MODEL_PATH", "/app/models/inception_v3_brain_tumor.h5")
    MODEL_INPUT_SIZE: int = 299  # InceptionV3 default
    CONFIDENCE_THRESHOLD: float = 0.5

    # Upload
    MAX_FILE_SIZE_MB: int = 10
    UPLOAD_DIR: str = "/tmp/uploads"

    # CORS
    ALLOWED_ORIGINS: list = ["http://localhost:3000", "http://frontend:3000"]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
