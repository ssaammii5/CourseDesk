from datetime import UTC, datetime
import html
import re

from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.announcement.dtos import (
    AnnouncementAttachmentResponseSchema,
    AnnouncementCommentResponseSchema,
    AnnouncementResponseSchema,
    AnnouncementSchema,
    AnnouncementUpdateSchema,
    CreateAnnouncementCommentSchema,
)
from app.announcement.models import (
    AnnouncementAttachmentModel,
    AnnouncementCommentModel,
    AnnouncementModel,
)
from app.course.models import CourseModel
from app.user.models import UserModel
from app.utils.helpers import save_upload_file


def _serialize_comment(c: AnnouncementCommentModel) -> AnnouncementCommentResponseSchema:
    return AnnouncementCommentResponseSchema(
        id=c.id,
        announcement_id=c.announcement_id,
        user_id=c.user_id,
        user_name=c.author.name if c.author else None,
        user_role=c.author.role if c.author else None,
        content=c.content,
        created_at_utc=c.created_at_utc,
        updated_at_utc=c.updated_at_utc,
    )


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
        comments=[_serialize_comment(c) for c in (a.comments or [])],
        attachments=[
            AnnouncementAttachmentResponseSchema.model_validate(att)
            for att in (a.attachments or [])
        ],
    )


def _clean_announcement_preview(
    title: str | None, body: str | None, max_length: int = 120
) -> str:
    clean_title = (title or "").strip()

    # Strip HTML tags and markdown symbols
    raw_body = body or ""
    clean_body = re.sub(r"<[^>]+>", " ", raw_body)
    clean_body = html.unescape(clean_body)
    clean_body = re.sub(r"[*_#`~]", "", clean_body)
    clean_body = re.sub(r"\s+", " ", clean_body).strip()

    if clean_title:
        if clean_body:
            snippet = clean_body[:80].rstrip() + ("..." if len(clean_body) > 80 else "")
            return f"{clean_title}: {snippet}"
        return clean_title

    if clean_body:
        return clean_body[:max_length].rstrip() + ("..." if len(clean_body) > max_length else "")

    return "New announcement posted."


def _announcement_stmt():
    return select(AnnouncementModel).options(
        selectinload(AnnouncementModel.author),
        selectinload(AnnouncementModel.comments).selectinload(AnnouncementCommentModel.author),
        selectinload(AnnouncementModel.attachments),
    )


def _can_manage_course(user: UserModel, course: CourseModel) -> bool:
    if user.role == "Admin":
        return True
    if user.role == "Instructor":
        return any(t.id == user.id for t in course.instructors)
    return False


def _check_course_access(user: UserModel, course: CourseModel) -> None:
    if user.role == "Admin":
        return
    if user.role == "Instructor" and any(t.id == user.id for t in course.instructors):
        return
    if user.role == "Learner" and any(s.id == user.id for s in course.learners):
        return
    raise HTTPException(403, detail="You don't have access to this course")


