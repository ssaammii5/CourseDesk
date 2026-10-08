import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.utils.db import Base, engine
from app.utils.settings import settings

# Ensure all SQLAlchemy models are registered in the declarative registry
import app.academic.models  # noqa: F401
import app.announcement.models  # noqa: F401
import app.assignment.models  # noqa: F401
import app.auth.models  # noqa: F401
import app.comment.models  # noqa: F401
import app.course.models  # noqa: F401
import app.notification.models  # noqa: F401
import app.session.models  # noqa: F401
import app.setting.models  # noqa: F401
import app.submission.models  # noqa: F401
import app.user.models  # noqa: F401

from app.academic.router import academic_routes
from app.announcement.router import announcement_routes
from app.assignment.router import assignment_routes
from app.auth.router import auth_routes
from app.comment.router import comment_routes
from app.course.router import course_routes
from app.dashboard.router import dashboard_routes
from app.notification.router import notification_routes
from app.session.router import session_routes
from app.setting.router import setting_routes
from app.submission.router import submission_routes
from app.user.router import (
    coordinator_routes,
    instructor_routes,
    learner_routes,
    user_routes,
)

from sqlalchemy import text


Base.metadata.create_all(engine)

# Safe idempotent migration to ensure new instructor and learner columns exist
try:
    with engine.begin() as conn:
        conn.execute(text("SET LOCAL lock_timeout = '2s';"))
        conn.execute(text("""
        ALTER TABLE academic_department_table ADD COLUMN IF NOT EXISTS description VARCHAR NOT NULL DEFAULT '';
    ALTER TABLE user_table ADD COLUMN IF NOT EXISTS avatar TEXT NOT NULL DEFAULT '';
    ALTER TABLE user_table ADD COLUMN IF NOT EXISTS timezone VARCHAR NOT NULL DEFAULT 'UTC';
    ALTER TABLE instructor_details_table ADD COLUMN IF NOT EXISTS first_name VARCHAR NOT NULL DEFAULT '';
    ALTER TABLE instructor_details_table ADD COLUMN IF NOT EXISTS last_name VARCHAR NOT NULL DEFAULT '';
    ALTER TABLE instructor_details_table ADD COLUMN IF NOT EXISTS avatar TEXT NOT NULL DEFAULT '';
    ALTER TABLE instructor_details_table ADD COLUMN IF NOT EXISTS professional_headline VARCHAR NOT NULL DEFAULT '';
    ALTER TABLE instructor_details_table ADD COLUMN IF NOT EXISTS short_bio TEXT NOT NULL DEFAULT '';
    ALTER TABLE instructor_details_table ADD COLUMN IF NOT EXISTS timezone VARCHAR NOT NULL DEFAULT 'UTC';
    ALTER TABLE instructor_details_table ADD COLUMN IF NOT EXISTS links JSON NOT NULL DEFAULT '[]';
    
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

    UPDATE user_table ut
    SET timezone = idt.timezone
    FROM instructor_details_table idt
    WHERE idt.user_id = ut.id AND idt.timezone IS NOT NULL AND idt.timezone != '' AND (ut.timezone = 'UTC' OR ut.timezone IS NULL);

    UPDATE user_table ut
    SET timezone = ldt.timezone
    FROM learner_details_table ldt
    WHERE ldt.user_id = ut.id AND ldt.timezone IS NOT NULL AND ldt.timezone != '' AND (ut.timezone = 'UTC' OR ut.timezone IS NULL);

    -- Ensure email verification columns exist on user_table
    ALTER TABLE user_table ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
    ALTER TABLE user_table ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
    ALTER TABLE user_table ADD COLUMN IF NOT EXISTS email_verification_expires_at_utc TIMESTAMP WITH TIME ZONE;
    ALTER TABLE user_table ADD COLUMN IF NOT EXISTS email_verification_attempts INTEGER DEFAULT 0;
    CREATE INDEX IF NOT EXISTS ix_user_table_email_verification_token ON user_table(email_verification_token);

    -- Ensure coordinator_details_table exists
    CREATE TABLE IF NOT EXISTS coordinator_details_table (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES user_table(id) ON DELETE CASCADE,
        coordinator_id VARCHAR UNIQUE DEFAULT generate_base32_id('CRD', 6),
        first_name VARCHAR NOT NULL DEFAULT '',
        last_name VARCHAR NOT NULL DEFAULT '',
        avatar TEXT NOT NULL DEFAULT '',
        phone VARCHAR NOT NULL DEFAULT '',
        short_bio TEXT NOT NULL DEFAULT '',
        timezone VARCHAR NOT NULL DEFAULT 'UTC',
        links JSON NOT NULL DEFAULT '[]'
    );
    CREATE INDEX IF NOT EXISTS ix_coordinator_details_table_coordinator_id ON coordinator_details_table(coordinator_id);

    -- Stripe-style ID generator & columns for courses, assignments, submissions
    CREATE OR REPLACE FUNCTION generate_stripe_id(prefix TEXT, len INT DEFAULT 10)
    RETURNS TEXT AS $fn$
    DECLARE
        chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        result TEXT := '';
        i INT;
    BEGIN
        FOR i IN 1..len LOOP
            result := result || substr(chars, floor(random() * 62 + 1)::INT, 1);
        END LOOP;
        RETURN prefix || '_' || result;
    END;
    $fn$ LANGUAGE plpgsql;

    ALTER TABLE course_table ADD COLUMN IF NOT EXISTS code VARCHAR(32);
    CREATE UNIQUE INDEX IF NOT EXISTS ix_course_table_code ON course_table(code);
    UPDATE course_table SET code = generate_stripe_id('crs', 10) WHERE code IS NULL OR code = '';

    ALTER TABLE assignment_table ADD COLUMN IF NOT EXISTS code VARCHAR(32);
    CREATE UNIQUE INDEX IF NOT EXISTS ix_assignment_table_code ON assignment_table(code);
    UPDATE assignment_table SET code = generate_stripe_id('asg', 10) WHERE code IS NULL OR code = '';

    ALTER TABLE submission_table ADD COLUMN IF NOT EXISTS code VARCHAR(32);
    CREATE UNIQUE INDEX IF NOT EXISTS ix_submission_table_code ON submission_table(code);
    UPDATE submission_table SET code = generate_stripe_id('sub', 10) WHERE code IS NULL OR code = '';
    """))
except Exception:
    pass

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="CourseDesk API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(auth_routes)
app.include_router(user_routes)
app.include_router(coordinator_routes)
app.include_router(instructor_routes)
app.include_router(learner_routes)
app.include_router(academic_routes)
app.include_router(course_routes)
app.include_router(assignment_routes)
app.include_router(comment_routes)
app.include_router(submission_routes)
app.include_router(setting_routes)
app.include_router(dashboard_routes)
app.include_router(notification_routes)
# ── NEW ──
app.include_router(session_routes)
app.include_router(announcement_routes)




@app.get("/", tags=["health"])
def health_check():
    return {"status": "ok", "app": "CourseDesk API"}