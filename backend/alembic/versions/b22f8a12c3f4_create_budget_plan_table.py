"""create_budget_plan_table

Revision ID: b22f8a12c3f4
Revises: 9a312d45ee0c
Create Date: 2026-05-28 13:42:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'b22f8a12c3f4'
down_revision = '8d90ad27e814'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table('budget_plans',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('monthly_costs', sa.JSON(), nullable=False),
    sa.Column('one_time_costs', sa.JSON(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('budget_plans')
