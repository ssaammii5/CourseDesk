from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.assignment.models import AssignmentModel
from app.course.models import CourseModel
from app.dashboard.dtos import DashboardStatsSchema
from app.submission.models import SubmissionModel
from app.user.models import UserModel


def get_stats(db: Session) -> DashboardStatsSchema:
    stmt = select(
        select(func.count(UserModel.id)).scalar_subquery().label("total_users"),
        select(func.count(UserModel.id)).where(UserModel.is_active.is_(True)).scalar_subquery().label("active_users"),
        select(func.count(UserModel.id)).where(UserModel.role == "Instructor").scalar_subquery().label("total_instructors"),
        select(func.count(UserModel.id)).where(UserModel.role == "Learner").scalar_subquery().label("total_learners"),
        select(func.count(UserModel.id)).where(UserModel.role.in_(("Coordinator", "Co-ordinator"))).scalar_subquery().label("total_coordinators"),
        select(func.count(CourseModel.id)).scalar_subquery().label("total_courses"),
        select(func.count(CourseModel.id)).where(CourseModel.is_active.is_(True)).scalar_subquery().label("active_courses"),
        select(func.count(AssignmentModel.id)).scalar_subquery().label("total_assignments"),
        select(func.count(AssignmentModel.id)).where(AssignmentModel.status == "Published").scalar_subquery().label("published_assignments"),
        select(func.count(SubmissionModel.id)).scalar_subquery().label("total_submissions"),
        select(func.count(SubmissionModel.id)).where(SubmissionModel.status == "Graded").scalar_subquery().label("graded_submissions"),
        select(func.count(SubmissionModel.id)).where(SubmissionModel.status.in_(("Submitted", "Pending"))).scalar_subquery().label("pending_submissions"),
    )

    row = db.execute(stmt).one()

    (
        total_users,
        active_users,
        total_instructors,
        total_learners,
        total_coordinators,
        total_courses,
        active_courses,
        total_assignments,
        published_assignments,
        total_submissions,
        graded_submissions,
        pending_submissions,
    ) = row

    return DashboardStatsSchema(
        total_users=total_users or 0,
        active_users=active_users or 0,
        total_instructors=total_instructors or 0,
        total_learners=total_learners or 0,
        total_teachers=total_instructors or 0,
        total_students=total_learners or 0,
        total_coordinators=total_coordinators or 0,
        total_courses=total_courses or 0,
        active_courses=active_courses or 0,
        total_assignments=total_assignments or 0,
        published_assignments=published_assignments or 0,
        total_submissions=total_submissions or 0,
        graded_submissions=graded_submissions or 0,
        pending_submissions=pending_submissions or 0,
    )