#!/usr/bin/env bash
# ============================================================
# Script de commits del Sprint 1 - TurnoIA
# Ejecutar desde la raíz del repo: bash scripts/commit_sprint1.sh
# Prerequisito: estar en la rama develop.
# ============================================================
set -e

cd "$(dirname "$0")/.."

# Sanity: estamos en develop
RAMA="$(git rev-parse --abbrev-ref HEAD)"
if [ "$RAMA" != "develop" ]; then
  echo "ERROR: estás en '$RAMA'. Cambiate a develop con: git checkout develop"
  exit 1
fi

# Limpiar SQLite de smoke tests (no debe ir al repo)
rm -f backend/test_smoke.db backend/test_smoke.db-journal 2>/dev/null || true

# ----- 1) chore: gitignore + gitattributes -----
git add .gitignore .gitattributes
git commit -m "chore(repo): agregar .gitattributes y proteger archivos *.db en gitignore

- .gitattributes: normaliza finales de línea (LF) entre Windows/Linux/macOS
- .gitignore: excluye SQLite local generado por smoke tests"

# ----- 2) feat(S1) Modelos + Alembic -----
git add backend/app/models/base.py \
        backend/app/models/negocio.py \
        backend/app/models/profesional.py \
        backend/app/models/cliente.py \
        backend/app/models/turno.py \
        backend/app/models/__init__.py \
        backend/alembic.ini \
        backend/alembic/env.py \
        backend/alembic/script.py.mako \
        backend/alembic/versions/20260429_0001_initial_schema.py
git commit -m "feat(S1)(models): modelos SQLAlchemy + migración inicial Alembic

Modelos:
- Negocio (tenant raíz, multitenancy)
- Profesional (FK negocio)
- Cliente (FK negocio, único por telefono+negocio)
- Turno (FK negocio/profesional/cliente, enum estado)

Estados de turno: pendiente | confirmado | cancelado | reprogramado | completado.
Mixins compartidos (id, created_at, updated_at) en base.py.
Alembic configurado con DATABASE_URL desde Settings.
Migración 0001_initial_schema lista para 'alembic upgrade head'.

Tarjeta Trello: S1 [BACKEND] Modelo de datos con SQLAlchemy"

# ----- 3) feat(S1) Auth JWT -----
git add backend/app/security.py \
        backend/app/dependencies.py \
        backend/app/schemas/auth.py \
        backend/app/services/auth_service.py \
        backend/app/routers/auth.py \
        backend/app/config.py \
        backend/app/schemas/__init__.py \
        backend/app/services/__init__.py \
        backend/.env.example
git commit -m "feat(S1)(auth): autenticación JWT (registro, login, /me)

- bcrypt para hashing (passlib)
- JWT HS256 con python-jose, expiración configurable por env
- Endpoints: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
- Dependency get_current_negocio() para proteger endpoints
- Validación de email + slug únicos por negocio
- 401 ante token inválido / negocio inactivo

Tarjeta Trello: S1 [BACKEND] Autenticación JWT para el negocio"

# ----- 4) feat(S1) CRUD turnos -----
git add backend/app/schemas/turno.py \
        backend/app/services/turnos_service.py \
        backend/app/routers/turnos.py \
        backend/main.py \
        backend/requirements.txt
git commit -m "feat(S1)(turnos): CRUD REST de turnos con multitenancy

Endpoints (todos requieren JWT):
- POST   /api/turnos
- GET    /api/turnos (filtros: desde, hasta, estado, profesional_id, paginación)
- GET    /api/turnos/{id}
- PATCH  /api/turnos/{id}
- DELETE /api/turnos/{id} (soft-delete: pasa a 'cancelado')

Reglas de negocio:
- Multitenancy estricto: cada negocio solo ve/edita sus propios recursos
- Detección de solapamientos por profesional (ventana ±8h, comparación timezone-aware)
- Validación de pertenencia profesional+cliente al negocio autenticado

Verificado con 17 smoke tests funcionales (register, login, CRUD,
multitenancy, validaciones, conflictos, soft-delete).

Tarjeta Trello: S1 [BACKEND] CRUD de turnos - endpoints REST"

echo ""
echo "============================================================"
echo "OK - 4 commits creados en develop. Próximos pasos:"
echo "  git log --oneline -5         # verificar"
echo "  git push origin develop      # cuando estés seguro"
echo "============================================================"
