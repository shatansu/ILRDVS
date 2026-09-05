import os
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

# Load .env before any os.getenv() call
load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

BASE_DIR = Path(__file__).resolve().parent.parent.parent
STORAGE_DIR = BASE_DIR / "storage"

class Settings(BaseModel):
    PROJECT_NAME: str = "BhoomiVerify AI"
    API_V1_STR: str = "/api"
    
    STORAGE_DIR: Path = STORAGE_DIR
    ORIGINALS_DIR: Path = STORAGE_DIR / "originals"
    NORMALIZED_DIR: Path = STORAGE_DIR / "normalized"
    PROCESSED_DIR: Path = STORAGE_DIR / "processed"
    PREVIEWS_DIR: Path = STORAGE_DIR / "previews"
    
    # Database Settings (MySQL default with fallback)
    MYSQL_USER: str = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "password")
    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT: str = os.getenv("MYSQL_PORT", "3306")
    MYSQL_DB: str = os.getenv("MYSQL_DB", "bhoomiverify_db")
    
    # Allowed CORS Origins
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001"
    ]

settings = Settings()

# Ensure directories exist
for folder in [settings.ORIGINALS_DIR, settings.NORMALIZED_DIR, settings.PROCESSED_DIR, settings.PREVIEWS_DIR]:
    folder.mkdir(parents=True, exist_ok=True)
