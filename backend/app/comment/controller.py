from datetime import UTC, datetime
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.assignment.models import AssignmentModel
from app.comment.dtos import CommentResponseSchema, CreateCommentSchema
from app.comment.models import CommentModel
from app.course.models import CourseModel
from app.user.models import UserModel


def _comment_stmt():
    return select(CommentModel).options(
        selectinload(CommentModel.author),
        selectinload(CommentModel.learner),
        selectinload(CommentModel.assignment).selectinload(AssignmentModel.course),
    )


def serialize_comment(comment: CommentModel) -> CommentResponseSchema:
    return CommentResponseSchema(
        id=comment.id,
        assignment_id=comment.assignment_id,
        user_id=comment.user_id,
        user_name=comment.author.name if comment.author else None,
        user_email=comment.author.email if comment.author else None,
        user_role=comment.author.role if comment.author else None,
        learner_id=comment.learner_id,
        learner_name=comment.learner.name if comment.learner else None,
        content=comment.content,
        is_private=comment.is_private,
        created_at_utc=comment.created_at_utc,
        updated_at_utc=comment.updated_at_utc,
    )


def _check_assignment_access(assignment: AssignmentModel, user: UserModel) -> None:
    if user.role == "Admin":
        return
    course = assignment.course
    if user.role == "Instructor" and any(t.id == user.id for t in course.instructors):
        return
    if (
        user.role == "Learner"
        and assignment.status == "Published"
        and any(s.id == user.id for s in course.learners)
    ):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You don't have access to this assignment",
    )


def get_comments(
    assignment_id: int,
    is_private: bool,
    learner_id: Optional[int],
    user: UserModel,
    db: Session,
) -> list[CommentResponseSchema]:
    assignment = db.scalar(
        select(AssignmentModel)
        .options(
            selectinload(AssignmentModel.course).selectinload(CourseModel.instructors),
            selectinload(AssignmentModel.course).selectinload(CourseModel.learners),
        )
        .where(AssignmentModel.id == assignment_id)
    )
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )

    _check_assignment_access(assignment, user)

    stmt = (
        _comment_stmt()
        .where(
            CommentModel.assignment_id == assignment_id,
            CommentModel.is_private == is_private,
        )
        .order_by(CommentModel.created_at_utc.asc())
    )

    if is_private:
        if user.role == "Learner":
            # Learner can strictly only see private comments from their own thread
            stmt = stmt.where(CommentModel.learner_id == user.id)
        elif learner_id is not None:
            # Instructor/Admin filtering by specific learner
            stmt = stmt.where(CommentModel.learner_id == learner_id)

    comments = db.scalars(stmt).all()
    return [serialize_comment(c) for c in comments]


def create_comment(
    assignment_id: int,
    body: CreateCommentSchema,
    user: UserModel,
    db: Session,
) -> CommentResponseSchema:
    content = body.content.strip()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Comment content cannot be empty",
        )

    assignment = db.scalar(
        select(AssignmentModel)
        .options(
            selectinload(AssignmentModel.course).selectinload(CourseModel.instructors),
            selectinload(AssignmentModel.course).selectinload(CourseModel.learners),
        )
        .where(AssignmentModel.id == assignment_id)
    )
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )

    _check_assignment_access(assignment, user)

    target_learner_id: Optional[int] = None
    if body.is_private:
        if user.role == "Learner":
            target_learner_id = user.id
        else:
            if not body.learner_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="learner_id is required when creating private comments as an instructor",
                )
            if not any(s.id == body.learner_id for s in assignment.course.learners):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Selected learner is not enrolled in this course",
                )
            target_learner_id = body.learner_id

    comment = CommentModel(
        assignment_id=assignment_id,
        user_id=user.id,
        learner_id=target_learner_id,
        content=content,
        is_private=body.is_private,
        created_at_utc=datetime.now(UTC),
    )
    db.add(comment)
    db.flush()

    # Trigger notifications
    try:
        from app.notification.controller import create_notification, create_notifications_bulk

        link = f"/course/{assignment.course_id}/assignments/{assignment.id}"
        snippet = content if len(content) <= 80 else f"{content[:80]}…"

        if not body.is_private:
            # Class comment: notify instructors if learner posted, or notify learners if instructor posted
            if user.role == "Learner":
                inst_ids = [t.id for t in assignment.course.instructors if t.id != user.id]
                create_notifications_bulk(
                    db,
                    inst_ids,
                    title=f"New class comment on {assignment.title}",
                    message=f"{user.name}: {snippet}",
                    kind="assignment",
                    link=link,
                )
            else:
                learner_ids = [l.id for l in assignment.course.learners if l.id != user.id]
                create_notifications_bulk(
                    db,
                    learner_ids,
                    title=f"New class comment on {assignment.title}",
                    message=f"{user.name}: {snippet}",
                    kind="assignment",
                    link=link,
                )
        else:
            # Private comment
            if user.role == "Learner":
                inst_ids = [t.id for t in assignment.course.instructors if t.id != user.id]
                create_notifications_bulk(
                    db,
                    inst_ids,
                    title=f"Private comment from {user.name} on {assignment.title}",
                    message=snippet,
                    kind="assignment",
                    link=link,
                )
            elif target_learner_id:
                create_notification(
                    db,
                    target_learner_id,
                    title=f"Private comment from {user.name} on {assignment.title}",
                    message=snippet,
                    kind="assignment",
                    link=link,
                )
    except Exception:
        # Do not fail comment creation if notification delivery encounters an issue
        pass

    db.commit()
    db.refresh(comment)

    # Re-fetch with relationships loaded
    loaded_comment = db.scalar(
        _comment_stmt().where(CommentModel.id == comment.id)
    )
    return serialize_comment(loaded_comment or comment)


def delete_comment(comment_id: int, user: UserModel, db: Session) -> None:
    comment = db.scalar(
        select(CommentModel)
        .options(
            selectinload(CommentModel.assignment).selectinload(AssignmentModel.course).selectinload(CourseModel.instructors),
        )
        .where(CommentModel.id == comment_id)
    )
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    # Check permission to delete
    is_author = comment.user_id == user.id
    is_admin = user.role == "Admin"
    is_course_instructor = False
    if comment.assignment and comment.assignment.course:
        is_course_instructor = any(t.id == user.id for t in comment.assignment.course.instructors)

    if not (is_author or is_admin or is_course_instructor):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this comment",
        )

    db.delete(comment)
    db.commit()
