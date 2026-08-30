"""Add federal_state column to universities

Revision ID: a3f8c1d2e4b5
Revises: 12d42f2bd6bc
Create Date: 2026-05-10 16:45:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a3f8c1d2e4b5'
down_revision = '12d42f2bd6bc'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add the federal_state column
    op.add_column('universities', sa.Column('federal_state', sa.String(), nullable=True))

    # Migrate data: split "City, State" into separate columns
    # The location currently has format like "Cottbus / Senftenberg, Brandenburg"
    # We want: location = "Cottbus / Senftenberg", federal_state = "Brandenburg"
    conn = op.get_bind()
    results = conn.execute(sa.text("SELECT id, location FROM universities"))
    for row in results:
        uid, location = row
        if ',' in location:
            # Split on the LAST comma to get the state
            parts = location.rsplit(',', 1)
            city = parts[0].strip()
            state = parts[1].strip()
            conn.execute(
                sa.text("UPDATE universities SET location = :city, federal_state = :state WHERE id = :id"),
                {"city": city, "state": state, "id": uid}
            )


def downgrade() -> None:
    # Merge federal_state back into location
    conn = op.get_bind()
    results = conn.execute(sa.text("SELECT id, location, federal_state FROM universities"))
    for row in results:
        uid, location, state = row
        if state:
            merged = f"{location}, {state}"
            conn.execute(
                sa.text("UPDATE universities SET location = :merged WHERE id = :id"),
                {"merged": merged, "id": uid}
            )

    op.drop_column('universities', 'federal_state')
