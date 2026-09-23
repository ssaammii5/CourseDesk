from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.assignment.models import AssignmentModel
from app.course.models import CourseModel
from app.session.dtos import (
    SessionMaterialResponseSchema,
    SessionResponseSchema,
    SessionSchema,
    SessionUpdateSchema,
    VideoMarkerResponseSchema,
)
from app.session.models import (
    SessionMaterialModel,
    SessionModel,
    SessionVideoMarkerModel,
)
from app.user.models import UserModel


def _serialize_session(session: SessionModel) -> SessionResponseSchema:
    return SessionResponseSchema(
        id=session.id,
        course_id=session.course_id,
        session_number=session.session_number,
        title=session.title,
        topic=session.topic,
        description=session.description,
        meeting_url=session.meeting_url,
        meeting_provider=session.meeting_provider,
        meeting_id=session.meeting_id,
        meeting_passcode=session.meeting_passcode,
        scheduled_at_utc=session.scheduled_at_utc,
        duration_minutes=session.duration_minutes,
        video_url=session.video_url,
        video_provider=session.video_provider,
        video_duration_minutes=session.video_duration_minutes,
        status=session.status,
        created_at_utc=session.created_at_utc,
        materials=[
            SessionMaterialResponseSchema.model_validate(m) for m in session.materials
        ],
        video_markers=[
            VideoMarkerResponseSchema(
                id=mk.id,
                timestamp_seconds=mk.timestamp_seconds,
                label=mk.label,
            )
            for mk in session.video_markers
            if hasattr(session, "video_markers")
        ],
        assignment_ids=[a.id for a in session.assignments],
        assignment_titles=[a.title for a in session.assignments],
    )


