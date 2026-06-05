"""
Lógica de negocio para Clientes.
Multitenancy estricto: todas las operaciones filtran por negocio_id.
"""
from typing import List

from sqlalchemy.orm import Session

from app.models import Cliente
from app.schemas.cliente import ClienteCreate


class RecursoNoEncontrado(Exception):
    """Cliente inexistente o no pertenece al negocio."""


class ClienteDuplicado(Exception):
    """Ya existe un cliente con ese teléfono en el negocio."""


def get_clientes(db: Session, negocio_id: int) -> List[Cliente]:
    """Devuelve todos los clientes del negocio."""
    return (
        db.query(Cliente)
        .filter(Cliente.negocio_id == negocio_id)
        .order_by(Cliente.nombre.asc())
        .all()
    )


def create_cliente(
    db: Session, negocio_id: int, data: ClienteCreate
) -> Cliente:
    """
    Crea un nuevo cliente en el negocio actual.
    El número de teléfono debe ser único por negocio (constraint en BD).
    """
    existente = (
        db.query(Cliente)
        .filter(
            Cliente.negocio_id == negocio_id,
            Cliente.telefono == data.telefono,
        )
        .first()
    )
    if existente:
        raise ClienteDuplicado(
            f"Ya existe un cliente con teléfono {data.telefono} en este negocio"
        )

    cliente = Cliente(
        negocio_id=negocio_id,
        nombre=data.nombre,
        telefono=data.telefono,
        email=data.email,
        notas=data.notas,
    )
    db.add(cliente)
    db.commit()
    db.refresh(cliente)
    return cliente


def delete_cliente(
    db: Session, negocio_id: int, cliente_id: int
) -> None:
    """
    Hard-delete del cliente.
    Verifica ownership antes de eliminar.
    """
    cliente = (
        db.query(Cliente)
        .filter(
            Cliente.id == cliente_id,
            Cliente.negocio_id == negocio_id,
        )
        .first()
    )
    if not cliente:
        raise RecursoNoEncontrado(
            f"Cliente {cliente_id} no existe en este negocio"
        )
    db.delete(cliente)
    db.commit()
