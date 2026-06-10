from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Motor de conexión a la base de datos
engine = create_engine(settings.DATABASE_URL)

# Fábrica de sesiones — cada request HTTP obtiene su propia sesión
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Clase base que heredan todos los modelos SQLAlchemy
Base = declarative_base()
