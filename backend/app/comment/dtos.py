from datetime import datetime
from typing import Optional

from pydantic import Field

from app.utils.dto import CamelModel


class CreateCommentSchema(CamelModel):
    content: str = Field(..., min_length=1, max_length=5000)
    is_private: bool = False
    learner_id: Optional[int] = None


class CommentResponseSchema(CamelModel):
    id: int
    assignment_id: int
    user_id: int
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_role: Optional[str] = None
    learner_id: Optional[int] = None
    learner_name: Optional[str] = None
    content: str
    is_private: bool
    created_at_utc: datetime
    updated_at_utc: Optional[datetime] = None
