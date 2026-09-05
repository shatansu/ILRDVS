"""
Database Configuration & Session Management for BhoomiVerify AI.
MySQL only via PyMySQL — no SQLite fallback.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

# MySQL connection URL
mysql_url = (
    f"mysql+pymysql://{settings.MYSQL_USER}:{settings.MYSQL_PASSWORD}@"
    f"{settings.MYSQL_HOST}:{settings.MYSQL_PORT}/{settings.MYSQL_DB}"
)

engine = create_engine(mysql_url, pool_pre_ping=True)
print(f"[Database] MySQL -> {settings.MYSQL_HOST}:{settings.MYSQL_PORT}/{settings.MYSQL_DB}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
