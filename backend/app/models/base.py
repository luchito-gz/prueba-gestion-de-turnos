"""
Mixins comunes para todos los modelos SQLAlchemy.
Centraliza columnas que se repiten (timestamps, id) para evitar duplicación.
"""
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer
from sqlalchemy.sql import func


class TimestampMixin:
    """Agrega created_at y updated_at gestionados por la BD."""
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class IDMixin:
    """PK numérica autoincremental estándar."""
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
