from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

Base = declarative_base()

_engine = None
_SessionLocal = None


def _get_engine():
    global _engine
    if _engine is None:
        database_url = settings.database_url
        if not database_url:
            raise ValueError("DATABASE_URL is not set")
        if database_url.startswith("mysql://"):
            database_url = database_url.replace("mysql://", "mysql+asyncmy://", 1)
        _engine = create_async_engine(database_url, echo=False, future=True)
    return _engine


def _get_session_local():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = async_sessionmaker(_get_engine(), class_=AsyncSession, expire_on_commit=False)
    return _SessionLocal


async def get_db():
    async with _get_session_local()() as session:
        yield session
