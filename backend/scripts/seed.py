"""
seed.py — Pobla la base de datos con datos demo para TurnoIA.

Ejecución (desde /backend):
    python scripts/seed.py

Características:
  - Idempotente: no duplica datos si se corre más de una vez.
  - Usa SQLAlchemy directamente (sin pasar por la API HTTP).
  - Imprime un resumen al finalizar.
"""

import sys
import os
from datetime import datetime, timedelta, timezone

# Asegura que Python encuentre el paquete `app` cuando se corre desde /backend
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import Negocio, Profesional, Cliente, Turno, EstadoTurno
from app.security import hash_password


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def slugify(texto: str) -> str:
    """Convierte un string a slug URL-friendly (minúsculas, sin tildes, guiones)."""
    replacements = {
        "á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u",
        "Á": "a", "É": "e", "Í": "i", "Ó": "o", "Ú": "u",
        "ñ": "n", "Ñ": "n", " ": "-", ".": "",
    }
    texto = texto.lower()
    for src, dst in replacements.items():
        texto = texto.replace(src, dst)
    # Eliminar caracteres que no sean alfanuméricos ni guiones
    return "".join(c for c in texto if c.isalnum() or c == "-")


def hora_hoy(hora: int, minuto: int = 0) -> datetime:
    """Devuelve un datetime con zona horaria UTC para hoy a la hora indicada."""
    hoy = datetime.now(timezone.utc).replace(
        hour=hora, minute=minuto, second=0, microsecond=0
    )
    return hoy


def hora_en_dias(dias: int, hora: int, minuto: int = 0) -> datetime:
    """Devuelve un datetime UTC relativo a hoy + N días."""
    return hora_hoy(hora, minuto) + timedelta(days=dias)


# ---------------------------------------------------------------------------
# Seed principal
# ---------------------------------------------------------------------------

