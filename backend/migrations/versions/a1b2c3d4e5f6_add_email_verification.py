"""add_email_verification

Revision ID: a1b2c3d4e5f6
Revises: f4a9b23c8901
Create Date: 2026-10-05 21:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'f4a9b23c8901'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
    ALTER TABLE user_table ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
    ALTER TABLE user_table ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
    ALTER TABLE user_table ADD COLUMN IF NOT EXISTS email_verification_expires_at_utc TIMESTAMP WITH TIME ZONE;
    CREATE INDEX IF NOT EXISTS ix_user_table_email_verification_token ON user_table(email_verification_token);

    UPDATE user_table 
    SET email_verified = TRUE 
    WHERE email_verified IS NULL OR email_verified = FALSE;
    """)


def downgrade() -> None:
    op.drop_index('ix_user_table_email_verification_token', table_name='user_table')
    op.drop_column('user_table', 'email_verification_expires_at_utc')
    op.drop_column('user_table', 'email_verification_token')
    op.drop_column('user_table', 'email_verified')
