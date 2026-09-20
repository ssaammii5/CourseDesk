from fastapi import APIRouter, File, Form, UploadFile, status

from app.assignment import controller
from app.assignment.dtos import (
    AssignmentAttachmentResponseSchema,
    AssignmentResponseSchema,
    AssignmentSchema,
    AssignmentUpdateSchema,
)
from app.submission.dtos import SubmissionResponseSchema
from app.utils.db import get_db
from app.utils.helpers import DbSession, IsAdminOrInstructor, IsAuthenticated

assignment_routes = APIRouter(prefix="/api/assignments", tags=["assignments"])


@assignment_routes.get("", response_model=list[AssignmentResponseSchema], status_code=status.HTTP_200_OK)
def get_all_assignments(db: DbSession, user: IsAuthenticated):
    return controller.get_assignments(user, db)


@assignment_routes.post("", status_code=status.HTTP_201_CREATED)
def create_assignment(body: AssignmentSchema, db: DbSession, user: IsAdminOrInstructor):
    assignment = controller.create_assignment(body, user, db)
    return {"id": assignment.id}


@assignment_routes.get("/{assignment_id}", response_model=AssignmentResponseSchema, status_code=status.HTTP_200_OK)
def get_one_assignment(assignment_id: int, db: DbSession, user: IsAuthenticated):
    return controller.get_assignment(assignment_id, user, db)


@assignment_routes.put("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def update_assignment(
    assignment_id: int, body: AssignmentUpdateSchema, db: DbSession, user: IsAdminOrInstructor
):
    return controller.update_assignment(assignment_id, body, user, db)


@assignment_routes.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(assignment_id: int, db: DbSession, user: IsAdminOrInstructor):
    return controller.delete_assignment(assignment_id, user, db)


@assignment_routes.post("/{assignment_id}/publish", status_code=status.HTTP_204_NO_CONTENT)
def publish_assignment(assignment_id: int, db: DbSession, user: IsAdminOrInstructor):
    return controller.publish_assignment(assignment_id, user, db)


@assignment_routes.get("/{assignment_id}/submissions", response_model=list[SubmissionResponseSchema], status_code=status.HTTP_200_OK)
def get_assignment_submissions(assignment_id: int, db: DbSession, user: IsAdminOrInstructor):
    return controller.get_assignment_submissions(assignment_id, user, db)


@assignment_routes.post("/{assignment_id}/attachments", response_model=AssignmentAttachmentResponseSchema, status_code=status.HTTP_201_CREATED)
def add_assignment_attachment(
    assignment_id: int,
    db: DbSession,
    user: IsAdminOrInstructor,
    file: UploadFile | None = File(default=None),
    link_url: str | None = Form(default=None, alias="linkUrl"),
    link_title: str | None = Form(default=None, alias="linkTitle"),
):
    return controller.add_attachment(assignment_id, user, db, file, link_url, link_title)


@assignment_routes.delete("/{assignment_id}/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment_attachment(
    assignment_id: int, attachment_id: int, db: DbSession, user: IsAdminOrInstructor
):
    return controller.delete_attachment(assignment_id, attachment_id, user, db)