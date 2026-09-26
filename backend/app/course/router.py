from fastapi import APIRouter, status

from app.assignment.dtos import AssignmentResponseSchema, TopicDeleteSchema, TopicRenameSchema
from app.course import controller
from app.course.dtos import (
    CoursePeopleResponseSchema,
    CourseResponseSchema,
    CourseSchema,
)
from app.utils.db import get_db
from app.utils.helpers import DbSession, IsAdmin, IsAdminOrInstructor, IsAdminOrTeacher, IsAuthenticated

course_routes = APIRouter(prefix="/api/courses", tags=["courses"])


@course_routes.get("", response_model=list[CourseResponseSchema], status_code=status.HTTP_200_OK)
def get_all_courses(db: DbSession, _admin: IsAdmin):
    return controller.get_courses(db)


@course_routes.get("/my", response_model=list[CourseResponseSchema], status_code=status.HTTP_200_OK)
def get_my_courses(db: DbSession, user: IsAuthenticated):
    return controller.get_my_courses(user, db)


@course_routes.post("", response_model=CourseResponseSchema, status_code=status.HTTP_201_CREATED)
def create_course(body: CourseSchema, db: DbSession, _admin: IsAdmin):
    return controller.create_course(body, db)


@course_routes.get("/{course_id}", response_model=CourseResponseSchema, status_code=status.HTTP_200_OK)
def get_one_course(course_id: int, db: DbSession, user: IsAuthenticated):
    return controller.get_one_course(course_id, db)


@course_routes.get("/{course_id}/people", response_model=CoursePeopleResponseSchema, status_code=status.HTTP_200_OK)
def get_course_people(course_id: int, db: DbSession, user: IsAuthenticated):
    return controller.get_course_people(course_id, db)


@course_routes.get("/{course_id}/assignments", response_model=list[AssignmentResponseSchema], status_code=status.HTTP_200_OK)
def get_course_assignments(course_id: int, db: DbSession, user: IsAuthenticated):
    from app.assignment import controller as assignment_controller

    return assignment_controller.get_course_assignments(course_id, user, db)


@course_routes.put("/{course_id}", response_model=CourseResponseSchema, status_code=status.HTTP_200_OK)
def update_course(course_id: int, body: CourseSchema, db: DbSession, _admin: IsAdmin):
    return controller.update_course(course_id, body, db)


@course_routes.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(course_id: int, db: DbSession, _admin: IsAdmin):
    return controller.delete_course(course_id, db)


@course_routes.put("/{course_id}/topics/rename", status_code=status.HTTP_200_OK)
def rename_course_topic(
    course_id: int, body: TopicRenameSchema, db: DbSession, user: IsAdminOrInstructor
):
    from app.assignment import controller as assignment_controller

    return assignment_controller.rename_topic(course_id, body.old_name, body.new_name, user, db)


@course_routes.post("/{course_id}/topics/delete", status_code=status.HTTP_200_OK)
def delete_course_topic(
    course_id: int, body: TopicDeleteSchema, db: DbSession, user: IsAdminOrInstructor
):
    from app.assignment import controller as assignment_controller

    return assignment_controller.delete_topic(course_id, body.topic_name, body.fallback_topic, user, db)