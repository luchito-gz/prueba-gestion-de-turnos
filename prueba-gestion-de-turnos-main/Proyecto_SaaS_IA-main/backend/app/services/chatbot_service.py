"""
Servicio de chatbot para reserva de turnos por WhatsApp.

Implementa una máquina de estados en memoria (por número de WhatsApp)
que guía al usuario paso a paso: nombre → fecha → profesional → horario → confirmación.

Estado en memoria: clave = número WhatsApp, valor = {"estado": str, "datos": dict}
⚠️ En producción esto debería migrar a Redis para persistir entre reinicios.
"""
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models import Cliente, EstadoTurno, Profesional, Turno
from app.services.disponibilidad_service import ProfesionalNoEncontrado, get_disponibilidad

# ── Estado en memoria ──────────────────────────────────────────────────────────
sesiones: dict = {}

ESTADOS = {
    "INICIO":                "inicio",
    "ESPERANDO_NOMBRE":      "esperando_nombre",
    "ESPERANDO_FECHA":       "esperando_fecha",
    "ESPERANDO_PROFESIONAL": "esperando_profesional",
    "ESPERANDO_HORARIO":     "esperando_horario",
    "CONFIRMANDO":           "confirmando",
}

# Negocio demo hardcodeado hasta que haya auth por WhatsApp
NEGOCIO_ID_DEMO = 1


# ── Helpers de parsing ─────────────────────────────────────────────────────────

