"""add_learner_fields

Revision ID: f4a9b23c8901
Revises: e3f8a12d904b
Create Date: 2026-10-05 20:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f4a9b23c8901'
down_revision: Union[str, Sequence[str], None] = 'e3f8a12d904b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
    ALTER TABLE learner_details_table ADD COLUMN IF NOT EXISTS first_name VARCHAR NOT NULL DEFAULT '';
    ALTER TABLE learner_details_table ADD COLUMN IF NOT EXISTS last_name VARCHAR NOT NULL DEFAULT '';
    ALTER TABLE learner_details_table ADD COLUMN IF NOT EXISTS avatar TEXT NOT NULL DEFAULT '';
    ALTER TABLE learner_details_table ADD COLUMN IF NOT EXISTS short_bio TEXT NOT NULL DEFAULT '';
    ALTER TABLE learner_details_table ADD COLUMN IF NOT EXISTS timezone VARCHAR NOT NULL DEFAULT 'UTC';
    ALTER TABLE learner_details_table ADD COLUMN IF NOT EXISTS links JSON NOT NULL DEFAULT '[]';

    UPDATE learner_details_table ldt
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
    WHERE ldt.user_id = ut.id AND (ldt.first_name = '' OR ldt.first_name IS NULL);
    """)


def downgrade() -> None:
    op.drop_column('learner_details_table', 'links')
    op.drop_column('learner_details_table', 'timezone')
    op.drop_column('learner_details_table', 'short_bio')
    op.drop_column('learner_details_table', 'avatar')
    op.drop_column('learner_details_table', 'last_name')
    op.drop_column('learner_details_table', 'first_name')
