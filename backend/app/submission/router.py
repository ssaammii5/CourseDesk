from fastapi import APIRouter, File, Form, UploadFile, status

from app.submission import controller
from app.submission.dtos import (
    DraftSubmissionSchema,
    GradeSubmissionSchema,
    SubmissionAttachmentResponseSchema,
    SubmissionResponseSchema,
    SubmitAssignmentSchema,
)
from app.utils.db import get_db
from app.utils.helpers import DbSession, IsAdminOrTeacher, IsAuthenticated

submission_routes = APIRouter(prefix="/api/submissions", tags=["submissions"])


@submission_routes.get("", response_model=list[SubmissionResponseSchema], status_code=status.HTTP_200_OK)
def get_all_submissions(db: DbSession, user: IsAuthenticated):
    return controller.get_submissions(user, db)


@submission_routes.get("/my", response_model=list[SubmissionResponseSchema], status_code=status.HTTP_200_OK)
def get_my_submissions(db: DbSession, user: IsAuthenticated):
    return controller.get_my_submissions(user, db)


@submission_routes.post("/draft", response_model=SubmissionResponseSchema, status_code=status.HTTP_200_OK)
def get_or_create_draft(body: DraftSubmissionSchema, db: DbSession, user: IsAuthenticated):
    return controller.get_or_create_draft_submission(body.assignment_id, user, db)


@submission_routes.post("", response_model=SubmissionResponseSchema, status_code=status.HTTP_201_CREATED)
def submit_assignment(body: SubmitAssignmentSchema, db: DbSession, user: IsAuthenticated):
    return controller.submit_assignment(body, user, db)


@submission_routes.get("/{submission_id}", response_model=SubmissionResponseSchema, status_code=status.HTTP_200_OK)
def get_one_submission(submission_id: int, db: DbSession, user: IsAuthenticated):
    return controller.get_submission(submission_id, user, db)


@submission_routes.post("/{submission_id}/grade", response_model=SubmissionResponseSchema, status_code=status.HTTP_200_OK)
def grade_submission(
    submission_id: int, body: GradeSubmissionSchema, db: DbSession, user: IsAdminOrTeacher
):
    return controller.grade_submission(submission_id, body, user, db)


@submission_routes.post("/{submission_id}/unsubmit", response_model=SubmissionResponseSchema, status_code=status.HTTP_200_OK)
def unsubmit_submission(submission_id: int, db: DbSession, user: IsAuthenticated):
    return controller.unsubmit_assignment(submission_id, user, db)


@submission_routes.post("/{submission_id}/attachments", response_model=SubmissionAttachmentResponseSchema, status_code=status.HTTP_201_CREATED)
def add_submission_attachment(
    submission_id: int,
    db: DbSession,
    user: IsAuthenticated,
    file: UploadFile | None = File(default=None),
    link_url: str | None = Form(default=None, alias="linkUrl"),
    link_title: str | None = Form(default=None, alias="linkTitle"),
):
    return controller.add_submission_attachment(
        submission_id, user, db, file, link_url, link_title
    )


@submission_routes.delete("/{submission_id}/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_submission_attachment(
    submission_id: int, attachment_id: int, db: DbSession, user: IsAuthenticated
):
    return controller.delete_submission_attachment(submission_id, attachment_id, user, db)