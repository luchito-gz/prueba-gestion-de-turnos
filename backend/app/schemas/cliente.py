"""
Schemas Pydantic para Cliente.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---- Base compartido ----
class ClienteBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=120)
    telefono: str = Field(..., min_length=7, max_length=20)
    email: Optional[EmailStr] = None
    notas: Optional[str] = Field(default=None, max_length=500)


# ---- Crear ----
class ClienteCreate(ClienteBase):
    """Payload para POST /clientes."""
    pass


# ---- Respuesta ----
class ClienteOut(ClienteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    negocio_id: int
    created_at: datetime
    updated_at: datetime
