from app.utils.dto import CamelModel


class DashboardStatsSchema(CamelModel):
    total_users: int
    active_users: int
    total_teachers: int
    total_students: int
    total_courses: int
    active_courses: int
    total_assignments: int
    published_assignments: int
    total_submissions: int
    graded_submissions: int
    pending_submissions: int