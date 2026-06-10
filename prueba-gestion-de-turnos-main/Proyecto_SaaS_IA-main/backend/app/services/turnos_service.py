"""
Logica de negocio para Turnos.
Mantener la logica fuera del router permite reusarla desde el chatbot (S2)
y testearla sin levantar la API.
"""
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy.orm import Session, selectinload

from app.models import Turno, Profesional, Cliente, EstadoTurno
from app.schemas.turno import TurnoCreate, TurnoUpdate


class TurnoConflicto(Exception):
    """Se intento crear un turno superpuesto con otro existente."""


class RecursoNoEncontrado(Exception):
    """Turno / profesional / cliente inexistente para este negocio."""


def _aware(dt: datetime) -> datetime:
    """Normaliza a timezone-aware (UTC) si viene naive."""
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


def _validar_pertenencia(
    db: Session, negocio_id: int, profesional_id: int, cliente_id: int
) -> None:
    """
    Verifica que profesional y cliente existan y pertenezcan al negocio.
    Multitenancy: ningun negocio puede tocar recursos de otro.
    """
    prof = (
        db.query(Profesional)
        .filter(Profesional.id == profesional_id, Profesional.negocio_id == negocio_id)
        .first()
    )
    if not prof:
        raise RecursoNoEncontrado(f"Profesional {profesional_id} inexistente")

    cli = (
        db.query(Cliente)
        .filter(Cliente.id == cliente_id, Cliente.negocio_id == negocio_id)
        .first()
    )
    if not cli:
        raise RecursoNoEncontrado(f"Cliente {cliente_id} inexistente")


def _hay_solapamiento(
    db: Session,
    profesional_id: int,
    inicio: datetime,
    duracion_min: int,
    excluir_id: Optional[int] = None,
) -> bool:
    """
    Detecta si el rango [inicio, inicio+duracion) pisa otro turno activo.
    Trae candidatos cercanos (ventana 8h) y compara en Python para soportar
    SQLite/PostgreSQL sin tocar SQL crudo.
    """
    inicio = _aware(inicio)
    fin = inicio + timedelta(minutes=duracion_min)
    ventana_inicio = inicio - timedelta(hours=8)
    ventana_fin = fin + timedelta(hours=8)

    estados_activos = [EstadoTurno.PENDIENTE, EstadoTurno.CONFIRMADO]
    q = db.query(Turno).filter(
        Turno.profesional_id == profesional_id,
        Turno.estado.in_(estados_activos),
        Turno.fecha_hora >= ventana_inicio,
        Turno.fecha_hora <= ventana_fin,
    )
    if excluir_id:
        q = q.filter(Turno.id != excluir_id)

    for t in q.all():
        t_inicio = _aware(t.fecha_hora)
        t_fin = t_inicio + timedelta(minutes=t.duracion_min)
        # Solapamiento clasico: A.start < B.end AND A.end > B.start
        if t_inicio < fin and t_fin > inicio:
            return True
    return False


def crear_turno(db: Session, negocio_id: int, payload: TurnoCreate) -> Turno:
    _validar_pertenencia(db, negocio_id, payload.profesional_id, payload.cliente_id)

    if _hay_solapamiento(
        db, payload.profesional_id, payload.fecha_hora, payload.duracion_min
    ):
        raise TurnoConflicto(
            "El profesional ya tiene un turno activo en ese horario"
        )

    turno = Turno(
        negocio_id=negocio_id,
        profesional_id=payload.profesional_id,
        cliente_id=payload.cliente_id,
        fecha_hora=payload.fecha_hora,
        duracion_min=payload.duracion_min,
        estado=EstadoTurno.PENDIENTE,
        notas=payload.notas,
        origen=payload.origen,
    )
    db.add(turno)
    db.commit()
    db.refresh(turno)
    # BUG 2: Recargar con relaciones para que TurnoOut serialice cliente/profesional
    return (
        db.query(Turno)
        .options(selectinload(Turno.cliente), selectinload(Turno.profesional))
        .filter(Turno.id == turno.id)
        .first()
    )


def listar_turnos(
    db: Session,
    negocio_id: int,
    desde: Optional[datetime] = None,
    hasta: Optional[datetime] = None,
    estado: Optional[EstadoTurno] = None,
    profesional_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Turno]:
    # BUG 2: selectinload evita N+1 al serializar cliente y profesional
    q = (
        db.query(Turno)
        .options(selectinload(Turno.cliente), selectinload(Turno.profesional))
        .filter(Turno.negocio_id == negocio_id)
    )
    if desde:
        q = q.filter(Turno.fecha_hora >= desde)
    if hasta:
        q = q.filter(Turno.fecha_hora <= hasta)
    if estado:
        q = q.filter(Turno.estado == estado)
    if profesional_id:
        q = q.filter(Turno.profesional_id == profesional_id)
    return q.order_by(Turno.fecha_hora.asc()).offset(skip).limit(limit).all()


def obtener_turno(db: Session, negocio_id: int, turno_id: int) -> Turno:
    # BUG 2: selectinload para relaciones en detalle de turno
    turno = (
        db.query(Turno)
        .options(selectinload(Turno.cliente), selectinload(Turno.profesional))
        .filter(Turno.id == turno_id, Turno.negocio_id == negocio_id)
        .first()
    )
    if not turno:
        raise RecursoNoEncontrado(f"Turno {turno_id} no existe")
    return turno


def actualizar_turno(
    db: Session, negocio_id: int, turno_id: int, payload: TurnoUpdate
) -> Turno:
    turno = obtener_turno(db, negocio_id, turno_id)

    data = payload.model_dump(exclude_unset=True)

    nuevo_prof = data.get("profesional_id", turno.profesional_id)
    nuevo_cli = data.get("cliente_id", turno.cliente_id)
    if "profesional_id" in data or "cliente_id" in data:
        _validar_pertenencia(db, negocio_id, nuevo_prof, nuevo_cli)

    nueva_fecha = data.get("fecha_hora", turno.fecha_hora)
    nueva_duracion = data.get("duracion_min", turno.duracion_min)
    campos_horario = set(["fecha_hora", "duracion_min", "profesional_id"])
    if campos_horario & set(data.keys()):
        if _hay_solapamiento(
            db, nuevo_prof, nueva_fecha, nueva_duracion, excluir_id=turno.id
        ):
            raise TurnoConflicto("El nuevo horario se superpone con otro turno")

    for k, v in data.items():
        setattr(turno, k, v)

    db.commit()
    db.refresh(turno)
    # Retornar con relaciones cargadas
    return obtener_turno(db, negocio_id, turno_id)


def eliminar_turno(db: Session, negocio_id: int, turno_id: int) -> None:
    """Soft-delete: marca como cancelado. No borra historicamente."""
    turno = obtener_turno(db, negocio_id, turno_id)
    turno.estado = EstadoTurno.CANCELADO
    db.commit()
