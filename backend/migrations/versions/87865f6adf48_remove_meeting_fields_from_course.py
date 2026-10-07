"""remove_meeting_fields_from_course

Revision ID: 87865f6adf48
Revises: a1b2c3d4e5f6
Create Date: 2026-10-07 21:00:46.712384

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '87865f6adf48'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_column('course_table', 'meeting_provider')
    op.drop_column('course_table', 'meeting_url')
    op.drop_column('course_table', 'meeting_id')
    op.drop_column('course_table', 'meeting_passcode')
    op.drop_column('course_table', 'schedule_notes')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('course_table', sa.Column('meeting_provider', sa.String(), server_default='', nullable=False))
    op.add_column('course_table', sa.Column('meeting_url', sa.String(), nullable=True))
    op.add_column('course_table', sa.Column('meeting_id', sa.String(), server_default='', nullable=False))
    op.add_column('course_table', sa.Column('meeting_passcode', sa.String(), server_default='', nullable=False))
    op.add_column('course_table', sa.Column('schedule_notes', sa.Text(), server_default='', nullable=False))
