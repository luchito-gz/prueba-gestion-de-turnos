"""
Schema de respuesta para el endpoint GET /disponibilidad.
"""
from pydantic import BaseModel


class SlotDisponibilidad(BaseModel):
    """Representa un slot horario y su estado de disponibilidad."""
    hora: str          # Formato "HH:MM", ej: "09:00", "14:30"
    disponible: bool   # True = libre, False = ocupado
