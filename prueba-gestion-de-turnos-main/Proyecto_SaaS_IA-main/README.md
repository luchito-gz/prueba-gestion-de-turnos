# TurnoIA — Asistente de Turnos con IA

**Materia:** Desarrollo de Software 2026 | **Grupo 2**
**Entrega final:** 17 de junio de 2026
**Metodología:** Scrum — Sprints semanales

---

## Descripción

TurnoIA es una plataforma SaaS que permite a consultorios y negocios de servicios gestionar sus turnos a través de dos canales: un panel web y un chatbot de WhatsApp.

El cliente objetivo es el profesional independiente o consultorio pequeño (médicos, psicólogos, peluquerías, estudios contables) que hoy coordina turnos por teléfono o WhatsApp manual, perdiendo tiempo y perdiendo reservas.

La plataforma les ofrece:
- Un panel web para ver y administrar la agenda diaria.
- Un chatbot de WhatsApp que atiende a los pacientes 24/7 y crea el turno directamente en la base de datos, sin intervención humana.

---

## Stack tecnológico

| Capa | Tecnología | Por qué se eligió |
|---|---|---|
| Backend | Python 3.11 + FastAPI | Alto rendimiento async, tipado con Pydantic, docs automáticas con Swagger |
| ORM / Migraciones | SQLAlchemy 2 + Alembic | Estándar de la industria en Python; migraciones declarativas |
| Base de datos | PostgreSQL en Supabase | Gratis en tier gratuito, acceso desde cualquier entorno, compatible con Railway |
| Frontend | React 18 + Vite | SPA moderna, HMR rápido, compatible con Vercel sin configuración |
| Autenticación | JWT (python-jose + passlib) | Sin estado, funciona bien para APIs REST multitenancy |
| Mensajería | Twilio WhatsApp Business API | Sandbox gratuito para desarrollo, escalable a producción |
| Deploy Backend | Railway (rama `main`) | Deploy automático desde GitHub, soporte nativo para Python |
| Deploy Frontend | Vercel | CDN global, deploy automático desde GitHub, preview por PR |

---

## Arquitectura

```
Usuario web
    └─► Vercel (React SPA)
            └─► Railway (FastAPI) ─► Supabase (PostgreSQL)

Paciente WhatsApp
    └─► Twilio
            └─► Railway (FastAPI) ─► Supabase (PostgreSQL)
                  [POST /api/webhook/whatsapp]
                  [Chatbot máquina de estados]
```

El backend es el único punto de escritura en la base de datos. El frontend consume la API REST con JWT. El webhook de WhatsApp recibe los mensajes de Twilio, los procesa con una máquina de estados en memoria y crea los turnos directamente en PostgreSQL.

**Multitenancy:** cada negocio tiene su propio `negocio_id`. Todas las queries filtran por `negocio_id` extraído del JWT, garantizando aislamiento de datos entre clientes.

---

## Cómo correr el proyecto localmente

### Requisitos

- Python 3.11+
- Node.js 18+
- Git
- Una base de datos PostgreSQL (local o Supabase gratuito)

### Backend

```bash
# 1. Clonar el repositorio
git clone https://github.com/M-albarenque-dev/Proyecto_SaaS_IA.git
cd Proyecto_SaaS_IA/backend

# 2. Crear y activar el entorno virtual
python -m venv venv

# Windows (Git Bash):
source venv/Scripts/activate
# Mac / Linux:
source venv/bin/activate
# Confirmación: debe aparecer el prefijo (venv) en la terminal.

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar variables de entorno
cp .env.example .env
# Editá .env y completá DATABASE_URL con tu conexión PostgreSQL.

# 5. Levantar el servidor
uvicorn main:app --reload
```

Verificación: `http://localhost:8000` debe responder `{"status": "ok", "app": "TurnoIA"}`.
Documentación interactiva: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend

# Configurar variables de entorno
cp .env.example .env
# Verificar que VITE_API_URL=http://localhost:8000

# Instalar dependencias
npm install

# Levantar el servidor de desarrollo
npm run dev
```

Verificación: `http://localhost:5173` debe mostrar el panel de login de TurnoIA.

---

## Variables de entorno

Las variables se configuran en `backend/.env`. Ver `backend/.env.example` para la plantilla completa.

