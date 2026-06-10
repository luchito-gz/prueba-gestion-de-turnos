"""
Router REST para Profesionales.
Todos los endpoints están protegidos por JWT (Depends(get_current_negocio))
y operan SOLO sobre los recursos del negocio autenticado (multitenancy).
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.negocio import Negocio
from app.schemas.profesional import ProfesionalCreate, ProfesionalOut
from app.security import get_current_negocio
from app.services import profesionales_service
from app.services.profesionales_service import RecursoNoEncontrado


router = APIRouter()


@router.get(
    "",
    response_model=List[ProfesionalOut],
    summary="Listar profesionales del negocio",
)
def listar_profesionales(
    db: Session = Depends(get_db),
    negocio: Negocio = Depends(get_current_negocio),
):
    return profesionales_service.get_profesionales(db, negocio.id)


@router.post(
    "",
    response_model=ProfesionalOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un profesional",
)
def crear_profesional(
    payload: ProfesionalCreate,
    db: Session = Depends(get_db),
    negocio: Negocio = Depends(get_current_negocio),
):
    return profesionales_service.create_profesional(db, negocio.id, payload)


@router.delete(
    "/{profesional_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Desactivar (soft-delete) un profesional",
)
def eliminar_profesional(
    profesional_id: int,
    db: Session = Depends(get_db),
    negocio: Negocio = Depends(get_current_negocio),
):
    try:
        profesionales_service.delete_profesional(db, negocio.id, profesional_id)
    except RecursoNoEncontrado as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))
    return None
