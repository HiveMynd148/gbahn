"""add_data_source_column

Revision ID: c4a7e8f12d90
Revises: b22f8a12c3f4
Create Date: 2026-06-03 16:55:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c4a7e8f12d90'
down_revision = 'b22f8a12c3f4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create the enum type in PostgreSQL
    data_source_type = sa.Enum('GEMINI_EXTRACTED', 'FALLBACK_GENERATED', 'MANUAL', 'UNVERIFIED', name='data_source_type')
    data_source_type.create(op.get_bind(), checkfirst=True)

    # Add the column with a default of 'UNVERIFIED' for all existing records
    op.add_column('programmes', sa.Column(
        'data_source',
        data_source_type,
        nullable=False,
        server_default='UNVERIFIED'
    ))
    op.create_index(op.f('ix_programmes_data_source'), 'programmes', ['data_source'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_programmes_data_source'), table_name='programmes')
    op.drop_column('programmes', 'data_source')

    # Drop the enum type
    sa.Enum(name='data_source_type').drop(op.get_bind(), checkfirst=True)
