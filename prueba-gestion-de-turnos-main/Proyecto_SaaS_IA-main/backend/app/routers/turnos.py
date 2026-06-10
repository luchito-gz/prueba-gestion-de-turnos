"""
Router REST para Turnos.
Todos los endpoints estan protegidos por JWT (Depends(get_current_negocio))
y operan SOLO sobre los recursos del negocio autenticado (multitenancy).
"""
from datetime import date, datetime, time, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.negocio import Negocio
from app.models.turno import EstadoTurno
from app.schemas.turno import TurnoCreate, TurnoUpdate, TurnoOut
from app.security import get_current_negocio
from app.services import turnos_service
from app.services.turnos_service import TurnoConflicto, RecursoNoEncontrado


router = APIRouter()


@router.post(
    "",
    response_model=TurnoOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un turno",
)
def crear_turno(
    payload: TurnoCreate,
    db: Session = Depends(get_db),
    negocio: Negocio = Depends(get_current_negocio),
):
    try:
        return turnos_service.crear_turno(db, negocio.id, payload)
    except RecursoNoEncontrado as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))
    except TurnoConflicto as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e))


@router.get(
    "",
    response_model=List[TurnoOut],
    summary="Listar turnos del negocio (con filtros opcionales)",
)
def listar_turnos(
    # BUG 3: nuevo parametro ?fecha=YYYY-MM-DD; convierte a desde/hasta automaticamente
    fecha: Optional[date] = Query(default=None, description="Filtrar por dia exacto (YYYY-MM-DD)"),
    desde: Optional[datetime] = Query(default=None),
    hasta: Optional[datetime] = Query(default=None),
    estado: Optional[EstadoTurno] = Query(default=None),
    profesional_id: Optional[int] = Query(default=None, gt=0),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    negocio: Negocio = Depends(get_current_negocio),
):
    # Si se recibe ?fecha=, construir rango 00:00:00 - 23:59:59 en UTC
    if fecha is not None:
        desde = datetime.combine(fecha, time.min).replace(tzinfo=timezone.utc)
        hasta = datetime.combine(fecha, time.max).replace(tzinfo=timezone.utc)

    return turnos_service.listar_turnos(
        db,
        negocio.id,
        desde=desde,
        hasta=hasta,
        estado=estado,
        profesional_id=profesional_id,
        skip=skip,
        limit=limit,
    )


@router.get("/{turno_id}", response_model=TurnoOut, summary="Obtener un turno por id")
def obtener_turno(
    turno_id: int,
    db: Session = Depends(get_db),
    negocio: Negocio = Depends(get_current_negocio),
):
    try:
        return turnos_service.obtener_turno(db, negocio.id, turno_id)
    except RecursoNoEncontrado as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))


@router.patch("/{turno_id}", response_model=TurnoOut, summary="Actualizar un turno")
def actualizar_turno(
    turno_id: int,
    payload: TurnoUpdate,
    db: Session = Depends(get_db),
    negocio: Negocio = Depends(get_current_negocio),
):
    try:
        return turnos_service.actualizar_turno(db, negocio.id, turno_id, payload)
    except RecursoNoEncontrado as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))
    except TurnoConflicto as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e))


@router.delete(
    "/{turno_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancelar (soft-delete) un turno",
)
def eliminar_turno(
    turno_id: int,
    db: Session = Depends(get_db),
    negocio: Negocio = Depends(get_current_negocio),
):
    try:
        turnos_service.eliminar_turno(db, negocio.id, turno_id)
    except RecursoNoEncontrado as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))
    return None
