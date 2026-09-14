"""add_notifications

Revision ID: 2bc6605a13d2
Revises: bba2c4909bf9
Create Date: 2026-09-14 13:29:48.158769

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2bc6605a13d2'
down_revision: Union[str, Sequence[str], None] = 'bba2c4909bf9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'notification_table',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('user_table.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('message', sa.Text(), server_default='', nullable=False),
        sa.Column('kind', sa.String(), server_default='system', nullable=False),
        sa.Column('link', sa.String(), nullable=True),
        sa.Column('is_read', sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column('created_at_utc', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f('ix_notification_table_user_id'), 'notification_table', ['user_id'], unique=False)
    op.create_index(op.f('ix_notification_table_is_read'), 'notification_table', ['is_read'], unique=False)
    op.create_index(op.f('ix_notification_table_created_at_utc'), 'notification_table', ['created_at_utc'], unique=False)

    op.create_table(
        'notification_preference_table',
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('user_table.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('email_notifications', sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column('assignment_notifications', sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column('grade_notifications', sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column('announcement_notifications', sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column('due_date_reminders', sa.Boolean(), server_default=sa.true(), nullable=False),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('notification_preference_table')
    op.drop_index(op.f('ix_notification_table_created_at_utc'), table_name='notification_table')
    op.drop_index(op.f('ix_notification_table_is_read'), table_name='notification_table')
    op.drop_index(op.f('ix_notification_table_user_id'), table_name='notification_table')
    op.drop_table('notification_table')
