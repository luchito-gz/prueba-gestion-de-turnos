"""
Router de autenticación: registro y login de Negocios.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.negocio import Negocio
from app.schemas.auth import NegocioRegister, NegocioLogin, NegocioOut, Token
from app.security import crear_access_token, get_current_negocio
from app.services import auth_service
from app.services.auth_service import CredencialesInvalidas, NegocioYaExiste


router = APIRouter()


@router.post(
    "/register",
    response_model=NegocioOut,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un nuevo negocio (tenant)",
)
def register(payload: NegocioRegister, db: Session = Depends(get_db)):
    try:
        return auth_service.registrar_negocio(db, payload)
    except NegocioYaExiste as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e))


@router.post("/login", response_model=Token, summary="Login con email + password")
def login(payload: NegocioLogin, db: Session = Depends(get_db)):
    try:
        negocio = auth_service.autenticar_negocio(db, payload.email, payload.password)
    except CredencialesInvalidas as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, str(e))

    token, expires_in = crear_access_token(subject=negocio.id)
    return Token(access_token=token, expires_in=expires_in)


@router.get("/me", response_model=NegocioOut, summary="Datos del negocio autenticado")
def me(negocio: Negocio = Depends(get_current_negocio)):
    return negocio
