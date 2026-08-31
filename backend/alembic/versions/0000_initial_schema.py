"""Squashed initial schema — creates all tables in their final form

Revision ID: 0000_initial_schema
Revises:
Create Date: 2026-05-10 00:00:00.000000

This is a squashed migration that replaces the entire original migration
chain. It creates all tables in their final state so that alembic upgrade
head works on a blank database without replaying the broken incremental
history.

Existing databases that were already fully migrated should be stamped:
    alembic stamp 0000_initial_schema
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = '0000_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- ENUM types ---
    # DO block is the correct PG idiom for idempotent type creation
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE institution_type AS ENUM (
                'University', 'Technical University', 'University of Applied Sciences'
            );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE applicant_origin AS ENUM (
                'EU Applicants', 'Non-EU Applicants', 'All Applicants'
            );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE nc_status_type AS ENUM ('NC_FREE', 'LOCAL_NC');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE application_route_type AS ENUM ('Direct', 'uni-assist');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE semester_type AS ENUM ('WINTER', 'SUMMER');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE gre_requirement_type AS ENUM (
                'Not Required', 'Advisable', 'Recommended', 'Mandatory'
            );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE data_source_type AS ENUM (
                'GEMINI_EXTRACTED', 'FALLBACK_GENERATED', 'MANUAL', 'UNVERIFIED'
            );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)

    # --- universities ---
    op.create_table(
        'universities',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('federal_state', sa.String(), nullable=True),
        sa.Column('country', sa.String(), nullable=False),
        sa.Column('institution_type', postgresql.ENUM(
            'University', 'Technical University', 'University of Applied Sciences',
            name='institution_type', create_type=False
        ), nullable=False),
        sa.Column('website_url', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
    )

    # --- programmes ---
    op.create_table(
        'programmes',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('university_id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('degree_type', sa.String(), nullable=False),
        sa.Column('nc_status', postgresql.ENUM('NC_FREE', 'LOCAL_NC', name='nc_status_type', create_type=False), nullable=False),
        sa.Column('application_route', postgresql.ENUM('Direct', 'uni-assist', name='application_route_type', create_type=False), nullable=False),
        sa.Column('application_fee_eur', sa.Numeric(precision=6, scale=2), nullable=True),
        sa.Column('primary_teaching_language', sa.String(), nullable=True),
        sa.Column('min_english_level', sa.String(), nullable=True),
        sa.Column('min_ielts_score', sa.Float(), nullable=True),
        sa.Column('min_german_level', sa.String(), nullable=True),
        sa.Column('total_ects_required', sa.Integer(), nullable=True),
        sa.Column('min_gpa_german_scale', sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column('gre_required', postgresql.ENUM(
            'Not Required', 'Advisable', 'Recommended', 'Mandatory',
            name='gre_requirement_type', create_type=False
        ), nullable=False),
        sa.Column('is_free_tuition', sa.Boolean(), nullable=False),
        sa.Column('tuition_fee_per_semester', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('programme_website_url', sa.String(), nullable=True),
        sa.Column('data_source', postgresql.ENUM(
            'GEMINI_EXTRACTED', 'FALLBACK_GENERATED', 'MANUAL', 'UNVERIFIED',
            name='data_source_type', create_type=False
        ), nullable=False),
        sa.Column('required_math_ects', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('required_cs_ects', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('requirements', sa.JSON().with_variant(postgresql.JSONB(), 'postgresql'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['university_id'], ['universities.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('university_id', 'name', 'degree_type', name='uq_university_programme_degree'),
    )
    op.create_index('ix_programmes_university_id', 'programmes', ['university_id'])
    op.create_index('ix_programmes_nc_status', 'programmes', ['nc_status'])
    op.create_index('ix_programmes_gre_required', 'programmes', ['gre_required'])
    op.create_index('ix_programmes_required_math_ects', 'programmes', ['required_math_ects'])
    op.create_index('ix_programmes_required_cs_ects', 'programmes', ['required_cs_ects'])
    op.create_index('ix_programmes_data_source', 'programmes', ['data_source'])

    # --- deadlines ---
    op.create_table(
        'deadlines',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('programme_id', sa.Uuid(), nullable=False),
        sa.Column('applicant_origin', postgresql.ENUM(
            'EU Applicants', 'Non-EU Applicants', 'All Applicants',
            name='applicant_origin', create_type=False
        ), nullable=False),
        sa.Column('semester', postgresql.ENUM('WINTER', 'SUMMER', name='semester_type', create_type=False), nullable=False),
        sa.Column('portal_opens', sa.DateTime(timezone=True), nullable=True),
        sa.Column('application_deadline', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['programme_id'], ['programmes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_deadlines_programme_id', 'deadlines', ['programme_id'])

    # --- required_documents ---
    op.create_table(
        'required_documents',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('programme_id', sa.Uuid(), nullable=False),
        sa.Column('document_name', sa.String(), nullable=False),
        sa.Column('is_mandatory', sa.Boolean(), nullable=False),
        sa.Column('notes', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['programme_id'], ['programmes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_required_documents_programme_id', 'required_documents', ['programme_id'])

    # --- users ---
    op.create_table(
        'users',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
    )

    # --- user_dashboard ---
    op.create_table(
        'user_dashboard',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('display_currency', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )

    # --- dashboard_programmes ---
    op.create_table(
        'dashboard_programmes',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('dashboard_id', sa.Uuid(), nullable=False),
        sa.Column('programme_id', sa.Uuid(), nullable=False),
        sa.Column('personal_status', sa.String(), nullable=True),
        sa.Column('personal_notes', sa.String(), nullable=True),
        sa.Column('added_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['dashboard_id'], ['user_dashboard.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['programme_id'], ['programmes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('dashboard_id', 'programme_id', name='uq_dashboard_programme'),
    )
    op.create_index('ix_dashboard_programmes_programme_id', 'dashboard_programmes', ['programme_id'])

    # --- transcript_configs ---
    op.create_table(
        'transcript_configs',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('degree_years', sa.Numeric(precision=4, scale=2), nullable=False, server_default='4.00'),
        sa.Column('total_local_credits', sa.Numeric(precision=5, scale=2), nullable=False, server_default='160.00'),
        sa.Column('n_max', sa.Numeric(precision=4, scale=2), nullable=False, server_default='10.00'),
        sa.Column('n_min', sa.Numeric(precision=4, scale=2), nullable=False, server_default='4.00'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )

    # --- transcript_subjects ---
    op.create_table(
        'transcript_subjects',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('credits', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('grade', sa.Numeric(precision=4, scale=2), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'name', name='uq_user_subject_name'),
    )
    op.create_index('ix_transcript_subjects_user_id', 'transcript_subjects', ['user_id'])

    # --- exchange_rates ---
    op.create_table(
        'exchange_rates',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('base_currency', sa.String(), nullable=False),
        sa.Column('target_currency', sa.String(), nullable=False),
        sa.Column('rate', sa.Numeric(precision=12, scale=6), nullable=False),
        sa.Column('fetched_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('base_currency', 'target_currency', name='uq_base_target_currency'),
    )

    # --- budget_plans ---
    op.create_table(
        'budget_plans',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('monthly_costs', sa.JSON(), nullable=False),
        sa.Column('one_time_costs', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('budget_plans')
    op.drop_table('exchange_rates')
    op.drop_index('ix_transcript_subjects_user_id', 'transcript_subjects')
    op.drop_table('transcript_subjects')
    op.drop_table('transcript_configs')
    op.drop_index('ix_dashboard_programmes_programme_id', 'dashboard_programmes')
    op.drop_table('dashboard_programmes')
    op.drop_table('user_dashboard')
    op.drop_table('users')
    op.drop_index('ix_required_documents_programme_id', 'required_documents')
    op.drop_table('required_documents')
    op.drop_index('ix_deadlines_programme_id', 'deadlines')
    op.drop_table('deadlines')
    op.drop_index('ix_programmes_data_source', 'programmes')
    op.drop_index('ix_programmes_required_cs_ects', 'programmes')
    op.drop_index('ix_programmes_required_math_ects', 'programmes')
    op.drop_index('ix_programmes_gre_required', 'programmes')
    op.drop_index('ix_programmes_nc_status', 'programmes')
    op.drop_index('ix_programmes_university_id', 'programmes')
    op.drop_table('programmes')
    op.drop_table('universities')
    op.execute('DROP TYPE IF EXISTS data_source_type')
    op.execute('DROP TYPE IF EXISTS gre_requirement_type')
    op.execute('DROP TYPE IF EXISTS semester_type')
    op.execute('DROP TYPE IF EXISTS application_route_type')
    op.execute('DROP TYPE IF EXISTS nc_status_type')
    op.execute('DROP TYPE IF EXISTS applicant_origin')
    op.execute('DROP TYPE IF EXISTS institution_type')
