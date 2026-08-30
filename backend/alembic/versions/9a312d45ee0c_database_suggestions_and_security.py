"""Database structural enhancements and security optimizations

Revision ID: 9a312d45ee0c
Revises: f3166476c896
Create Date: 2026-05-26 11:02:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '9a312d45ee0c'
down_revision = '3017614a0b36'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Create native PostgreSQL ENUM types
    semester_type = postgresql.ENUM('WINTER', 'SUMMER', name='semester_type')
    semester_type.create(op.get_bind(), checkfirst=True)

    nc_status_type = postgresql.ENUM('NC_FREE', 'LOCAL_NC', name='nc_status_type')
    nc_status_type.create(op.get_bind(), checkfirst=True)

    application_route_type = postgresql.ENUM('Direct', 'uni-assist', name='application_route_type')
    application_route_type.create(op.get_bind(), checkfirst=True)

    # 2. Convert standard categorical String columns to ENUMs safely
    # First, map existing diverse application_route strings to valid enum values ('Direct', 'uni-assist')
    op.execute("""
        UPDATE programmes 
        SET application_route = CASE 
            WHEN LOWER(application_route) LIKE '%uni%' OR LOWER(application_route) LIKE '%assist%' THEN 'uni-assist'
            ELSE 'Direct'
        END;
    """)

    op.execute("ALTER TABLE deadlines ALTER COLUMN semester TYPE semester_type USING semester::semester_type;")
    op.execute("ALTER TABLE programmes ALTER COLUMN nc_status TYPE nc_status_type USING nc_status::nc_status_type;")
    op.execute("ALTER TABLE programmes ALTER COLUMN application_route TYPE application_route_type USING application_route::application_route_type;")

    # 3. Timezone-Naive to Timezone-Aware DateTime
    op.alter_column('deadlines', 'portal_opens', type_=sa.DateTime(timezone=True), existing_type=sa.DateTime(timezone=False))
    op.alter_column('deadlines', 'application_deadline', type_=sa.DateTime(timezone=True), existing_type=sa.DateTime(timezone=False))

    # 4. Convert float to precise Numeric for transcript models
    op.alter_column('transcript_configs', 'degree_years', type_=sa.Numeric(precision=4, scale=2), existing_type=sa.Float())
    op.alter_column('transcript_configs', 'total_local_credits', type_=sa.Numeric(precision=5, scale=2), existing_type=sa.Float())
    op.alter_column('transcript_configs', 'n_max', type_=sa.Numeric(precision=4, scale=2), existing_type=sa.Float())
    op.alter_column('transcript_configs', 'n_min', type_=sa.Numeric(precision=4, scale=2), existing_type=sa.Float())

    op.alter_column('transcript_subjects', 'credits', type_=sa.Numeric(precision=5, scale=2), existing_type=sa.Float())
    op.alter_column('transcript_subjects', 'grade', type_=sa.Numeric(precision=4, scale=2), existing_type=sa.Float())

    # 5. Convert exchange rates to parameterized Numeric
    op.alter_column('exchange_rates', 'rate', type_=sa.Numeric(precision=12, scale=6), existing_type=sa.Numeric())

    # 6. Add new flat math and cs ECTS columns
    op.add_column('programmes', sa.Column('required_math_ects', sa.Numeric(precision=5, scale=2), nullable=True))
    op.add_column('programmes', sa.Column('required_cs_ects', sa.Numeric(precision=5, scale=2), nullable=True))

    # 7. Populate math/cs columns from the existing requirements JSONB to ensure no data loss
    op.execute("""
        UPDATE programmes 
        SET required_math_ects = CAST(requirements->'quantitative'->'ects_thresholds'->>'math' AS numeric),
            required_cs_ects = CAST(requirements->'quantitative'->'ects_thresholds'->>'cs' AS numeric)
        WHERE requirements IS NOT NULL;
    """)

    # 8. Create Indexes
    op.create_index('ix_programmes_required_math_ects', 'programmes', ['required_math_ects'])
    op.create_index('ix_programmes_required_cs_ects', 'programmes', ['required_cs_ects'])
    op.create_index('ix_programmes_gre_required', 'programmes', ['gre_required'])
    op.create_index('ix_programmes_nc_status', 'programmes', ['nc_status'])
    op.create_index('ix_deadlines_programme_id', 'deadlines', ['programme_id'])
    op.create_index('ix_required_documents_programme_id', 'required_documents', ['programme_id'])
    op.create_index('ix_transcript_subjects_user_id', 'transcript_subjects', ['user_id'])
    op.create_index('ix_dashboard_programmes_programme_id', 'dashboard_programmes', ['programme_id'])

    # 9. Create Unique Constraints
    op.create_unique_constraint('uq_university_programme_degree', 'programmes', ['university_id', 'name', 'degree_type'])
    op.create_unique_constraint('uq_user_subject_name', 'transcript_subjects', ['user_id', 'name'])

    # 10. Update Foreign Key Cascades natively
    op.drop_constraint('user_dashboard_user_id_fkey', 'user_dashboard', type_='foreignkey')
    op.create_foreign_key('user_dashboard_user_id_fkey', 'user_dashboard', 'users', ['user_id'], ['id'], ondelete='CASCADE')

    op.drop_constraint('dashboard_programmes_dashboard_id_fkey', 'dashboard_programmes', type_='foreignkey')
    op.create_foreign_key('dashboard_programmes_dashboard_id_fkey', 'dashboard_programmes', 'user_dashboard', ['dashboard_id'], ['id'], ondelete='CASCADE')
    
    op.drop_constraint('dashboard_programmes_programme_id_fkey', 'dashboard_programmes', type_='foreignkey')
    op.create_foreign_key('dashboard_programmes_programme_id_fkey', 'dashboard_programmes', 'programmes', ['programme_id'], ['id'], ondelete='CASCADE')

def downgrade() -> None:
    # Downgrade foreign keys
    op.drop_constraint('dashboard_programmes_programme_id_fkey', 'dashboard_programmes', type_='foreignkey')
    op.create_foreign_key('dashboard_programmes_programme_id_fkey', 'dashboard_programmes', 'programmes', ['programme_id'], ['id'])
    
    op.drop_constraint('dashboard_programmes_dashboard_id_fkey', 'dashboard_programmes', type_='foreignkey')
    op.create_foreign_key('dashboard_programmes_dashboard_id_fkey', 'dashboard_programmes', 'user_dashboard', ['dashboard_id'], ['id'])

    op.drop_constraint('user_dashboard_user_id_fkey', 'user_dashboard', type_='foreignkey')
    op.create_foreign_key('user_dashboard_user_id_fkey', 'user_dashboard', 'users', ['user_id'], ['id'])

    # Drop constraints
    op.drop_constraint('uq_user_subject_name', 'transcript_subjects', type_='unique')
    op.drop_constraint('uq_university_programme_degree', 'programmes', type_='unique')

    # Drop indexes
    op.drop_index('ix_dashboard_programmes_programme_id', 'dashboard_programmes')
    op.drop_index('ix_transcript_subjects_user_id', 'transcript_subjects')
    op.drop_index('ix_required_documents_programme_id', 'required_documents')
    op.drop_index('ix_deadlines_programme_id', 'deadlines')
    op.drop_index('ix_programmes_nc_status', 'programmes')
    op.drop_index('ix_programmes_gre_required', 'programmes')
    op.drop_index('ix_programmes_required_cs_ects', 'programmes')
    op.drop_index('ix_programmes_required_math_ects', 'programmes')

    # Drop math/cs ECTS columns
    op.drop_column('programmes', 'required_cs_ects')
    op.drop_column('programmes', 'required_math_ects')

    # Convert numeric back to float
    op.alter_column('exchange_rates', 'rate', type_=sa.Numeric(), existing_type=sa.Numeric(precision=12, scale=6))

    op.alter_column('transcript_subjects', 'grade', type_=sa.Float(), existing_type=sa.Numeric(precision=4, scale=2))
    op.alter_column('transcript_subjects', 'credits', type_=sa.Float(), existing_type=sa.Numeric(precision=5, scale=2))

    op.alter_column('transcript_configs', 'n_min', type_=sa.Float(), existing_type=sa.Numeric(precision=4, scale=2))
    op.alter_column('transcript_configs', 'n_max', type_=sa.Float(), existing_type=sa.Numeric(precision=4, scale=2))
    op.alter_column('transcript_configs', 'total_local_credits', type_=sa.Float(), existing_type=sa.Numeric(precision=5, scale=2))
    op.alter_column('transcript_configs', 'degree_years', type_=sa.Float(), existing_type=sa.Numeric(precision=4, scale=2))

    # Timezone back to naive
    op.alter_column('deadlines', 'application_deadline', type_=sa.DateTime(timezone=False), existing_type=sa.DateTime(timezone=True))
    op.alter_column('deadlines', 'portal_opens', type_=sa.DateTime(timezone=False), existing_type=sa.DateTime(timezone=True))

    # ENUM back to String/VARCHAR
    op.execute("ALTER TABLE deadlines ALTER COLUMN semester TYPE VARCHAR;")
    op.execute("ALTER TABLE programmes ALTER COLUMN nc_status TYPE VARCHAR;")
    op.execute("ALTER TABLE programmes ALTER COLUMN application_route TYPE VARCHAR;")

    # Drop enum types
    op.execute("DROP TYPE application_route_type;")
    op.execute("DROP TYPE nc_status_type;")
    op.execute("DROP TYPE semester_type;")
