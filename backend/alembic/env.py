"""
Entry point de Alembic.
Toma la DATABASE_URL desde la config de la app (Pydantic Settings),
y registra la metadata de SQLAlchemy para autogenerar migraciones.
"""
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# Importamos config y modelos de la app
from app.config import settings
from app.database import Base

# IMPORTANTE: importar todos los modelos para que Base.metadata los conozca
from app.models import Negocio, Profesional, Cliente, Turno  # noqa: F401

config = context.config

# Inyecta la URL real de la BD desde Settings
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Genera SQL sin conectar a la BD (útil para entornos sin acceso)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Aplica las migraciones conectándose a la BD."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