| Variable | Descripción | Dónde obtenerla |
|---|---|---|
| `DATABASE_URL` | URL de conexión PostgreSQL | Supabase → Project Settings → Database → Connection string |
| `JWT_SECRET_KEY` | Clave secreta para firmar tokens | Generar con `python -c "import secrets; print(secrets.token_hex(32))"` |
| `JWT_ALGORITHM` | Algoritmo de firma JWT | Dejar `HS256` |
| `JWT_EXPIRE_MINUTES` | Expiración del token en minutos | `1440` (24 horas) por defecto |
| `TWILIO_ACCOUNT_SID` | ID de cuenta Twilio | [console.twilio.com](https://console.twilio.com) |
| `TWILIO_AUTH_TOKEN` | Token de autenticación Twilio | [console.twilio.com](https://console.twilio.com) |
| `TWILIO_WHATSAPP_NUMBER` | Número del negocio (ej: `+5491112345678`) | Panel Twilio → WhatsApp Sender |
| `TWILIO_WHATSAPP_FROM` | Número de origen Twilio Sandbox | Panel Twilio → Sandbox (ej: `whatsapp:+14155238886`) |

Para el frontend, configurar en `frontend/.env`:

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base del backend (ej: `http://localhost:8000` o la URL de Railway en producción) |

---

## Endpoints principales

Todos los endpoints (excepto auth y webhook) requieren JWT en el header: `Authorization: Bearer <token>`.

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Registrar un nuevo negocio | No |
| `POST` | `/api/auth/login` | Login — devuelve JWT | No |
| `GET` | `/api/auth/me` | Datos del negocio autenticado | Sí |
| `POST` | `/api/turnos` | Crear turno | Sí |
| `GET` | `/api/turnos` | Listar turnos (filtros: fecha, estado, profesional) | Sí |
| `GET` | `/api/turnos/{id}` | Obtener turno por ID | Sí |
| `PATCH` | `/api/turnos/{id}` | Actualizar turno (estado, notas) | Sí |
| `DELETE` | `/api/turnos/{id}` | Eliminar turno | Sí |
| `GET` | `/api/disponibilidad` | Slots libres por profesional y fecha | Sí |
| `GET` | `/api/profesionales` | Listar profesionales del negocio | Sí |
| `POST` | `/api/profesionales` | Crear profesional | Sí |
| `DELETE` | `/api/profesionales/{id}` | Eliminar profesional | Sí |
| `GET` | `/api/clientes` | Listar clientes del negocio | Sí |
| `POST` | `/api/clientes` | Crear cliente | Sí |
| `DELETE` | `/api/clientes/{id}` | Eliminar cliente | Sí |
| `POST` | `/api/webhook/whatsapp` | Recibir mensajes de Twilio WhatsApp | No (firma Twilio) |

Documentación interactiva completa (con esquemas y pruebas en vivo):
`https://proyectosaasia-production.up.railway.app/docs`

---

## Cuenta demo

| | |
|---|---|
| **URL** | https://proyecto-saa-s-ia.vercel.app |
| **Email** | admin@garcia.com |
| **Contraseña** | demo1234 |

La cuenta demo corresponde al **Consultorio Dr. García** con datos precargados: 2 profesionales, 3 clientes y 10 turnos de ejemplo.

---

## Estado del proyecto

| Bloque | Funcionalidad | Estado |
|---|---|---|
| A — Panel web | Login + JWT + multitenancy | ✅ Completo |
| A — Panel web | Agenda diaria, crear/editar/cancelar turnos | ✅ Completo |
| B — Datos | Modelos SQLAlchemy + migraciones Alembic | ✅ Completo |
| B — Datos | API disponibilidad (slots 30 min) | ✅ Completo |
| B — Datos | Seed con datos demo en Supabase | ✅ Completo |
| C — Chatbot | Webhook WhatsApp (Twilio) | ✅ Completo |
| C — Chatbot | Máquina de estados (saludo→nombre→fecha→profesional→horario→confirmación) | ✅ Completo |
| D — IA | Whisper STT (audio .ogg → texto) | 🔄 Pendiente |
| D — IA | Scheduler APScheduler (recordatorio 24h antes del turno) | 🔄 Pendiente |

---

## Equipo

| Integrante | DNI |
|---|---|
| Marcelo Albarenque | 38.406.528 |
| Eric Cuellar | 45.985.676 |
| Luciano Gabriel Zenobio | 44.598.717 |
| Adrian Her Molins | 32.161.709 |
| Melany Lujan Sosa | 45.192.698 |

**Desarrollo de Software 2026**