def _session_stmt():
    return select(SessionModel).options(
        selectinload(SessionModel.materials),
        selectinload(SessionModel.assignments),
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


# ── CRUD ───────────────────────────────────────────────────────────────────

def get_course_sessions(
    course_id: int, user: UserModel, db: Session
) -> list[SessionResponseSchema]:
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

    sessions = db.scalars(
        _session_stmt()
        .where(SessionModel.course_id == course_id)
        .order_by(SessionModel.session_number)
    ).all()
    return [_serialize_session(s) for s in sessions]


def get_session(
    session_id: int, user: UserModel, db: Session
) -> SessionResponseSchema:
    session = db.scalar(_session_stmt().where(SessionModel.id == session_id))
    if not session:
        raise HTTPException(404, detail="Session id is incorrect")

    course = db.scalar(
        select(CourseModel)
        .options(
            selectinload(CourseModel.instructors),
            selectinload(CourseModel.learners),
        )
        .where(CourseModel.id == session.course_id)
    )
    if course:
        _check_course_access(user, course)

    return _serialize_session(session)


def create_session(
    body: SessionSchema, user: UserModel, db: Session
) -> SessionResponseSchema:
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
        raise HTTPException(403, detail="You cannot manage sessions in this course")

    session = SessionModel(
        course_id=body.course_id,
        session_number=body.session_number,
        title=body.title,
        topic=body.topic,
        description=body.description,
        meeting_url=body.meeting_url,
        meeting_provider=body.meeting_provider,
        meeting_id=body.meeting_id,
        meeting_passcode=body.meeting_passcode,
        scheduled_at_utc=body.scheduled_at_utc,
        duration_minutes=body.duration_minutes,
        video_url=body.video_url,
        video_provider=body.video_provider,
        video_duration_minutes=body.video_duration_minutes,
        status=body.status,
    )
    db.add(session)
    db.flush()

    learner_ids = [s.id for s in (course.learners or [])]
    if learner_ids:
        from app.notification.controller import create_notifications_bulk

        sched_str = (
            session.scheduled_at_utc.strftime("%b %d at %I:%M %p")
            if session.scheduled_at_utc
            else ""
        )
        msg = f"{session.title} in {course.name}" + (f" • {sched_str}" if sched_str else "")
        create_notifications_bulk(
            db=db,
            user_ids=learner_ids,
            title=f"New course session: {session.title}",
            message=msg,
            kind="session",
            link=f"/course/{body.course_id}?tab=curriculum",
        )

    db.commit()
    db.refresh(session)
    return get_session(session.id, user, db)


def update_session(
    session_id: int, body: SessionUpdateSchema, user: UserModel, db: Session
) -> SessionResponseSchema:
    session = db.scalar(_session_stmt().where(SessionModel.id == session_id))
    if not session:
        raise HTTPException(404, detail="Session id is incorrect")

    course = db.scalar(
        select(CourseModel)
        .options(selectinload(CourseModel.instructors))
        .where(CourseModel.id == session.course_id)
    )
    if not course or not _can_manage_course(user, course):
        raise HTTPException(403, detail="You cannot manage this session")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(session, field, value)

    db.add(session)
    db.commit()
    return get_session(session_id, user, db)


def delete_session(session_id: int, user: UserModel, db: Session) -> None:
    session = db.get(SessionModel, session_id)
    if not session:
        raise HTTPException(404, detail="Session id is incorrect")

    course = db.scalar(
        select(CourseModel)
        .options(selectinload(CourseModel.instructors))
        .where(CourseModel.id == session.course_id)
    )
    if not course or not _can_manage_course(user, course):
        raise HTTPException(403, detail="You cannot manage this session")

    db.delete(session)
    db.commit()


# ── Materials ──────────────────────────────────────────────────────────────

def add_material(
    session_id: int,
    user: UserModel,
    db: Session,
    title: str,
    kind: str = "link",
    url: str | None = None,
    description: str = "",
    sort_order: int = 0,
) -> SessionMaterialResponseSchema:
    session = db.get(SessionModel, session_id)
    if not session:
        raise HTTPException(404, detail="Session id is incorrect")

    course = db.scalar(
        select(CourseModel)
        .options(selectinload(CourseModel.instructors))
        .where(CourseModel.id == session.course_id)
    )
    if not course or not _can_manage_course(user, course):
        raise HTTPException(403, detail="You cannot manage this session")

    material = SessionMaterialModel(
        session_id=session_id,
        title=title,
        kind=kind,
        url=url,
        description=description,
        sort_order=sort_order,
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return SessionMaterialResponseSchema.model_validate(material)


def delete_material(
    session_id: int, material_id: int, user: UserModel, db: Session
) -> None:
    material = db.get(SessionMaterialModel, material_id)
    if not material or material.session_id != session_id:
        raise HTTPException(404, detail="Material id is incorrect")

    session = db.get(SessionModel, session_id)
    if not session:
        raise HTTPException(404, detail="Session id is incorrect")

    course = db.scalar(
        select(CourseModel)
        .options(selectinload(CourseModel.instructors))
        .where(CourseModel.id == session.course_id)
    )
    if not course or not _can_manage_course(user, course):
        raise HTTPException(403, detail="You cannot manage this session")

    db.delete(material)
    db.commit()


# ── Video markers ──────────────────────────────────────────────────────────

def add_video_marker(
    session_id: int,
    user: UserModel,
    db: Session,
    timestamp_seconds: int,
    label: str,
) -> VideoMarkerResponseSchema:
    session = db.get(SessionModel, session_id)
    if not session:
        raise HTTPException(404, detail="Session id is incorrect")

    course = db.scalar(
        select(CourseModel)
        .options(selectinload(CourseModel.instructors))
        .where(CourseModel.id == session.course_id)
    )
    if not course or not _can_manage_course(user, course):
        raise HTTPException(403, detail="You cannot manage this session")

    marker = SessionVideoMarkerModel(
        session_id=session_id,
        timestamp_seconds=timestamp_seconds,
        label=label,
    )
    db.add(marker)
    db.commit()
    db.refresh(marker)
    return VideoMarkerResponseSchema(
        id=marker.id,
        timestamp_seconds=marker.timestamp_seconds,
        label=marker.label,
    )


def delete_video_marker(
    session_id: int, marker_id: int, user: UserModel, db: Session
) -> None:
    marker = db.get(SessionVideoMarkerModel, marker_id)
    if not marker or marker.session_id != session_id:
        raise HTTPException(404, detail="Marker id is incorrect")
    db.delete(marker)
    db.commit()


# ── Next upcoming session helper ──────────────────────────────────────────

def get_next_session(
    course_id: int, user: UserModel, db: Session
) -> SessionResponseSchema | None:
    """Return the next upcoming (or currently live) session for the course."""
    from datetime import UTC, datetime

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

    now = datetime.now(UTC)
    session = db.scalar(
        _session_stmt()
        .where(
            SessionModel.course_id == course_id,
            SessionModel.scheduled_at_utc >= now,
            SessionModel.status.in_(["Scheduled", "Live"]),
        )
        .order_by(SessionModel.scheduled_at_utc)
    )
    if session:
        return _serialize_session(session)
    return None