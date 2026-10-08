from fastapi import HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.assignment.models import AssignmentModel
from app.course.models import CourseModel
from app.session.dtos import (
    CourseTopicsReorderSchema,
    SessionMaterialResponseSchema,
    SessionReorderSchema,
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
from app.utils.helpers import save_upload_file


def _detect_video_provider(url: str | None) -> str:
    if not url:
        return ""
    lower = url.lower()
    if "youtube.com" in lower or "youtu.be" in lower:
        return "youtube"
    if "vimeo.com" in lower:
        return "vimeo"
    if "zoom.us" in lower:
        return "zoom"
    return "direct"


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
        file_url=session.file_url,
        file_name=session.file_name,
        file_type=session.file_type,
        file_size=session.file_size,
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
            for mk in (session.video_markers or [])
        ],
        assignment_ids=[a.id for a in session.assignments],
        assignment_titles=[a.title for a in session.assignments],
    )


def _session_stmt():
    return select(SessionModel).options(
        selectinload(SessionModel.materials),
        selectinload(SessionModel.video_markers),
        selectinload(SessionModel.assignments),
    )


def _can_manage_course(user: UserModel, course: CourseModel) -> bool:
    if user.role in ("Admin", "Instructor"):
        return True
    return False


def _check_course_access(user: UserModel, course: CourseModel) -> None:
    if user.role in ("Admin", "Instructor", "Learner"):
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
        .order_by(SessionModel.session_number, SessionModel.id)
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
            link=f"/course/{body.course_id}?tab=video",
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


def reorder_course_sessions(
    course_id: int,
    body: SessionReorderSchema,
    user: UserModel,
    db: Session,
) -> list[SessionResponseSchema]:
    course = db.scalar(
        select(CourseModel)
        .options(selectinload(CourseModel.instructors))
        .where(CourseModel.id == course_id)
    )
    if not course:
        raise HTTPException(404, detail="Course id is incorrect")
    if not _can_manage_course(user, course):
        raise HTTPException(403, detail="You cannot manage sessions in this course")

    if body.items:
        for item in body.items:
            session = db.scalar(
                select(SessionModel).where(
                    SessionModel.id == item.id,
                    SessionModel.course_id == course_id,
                )
            )
            if session:
                if item.session_number is not None:
                    session.session_number = item.session_number
                # IMPORTANT: Video reordering must NEVER change the topic of the video
                db.add(session)
    elif body.session_ids:
        for idx, sid in enumerate(body.session_ids, start=1):
            session = db.scalar(
                select(SessionModel).where(
                    SessionModel.id == sid,
                    SessionModel.course_id == course_id,
                )
            )
            if session:
                session.session_number = idx
                db.add(session)

    db.commit()
    return get_course_sessions(course_id, user, db)


def reorder_course_topics(
    course_id: int,
    body: CourseTopicsReorderSchema,
    user: UserModel,
    db: Session,
) -> list[SessionResponseSchema]:
    course = db.scalar(
        select(CourseModel)
        .options(selectinload(CourseModel.instructors))
        .where(CourseModel.id == course_id)
    )
    if not course:
        raise HTTPException(404, detail="Course id is incorrect")
    if not _can_manage_course(user, course):
        raise HTTPException(403, detail="You cannot manage sessions in this course")

    all_sessions = db.scalars(
        _session_stmt()
        .where(SessionModel.course_id == course_id)
        .order_by(SessionModel.session_number, SessionModel.id)
    ).all()

    # Group existing sessions by topic while preserving their internal sequence
    groups: dict[str, list[SessionModel]] = {}
    for s in all_sessions:
        t_name = s.topic.strip() if s.topic else "General Videos"
        groups.setdefault(t_name, []).append(s)

    # Reassemble sessions in the order of body.topics, then any remaining topics
    reordered_sessions: list[SessionModel] = []
    seen_topics: set[str] = set()

    for t_name in body.topics:
        t_clean = t_name.strip()
        if t_clean in groups and t_clean not in seen_topics:
            reordered_sessions.extend(groups[t_clean])
            seen_topics.add(t_clean)

    for t_clean, s_list in groups.items():
        if t_clean not in seen_topics:
            reordered_sessions.extend(s_list)

    # Assign sequential session_number in database
    for idx, s in enumerate(reordered_sessions, start=1):
        s.session_number = idx
        db.add(s)

    db.commit()
    return get_course_sessions(course_id, user, db)


# ── Video Setup (YouTube, title, description, file) ─────────────────────────

