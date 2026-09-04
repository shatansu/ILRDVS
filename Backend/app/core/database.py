"""
Database Configuration & Session Management for BhoomiVerify AI.
Uses MySQL via PyMySQL, with graceful SQLite fallback if MySQL is offline.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

# Construct MySQL connection URL
mysql_url = (
    f"mysql+pymysql://{settings.MYSQL_USER}:{settings.MYSQL_PASSWORD}@"
    f"{settings.MYSQL_HOST}:{settings.MYSQL_PORT}/{settings.MYSQL_DB}"
)

# Attempt to connect to MySQL, fallback to SQLite if offline
engine = None
try:
    # Test connection with short timeout
    temp_engine = create_engine(mysql_url, connect_args={"connect_timeout": 2})
    with temp_engine.connect():
        pass
    engine = temp_engine
    print(f"[Database] Connected to MySQL database: {settings.MYSQL_DB}")
except Exception as e:
    sqlite_path = settings.STORAGE_DIR / "bhoomiverify.db"
    engine = create_engine(
        f"sqlite:///{sqlite_path}",
        connect_args={"check_same_thread": False}
    )
    print(f"[Database] MySQL not reachable ({str(e)[:60]}...). Active fallback to SQLite: {sqlite_path}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
