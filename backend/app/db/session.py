import os
import contextlib
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, scoped_session

# Resolve default sqlite database path inside backend/data/
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BACKEND_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

DEFAULT_DB_FILE = os.path.join(DATA_DIR, "inspections.db")
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DEFAULT_DB_FILE.replace(os.sep, '/')}")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

ScopedSession = scoped_session(SessionLocal)
Base = declarative_base()

def init_db():
    """Create all tables in the database."""
    from . import models  # Ensure all models are registered
    Base.metadata.create_all(bind=engine)
    print(f"[Database] Initialized SQLite/SQLAlchemy schema at: {DATABASE_URL}")

@contextlib.contextmanager
def get_db():
    """Provide a transactional database session scope."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
