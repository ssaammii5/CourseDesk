"""remove_academic_fields_from_user_details

Revision ID: 94436978b449
Revises: d4e8f1a23b90
Create Date: 2026-10-05 00:37:04.206682

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '94436978b449'
down_revision: Union[str, Sequence[str], None] = 'd4e8f1a23b90'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('instructor_details_table', 'designation')
    op.drop_column('instructor_details_table', 'department')
    op.drop_column('learner_details_table', 'department')
    op.drop_column('learner_details_table', 'current_program')
    op.drop_column('learner_details_table', 'session')
    op.drop_column('learner_details_table', 'semester_session')


def downgrade() -> None:
    op.add_column('learner_details_table', sa.Column('semester_session', sa.String(), nullable=False, server_default=''))
    op.add_column('learner_details_table', sa.Column('session', sa.String(), nullable=False, server_default=''))
    op.add_column('learner_details_table', sa.Column('current_program', sa.String(), nullable=False, server_default='Undergraduate'))
    op.add_column('learner_details_table', sa.Column('department', sa.String(), nullable=False, server_default=''))
    op.add_column('instructor_details_table', sa.Column('department', sa.String(), nullable=False, server_default=''))
    op.add_column('instructor_details_table', sa.Column('designation', sa.String(), nullable=False, server_default=''))
