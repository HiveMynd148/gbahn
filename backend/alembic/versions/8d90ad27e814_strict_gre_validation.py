"""Strict GRE column validation

Revision ID: 8d90ad27e814
Revises: 9a312d45ee0c
Create Date: 2026-05-26 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '8d90ad27e814'
down_revision = '9a312d45ee0c'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Create native PostgreSQL ENUM type for GRE requirements
    gre_requirement_type = postgresql.ENUM('Not Required', 'Advisable', 'Recommended', 'Mandatory', name='gre_requirement_type')
    gre_requirement_type.create(op.get_bind(), checkfirst=True)

    # 2. Map existing diverse and boolean string values to the 4 strict allowed values
    op.execute("""
        UPDATE programmes 
        SET gre_required = CASE 
            WHEN gre_required IN ('True', 'true', 'Mandatory') THEN 'Mandatory'
            WHEN gre_required = 'Advisable' THEN 'Advisable'
            WHEN gre_required = 'Recommended' THEN 'Recommended'
            ELSE 'Not Required'
        END;
    """)

    # 3. Alter gre_required column to the new enum type safely
    op.execute("ALTER TABLE programmes ALTER COLUMN gre_required DROP DEFAULT;")
    op.execute("ALTER TABLE programmes ALTER COLUMN gre_required TYPE gre_requirement_type USING gre_required::gre_requirement_type;")
    op.execute("ALTER TABLE programmes ALTER COLUMN gre_required SET DEFAULT 'Not Required'::gre_requirement_type;")

def downgrade() -> None:
    # Drop default and convert column back to string/VARCHAR
    op.execute("ALTER TABLE programmes ALTER COLUMN gre_required DROP DEFAULT;")
    op.execute("ALTER TABLE programmes ALTER COLUMN gre_required TYPE VARCHAR USING gre_required::VARCHAR;")
    op.execute("ALTER TABLE programmes ALTER COLUMN gre_required SET DEFAULT 'Not Required';")

    # Drop enum type
    op.execute("DROP TYPE gre_requirement_type;")
