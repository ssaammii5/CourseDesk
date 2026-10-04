"""add_postgres_default_for_user_ids

Revision ID: 7eb06bd17743
Revises: 94436978b449
Create Date: 2026-10-05 01:57:11.080682

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7eb06bd17743'
down_revision: Union[str, Sequence[str], None] = '94436978b449'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create the Base32 random generator function in PostgreSQL
    op.execute("""
    CREATE OR REPLACE FUNCTION generate_base32_id(prefix TEXT, len INT DEFAULT 6)
    RETURNS TEXT AS $$
    DECLARE
        chars TEXT := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
        result TEXT := '';
        i INT;
    BEGIN
        FOR i IN 1..len LOOP
            result := result || substr(chars, floor(random() * 32 + 1)::INT, 1);
        END LOOP;
        RETURN prefix || '-' || result;
    END;
    $$ LANGUAGE plpgsql;
    """)

    # 2. Backfill any blank or null IDs in existing rows
    op.execute("""
    UPDATE learner_details_table
    SET learner_id = generate_base32_id('LRN', 6)
    WHERE learner_id IS NULL OR learner_id = '';
    """)

    op.execute("""
    UPDATE instructor_details_table
    SET instructor_id = generate_base32_id('INS', 6)
    WHERE instructor_id IS NULL OR instructor_id = '';
    """)

    # 3. Set the server defaults on both tables
    op.execute("""
    ALTER TABLE learner_details_table
    ALTER COLUMN learner_id SET DEFAULT generate_base32_id('LRN', 6);
    """)

    op.execute("""
    ALTER TABLE instructor_details_table
    ALTER COLUMN instructor_id SET DEFAULT generate_base32_id('INS', 6);
    """)

    # 4. Add unique constraints
    op.create_unique_constraint(
        'uq_learner_details_learner_id',
        'learner_details_table',
        ['learner_id'],
    )
    op.create_unique_constraint(
        'uq_instructor_details_instructor_id',
        'instructor_details_table',
        ['instructor_id'],
    )


def downgrade() -> None:
    op.drop_constraint('uq_instructor_details_instructor_id', 'instructor_details_table', type_='unique')
    op.drop_constraint('uq_learner_details_learner_id', 'learner_details_table', type_='unique')

    op.execute("ALTER TABLE instructor_details_table ALTER COLUMN instructor_id DROP DEFAULT;")
    op.execute("ALTER TABLE learner_details_table ALTER COLUMN learner_id DROP DEFAULT;")

    op.execute("DROP FUNCTION IF EXISTS generate_base32_id(TEXT, INT);")
