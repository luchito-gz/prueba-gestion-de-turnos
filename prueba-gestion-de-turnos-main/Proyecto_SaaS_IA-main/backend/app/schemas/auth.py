"""
Schemas para registro, login y respuestas con token.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class NegocioRegister(BaseModel):
    """Payload del registro de un nuevo Negocio (tenant)."""
    nombre: str = Field(..., min_length=2, max_length=120)
    slug: str = Field(..., min_length=2, max_length=60, pattern="^[a-z0-9-]+$")
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
    telefono_whatsapp: Optional[str] = Field(default=None, max_length=20)


class NegocioLogin(BaseModel):
    email: EmailStr
    password: str


class NegocioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    slug: str
    email: EmailStr
    telefono_whatsapp: Optional[str]
    plan: str
    activo: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # segundos


class TokenPayload(BaseModel):
    """Lo que va dentro del JWT."""
    sub: str  # negocio_id como string (estándar JWT)
    exp: int
