from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.setting.dtos import AppSettingSchema
from app.setting.models import AppSettingModel


def get_settings(db: Session):
    return list(db.scalars(select(AppSettingModel)).all())


def get_public_settings(db: Session):
    rows = list(db.scalars(select(AppSettingModel)).all())
    store = {r.key: r.value for r in rows}

    platform_name = store.get("platform_name") or store.get("site_name") or "CourseDesk"
    site_name = store.get("site_name") or platform_name
    tagline = store.get("platform_tagline") or "Modern Learning & Assessment Management Platform"
    logo_light = store.get("brand_logo_light") or ""
    logo_dark = store.get("brand_logo_dark") or ""
    favicon = store.get("brand_favicon") or "/favicon.ico"
    m_mode = store.get("maintenance_mode", "false").lower() in ("true", "1", "yes")
    m_msg = (
        store.get("maintenance_banner_message")
        or "CourseDesk is currently undergoing scheduled maintenance. Normal access will resume shortly."
    )

    return {
        "platform_name": platform_name,
        "site_name": site_name,
        "platform_tagline": tagline,
        "brand_logo_light": logo_light,
        "brand_logo_dark": logo_dark,
        "brand_favicon": favicon,
        "maintenance_mode": m_mode,
        "maintenance_banner_message": m_msg,
    }


def upsert_setting(body: AppSettingSchema, db: Session):
    setting = db.get(AppSettingModel, body.key)
    if setting:
        setting.value = body.value
        setting.description = body.description
        setting.category = body.category
    else:
        setting = AppSettingModel(
            key=body.key,
            value=body.value,
            description=body.description,
            category=body.category,
        )
        db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting


def batch_upsert_settings(settings: list[AppSettingSchema], db: Session):
    for item in settings:
        s = db.get(AppSettingModel, item.key)
        if s:
            s.value = item.value
            if item.description:
                s.description = item.description
            if item.category:
                s.category = item.category
        else:
            s = AppSettingModel(
                key=item.key,
                value=item.value,
                description=item.description,
                category=item.category,
            )
            db.add(s)
    db.commit()
    return list(db.scalars(select(AppSettingModel)).all())


def get_system_health(db: Session):
    from app.assignment.models import AssignmentModel
    from app.course.models import CourseModel
    from app.submission.models import SubmissionModel
    from app.user.models import UserModel

    def count(model) -> int:
        return db.scalar(select(func.count()).select_from(model)) or 0

    courses_count = count(CourseModel)
    assignments_count = count(AssignmentModel)
    submissions_count = count(SubmissionModel)
    learners_count = db.scalar(
        select(func.count(UserModel.id)).where(UserModel.role == "Learner")
    ) or 0
    instructors_count = db.scalar(
        select(func.count(UserModel.id)).where(UserModel.role.in_(("Instructor", "Teacher")))
    ) or 0

    # Calculated asset storage footprint approximation in MB
    estimated_mb = round(
        (submissions_count * 1.8) + (assignments_count * 0.6) + (courses_count * 0.3) + 14.5, 1
    )

    return {
        "total_courses": courses_count,
        "total_assignments": assignments_count,
        "total_submissions": submissions_count,
        "total_learners": learners_count,
        "total_instructors": instructors_count,
        "estimated_storage_mb": estimated_mb,
        "storage_quota_mb": 51200.0,
        "status": "Healthy",
        "database_status": "Connected",
    }