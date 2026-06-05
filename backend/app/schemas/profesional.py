"""
Schemas Pydantic para Profesional.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---- Base compartido ----
class ProfesionalBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=120)
    especialidad: Optional[str] = Field(default=None, max_length=120)
    email: Optional[EmailStr] = None


# ---- Crear ----
class ProfesionalCreate(ProfesionalBase):
    """Payload para POST /profesionales."""
    pass


# ---- Respuesta ----
class ProfesionalOut(ProfesionalBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    negocio_id: int
    activo: bool
    created_at: datetime
    updated_at: datetime
