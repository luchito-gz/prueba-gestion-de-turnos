"""
Dependencias compartidas para los routers FastAPI.
La principal: get_db() — abre y cierra una sesión de BD por request.
"""
from typing import Generator

from app.database import SessionLocal


def get_db() -> Generator:
    """
    Genera una sesión de SQLAlchemy por request HTTP.
    Garantiza el cierre incluso si el handler explota.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
