"""
Utilidades de seguridad: hashing de contraseñas y emisión/validación de JWT.
Centralizadas para que solo este archivo conozca los detalles criptográficos.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.dependencies import get_db
from app.models.negocio import Negocio


# Bcrypt: estándar de la industria. 12 rounds por defecto.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2: FastAPI inyecta el header Authorization: Bearer <token>
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ---------- Hashing ----------
def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed: str) -> bool:
    return pwd_context.verify(plain_password, hashed)


# ---------- JWT ----------
def crear_access_token(
    subject: str | int, expires_delta: Optional[timedelta] = None
) -> tuple[str, int]:
    """Devuelve (token, expires_in_seconds)."""
    expire_minutes = settings.JWT_EXPIRE_MINUTES
    if expires_delta:
        expire_minutes = int(expires_delta.total_seconds() // 60)

    expire = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)
    to_encode = {"sub": str(subject), "exp": expire}
    token = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token, expire_minutes * 60


def decodificar_token(token: str) -> dict:
    """Decodifica el JWT y devuelve el payload. Lanza HTTPException si es inválido."""
    try:
        return jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ---------- Dependencia de FastAPI ----------
def get_current_negocio(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Negocio:
    """
    Dependencia que extrae el Negocio (tenant) autenticado a partir del token.
    Se inyecta en cualquier endpoint protegido con Depends(get_current_negocio).
    """
    payload = decodificar_token(token)
    sub = payload.get("sub")
    if sub is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token sin subject"
        )

    try:
        negocio_id = int(sub)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token con subject inválido"
        )

    negocio = db.query(Negocio).filter(Negocio.id == negocio_id).first()
    if not negocio or not negocio.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Negocio inexistente o inactivo"
        )
    return negocio
