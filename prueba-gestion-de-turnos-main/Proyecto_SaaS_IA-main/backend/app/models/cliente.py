"""
Modelo Cliente — paciente / persona que reserva turnos.
Identificado por su número de WhatsApp (canal principal del MVP).
"""
from sqlalchemy import Column, String, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import IDMixin, TimestampMixin


class Cliente(Base, IDMixin, TimestampMixin):
    __tablename__ = "clientes"
    # Un mismo número de WhatsApp solo puede existir una vez por negocio
    __table_args__ = (
        UniqueConstraint("negocio_id", "telefono", name="uq_cliente_negocio_telefono"),
    )

    negocio_id = Column(
        Integer,
        ForeignKey("negocios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    nombre = Column(String(120), nullable=False)
    telefono = Column(String(20), nullable=False, index=True)
    email = Column(String(120), nullable=True)
    notas = Column(String(500), nullable=True)

    # Relaciones
    negocio = relationship("Negocio", back_populates="clientes")
    turnos = relationship(
        "Turno",
        back_populates="cliente",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Cliente id={self.id} telefono={self.telefono}>"