def create_video_session(
    course_id: int,
    title: str,
    video_url: str,
    description: str,
    topic: str,
    duration_minutes: int,
    file: UploadFile | None,
    user: UserModel,
    db: Session,
    files: list[UploadFile] | None = None,
) -> SessionResponseSchema:
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
    if not _can_manage_course(user, course):
        raise HTTPException(403, detail="You cannot manage sessions in this course")

    if not title or not title.strip():
        raise HTTPException(400, detail="Video title is required")
    if not video_url or not video_url.strip():
        raise HTTPException(400, detail="Video URL is required")

    max_num = db.scalar(
        select(func.max(SessionModel.session_number)).where(SessionModel.course_id == course_id)
    ) or 0
    session_number = max_num + 1

    upload_list: list[UploadFile] = []
    if file and file.filename:
        upload_list.append(file)
    if files:
        for f in files:
            if f and f.filename and f not in upload_list:
                upload_list.append(f)

    file_url = None
    file_name = None
    file_type = None
    file_size = None

    if upload_list:
        first_f = upload_list[0]
        file_url, file_type, file_size = save_upload_file(first_f, f"sessions/{course_id}")
        file_name = first_f.filename

    video_provider = _detect_video_provider(video_url)

    session = SessionModel(
        course_id=course_id,
        session_number=session_number,
        title=title.strip(),
        topic=topic.strip() if topic else "General Videos",
        description=description or "",
        video_url=video_url.strip(),
        video_provider=video_provider,
        video_duration_minutes=duration_minutes or 45,
        duration_minutes=duration_minutes or 45,
        file_url=file_url,
        file_name=file_name,
        file_type=file_type,
        file_size=file_size,
        status="Completed",
    )
    if file_url:
        material = SessionMaterialModel(
            title=file_name or "Lecture Handout",
            kind="file",
            url=file_url,
            file_name=file_name or "file",
            file_type=file_type or "FILE",
            file_size=file_size or "—",
            description="Attached lecture file",
            sort_order=1,
        )
        session.materials.append(material)

    for idx, extra_f in enumerate(upload_list[1:], start=2):
        extra_url, extra_type, extra_size = save_upload_file(extra_f, f"sessions/{course_id}")
        extra_mat = SessionMaterialModel(
            title=extra_f.filename or f"Lecture Handout {idx}",
            kind="file",
            url=extra_url,
            file_name=extra_f.filename or "file",
            file_type=extra_type or "FILE",
            file_size=extra_size or "—",
            description="Attached lecture file",
            sort_order=idx,
        )
        session.materials.append(extra_mat)

    db.add(session)
    db.flush()

    learner_ids = [s.id for s in (course.learners or [])]
    if learner_ids:
        from app.notification.controller import create_notifications_bulk

        create_notifications_bulk(
            db=db,
            user_ids=learner_ids,
            title=f"New video lecture: {session.title}",
            message=f"{session.title} was uploaded in {course.name}",
            kind="session",
            link=f"/course/{course_id}?tab=video",
        )

    db.commit()
    db.refresh(session)
    return get_session(session.id, user, db)


def update_video_session(
    session_id: int,
    user: UserModel,
    db: Session,
    title: str | None = None,
    video_url: str | None = None,
    description: str | None = None,
    topic: str | None = None,
    duration_minutes: int | None = None,
    file: UploadFile | None = None,
    files: list[UploadFile] | None = None,
    remove_file: bool = False,
    remove_material_ids: str | None = None,
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

    if title is not None and title.strip():
        session.title = title.strip()
    if video_url is not None and video_url.strip():
        session.video_url = video_url.strip()
        session.video_provider = _detect_video_provider(video_url)
    if description is not None:
        session.description = description
    if topic is not None:
        session.topic = topic.strip()
    if duration_minutes is not None:
        session.duration_minutes = duration_minutes
        session.video_duration_minutes = duration_minutes

    # Remove specific material IDs
    if remove_material_ids:
        try:
            ids_to_remove = {int(x.strip()) for x in remove_material_ids.split(",") if x.strip()}
        except ValueError:
            ids_to_remove = set()
        for mat in list(session.materials):
            if mat.id in ids_to_remove:
                if session.file_url == mat.url:
                    session.file_url = None
                    session.file_name = None
                    session.file_type = None
                    session.file_size = None
                db.delete(mat)

    # Remove primary file if requested
    if remove_file:
        old_url = session.file_url
        session.file_url = None
        session.file_name = None
        session.file_type = None
        session.file_size = None
        if old_url:
            for mat in list(session.materials):
                if mat.url == old_url:
                    db.delete(mat)

    # Add any new files
    upload_list: list[UploadFile] = []
    if file and file.filename:
        upload_list.append(file)
    if files:
        for f in files:
            if f and f.filename and f not in upload_list:
                upload_list.append(f)

    if upload_list:
        for idx, f in enumerate(upload_list):
            f_url, f_type, f_size = save_upload_file(f, f"sessions/{session.course_id}")
            if not session.file_url:
                session.file_url = f_url
                session.file_name = f.filename
                session.file_type = f_type
                session.file_size = f_size
            mat = SessionMaterialModel(
                session_id=session.id,
                title=f.filename or f"Lecture Handout {len(session.materials) + 1}",
                kind="file",
                url=f_url,
                file_name=f.filename or "file",
                file_type=f_type or "FILE",
                file_size=f_size or "—",
                description="Attached lecture file",
                sort_order=len(session.materials) + 1 + idx,
            )
            db.add(mat)

    # If primary file was cleared but materials remain, point file_url to the first remaining material
    if not session.file_url and session.materials:
        first_remaining = session.materials[0]
        session.file_url = first_remaining.url
        session.file_name = first_remaining.file_name or first_remaining.title
        session.file_type = first_remaining.file_type
        session.file_size = first_remaining.file_size

    db.add(session)
    db.commit()
    return get_session(session_id, user, db)


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
    file: UploadFile | None = None,
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

    file_name = ""
    file_type = ""
    file_size = ""
    if file and file.filename:
        url, file_type, file_size = save_upload_file(file, f"sessions/{session.course_id}")
        file_name = file.filename
        kind = "file"

    material = SessionMaterialModel(
        session_id=session_id,
        title=title or file_name or "Lecture Handout",
        kind=kind,
        url=url,
        file_name=file_name,
        file_type=file_type,
        file_size=file_size,
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

    if session.file_url and session.file_url == material.url:
        session.file_url = None
        session.file_name = None
        session.file_type = None
        session.file_size = None
        db.add(session)

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