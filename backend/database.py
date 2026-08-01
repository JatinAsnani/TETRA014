import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

_default_mysql = "mysql+pymysql://root:YOUR_MYSQL_PASSWORD@localhost:3306/tallai"
DATABASE_URL = os.getenv("DATABASE_URL", _default_mysql)

if os.getenv("USE_SQLITE", "").lower() in ("1", "true", "yes"):
    DATABASE_URL = "sqlite:///./tallai.db"
elif "YOUR_MYSQL_PASSWORD" in DATABASE_URL:
    DATABASE_URL = "sqlite:///./tallai.db"

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=3600, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