def get_course_announcements(
    course_id: int, user: UserModel, db: Session
) -> list[AnnouncementResponseSchema]:
    course = db.scalar(
        select(CourseModel)
        .options(
            selectinload(CourseModel.instructors),
            selectinload(CourseModel.learners),
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
            selectinload(CourseModel.instructors),
            selectinload(CourseModel.learners),
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
        s.id for s in (course.learners or []) if s.id != user.id
    ] + [
        t.id for t in (course.instructors or []) if t.id != user.id
    ]
    if recipient_ids:
        from app.notification.controller import create_notifications_bulk

        preview = _clean_announcement_preview(body.title, body.body, max_length=120)
        create_notifications_bulk(
            db=db,
            user_ids=recipient_ids,
            title=f"New announcement in {course.name}",
            message=preview,
            kind="announcement",
            link=f"/course/{body.course_id}",
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
            selectinload(CourseModel.instructors),
            selectinload(CourseModel.learners),
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
        .options(selectinload(CourseModel.instructors))
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
        .options(selectinload(CourseModel.instructors))
        .where(CourseModel.id == announcement.course_id)
    )
    can_manage = (course and _can_manage_course(user, course)) or (announcement.author_id == user.id)
    if not can_manage:
        raise HTTPException(403, detail="You cannot delete this announcement")

    db.delete(announcement)
    db.commit()


def get_announcement_comments(
    announcement_id: int, user: UserModel, db: Session
) -> list[AnnouncementCommentResponseSchema]:
    announcement = db.scalar(
        select(AnnouncementModel).where(AnnouncementModel.id == announcement_id)
    )
    if not announcement:
        raise HTTPException(404, detail="Announcement not found")

    course = db.scalar(
        select(CourseModel)
        .options(
            selectinload(CourseModel.instructors),
            selectinload(CourseModel.learners),
        )
        .where(CourseModel.id == announcement.course_id)
    )
    if not course:
        raise HTTPException(404, detail="Course not found")
    _check_course_access(user, course)

    comments = db.scalars(
        select(AnnouncementCommentModel)
        .options(selectinload(AnnouncementCommentModel.author))
        .where(AnnouncementCommentModel.announcement_id == announcement_id)
        .order_by(AnnouncementCommentModel.created_at_utc.asc())
    ).all()
    return [_serialize_comment(c) for c in comments]


def create_announcement_comment(
    announcement_id: int,
    body: CreateAnnouncementCommentSchema,
    user: UserModel,
    db: Session,
) -> AnnouncementCommentResponseSchema:
    content = body.content.strip()
    if not content:
        raise HTTPException(400, detail="Comment content cannot be empty")
    if len(content) > 5000:
        raise HTTPException(400, detail="Comment content cannot exceed 5000 characters")

    announcement = db.scalar(
        select(AnnouncementModel).where(AnnouncementModel.id == announcement_id)
    )
    if not announcement:
        raise HTTPException(404, detail="Announcement not found")

    course = db.scalar(
        select(CourseModel)
        .options(
            selectinload(CourseModel.instructors),
            selectinload(CourseModel.learners),
        )
        .where(CourseModel.id == announcement.course_id)
    )
    if not course:
        raise HTTPException(404, detail="Course not found")
    _check_course_access(user, course)

    comment = AnnouncementCommentModel(
        announcement_id=announcement_id,
        user_id=user.id,
        content=content,
    )
    db.add(comment)
    db.flush()

    try:
        from app.notification.controller import create_notification

        if announcement.author_id != user.id:
            snippet = content if len(content) <= 80 else f"{content[:80]}…"
            create_notification(
                db=db,
                user_id=announcement.author_id,
                title=f"New comment on your announcement in {course.name}",
                message=f"{user.name}: {snippet}",
                kind="announcement",
                link=f"/course/{course.id}",
            )
    except Exception:
        pass

    db.commit()
    db.refresh(comment)

    comment_loaded = db.scalar(
        select(AnnouncementCommentModel)
        .options(selectinload(AnnouncementCommentModel.author))
        .where(AnnouncementCommentModel.id == comment.id)
    )
    return _serialize_comment(comment_loaded or comment)


def delete_announcement_comment(
    comment_id: int,
    user: UserModel,
    db: Session,
) -> None:
    comment = db.scalar(
        select(AnnouncementCommentModel).where(AnnouncementCommentModel.id == comment_id)
    )
    if not comment:
        raise HTTPException(404, detail="Comment not found")

    announcement = db.scalar(
        select(AnnouncementModel).where(AnnouncementModel.id == comment.announcement_id)
    )
    if not announcement:
        raise HTTPException(404, detail="Announcement not found")

    course = db.scalar(
        select(CourseModel)
        .options(selectinload(CourseModel.instructors))
        .where(CourseModel.id == announcement.course_id)
    )

    can_delete = (
        user.role == "Admin"
        or comment.user_id == user.id
        or (course and _can_manage_course(user, course))
    )
    if not can_delete:
        raise HTTPException(403, detail="You cannot delete this comment")

    db.delete(comment)
    db.commit()


def add_attachment(
    announcement_id: int,
    user: UserModel,
    db: Session,
    file: UploadFile | None,
    link_url: str | None,
    link_title: str | None,
) -> AnnouncementAttachmentResponseSchema:
    announcement = db.scalar(
        _announcement_stmt().where(AnnouncementModel.id == announcement_id)
    )
    if not announcement:
        raise HTTPException(404, detail="Announcement id is incorrect")

    course = db.scalar(
        select(CourseModel)
        .options(selectinload(CourseModel.instructors))
        .where(CourseModel.id == announcement.course_id)
    )
    can_manage = (course and _can_manage_course(user, course)) or (announcement.author_id == user.id)
    if not can_manage:
        raise HTTPException(403, detail="You cannot add attachments to this announcement")

    if link_url:
        attachment = AnnouncementAttachmentModel(
            announcement_id=announcement.id,
            file_name=link_title or link_url,
            file_type="Link",
            file_size="—",
            kind="link",
            url=link_url,
        )
    elif file is not None:
        url, file_type, file_size = save_upload_file(file, f"announcements/{announcement.id}")
        attachment = AnnouncementAttachmentModel(
            announcement_id=announcement.id,
            file_name=file.filename or "file",
            file_type=file_type,
            file_size=file_size,
            kind="file",
            url=url,
        )
    else:
        raise HTTPException(400, detail="No file or link provided")

    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return AnnouncementAttachmentResponseSchema.model_validate(attachment)


def delete_attachment(
    announcement_id: int, attachment_id: int, user: UserModel, db: Session
) -> None:
    announcement = db.get(AnnouncementModel, announcement_id)
    if not announcement:
        raise HTTPException(404, detail="Announcement not found")

    course = db.scalar(
        select(CourseModel)
        .options(selectinload(CourseModel.instructors))
        .where(CourseModel.id == announcement.course_id)
    )
    can_manage = (course and _can_manage_course(user, course)) or (announcement.author_id == user.id)
    if not can_manage:
        raise HTTPException(403, detail="You cannot delete this attachment")

    attachment = db.get(AnnouncementAttachmentModel, attachment_id)
    if not attachment or attachment.announcement_id != announcement.id:
        raise HTTPException(404, detail="Attachment id is incorrect")
    db.delete(attachment)
    db.commit()