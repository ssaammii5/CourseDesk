from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.setting.dtos import AppSettingSchema
from app.setting.models import AppSettingModel


def get_settings(db: Session):
    return list(db.scalars(select(AppSettingModel)).all())


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


def get_system_activities(
    db: Session,
    limit: int = 15,
    offset: int = 0,
    search: str | None = None,
):
    from datetime import datetime, timezone, timedelta
    from sqlalchemy import or_
    from sqlalchemy.orm import joinedload
    from app.notification.models import NotificationModel

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=30)

    # Base query strictly constrained to the past 30 days
    base_filter = [NotificationModel.created_at_utc >= cutoff]

    if search and search.strip():
        term = f"%{search.strip()}%"
        base_filter.append(
            or_(
                NotificationModel.title.ilike(term),
                NotificationModel.message.ilike(term),
                NotificationModel.kind.ilike(term),
            )
        )

    # Total matching records within the 30-day window
    total = db.scalar(
        select(func.count(NotificationModel.id)).where(*base_filter)
    ) or 0

    # Paginated query with eager user load for lazy loading
    safe_limit = max(1, min(limit, 100))
    safe_offset = max(0, offset)

    query = (
        select(NotificationModel)
        .where(*base_filter)
        .options(joinedload(NotificationModel.user))
        .order_by(NotificationModel.created_at_utc.desc())
        .offset(safe_offset)
        .limit(safe_limit)
    )

    notifs = list(db.scalars(query).all())

    items = []
    for n in notifs:
        actor_name = n.user.name if n.user else "System"
        items.append({
            "id": n.id,
            "action": n.title,
            "details": n.message or "Administrative system action completed successfully.",
            "actor": actor_name,
            "timestamp": n.created_at_utc.isoformat(),
            "category": n.kind or "system",
        })

    return {
        "items": items,
        "total": total,
        "has_more": (safe_offset + len(items)) < total,
        "offset": safe_offset,
        "limit": safe_limit,
        "retention_days": 30,
    }