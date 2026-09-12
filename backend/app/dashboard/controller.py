from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.assignment.models import AssignmentModel
from app.course.models import CourseModel
from app.dashboard.dtos import DashboardStatsSchema
from app.submission.models import SubmissionModel
from app.user.models import UserModel


def get_stats(db: Session) -> DashboardStatsSchema:
    def count(model, *filters) -> int:
        stmt = select(func.count()).select_from(model)
        for f in filters:
            stmt = stmt.where(f)
        return db.scalar(stmt) or 0

    return DashboardStatsSchema(
        total_users=count(UserModel),
        active_users=count(UserModel, UserModel.is_active.is_(True)),
        total_teachers=count(UserModel, UserModel.role == "Teacher"),
        total_students=count(UserModel, UserModel.role == "Student"),
        total_courses=count(CourseModel),
        active_courses=count(CourseModel, CourseModel.is_active.is_(True)),
        total_assignments=count(AssignmentModel),
        published_assignments=count(AssignmentModel, AssignmentModel.status == "Published"),
        total_submissions=count(SubmissionModel),
        graded_submissions=count(SubmissionModel, SubmissionModel.status == "Graded"),
        pending_submissions=count(SubmissionModel, SubmissionModel.status == "Submitted"),
    )