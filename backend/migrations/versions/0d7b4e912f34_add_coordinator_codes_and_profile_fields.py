"""add_coordinator_codes_and_profile_fields

Revision ID: 0d7b4e912f34
Revises: ffdb69a43120
Create Date: 2026-10-09 15:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0d7b4e912f34'
down_revision: Union[str, Sequence[str], None] = 'ffdb69a43120'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    # 1. academic_department_table.description
    if 'academic_department_table' in existing_tables:
        dept_cols = {col['name'] for col in inspector.get_columns('academic_department_table')}
        if 'description' not in dept_cols:
            op.add_column(
                'academic_department_table',
                sa.Column('description', sa.String(), server_default='', nullable=False),
            )

    # 2. user_table columns
    if 'user_table' in existing_tables:
        user_cols = {col['name'] for col in inspector.get_columns('user_table')}
        if 'avatar' not in user_cols:
            op.add_column(
                'user_table',
                sa.Column('avatar', sa.Text(), server_default='', nullable=False),
            )
        if 'timezone' not in user_cols:
            op.add_column(
                'user_table',
                sa.Column('timezone', sa.String(), server_default='UTC', nullable=False),
            )
        if 'email_verification_attempts' not in user_cols:
            op.add_column(
                'user_table',
                sa.Column('email_verification_attempts', sa.Integer(), server_default='0', nullable=False),
            )

    # 3. coordinator_details_table
    if 'coordinator_details_table' not in existing_tables:
        op.create_table(
            'coordinator_details_table',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('user_table.id', ondelete='CASCADE'), unique=True, nullable=False),
            sa.Column('coordinator_id', sa.String(), server_default=sa.text("generate_base32_id('CRD', 6)"), unique=True, nullable=False),
            sa.Column('first_name', sa.String(), server_default='', nullable=False),
            sa.Column('last_name', sa.String(), server_default='', nullable=False),
            sa.Column('avatar', sa.Text(), server_default='', nullable=False),
            sa.Column('phone', sa.String(), server_default='', nullable=False),
            sa.Column('short_bio', sa.Text(), server_default='', nullable=False),
            sa.Column('timezone', sa.String(), server_default='UTC', nullable=False),
            sa.Column('links', sa.JSON(), server_default='[]', nullable=False),
        )
        op.create_index(
            'ix_coordinator_details_table_coordinator_id',
            'coordinator_details_table',
            ['coordinator_id'],
            unique=False,
        )

    # 4. course_table.code
    if 'course_table' in existing_tables:
        course_cols = {col['name'] for col in inspector.get_columns('course_table')}
        if 'code' not in course_cols:
            op.add_column(
                'course_table',
                sa.Column('code', sa.String(32), nullable=True),
            )
        course_indexes = {ix['name'] for ix in inspector.get_indexes('course_table')}
        if 'ix_course_table_code' not in course_indexes:
            op.create_index('ix_course_table_code', 'course_table', ['code'], unique=True)

    # 5. assignment_table.code
    if 'assignment_table' in existing_tables:
        asg_cols = {col['name'] for col in inspector.get_columns('assignment_table')}
        if 'code' not in asg_cols:
            op.add_column(
                'assignment_table',
                sa.Column('code', sa.String(32), nullable=True),
            )
        asg_indexes = {ix['name'] for ix in inspector.get_indexes('assignment_table')}
        if 'ix_assignment_table_code' not in asg_indexes:
            op.create_index('ix_assignment_table_code', 'assignment_table', ['code'], unique=True)

    # 6. submission_table.code
    if 'submission_table' in existing_tables:
        sub_cols = {col['name'] for col in inspector.get_columns('submission_table')}
        if 'code' not in sub_cols:
            op.add_column(
                'submission_table',
                sa.Column('code', sa.String(32), nullable=True),
            )
        sub_indexes = {ix['name'] for ix in inspector.get_indexes('submission_table')}
        if 'ix_submission_table_code' not in sub_indexes:
            op.create_index('ix_submission_table_code', 'submission_table', ['code'], unique=True)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if 'submission_table' in existing_tables:
        sub_indexes = {ix['name'] for ix in inspector.get_indexes('submission_table')}
        if 'ix_submission_table_code' in sub_indexes:
            op.drop_index('ix_submission_table_code', table_name='submission_table')
        sub_cols = {col['name'] for col in inspector.get_columns('submission_table')}
        if 'code' in sub_cols:
            op.drop_column('submission_table', 'code')

    if 'assignment_table' in existing_tables:
        asg_indexes = {ix['name'] for ix in inspector.get_indexes('assignment_table')}
        if 'ix_assignment_table_code' in asg_indexes:
            op.drop_index('ix_assignment_table_code', table_name='assignment_table')
        asg_cols = {col['name'] for col in inspector.get_columns('assignment_table')}
        if 'code' in asg_cols:
            op.drop_column('assignment_table', 'code')

    if 'course_table' in existing_tables:
        course_indexes = {ix['name'] for ix in inspector.get_indexes('course_table')}
        if 'ix_course_table_code' in course_indexes:
            op.drop_index('ix_course_table_code', table_name='course_table')
        course_cols = {col['name'] for col in inspector.get_columns('course_table')}
        if 'code' in course_cols:
            op.drop_column('course_table', 'code')

    if 'coordinator_details_table' in existing_tables:
        op.drop_index('ix_coordinator_details_table_coordinator_id', table_name='coordinator_details_table')
        op.drop_table('coordinator_details_table')

    if 'user_table' in existing_tables:
        user_cols = {col['name'] for col in inspector.get_columns('user_table')}
        if 'email_verification_attempts' in user_cols:
            op.drop_column('user_table', 'email_verification_attempts')
        if 'timezone' in user_cols:
            op.drop_column('user_table', 'timezone')
        if 'avatar' in user_cols:
            op.drop_column('user_table', 'avatar')

    if 'academic_department_table' in existing_tables:
        dept_cols = {col['name'] for col in inspector.get_columns('academic_department_table')}
        if 'description' in dept_cols:
            op.drop_column('academic_department_table', 'description')
