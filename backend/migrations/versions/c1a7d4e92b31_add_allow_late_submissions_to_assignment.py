"""add_allow_late_submissions_to_assignment

Revision ID: c1a7d4e92b31
Revises: 6d35232726b1
Create Date: 2026-09-30 18:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1a7d4e92b31'
down_revision: Union[str, Sequence[str], None] = '6d35232726b1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    insp = sa.inspect(conn)
    columns = [c['name'] for c in insp.get_columns('assignment_table')]
    if 'allow_late_submissions' not in columns:
        op.add_column(
            'assignment_table',
            sa.Column('allow_late_submissions', sa.Boolean(), server_default=sa.text('true'), nullable=False)
        )


def downgrade() -> None:
    conn = op.get_bind()
    insp = sa.inspect(conn)
    columns = [c['name'] for c in insp.get_columns('assignment_table')]
    if 'allow_late_submissions' in columns:
        op.drop_column('assignment_table', 'allow_late_submissions')
