"""
Lógica de registro y login de Negocios (tenants).
"""
from sqlalchemy.orm import Session

from app.models.negocio import Negocio
from app.schemas.auth import NegocioRegister
from app.security import hash_password, verify_password


class CredencialesInvalidas(Exception):
    """Login con email/password incorrectos."""


class NegocioYaExiste(Exception):
    """Slug o email ya registrados."""


def registrar_negocio(db: Session, payload: NegocioRegister) -> Negocio:
    # Unicidad de email y slug
    existente = (
        db.query(Negocio)
        .filter((Negocio.email == payload.email) | (Negocio.slug == payload.slug))
        .first()
    )
    if existente:
        campo = "email" if existente.email == payload.email else "slug"
        raise NegocioYaExiste(f"Ya existe un negocio con ese {campo}")

    negocio = Negocio(
        nombre=payload.nombre,
        slug=payload.slug,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        telefono_whatsapp=payload.telefono_whatsapp,
    )
    db.add(negocio)
    db.commit()
    db.refresh(negocio)
    return negocio


def autenticar_negocio(db: Session, email: str, password: str) -> Negocio:
    negocio = db.query(Negocio).filter(Negocio.email == email).first()
    if not negocio or not verify_password(password, negocio.hashed_password):
        raise CredencialesInvalidas("Email o password incorrectos")
    if not negocio.activo:
        raise CredencialesInvalidas("Negocio inactivo")
    return negocio
