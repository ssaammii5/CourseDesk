from datetime import UTC, datetime

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.announcement.dtos import (
    AnnouncementResponseSchema,
    AnnouncementSchema,
    AnnouncementUpdateSchema,
)
from app.announcement.models import AnnouncementModel
from app.course.models import CourseModel
from app.user.models import UserModel


def _serialize(a: AnnouncementModel) -> AnnouncementResponseSchema:
    return AnnouncementResponseSchema(
        id=a.id,
        course_id=a.course_id,
        author_id=a.author_id,
        author_name=a.author.name if a.author else None,
        title=a.title,
        body=a.body,
        is_pinned=a.is_pinned,
        created_at_utc=a.created_at_utc,
        updated_at_utc=a.updated_at_utc,
    )


def _announcement_stmt():
    return select(AnnouncementModel).options(
        selectinload(AnnouncementModel.author),
    )


def _can_manage_course(user: UserModel, course: CourseModel) -> bool:
    if user.role == "Admin":
        return True
    if user.role == "Teacher":
        return any(t.id == user.id for t in course.teachers)
    return False


def _check_course_access(user: UserModel, course: CourseModel) -> None:
    if user.role == "Admin":
        return
    if user.role == "Teacher" and any(t.id == user.id for t in course.teachers):
        return
    if user.role == "Student" and any(s.id == user.id for s in course.students):
        return
    raise HTTPException(403, detail="You don't have access to this course")


def get_course_announcements(
    course_id: int, user: UserModel, db: Session
) -> list[AnnouncementResponseSchema]:
    course = db.scalar(
        select(CourseModel)
        .options(
            selectinload(CourseModel.teachers),
            selectinload(CourseModel.students),
        )
        .where(CourseModel.id == course_id)
    )
    if not course:
        raise HTTPException(404, detail="Course id is incorrect")
    _check_course_access(user, course)

    announcements = db.scalars(
        _announcement_stmt()
        .where(AnnouncementModel.course_id == course_id)
        .order_by(
            AnnouncementModel.is_pinned.desc(),
            AnnouncementModel.created_at_utc.desc(),
        )
    ).all()
    return [_serialize(a) for a in announcements]


def create_announcement(
    body: AnnouncementSchema, user: UserModel, db: Session
) -> AnnouncementResponseSchema:
    course = db.scalar(
        select(CourseModel)
        .options(
            selectinload(CourseModel.teachers),
            selectinload(CourseModel.students),
        )
        .where(CourseModel.id == body.course_id)
    )
    if not course:
        raise HTTPException(404, detail="Course id is incorrect")
    if not _can_manage_course(user, course):
        raise HTTPException(403, detail="You cannot post announcements in this course")

    announcement = AnnouncementModel(
        course_id=body.course_id,
        author_id=user.id,
        title=body.title,
        body=body.body,
        is_pinned=body.is_pinned,
    )
    db.add(announcement)
    db.flush()

    recipient_ids = [
        s.id for s in (course.students or []) if s.id != user.id
    ] + [
        t.id for t in (course.teachers or []) if t.id != user.id
    ]
    if recipient_ids:
        from app.notification.controller import create_notifications_bulk

        preview = body.title or (body.body[:80] + ("..." if len(body.body) > 80 else ""))
        create_notifications_bulk(
            db=db,
            user_ids=recipient_ids,
            title=f"New announcement in {course.name}",
            message=preview,
            kind="announcement",
            link=f"/class/{body.course_id}",
        )

    db.commit()
    db.refresh(announcement)
    return get_announcement(announcement.id, user, db)


def get_announcement(
    announcement_id: int, user: UserModel, db: Session
) -> AnnouncementResponseSchema:
    announcement = db.scalar(
        _announcement_stmt().where(AnnouncementModel.id == announcement_id)
    )
    if not announcement:
        raise HTTPException(404, detail="Announcement id is incorrect")

    course = db.scalar(
        select(CourseModel)
        .options(
            selectinload(CourseModel.teachers),
            selectinload(CourseModel.students),
        )
        .where(CourseModel.id == announcement.course_id)
    )
    if course:
        _check_course_access(user, course)

    return _serialize(announcement)


def update_announcement(
    announcement_id: int,
    body: AnnouncementUpdateSchema,
    user: UserModel,
    db: Session,
) -> AnnouncementResponseSchema:
    announcement = db.scalar(
        _announcement_stmt().where(AnnouncementModel.id == announcement_id)
    )
    if not announcement:
        raise HTTPException(404, detail="Announcement id is incorrect")

    course = db.scalar(
        select(CourseModel)
        .options(selectinload(CourseModel.teachers))
        .where(CourseModel.id == announcement.course_id)
    )
    can_manage = (course and _can_manage_course(user, course)) or (announcement.author_id == user.id)
    if not can_manage:
        raise HTTPException(403, detail="You cannot edit this announcement")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(announcement, field, value)
    announcement.updated_at_utc = datetime.now(UTC)

    db.add(announcement)
    db.commit()
    return get_announcement(announcement_id, user, db)


def delete_announcement(
    announcement_id: int, user: UserModel, db: Session
) -> None:
    announcement = db.get(AnnouncementModel, announcement_id)
    if not announcement:
        raise HTTPException(404, detail="Announcement id is incorrect")

    course = db.scalar(
        select(CourseModel)
        .options(selectinload(CourseModel.teachers))
        .where(CourseModel.id == announcement.course_id)
    )
    can_manage = (course and _can_manage_course(user, course)) or (announcement.author_id == user.id)
    if not can_manage:
        raise HTTPException(403, detail="You cannot delete this announcement")

    db.delete(announcement)
    db.commit()