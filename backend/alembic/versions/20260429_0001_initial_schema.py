"""initial_schema — S1: negocios, profesionales, clientes, turnos

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-04-29
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ---- negocios ----
    op.create_table(
        "negocios",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("nombre", sa.String(length=120), nullable=False),
        sa.Column("slug", sa.String(length=60), nullable=False),
        sa.Column("email", sa.String(length=120), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("telefono_whatsapp", sa.String(length=20), nullable=True),
        sa.Column("plan", sa.String(length=20), nullable=False, server_default="starter"),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_negocios_id", "negocios", ["id"])
    op.create_index("ix_negocios_slug", "negocios", ["slug"], unique=True)
    op.create_index("ix_negocios_email", "negocios", ["email"], unique=True)

    # ---- profesionales ----
    op.create_table(
        "profesionales",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("negocio_id", sa.Integer(), nullable=False),
        sa.Column("nombre", sa.String(length=120), nullable=False),
        sa.Column("especialidad", sa.String(length=120), nullable=True),
        sa.Column("email", sa.String(length=120), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["negocio_id"], ["negocios.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_profesionales_id", "profesionales", ["id"])
    op.create_index("ix_profesionales_negocio_id", "profesionales", ["negocio_id"])

    # ---- clientes ----
    op.create_table(
        "clientes",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("negocio_id", sa.Integer(), nullable=False),
        sa.Column("nombre", sa.String(length=120), nullable=False),
        sa.Column("telefono", sa.String(length=20), nullable=False),
        sa.Column("email", sa.String(length=120), nullable=True),
        sa.Column("notas", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["negocio_id"], ["negocios.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("negocio_id", "telefono", name="uq_cliente_negocio_telefono"),
    )
    op.create_index("ix_clientes_id", "clientes", ["id"])
    op.create_index("ix_clientes_negocio_id", "clientes", ["negocio_id"])
    op.create_index("ix_clientes_telefono", "clientes", ["telefono"])

    # ---- turnos ----
    op.create_table(
        "turnos",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("negocio_id", sa.Integer(), nullable=False),
        sa.Column("profesional_id", sa.Integer(), nullable=False),
        sa.Column("cliente_id", sa.Integer(), nullable=False),
        sa.Column("fecha_hora", sa.DateTime(timezone=True), nullable=False),
        sa.Column("duracion_min", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("estado", sa.Enum("pendiente", "confirmado", "cancelado", "reprogramado", "completado", name="estado_turno"), nullable=False, server_default="pendiente"),
        sa.Column("notas", sa.String(length=500), nullable=True),
        sa.Column("origen", sa.String(length=20), nullable=False, server_default="panel"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["negocio_id"], ["negocios.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["profesional_id"], ["profesionales.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["cliente_id"], ["clientes.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_turnos_id", "turnos", ["id"])
    op.create_index("ix_turnos_negocio_id", "turnos", ["negocio_id"])
    op.create_index("ix_turnos_fecha_hora", "turnos", ["fecha_hora"])
    op.create_index("ix_turnos_estado", "turnos", ["estado"])
    op.create_index("ix_turno_profesional_fecha", "turnos", ["profesional_id", "fecha_hora"])
    op.create_index("ix_turno_negocio_fecha", "turnos", ["negocio_id", "fecha_hora"])


def downgrade() -> None:
    op.drop_table("turnos")
    sa.Enum(name="estado_turno").drop(op.get_bind(), checkfirst=True)
    op.drop_table("clientes")
    op.drop_table("profesionales")
    op.drop_table("negocios")
