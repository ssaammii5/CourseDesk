from datetime import UTC, datetime
from typing import Sequence

from fastapi import HTTPException
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.notification.dtos import (
    NotificationListResponseSchema,
    NotificationPreferenceSchema,
    NotificationResponseSchema,
)
from app.notification.models import NotificationModel, NotificationPreferenceModel
from app.user.models import UserModel


def get_preferences(
    user: UserModel, db: Session
) -> NotificationPreferenceSchema:
    pref = db.scalar(
        select(NotificationPreferenceModel).where(
            NotificationPreferenceModel.user_id == user.id
        )
    )
    if not pref:
        pref = NotificationPreferenceModel(user_id=user.id)
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return NotificationPreferenceSchema.model_validate(pref)


def update_preferences(
    user: UserModel, body: NotificationPreferenceSchema, db: Session
) -> NotificationPreferenceSchema:
    pref = db.scalar(
        select(NotificationPreferenceModel).where(
            NotificationPreferenceModel.user_id == user.id
        )
    )
    if not pref:
        pref = NotificationPreferenceModel(user_id=user.id)
        db.add(pref)

    pref.email_notifications = body.email_notifications
    pref.assignment_notifications = body.assignment_notifications
    pref.grade_notifications = body.grade_notifications
    pref.announcement_notifications = body.announcement_notifications
    pref.due_date_reminders = body.due_date_reminders

    db.commit()
    db.refresh(pref)
    return NotificationPreferenceSchema.model_validate(pref)


def _should_suppress(
    pref: NotificationPreferenceModel | None, kind: str
) -> bool:
    if not pref:
        return False
    if kind == "assignment" and not pref.assignment_notifications:
        return True
    if kind == "grade" and not pref.grade_notifications:
        return True
    if kind == "announcement" and not pref.announcement_notifications:
        return True
    if kind == "due" and not pref.due_date_reminders:
        return True
    return False


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str = "",
    kind: str = "system",
    link: str | None = None,
) -> NotificationModel | None:
    pref = db.scalar(
        select(NotificationPreferenceModel).where(
            NotificationPreferenceModel.user_id == user_id
        )
    )
    if _should_suppress(pref, kind):
        return None

    notification = NotificationModel(
        user_id=user_id,
        title=title,
        message=message,
        kind=kind,
        link=link,
        is_read=False,
        created_at_utc=datetime.now(UTC),
    )
    db.add(notification)
    db.flush()

    try:
        from app.notification.broadcaster import notification_broadcaster

        payload = NotificationResponseSchema.model_validate(
            notification
        ).model_dump(mode="json", by_alias=True)
        notification_broadcaster.publish(user_id, payload)
    except Exception:
        pass

    return notification


def create_notifications_bulk(
    db: Session,
    user_ids: Sequence[int],
    title: str,
    message: str = "",
    kind: str = "system",
    link: str | None = None,
) -> list[NotificationModel]:
    if not user_ids:
        return []

    unique_ids = list(set(user_ids))
    prefs = {
        p.user_id: p
        for p in db.scalars(
            select(NotificationPreferenceModel).where(
                NotificationPreferenceModel.user_id.in_(unique_ids)
            )
        ).all()
    }

    created = []
    now = datetime.now(UTC)
    for uid in unique_ids:
        pref = prefs.get(uid)
        if _should_suppress(pref, kind):
            continue
        notif = NotificationModel(
            user_id=uid,
            title=title,
            message=message,
            kind=kind,
            link=link,
            is_read=False,
            created_at_utc=now,
        )
        db.add(notif)
        created.append(notif)

    if created:
        db.flush()
        try:
            from app.notification.broadcaster import notification_broadcaster

            for notif in created:
                payload = NotificationResponseSchema.model_validate(
                    notif
                ).model_dump(mode="json", by_alias=True)
                notification_broadcaster.publish(notif.user_id, payload)
        except Exception:
            pass

    return created


