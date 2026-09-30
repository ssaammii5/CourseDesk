"""add_video_file_to_session

Revision ID: d4e8f1a23b90
Revises: c1a7d4e92b31
Create Date: 2026-09-30 19:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e8f1a23b90'
down_revision: Union[str, Sequence[str], None] = 'c1a7d4e92b31'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    insp = sa.inspect(conn)
    columns = [c['name'] for c in insp.get_columns('session_table')]
    
    if 'file_url' not in columns:
        op.add_column('session_table', sa.Column('file_url', sa.String(), nullable=True))
    if 'file_name' not in columns:
        op.add_column('session_table', sa.Column('file_name', sa.String(), nullable=True))
    if 'file_type' not in columns:
        op.add_column('session_table', sa.Column('file_type', sa.String(), nullable=True))
    if 'file_size' not in columns:
        op.add_column('session_table', sa.Column('file_size', sa.String(), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    insp = sa.inspect(conn)
    columns = [c['name'] for c in insp.get_columns('session_table')]
    
    if 'file_size' in columns:
        op.drop_column('session_table', 'file_size')
    if 'file_type' in columns:
        op.drop_column('session_table', 'file_type')
    if 'file_name' in columns:
        op.drop_column('session_table', 'file_name')
    if 'file_url' in columns:
        op.drop_column('session_table', 'file_url')
