import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./friday.db")

if os.getenv("USE_SQLITE", "true").lower() in ("1", "true", "yes"):
    if DATABASE_URL.startswith("mysql") or "YOUR_MYSQL" in DATABASE_URL:
        DATABASE_URL = "sqlite:///./friday.db"

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=3600, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def run_migrations():
    """Ensure missing columns in SQLite database tables are added automatically."""
    if not DATABASE_URL.startswith("sqlite"):
        return
    try:
        with engine.connect() as conn:
            result = conn.execute(text("PRAGMA table_info(users)")).fetchall()
            existing_cols = {row[1] for row in result}
            if existing_cols:
                if "org_pass_hash" not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN org_pass_hash VARCHAR(255)"))
                if "parent_id" not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN parent_id INTEGER"))
                if "role" not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'admin'"))
                conn.commit()
    except Exception as e:
        print(f"[Database Migration Note] {e}")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