def _sync_due_reminders(user: UserModel, db: Session) -> None:
    from datetime import timedelta

    from app.assignment.models import AssignmentModel
    from app.course.models import CourseModel
    from app.submission.models import SubmissionModel

    now = datetime.now(UTC)
    pref = db.scalar(
        select(NotificationPreferenceModel).where(
            NotificationPreferenceModel.user_id == user.id
        )
    )
    if pref and not pref.due_date_reminders:
        return

    added = False
    if user.role == "Learner":
        upcoming = db.scalars(
            select(AssignmentModel)
            .join(CourseModel, AssignmentModel.course_id == CourseModel.id)
            .where(
                CourseModel.learners.any(UserModel.id == user.id),
                AssignmentModel.status == "Published",
                AssignmentModel.deadline_utc > now,
                AssignmentModel.deadline_utc <= now + timedelta(days=7),
            )
        ).all()
        for assign in upcoming:
            sub = db.scalar(
                select(SubmissionModel).where(
                    SubmissionModel.assignment_id == assign.id,
                    SubmissionModel.learner_id == user.id,
                )
            )
            if sub and sub.status in ("Submitted", "Graded"):
                continue

            link = f"/course/{assign.course_id}/coursework"
            existing = db.scalar(
                select(NotificationModel).where(
                    NotificationModel.user_id == user.id,
                    NotificationModel.kind == "due",
                    NotificationModel.link == link,
                )
            )
            if not existing:
                deadline_str = (
                    assign.deadline_utc.strftime("%b %d at %I:%M %p")
                    if assign.deadline_utc
                    else ""
                )
                db.add(
                    NotificationModel(
                        user_id=user.id,
                        title=f"Due soon: {assign.title}",
                        message=f"Due on {deadline_str}. Submit your work before the deadline!",
                        kind="due",
                        link=link,
                        is_read=False,
                        created_at_utc=now,
                    )
                )
                added = True
    if added:
        db.commit()


def get_user_notifications(
    user: UserModel, db: Session, limit: int = 50
) -> NotificationListResponseSchema:
    _sync_due_reminders(user, db)

    notifications = db.scalars(
        select(NotificationModel)
        .where(NotificationModel.user_id == user.id)
        .order_by(NotificationModel.created_at_utc.desc())
        .limit(limit)
    ).all()

    unread_count = db.scalar(
        select(func.count(NotificationModel.id)).where(
            NotificationModel.user_id == user.id,
            NotificationModel.is_read == False,  # noqa: E712
        )
    ) or 0

    items = [
        NotificationResponseSchema.model_validate(n) for n in notifications
    ]
    return NotificationListResponseSchema(items=items, unread_count=unread_count)


def mark_as_read(
    notification_id: int, user: UserModel, db: Session
) -> NotificationResponseSchema:
    notif = db.scalar(
        select(NotificationModel).where(NotificationModel.id == notification_id)
    )
    if not notif:
        raise HTTPException(404, detail="Notification not found")
    if notif.user_id != user.id:
        raise HTTPException(403, detail="Not authorized to access this notification")

    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return NotificationResponseSchema.model_validate(notif)


def mark_all_as_read(user: UserModel, db: Session) -> int:
    result = db.execute(
        update(NotificationModel)
        .where(
            NotificationModel.user_id == user.id,
            NotificationModel.is_read == False,  # noqa: E712
        )
        .values(is_read=True)
    )
    db.commit()
    return result.rowcount


def delete_notification(
    notification_id: int, user: UserModel, db: Session
) -> None:
    notif = db.scalar(
        select(NotificationModel).where(NotificationModel.id == notification_id)
    )
    if not notif:
        raise HTTPException(404, detail="Notification not found")
    if notif.user_id != user.id:
        raise HTTPException(403, detail="Not authorized to delete this notification")

    db.delete(notif)
    db.commit()


def clear_all_notifications(user: UserModel, db: Session) -> None:
    notifs = db.scalars(
        select(NotificationModel).where(NotificationModel.user_id == user.id)
    ).all()
    for n in notifs:
        db.delete(n)
    db.commit()
