from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

app = FastAPI(
    title="TurnoIA API",
    description="API REST para el sistema de gestion de turnos con IA",
    version="0.1.0",
)

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://proyecto-saa-s-ia.vercel.app",
    "https://proyecto-saa-s-ia-git-develop-malbarenquedevs-projects.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de routers
from app.routers import auth, turnos, profesionales, clientes, disponibilidad
from app.routers import webhook

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(turnos.router, prefix="/api/turnos", tags=["turnos"])
app.include_router(profesionales.router, prefix="/api/profesionales", tags=["profesionales"])
app.include_router(clientes.router, prefix="/api/clientes", tags=["clientes"])
app.include_router(disponibilidad.router, prefix="/api/disponibilidad", tags=["disponibilidad"])
app.include_router(webhook.router, prefix="/api", tags=["webhook"])


@app.get("/", tags=["health"])
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}
