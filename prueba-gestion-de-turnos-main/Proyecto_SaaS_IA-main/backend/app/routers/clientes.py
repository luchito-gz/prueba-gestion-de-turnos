"""
Router REST para Clientes.
Todos los endpoints están protegidos por JWT (Depends(get_current_negocio))
y operan SOLO sobre los recursos del negocio autenticado (multitenancy).
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.negocio import Negocio
from app.schemas.cliente import ClienteCreate, ClienteOut
from app.security import get_current_negocio
from app.services import clientes_service
from app.services.clientes_service import RecursoNoEncontrado, ClienteDuplicado


router = APIRouter()


@router.get(
    "",
    response_model=List[ClienteOut],
    summary="Listar clientes del negocio",
)
def listar_clientes(
    db: Session = Depends(get_db),
    negocio: Negocio = Depends(get_current_negocio),
):
    return clientes_service.get_clientes(db, negocio.id)


@router.post(
    "",
    response_model=ClienteOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un cliente",
)
def crear_cliente(
    payload: ClienteCreate,
    db: Session = Depends(get_db),
    negocio: Negocio = Depends(get_current_negocio),
):
    try:
        return clientes_service.create_cliente(db, negocio.id, payload)
    except ClienteDuplicado as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e))


@router.delete(
    "/{cliente_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar un cliente",
)
def eliminar_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    negocio: Negocio = Depends(get_current_negocio),
):
    try:
        clientes_service.delete_cliente(db, negocio.id, cliente_id)
    except RecursoNoEncontrado as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))
    return None
