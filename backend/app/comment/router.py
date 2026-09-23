from typing import Optional

from fastapi import APIRouter, Query, status

from app.comment import controller
from app.comment.dtos import CommentResponseSchema, CreateCommentSchema
from app.utils.db import get_db
from app.utils.helpers import DbSession, IsAuthenticated

comment_routes = APIRouter(tags=["comments"])


@comment_routes.get(
    "/api/assignments/{assignment_id}/comments",
    response_model=list[CommentResponseSchema],
    status_code=status.HTTP_200_OK,
)
def get_assignment_comments(
    assignment_id: int,
    db: DbSession,
    user: IsAuthenticated,
    is_private: bool = Query(default=False, alias="isPrivate"),
    learner_id: Optional[int] = Query(default=None, alias="learnerId"),
):
    return controller.get_comments(assignment_id, is_private, learner_id, user, db)


@comment_routes.post(
    "/api/assignments/{assignment_id}/comments",
    response_model=CommentResponseSchema,
    status_code=status.HTTP_201_CREATED,
)
def create_assignment_comment(
    assignment_id: int,
    body: CreateCommentSchema,
    db: DbSession,
    user: IsAuthenticated,
):
    return controller.create_comment(assignment_id, body, user, db)


@comment_routes.delete(
    "/api/comments/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_comment(
    comment_id: int,
    db: DbSession,
    user: IsAuthenticated,
):
    controller.delete_comment(comment_id, user, db)
