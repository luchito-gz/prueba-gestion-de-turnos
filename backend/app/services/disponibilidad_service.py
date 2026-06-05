"""
Lógica de negocio para disponibilidad de profesionales.

Genera los slots horarios del día (09:00-18:00 cada 30 min) y marca
cada uno como libre u ocupado según los turnos activos del profesional.

Multitenancy estricto: verifica que el profesional pertenezca al negocio
autenticado antes de consultar la agenda.
"""
from datetime import date, datetime, timedelta, timezone
from typing import List

from sqlalchemy.orm import Session

from app.models import EstadoTurno, Profesional, Turno
from app.schemas.disponibilidad import SlotDisponibilidad

# ── Configuración de horario (hardcoded, configurable a futuro) ──────────────
HORA_INICIO = 9    # 09:00
HORA_FIN = 18      # 18:00 (exclusivo — el último slot arranca a las 17:30)
SLOT_MINUTOS = 30

# Estados que BLOQUEAN un slot (turnos activos u ocupados)
# CANCELADO y REPROGRAMADO liberan el horario
ESTADOS_BLOQUEANTES = [
    EstadoTurno.PENDIENTE,
    EstadoTurno.CONFIRMADO,
    EstadoTurno.COMPLETADO,
]


class ProfesionalNoEncontrado(Exception):
    """El profesional no existe o no pertenece al negocio autenticado."""


# ── Helpers ──────────────────────────────────────────────────────────────────

def _aware(dt: datetime) -> datetime:
    """Normaliza un datetime a timezone-aware UTC si viene naive."""
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


def _generar_slots(fecha: date) -> List[datetime]:
    """
    Genera todos los slots de trabajo del día como datetimes naive.
    Resultado: [09:00, 09:30, 10:00, ..., 17:30] → 18 slots.
    """
    slots: List[datetime] = []
    cursor = datetime(fecha.year, fecha.month, fecha.day, HORA_INICIO, 0)
    fin_dia = datetime(fecha.year, fecha.month, fecha.day, HORA_FIN, 0)
    while cursor < fin_dia:
        slots.append(cursor)
        cursor += timedelta(minutes=SLOT_MINUTOS)
    return slots


# ── Función principal ─────────────────────────────────────────────────────────

def get_disponibilidad(
    db: Session,
    negocio_id: int,
    profesional_id: int,
    fecha: date,
) -> List[SlotDisponibilidad]:
    """
    Retorna la lista de slots horarios del día con su estado de disponibilidad.

    Flujo:
        1. Verifica ownership (multitenancy): profesional ∈ negocio.
        2. Trae todos los turnos bloqueantes del profesional en ese día.
        3. Pre-calcula los rangos [inicio, fin) de cada turno.
        4. Por cada slot, aplica el test de solapamiento clásico y marca
           disponible=True/False.
    """
    # 1. Guard: ownership check ────────────────────────────────────────────────
    profesional = (
        db.query(Profesional)
        .filter(
            Profesional.id == profesional_id,
            Profesional.negocio_id == negocio_id,
            Profesional.activo == True,  # noqa: E712
        )
        .first()
    )
    if not profesional:
        raise ProfesionalNoEncontrado(
            f"Profesional {profesional_id} no existe en este negocio"
        )

    # 2. Turnos del día ────────────────────────────────────────────────────────
    # Ventana: desde las 00:00 hasta las 23:59:59 del día solicitado.
    # _aware() garantiza consistencia con la columna DateTime(timezone=True).
    dia_inicio = _aware(datetime(fecha.year, fecha.month, fecha.day, 0, 0, 0))
    dia_fin = _aware(datetime(fecha.year, fecha.month, fecha.day, 23, 59, 59))

    turnos = (
        db.query(Turno)
        .filter(
            Turno.profesional_id == profesional_id,
            Turno.estado.in_(ESTADOS_BLOQUEANTES),
            Turno.fecha_hora >= dia_inicio,
            Turno.fecha_hora <= dia_fin,
        )
        .all()
    )

    # 3. Pre-calcular rangos [inicio, fin) de cada turno ──────────────────────
    rangos_ocupados = [
        (
            _aware(t.fecha_hora),
            _aware(t.fecha_hora) + timedelta(minutes=t.duracion_min),
        )
        for t in turnos
    ]

    # 4. Evaluar solapamiento por slot ─────────────────────────────────────────
    resultado: List[SlotDisponibilidad] = []

    for slot_inicio in _generar_slots(fecha):
        slot_inicio_aware = _aware(slot_inicio)
        slot_fin_aware = slot_inicio_aware + timedelta(minutes=SLOT_MINUTOS)

        disponible = True
        for t_inicio, t_fin in rangos_ocupados:
            # Test de solapamiento clásico: A.start < B.end AND B.start < A.end
            if t_inicio < slot_fin_aware and t_fin > slot_inicio_aware:
                disponible = False
                break  # Con uno que pise es suficiente

        resultado.append(
            SlotDisponibilidad(
                hora=slot_inicio.strftime("%H:%M"),
                disponible=disponible,
            )
        )

    return resultado
