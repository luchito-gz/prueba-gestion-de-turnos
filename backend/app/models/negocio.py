"""
Modelo Negocio — entidad raíz del sistema multitenancy.
Cada Negocio es un cliente SaaS de TurnoIA (consultorio, peluquería, etc.).
"""
from sqlalchemy import Column, String, Boolean
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import IDMixin, TimestampMixin


class Negocio(Base, IDMixin, TimestampMixin):
    __tablename__ = "negocios"

    nombre = Column(String(120), nullable=False)
    slug = Column(String(60), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    telefono_whatsapp = Column(String(20), nullable=True)
    plan = Column(String(20), default="starter", nullable=False)  # starter | pro | enterprise
    activo = Column(Boolean, default=True, nullable=False)

    # Relaciones — un Negocio tiene muchos Profesionales, Clientes y Turnos
    profesionales = relationship(
        "Profesional",
        back_populates="negocio",
        cascade="all, delete-orphan",
    )
    clientes = relationship(
        "Cliente",
        back_populates="negocio",
        cascade="all, delete-orphan",
    )
    turnos = relationship(
        "Turno",
        back_populates="negocio",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Negocio id={self.id} slug={self.slug}>"
