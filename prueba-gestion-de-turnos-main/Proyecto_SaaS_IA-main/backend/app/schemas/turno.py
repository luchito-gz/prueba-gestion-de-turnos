"""
Schemas Pydantic para Turno.
Separamos schema de creacion, actualizacion y respuesta para que la API
nunca exponga campos internos ni acepte campos que no debe.
"""
from datetime import datetime, timedelta
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, computed_field

from app.models.turno import EstadoTurno


# ---- Schemas anidados (BUG 2) ----
class ClienteBasico(BaseModel):
    """Representacion minima de cliente para incluir en TurnoOut."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str


class ProfesionalBasico(BaseModel):
    """Representacion minima de profesional para incluir en TurnoOut."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str


# ---- Base compartido ----
class TurnoBase(BaseModel):
    profesional_id: int = Field(..., gt=0)
    cliente_id: int = Field(..., gt=0)
    fecha_hora: datetime
    duracion_min: int = Field(default=30, ge=5, le=480)
    notas: Optional[str] = Field(default=None, max_length=500)


# ---- Crear ----
class TurnoCreate(TurnoBase):
    """Lo que el cliente envia en POST /turnos."""
    origen: str = Field(default="panel", pattern="^(panel|whatsapp)$")


# ---- Actualizar ----
class TurnoUpdate(BaseModel):
    """Todos los campos opcionales. El negocio actualiza solo lo necesario."""
    profesional_id: Optional[int] = Field(default=None, gt=0)
    cliente_id: Optional[int] = Field(default=None, gt=0)
    fecha_hora: Optional[datetime] = None
    duracion_min: Optional[int] = Field(default=None, ge=5, le=480)
    estado: Optional[EstadoTurno] = None
    notas: Optional[str] = Field(default=None, max_length=500)


# ---- Respuesta ----
class TurnoOut(TurnoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    negocio_id: int
    estado: EstadoTurno
    origen: str
    created_at: datetime
    updated_at: datetime

    # BUG 2: Objetos anidados en lugar de IDs crudos
    cliente: ClienteBasico
    profesional: ProfesionalBasico

    # BUG 1: Alias que el frontend espera (fecha_inicio / fecha_fin)
    @computed_field  # type: ignore[misc]
    @property
    def fecha_inicio(self) -> datetime:
        """Alias de fecha_hora para compatibilidad con el frontend."""
        return self.fecha_hora

    @computed_field  # type: ignore[misc]
    @property
    def fecha_fin(self) -> datetime:
        """Hora de fin calculada: fecha_hora + duracion_min."""
        return self.fecha_hora + timedelta(minutes=self.duracion_min)