def parsear_fecha(texto: str) -> Optional[date]:
    """Parsea fecha en formato DD/MM/YYYY o DD-MM-YYYY. Retorna None si falla."""
    for fmt in ("%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(texto.strip(), fmt).date()
        except ValueError:
            continue
    return None


def es_intencion_reserva(msg: str) -> bool:
    keywords = ["turno", "reservar", "sacar", "quiero", "hola", "necesito", "agendar"]
    return any(k in msg.lower() for k in keywords)


def es_intencion_cancelacion(msg: str) -> bool:
    keywords = ["cancelar", "no puedo", "borrar", "eliminar"]
    return any(k in msg.lower() for k in keywords)


def _telefono_limpio(from_number: str) -> str:
    """Quita el prefijo 'whatsapp:' del número (ej: 'whatsapp:+5491...' → '+5491...')."""
    return from_number.replace("whatsapp:", "")


# ── Máquina de estados principal ───────────────────────────────────────────────

def procesar_mensaje(from_number: str, mensaje: str, db: Session) -> str:
    msg = mensaje.strip()
    sesion = sesiones.get(from_number, {"estado": ESTADOS["INICIO"], "datos": {}})
    estado = sesion["estado"]
    datos = sesion["datos"]

    # ── Cancelación desde cualquier estado ────────────────────────────────────
    if es_intencion_cancelacion(msg) and estado != ESTADOS["INICIO"]:
        sesiones.pop(from_number, None)
        return "❌ Reserva cancelada. Cuando quieras, escribí *turno* para empezar de nuevo."

    # ── INICIO ────────────────────────────────────────────────────────────────
    if estado == ESTADOS["INICIO"]:
        if es_intencion_reserva(msg):
            sesiones[from_number] = {"estado": ESTADOS["ESPERANDO_NOMBRE"], "datos": {}}
            return "👋 ¡Hola! Soy el asistente de TurnoIA.\n\n¿Cuál es tu nombre completo?"
        return "Hola 👋 Escribí *turno* para reservar un turno."

    # ── ESPERANDO NOMBRE ──────────────────────────────────────────────────────
    elif estado == ESTADOS["ESPERANDO_NOMBRE"]:
        if len(msg) < 2:
            return "Por favor ingresá tu nombre completo."
        datos["nombre"] = msg
        sesiones[from_number] = {"estado": ESTADOS["ESPERANDO_FECHA"], "datos": datos}
        return f"Perfecto, *{msg}*. 📅 ¿Para qué fecha querés el turno? (formato DD/MM/YYYY)"

    # ── ESPERANDO FECHA ───────────────────────────────────────────────────────
    elif estado == ESTADOS["ESPERANDO_FECHA"]:
        fecha = parsear_fecha(msg)
        if not fecha:
            return "⚠️ No entendí la fecha. Por favor usá el formato *DD/MM/YYYY* (ej: 25/05/2026)"
        if fecha < date.today():
            return "⚠️ La fecha no puede ser en el pasado. Ingresá una fecha válida."

        datos["fecha"] = fecha.isoformat()

        profesionales = (
            db.query(Profesional)
            .filter(
                Profesional.negocio_id == NEGOCIO_ID_DEMO,
                Profesional.activo == True,  # noqa: E712
            )
            .all()
        )
        if not profesionales:
            sesiones.pop(from_number, None)
            return "⚠️ No hay profesionales disponibles. Contactá al consultorio."

        datos["profesionales"] = [{"id": p.id, "nombre": p.nombre} for p in profesionales]
        lista = "\n".join([f"  *{i+1}.* {p.nombre}" for i, p in enumerate(profesionales)])
        sesiones[from_number] = {"estado": ESTADOS["ESPERANDO_PROFESIONAL"], "datos": datos}
        return f"👨‍⚕️ ¿Con qué profesional?\n\n{lista}\n\nRespondé con el número."

    # ── ESPERANDO PROFESIONAL ─────────────────────────────────────────────────
    elif estado == ESTADOS["ESPERANDO_PROFESIONAL"]:
        try:
            opcion = int(msg) - 1
            profesionales = datos["profesionales"]
            if opcion < 0 or opcion >= len(profesionales):
                raise ValueError
        except ValueError:
            return "Por favor respondé con el número del profesional."

        datos["profesional_id"] = profesionales[opcion]["id"]
        datos["profesional_nombre"] = profesionales[opcion]["nombre"]

        # Consultar slots a través del servicio real (no el router)
        try:
            todos_los_slots = get_disponibilidad(
                db=db,
                negocio_id=NEGOCIO_ID_DEMO,
                profesional_id=datos["profesional_id"],
                fecha=date.fromisoformat(datos["fecha"]),
            )
        except ProfesionalNoEncontrado:
            sesiones.pop(from_number, None)
            return "⚠️ No se encontró ese profesional. Escribí *turno* para empezar de nuevo."

        # Filtrar solo los libres y extraer string de hora
        slots_libres = [s.hora for s in todos_los_slots if s.disponible]

        if not slots_libres:
            sesiones[from_number] = {"estado": ESTADOS["ESPERANDO_FECHA"], "datos": datos}
            return (
                f"😕 No hay horarios disponibles con *{datos['profesional_nombre']}* "
                f"para esa fecha.\n¿Querés probar otra fecha? (DD/MM/YYYY)"
            )

        datos["slots"] = slots_libres
        lista = "\n".join([f"  *{i+1}.* {s}" for i, s in enumerate(slots_libres)])
        sesiones[from_number] = {"estado": ESTADOS["ESPERANDO_HORARIO"], "datos": datos}
        return (
            f"🕐 Horarios disponibles con *{datos['profesional_nombre']}*:\n\n"
            f"{lista}\n\nRespondé con el número."
        )

    # ── ESPERANDO HORARIO ─────────────────────────────────────────────────────
    elif estado == ESTADOS["ESPERANDO_HORARIO"]:
        try:
            opcion = int(msg) - 1
            slots = datos["slots"]
            if opcion < 0 or opcion >= len(slots):
                raise ValueError
        except ValueError:
            return "Por favor respondé con el número del horario."

        datos["horario"] = slots[opcion]
        sesiones[from_number] = {"estado": ESTADOS["CONFIRMANDO"], "datos": datos}
        return (
            f"📋 *Resumen del turno:*\n"
            f"👤 Paciente: {datos['nombre']}\n"
            f"👨‍⚕️ Profesional: {datos['profesional_nombre']}\n"
            f"📅 Fecha: {datos['fecha']}\n"
            f"🕐 Horario: {datos['horario']}\n\n"
            f"¿Confirmás? Respondé *SÍ* o *NO*"
        )

    # ── CONFIRMANDO ───────────────────────────────────────────────────────────
    elif estado == ESTADOS["CONFIRMANDO"]:
        if msg.lower() in ["sí", "si", "s", "yes", "confirmo", "ok"]:
            telefono = _telefono_limpio(from_number)

            # Buscar cliente por teléfono único (UniqueConstraint negocio+telefono)
            cliente = (
                db.query(Cliente)
                .filter(
                    Cliente.negocio_id == NEGOCIO_ID_DEMO,
                    Cliente.telefono == telefono,
                )
                .first()
            )
            if not cliente:
                cliente = Cliente(
                    nombre=datos["nombre"],
                    telefono=telefono,
                    negocio_id=NEGOCIO_ID_DEMO,
                )
                db.add(cliente)
                db.flush()  # obtener cliente.id sin commitear aún
            else:
                # Actualizar nombre si el cliente ya existía
                cliente.nombre = datos["nombre"]

            # Parsear fecha y hora → datetime aware UTC
            fecha = date.fromisoformat(datos["fecha"])
            hora_str = datos["horario"]  # formato "HH:MM"
            hora_h, hora_m = map(int, hora_str.split(":"))
            fecha_hora = datetime(
                fecha.year, fecha.month, fecha.day, hora_h, hora_m,
                tzinfo=timezone.utc,
            )

            turno = Turno(
                cliente_id=cliente.id,
                profesional_id=datos["profesional_id"],
                negocio_id=NEGOCIO_ID_DEMO,
                fecha_hora=fecha_hora,
                duracion_min=30,
                estado=EstadoTurno.PENDIENTE,
                origen="whatsapp",
            )
            db.add(turno)
            db.commit()
            db.refresh(turno)

            sesiones.pop(from_number, None)
            return (
                f"✅ ¡Turno confirmado!\n"
                f"📋 N° {turno.id}\n"
                f"📅 {fecha.strftime('%d/%m/%Y')} a las {hora_str}\n"
                f"👨‍⚕️ {datos['profesional_nombre']}\n\n"
                f"Te esperamos 😊"
            )

        elif msg.lower() in ["no", "n"]:
            sesiones.pop(from_number, None)
            return "❌ Turno cancelado. Escribí *turno* cuando quieras reservar."

        else:
            return "Respondé *SÍ* para confirmar o *NO* para cancelar."

    # ── Estado desconocido — resetear ─────────────────────────────────────────
    sesiones.pop(from_number, None)
    return "Algo salió mal. Escribí *turno* para empezar de nuevo."
