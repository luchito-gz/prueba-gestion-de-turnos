"""
Router REST para Disponibilidad.
GET /api/disponibilidad?profesional_id=1&fecha=2026-05-05

Retorna los slots horarios del día (09:00–17:30 cada 30 min)
indicando cuáles están libres u ocupados para un profesional dado.
Requiere JWT — solo expone datos del negocio autenticado (multitenancy).
"""
from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.negocio import Negocio
from app.schemas.disponibilidad import SlotDisponibilidad
from app.security import get_current_negocio
from app.services.disponibilidad_service import (
    ProfesionalNoEncontrado,
    get_disponibilidad,
)

router = APIRouter()


@router.get(
    "",
    response_model=List[SlotDisponibilidad],
    summary="Horarios libres de un profesional para una fecha",
    description=(
        "Devuelve los 18 slots de 30 minutos del día laboral (09:00–17:30). "
        "Cada slot indica si está **disponible** (sin turno activo) u **ocupado**. "
        "Solo se consultan profesionales del negocio autenticado (multitenancy)."
    ),
)
def listar_disponibilidad(
    profesional_id: int = Query(..., gt=0, description="ID del profesional"),
    fecha: date = Query(..., description="Fecha a consultar (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    negocio: Negocio = Depends(get_current_negocio),
) -> List[SlotDisponibilidad]:
    try:
        return get_disponibilidad(db, negocio.id, profesional_id, fecha)
    except ProfesionalNoEncontrado as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
