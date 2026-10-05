"""add_instructor_fields

Revision ID: e3f8a12d904b
Revises: 7eb06bd17743
Create Date: 2026-10-05 14:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e3f8a12d904b'
down_revision: Union[str, Sequence[str], None] = '7eb06bd17743'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add new columns to instructor_details_table
    op.add_column(
        'instructor_details_table',
        sa.Column('first_name', sa.String(), nullable=False, server_default=''),
    )
    op.add_column(
        'instructor_details_table',
        sa.Column('last_name', sa.String(), nullable=False, server_default=''),
    )
    op.add_column(
        'instructor_details_table',
        sa.Column('avatar', sa.Text(), nullable=False, server_default=''),
    )
    op.add_column(
        'instructor_details_table',
        sa.Column('professional_headline', sa.String(), nullable=False, server_default=''),
    )
    op.add_column(
        'instructor_details_table',
        sa.Column('timezone', sa.String(), nullable=False, server_default='UTC'),
    )
    op.add_column(
        'instructor_details_table',
        sa.Column('links', sa.JSON(), nullable=False, server_default='[]'),
    )

    # 2. Backfill first_name and last_name from user_table.name
    op.execute("""
    UPDATE instructor_details_table idt
    SET 
        first_name = CASE 
            WHEN position(' ' in ut.name) > 0 THEN split_part(ut.name, ' ', 1)
            ELSE ut.name
        END,
        last_name = CASE 
            WHEN position(' ' in ut.name) > 0 THEN substring(ut.name from position(' ' in ut.name) + 1)
            ELSE ''
        END
    FROM user_table ut
    WHERE idt.user_id = ut.id AND (idt.first_name = '' OR idt.first_name IS NULL);
    """)


def downgrade() -> None:
    op.drop_column('instructor_details_table', 'links')
    op.drop_column('instructor_details_table', 'timezone')
    op.drop_column('instructor_details_table', 'professional_headline')
    op.drop_column('instructor_details_table', 'avatar')
    op.drop_column('instructor_details_table', 'last_name')
    op.drop_column('instructor_details_table', 'first_name')
