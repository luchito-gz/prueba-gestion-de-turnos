"""
Modelo Turno — la entidad central del producto.
Une Negocio + Profesional + Cliente en una franja horaria con un estado.
"""
import enum

from sqlalchemy import (
    Column,
    String,
    Integer,
    DateTime,
    ForeignKey,
    Enum as SAEnum,
    Index,
)
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import IDMixin, TimestampMixin


class EstadoTurno(str, enum.Enum):
    """Máquina de estados del turno."""
    PENDIENTE = "pendiente"
    CONFIRMADO = "confirmado"
    CANCELADO = "cancelado"
    REPROGRAMADO = "reprogramado"
    COMPLETADO = "completado"


class Turno(Base, IDMixin, TimestampMixin):
    __tablename__ = "turnos"
    __table_args__ = (
        # Acelera la consulta más frecuente: agenda diaria por profesional
        Index("ix_turno_profesional_fecha", "profesional_id", "fecha_hora"),
        Index("ix_turno_negocio_fecha", "negocio_id", "fecha_hora"),
    )

    negocio_id = Column(
        Integer,
        ForeignKey("negocios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    profesional_id = Column(
        Integer,
        ForeignKey("profesionales.id", ondelete="CASCADE"),
        nullable=False,
    )
    cliente_id = Column(
        Integer,
        ForeignKey("clientes.id", ondelete="CASCADE"),
        nullable=False,
    )

    fecha_hora = Column(DateTime(timezone=True), nullable=False, index=True)
    duracion_min = Column(Integer, default=30, nullable=False)
    estado = Column(
        SAEnum(
            EstadoTurno,
            name="estado_turno",
            values_callable=lambda x: [e.value for e in x],
        ),
        default=EstadoTurno.PENDIENTE,
        nullable=False,
        index=True,
    )
    notas = Column(String(500), nullable=True)
    # Para deduplicar reservas creadas desde WhatsApp (S2)
    origen = Column(String(20), default="panel", nullable=False)  # panel | whatsapp

    # Relaciones
    negocio = relationship("Negocio", back_populates="turnos")
    profesional = relationship("Profesional", back_populates="turnos")
    cliente = relationship("Cliente", back_populates="turnos")

    def __repr__(self) -> str:
        return f"<Turno id={self.id} fecha={self.fecha_hora} estado={self.estado}>"
