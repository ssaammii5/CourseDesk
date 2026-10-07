"""add_tags_to_course

Revision ID: 642309587ea2
Revises: 87865f6adf48
Create Date: 2026-10-07 21:49:36.782241

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '642309587ea2'
down_revision: Union[str, Sequence[str], None] = '87865f6adf48'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('course_table', sa.Column('tags', sa.JSON(), server_default='[]', nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('course_table', 'tags')
