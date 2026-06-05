"""
Modelo Profesional — quien atiende los turnos.
Pertenece a un Negocio (multitenancy: aislamiento por negocio_id).
"""
from sqlalchemy import Column, String, Boolean, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import IDMixin, TimestampMixin


class Profesional(Base, IDMixin, TimestampMixin):
    __tablename__ = "profesionales"

    negocio_id = Column(
        Integer,
        ForeignKey("negocios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    nombre = Column(String(120), nullable=False)
    especialidad = Column(String(120), nullable=True)
    email = Column(String(120), nullable=True)
    activo = Column(Boolean, default=True, nullable=False)

    # Relaciones
    negocio = relationship("Negocio", back_populates="profesionales")
    turnos = relationship(
        "Turno",
        back_populates="profesional",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Profesional id={self.id} nombre={self.nombre}>"