def run_seed() -> None:
    db = SessionLocal()
    try:
        contadores = {"negocios": 0, "profesionales": 0, "clientes": 0, "turnos": 0}

        # ------------------------------------------------------------------ #
        # 1. NEGOCIO
        # ------------------------------------------------------------------ #
        NEGOCIO_EMAIL = "admin@garcia.com"
        negocio = db.query(Negocio).filter(Negocio.email == NEGOCIO_EMAIL).first()

        if not negocio:
            negocio = Negocio(
                nombre="Consultorio Dr. García",
                slug=slugify("Consultorio Dr. García"),
                email=NEGOCIO_EMAIL,
                hashed_password=hash_password("demo1234"),
                telefono_whatsapp=None,
                plan="starter",
                activo=True,
            )
            db.add(negocio)
            db.flush()  # Obtiene negocio.id sin cerrar la transacción
            contadores["negocios"] += 1
            print(f"  ➕ Negocio creado: {negocio.nombre} (id={negocio.id})")
        else:
            print(f"  ✔ Negocio ya existe: {negocio.nombre} (id={negocio.id})")

        # ------------------------------------------------------------------ #
        # 2. PROFESIONALES
        # ------------------------------------------------------------------ #
        profesionales_data = [
            {"nombre": "Dr. Marcelo García",  "especialidad": "Clínica General"},
            {"nombre": "Dra. Laura Pérez",    "especialidad": "Pediatría"},
        ]
        profesionales_objs = []

        for pdata in profesionales_data:
            prof = (
                db.query(Profesional)
                .filter(
                    Profesional.negocio_id == negocio.id,
                    Profesional.nombre == pdata["nombre"],
                )
                .first()
            )
            if not prof:
                prof = Profesional(
                    negocio_id=negocio.id,
                    nombre=pdata["nombre"],
                    especialidad=pdata["especialidad"],
                    activo=True,
                )
                db.add(prof)
                db.flush()
                contadores["profesionales"] += 1
                print(f"  ➕ Profesional creado: {prof.nombre} (id={prof.id})")
            else:
                print(f"  ✔ Profesional ya existe: {prof.nombre} (id={prof.id})")
            profesionales_objs.append(prof)

        garcia = profesionales_objs[0]
        perez  = profesionales_objs[1]

        # ------------------------------------------------------------------ #
        # 3. CLIENTES
        # ------------------------------------------------------------------ #
        clientes_data = [
            {"nombre": "Norma González", "telefono": "1122334455"},
            {"nombre": "Olga Martínez",  "telefono": "1199887766"},
            {"nombre": "Carlos Ruiz",    "telefono": "1155443322"},
        ]
        clientes_objs = []

        for cdata in clientes_data:
            cliente = (
                db.query(Cliente)
                .filter(
                    Cliente.negocio_id == negocio.id,
                    Cliente.telefono == cdata["telefono"],
                )
                .first()
            )
            if not cliente:
                cliente = Cliente(
                    negocio_id=negocio.id,
                    nombre=cdata["nombre"],
                    telefono=cdata["telefono"],
                )
                db.add(cliente)
                db.flush()
                contadores["clientes"] += 1
                print(f"  ➕ Cliente creado: {cliente.nombre} (id={cliente.id})")
            else:
                print(f"  ✔ Cliente ya existe: {cliente.nombre} (id={cliente.id})")
            clientes_objs.append(cliente)

        norma, olga, carlos = clientes_objs

        # ------------------------------------------------------------------ #
        # 4. TURNOS — 10 en total
        #
        #   Lógica de idempotencia: verificar (profesional_id, cliente_id, fecha_hora)
        #   Si ya existe ese triple exacto, se omite.
        # ------------------------------------------------------------------ #
        turnos_data = [
            # --- HOY (3 turnos) ---
            {
                "profesional": garcia,  "cliente": norma,
                "fecha_hora": hora_hoy(9, 0),
                "estado": EstadoTurno.CONFIRMADO,
                "notas": "Primera consulta del día",
            },
            {
                "profesional": perez,   "cliente": olga,
                "fecha_hora": hora_hoy(10, 30),
                "estado": EstadoTurno.PENDIENTE,
                "notas": None,
            },
            {
                "profesional": garcia,  "cliente": carlos,
                "fecha_hora": hora_hoy(14, 0),
                "estado": EstadoTurno.CONFIRMADO,
                "notas": "Control de rutina",
            },

            # --- MAÑANA (3 turnos) ---
            {
                "profesional": perez,   "cliente": norma,
                "fecha_hora": hora_en_dias(1, 9, 0),
                "estado": EstadoTurno.PENDIENTE,
                "notas": None,
            },
            {
                "profesional": garcia,  "cliente": olga,
                "fecha_hora": hora_en_dias(1, 11, 0),
                "estado": EstadoTurno.CONFIRMADO,
                "notas": "Seguimiento post-análisis",
            },
            {
                "profesional": perez,   "cliente": carlos,
                "fecha_hora": hora_en_dias(1, 15, 30),
                "estado": EstadoTurno.CANCELADO,
                "notas": "Cancelado por el paciente",
            },

            # --- PASADO MAÑANA (2 turnos) ---
            {
                "profesional": garcia,  "cliente": norma,
                "fecha_hora": hora_en_dias(2, 10, 0),
                "estado": EstadoTurno.PENDIENTE,
                "notas": None,
            },
            {
                "profesional": perez,   "cliente": olga,
                "fecha_hora": hora_en_dias(2, 16, 0),
                "estado": EstadoTurno.PENDIENTE,
                "notas": "Cita de vacunación",
            },

            # --- PASADO (2 turnos — historial) ---
            {
                "profesional": garcia,  "cliente": carlos,
                "fecha_hora": hora_en_dias(-2, 9, 0),
                "estado": EstadoTurno.COMPLETADO,
                "notas": "Consulta completada sin novedades",
            },
            {
                "profesional": perez,   "cliente": norma,
                "fecha_hora": hora_en_dias(-5, 11, 30),
                "estado": EstadoTurno.COMPLETADO,
                "notas": "Control pediátrico",
            },
        ]

        for tdata in turnos_data:
            existe = (
                db.query(Turno)
                .filter(
                    Turno.profesional_id == tdata["profesional"].id,
                    Turno.cliente_id    == tdata["cliente"].id,
                    Turno.fecha_hora    == tdata["fecha_hora"],
                )
                .first()
            )
            if not existe:
                turno = Turno(
                    negocio_id     = negocio.id,
                    profesional_id = tdata["profesional"].id,
                    cliente_id     = tdata["cliente"].id,
                    fecha_hora     = tdata["fecha_hora"],
                    duracion_min   = 30,
                    estado         = tdata["estado"],
                    notas          = tdata["notas"],
                    origen         = "panel",
                )
                db.add(turno)
                contadores["turnos"] += 1
            # (si ya existe, se omite silenciosamente)

        db.commit()

        # ------------------------------------------------------------------ #
        # Resumen final
        # ------------------------------------------------------------------ #
        print()
        print(
            f"✅ Seed completado: "
            f"{contadores['negocios']} negocio, "
            f"{contadores['profesionales']} profesionales, "
            f"{contadores['clientes']} clientes, "
            f"{contadores['turnos']} turnos"
        )
        if any(v == 0 for v in contadores.values()):
            print("   ℹ️  Los registros en 0 ya existían — no se duplicaron.")

    except Exception as exc:
        db.rollback()
        print(f"\n❌ Error durante el seed: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🌱 Iniciando seed de TurnoIA...\n")
    run_seed()
