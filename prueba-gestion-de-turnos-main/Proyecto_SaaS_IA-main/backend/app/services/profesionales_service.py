"""
Lógica de negocio para Profesionales.
Multitenancy estricto: todas las operaciones filtran por negocio_id.
"""
from typing import List

from sqlalchemy.orm import Session

from app.models import Profesional
from app.schemas.profesional import ProfesionalCreate


class RecursoNoEncontrado(Exception):
    """Profesional inexistente o no pertenece al negocio."""


def get_profesionales(db: Session, negocio_id: int) -> List[Profesional]:
    """Devuelve todos los profesionales activos del negocio."""
    return (
        db.query(Profesional)
        .filter(Profesional.negocio_id == negocio_id, Profesional.activo == True)
        .order_by(Profesional.nombre.asc())
        .all()
    )


def create_profesional(
    db: Session, negocio_id: int, data: ProfesionalCreate
) -> Profesional:
    """Crea un nuevo profesional en el negocio actual."""
    profesional = Profesional(
        negocio_id=negocio_id,
        nombre=data.nombre,
        especialidad=data.especialidad,
        email=data.email,
        activo=True,
    )
    db.add(profesional)
    db.commit()
    db.refresh(profesional)
    return profesional


def delete_profesional(
    db: Session, negocio_id: int, profesional_id: int
) -> None:
    """
    Soft-delete: marca al profesional como inactivo.
    Verifica que el profesional pertenezca al negocio (ownership).
    """
    profesional = (
        db.query(Profesional)
        .filter(
            Profesional.id == profesional_id,
            Profesional.negocio_id == negocio_id,
        )
        .first()
    )
    if not profesional:
        raise RecursoNoEncontrado(
            f"Profesional {profesional_id} no existe en este negocio"
        )
    profesional.activo = False
    db.commit()
