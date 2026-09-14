"""Seed the database with demo data matching the frontend mock data.

Usage: python -m app.utils.seed
"""

from datetime import UTC, datetime

from sqlalchemy import select

import app.academic.models  # noqa: F401
import app.announcement.models  # noqa: F401
import app.assignment.models  # noqa: F401
import app.auth.models  # noqa: F401
import app.course.models  # noqa: F401
import app.notification.models  # noqa: F401
import app.session.models  # noqa: F401
import app.setting.models  # noqa: F401
import app.submission.models  # noqa: F401
import app.user.models  # noqa: F401
from app.academic.controller import (
    create_department,
    create_program,
    create_semester,
)
from app.academic.dtos import DepartmentSchema, ProgramSchema, SemesterSchema
from app.assignment.controller import create_assignment, publish_assignment
from app.assignment.dtos import AssignmentSchema
from app.assignment.models import AssignmentModel
from app.auth.controller import login_user  # noqa: F401  (kept for parity)
from app.course.controller import create_course
from app.course.dtos import CourseSchema
from app.course.models import CourseModel
from app.setting.controller import upsert_setting
from app.setting.dtos import AppSettingSchema
from app.submission.controller import grade_submission, submit_assignment
from app.submission.dtos import GradeSubmissionSchema, SubmitAssignmentSchema
from app.user.controller import create_user
from app.user.dtos import StudentDetailsSchema, TeacherDetailsSchema, UserSchema
from app.user.models import UserModel
from app.utils.db import Base, LocalSession, engine

ADMIN = {"email": "admin@eclassroompro.com", "password": "Admin@123"}

PROGRAMS = [
    ("Undergraduate", "Bachelor's degree programs (4 years)"),
    ("Postgraduate", "Master's degree programs (2 years)"),
    ("Post Graduate Diploma", "Postgraduate diploma programs (1 year)"),
    ("M.Phil", "Master of Philosophy research program"),
    ("PhD", "Doctoral research program"),
]

DEPARTMENTS = [
    ("Computer Science and Engineering", "CSE"),
    ("Electrical and Electronic Engineering", "EEE"),
    ("Business Administration", "BBA"),
    ("English", "ENG"),
    ("Economics", "ECO"),
    ("Law", "LAW"),
    ("Mathematics", "MTH"),
    ("Physics", "PHY"),
    ("Chemistry", "CHM"),
    ("Architecture", "ARCH"),
    ("Civil Engineering", "CE"),
    ("Mechanical Engineering", "ME"),
]

SEMESTERS = [
    "January-June/2023", "July-December/2023",
    "January-June/2024", "July-December/2024",
    "January-June/2025", "July-December/2025",
    "January-June/2026", "July-December/2026",
]

SETTINGS = [
    ("site_name", "CourseDesk", "The display name of the application", "General"),
    ("max_file_size_mb", "10", "Maximum file upload size in MB", "General"),
    ("allowed_file_types", "pdf,doc,docx,zip,txt", "Comma-separated list of allowed file types", "General"),
    ("email_notifications_enabled", "true", "Enable email notifications for assignments", "Notifications"),
    ("due_date_reminder_hours", "24", "Hours before deadline to send reminder", "Notifications"),
    ("grade_notification_enabled", "true", "Notify students when graded", "Notifications"),
    ("max_marks_default", "100", "Default maximum marks for assignments", "Grading"),
    ("allow_late_submission", "false", "Allow submissions after deadline", "Grading"),
    ("late_submission_penalty_percent", "10", "Percentage penalty for late submissions", "Grading"),
    ("session_timeout_minutes", "60", "Session timeout in minutes", "Security"),
    ("password_min_length", "8", "Minimum password length", "Security"),
    ("enable_two_factor_auth", "false", "Require 2FA for all users", "Security"),
]

TEACHERS = [
    ("Prof. Dr. Abdul Masud", "abdul@eclassroompro.com", "FAC-1001", "Professor", "CSE"),
    ("Md. Mahbubur Rahman", "mahbubur@eclassroompro.com", "FAC-1002", "Associate Professor", "CSE"),
    ("Farjana Sultana Mim", "farjana@eclassroompro.com", "FAC-1003", "Assistant Professor", "CSE"),
    ("Dr. Rafiqul Islam", "rafiqul@eclassroompro.com", "FAC-1004", "Professor", "EEE"),
    ("Dr. Nasreen Akter", "nasreen@eclassroompro.com", "FAC-1005", "Associate Professor", "BBA"),
]

STUDENTS = [
    ("Md. Samiur Rahman", "samiur@eclassroompro.com", "201-15-0000", "CSE", "Postgraduate", "January-June/2024"),
    ("Habibur Rahman Khan Ratin", "ratin@eclassroompro.com", "201-15-0001", "CSE", "Postgraduate", "January-June/2024"),
    ("Iffat Ara Babli", "iffat@eclassroompro.com", "201-15-0002", "CSE", "Postgraduate", "January-June/2024"),
    ("Partha Bhakta", "partha@eclassroompro.com", "201-15-0003", "CSE", "Postgraduate", "January-June/2025"),
    ("Md. Kaium Al Sifat Bhuiyan", "kaium@eclassroompro.com", "201-15-0004", "CSE", "Postgraduate", "January-June/2025"),
    ("Sadia Islam", "sadia@eclassroompro.com", "201-15-0007", "CSE", "Postgraduate", "January-June/2024"),
    ("Nusrat Jahan Dina", "dina@eclassroompro.com", "201-15-0005", "EEE", "Undergraduate", "January-June/2024"),
    ("Tanvir Hasan", "tanvir@eclassroompro.com", "201-15-0006", "BBA", "Undergraduate", "January-June/2024"),
]


def _email_id(db, email: str) -> int:
    user = db.scalar(select(UserModel).where(UserModel.email == email))
    assert user is not None, f"seed user missing: {email}"
    return user.id


def seed_notifications(db) -> None:
    from app.notification.models import NotificationModel
    from app.course.models import CourseModel

    if db.scalar(select(NotificationModel).limit(1)):
        return

    print("Seeding demo notifications…")
    now = datetime.now(UTC)
    security_course = db.scalar(select(CourseModel).where(CourseModel.name.like("%Information Security%")))
    sec_id = security_course.id if security_course else 1

    samiur_id = _email_id(db, "samiur@eclassroompro.com")
    ratin_id = _email_id(db, "ratin@eclassroompro.com")
    mahbubur_id = _email_id(db, "mahbubur@eclassroompro.com")
    admin_id = _email_id(db, ADMIN["email"])

    notifications = [
        # Student Samiur
        NotificationModel(
            user_id=samiur_id,
            title="New assignment: CIT-6105 Research Assignment",
            message="Posted in CIT-6105: Information Security • Due Dec 16, 2026",
            kind="assignment",
            link=f"/class/{sec_id}/classwork",
            is_read=False,
            created_at_utc=now,
        ),
        NotificationModel(
            user_id=samiur_id,
            title="Graded: Quiz 1 - Classical Ciphers",
            message="Score: 9/10 • Feedback: Excellent understanding.",
            kind="grade",
            link=f"/class/{sec_id}/classwork",
            is_read=False,
            created_at_utc=now,
        ),
        NotificationModel(
            user_id=samiur_id,
            title="Due soon: Lab 1 - Substitution Cipher",
            message="Due tomorrow at 11:59 PM. Submit your work before the deadline!",
            kind="due",
            link=f"/class/{sec_id}/classwork",
            is_read=False,
            created_at_utc=now,
        ),
        NotificationModel(
            user_id=samiur_id,
            title="New announcement in CIT-6105: Information Security",
            message="Welcome to the semester! Please check the syllabus and lab schedule.",
            kind="announcement",
            link=f"/class/{sec_id}/announcements",
            is_read=True,
            created_at_utc=now,
        ),

        # Student Ratin
        NotificationModel(
            user_id=ratin_id,
            title="New assignment: CIT-6105 Research Assignment",
            message="Posted in CIT-6105: Information Security • Due Dec 16, 2026",
            kind="assignment",
            link=f"/class/{sec_id}/classwork",
            is_read=False,
            created_at_utc=now,
        ),
        NotificationModel(
            user_id=ratin_id,
            title="Graded: Lab 1 - Substitution Cipher",
            message="Score: 42/50 • Feedback: Well done. Consider adding more test cases.",
            kind="grade",
            link=f"/class/{sec_id}/classwork",
            is_read=False,
            created_at_utc=now,
        ),

        # Teacher Mahbubur
        NotificationModel(
            user_id=mahbubur_id,
            title="New submission: Lab 1 - Substitution Cipher",
            message="Md. Samiur Rahman submitted work in CIT-6105: Information Security",
            kind="submission",
            link=f"/class/{sec_id}/submissions",
            is_read=False,
            created_at_utc=now,
        ),
        NotificationModel(
            user_id=mahbubur_id,
            title="New submission: Lab 1 - Substitution Cipher",
            message="Habibur Rahman Khan Ratin submitted work in CIT-6105: Information Security",
            kind="submission",
            link=f"/class/{sec_id}/submissions",
            is_read=False,
            created_at_utc=now,
        ),
        NotificationModel(
            user_id=mahbubur_id,
            title="New submission: Quiz 1 - Classical Ciphers",
            message="Md. Samiur Rahman submitted work in CIT-6105: Information Security",
            kind="submission",
            link=f"/class/{sec_id}/submissions",
            is_read=True,
            created_at_utc=now,
        ),

        # Admin
        NotificationModel(
            user_id=admin_id,
            title="System initialized: CourseDesk LMS ready",
            message="Database initialized with academic departments, sessions, and sample courses.",
            kind="system",
            link="/courses",
            is_read=False,
            created_at_utc=now,
        ),
        NotificationModel(
            user_id=admin_id,
            title="Course created: CIT-6105: Information Security",
            message="Instructor: Prof. Md. Mahbubur Rahman • 4 Students Enrolled",
            kind="system",
            link=f"/class/{sec_id}",
            is_read=True,
            created_at_utc=now,
        ),
    ]

    for n in notifications:
        db.add(n)
    db.commit()
    print("Demo notifications seeded successfully.")


def seed() -> None:
    Base.metadata.create_all(engine)
    db = LocalSession()
    try:
        if db.scalar(select(UserModel).where(UserModel.email == ADMIN["email"])):
            print("Database already seeded — checking notifications…")
            seed_notifications(db)
            return

        print("Seeding academics…")
        for name, description in PROGRAMS:
            create_program(ProgramSchema(name=name, description=description), db)
        for name, code in DEPARTMENTS:
            create_department(DepartmentSchema(name=name, code=code), db)
        for name in SEMESTERS:
            create_semester(SemesterSchema(name=name), db)

        print("Seeding app settings…")
        for key, value, description, category in SETTINGS:
            upsert_setting(
                AppSettingSchema(key=key, value=value, description=description, category=category), db
            )

        print("Seeding users…")
        create_user(
            UserSchema(name="Admin User", email=ADMIN["email"], password=ADMIN["password"], role="Admin"), db
        )
        for name, email, teacher_id, designation, department in TEACHERS:
            create_user(
                UserSchema(
                    name=name,
                    email=email,
                    password="Teacher@123",
                    role="Teacher",
                    teacher_details=TeacherDetailsSchema(
                        teacher_id=teacher_id, designation=designation, department=department
                    ),
                ),
                db,
            )
        for name, email, student_id, department, program, semester in STUDENTS:
            create_user(
                UserSchema(
                    name=name,
                    email=email,
                    password="Student@123",
                    role="Student",
                    student_details=StudentDetailsSchema(
                        student_id=student_id,
                        department=department,
                        current_program=program,
                        session="2021-2022",
                        semester_session=semester,
                        nationality="Bangladeshi",
                    ),
                ),
                db,
            )

        print("Seeding courses…")
        pg_2024 = [_email_id(db, e) for e in ("samiur@eclassroompro.com", "ratin@eclassroompro.com", "iffat@eclassroompro.com", "sadia@eclassroompro.com")]
        pg_2025 = [_email_id(db, e) for e in ("partha@eclassroompro.com", "kaium@eclassroompro.com")]

        create_course(
            CourseSchema(
                name="CIT-6105: Information Security", program="Postgraduate", department="CSE",
                session="January-June/2024", is_active=True,
                teacher_ids=[_email_id(db, "mahbubur@eclassroompro.com")], student_ids=pg_2024,
            ), db,
        )
        create_course(
            CourseSchema(
                name="CIT-6102: Advanced Algorithms", program="Postgraduate", department="CSE",
                session="January-June/2025", is_active=True,
                teacher_ids=[_email_id(db, "abdul@eclassroompro.com")], student_ids=pg_2025,
            ), db,
        )
        create_course(
            CourseSchema(
                name="CIT-5109: Natural Language Processing", program="Postgraduate", department="CSE",
                session="January-June/2025", is_active=True,
                teacher_ids=[_email_id(db, "farjana@eclassroompro.com")], student_ids=pg_2025,
            ), db,
        )
        create_course(
            CourseSchema(
                name="CCE 423: Cryptography and Network Security", program="Undergraduate", department="CSE",
                session="January-June/2024", is_active=True,
                teacher_ids=[_email_id(db, "mahbubur@eclassroompro.com")],
                student_ids=[_email_id(db, e) for e in ("samiur@eclassroompro.com", "ratin@eclassroompro.com", "iffat@eclassroompro.com")],
            ), db,
        )
        create_course(
            CourseSchema(
                name="EEE 301: Circuit Analysis", program="Undergraduate", department="EEE",
                session="January-June/2024", is_active=True,
                teacher_ids=[_email_id(db, "rafiqul@eclassroompro.com")],
                student_ids=[_email_id(db, "dina@eclassroompro.com")],
            ), db,
        )
        create_course(
            CourseSchema(
                name="BBA 201: Principles of Management", program="Undergraduate", department="BBA",
                session="January-June/2024", is_active=True,
                teacher_ids=[_email_id(db, "nasreen@eclassroompro.com")],
                student_ids=[_email_id(db, "tanvir@eclassroompro.com")],
            ), db,
        )

        def course_id(name: str) -> int:
            course = db.scalar(select(CourseModel).where(CourseModel.name == name))
            assert course is not None
            return course.id

        def teacher(name: str) -> UserModel:
            user = db.scalar(select(UserModel).where(UserModel.name == name))
            assert user is not None
            return user

        def student(email: str) -> UserModel:
            user = db.scalar(select(UserModel).where(UserModel.email == email))
            assert user is not None
            return user

        print("Seeding assignments…")
        security = course_id("CIT-6105: Information Security")
        algorithms = course_id("CIT-6102: Advanced Algorithms")
        crypto = course_id("CCE 423: Cryptography and Network Security")
        mahbubur = teacher("Md. Mahbubur Rahman")
        abdul = teacher("Prof. Dr. Abdul Masud")

        a1 = create_assignment(
            AssignmentSchema(
                course_id=security, title="CIT-6105 Research Assignment",
                description="Follow IEEE Conference Paper format\nPlagiarism Similarity less than 10%, AI less than 15%\nUpload code in a Zip file",
                topic="CIT 6105 Research Assignment", kind="Assignment",
                deadline_utc=datetime(2026, 12, 16, 23, 59, tzinfo=UTC), max_marks=100,
            ), mahbubur, db,
        )
        publish_assignment(a1.id, mahbubur, db)

        a2 = create_assignment(
            AssignmentSchema(
                course_id=security, title="Lab 1 - Substitution Cipher",
                description="Implement Caesar and Vigenère ciphers.\nSubmit a short report with test cases.",
                topic="Software Security", kind="Assignment",
                deadline_utc=datetime(2027, 1, 30, 23, 59, tzinfo=UTC), max_marks=50,
            ), mahbubur, db,
        )
        publish_assignment(a2.id, mahbubur, db)

        a3 = create_assignment(
            AssignmentSchema(
                course_id=security, title="Quiz 1 - Classical Ciphers",
                description="10 multiple-choice questions on classical cryptography.",
                topic="Software Security", kind="Quiz",
                deadline_utc=datetime(2027, 1, 12, 23, 59, tzinfo=UTC), max_marks=10,
            ), mahbubur, db,
        )
        publish_assignment(a3.id, mahbubur, db)

        a4 = create_assignment(
            AssignmentSchema(
                course_id=algorithms, title="Quiz 2 - Hashing",
                description="Hash functions and collision resolution",
                topic="Algorithms", kind="Quiz",
                deadline_utc=datetime(2027, 2, 20, 23, 59, tzinfo=UTC), max_marks=20,
            ), abdul, db,
        )
        publish_assignment(a4.id, abdul, db)

        a5 = create_assignment(
            AssignmentSchema(
                course_id=algorithms, title="Assignment on Dynamic Programming",
                description="Solve DP problems", topic="Algorithms", kind="Assignment",
                deadline_utc=datetime(2027, 3, 1, 23, 59, tzinfo=UTC), max_marks=50,
            ), abdul, db,
        )  # left as Draft on purpose

        a6 = create_assignment(
            AssignmentSchema(
                course_id=crypto, title="Problem Set 1 - Symmetric Encryption",
                description="AES and DES problems", topic="Cryptography", kind="Assignment",
                deadline_utc=datetime(2027, 2, 15, 23, 59, tzinfo=UTC), max_marks=30,
            ), mahbubur, db,
        )
        publish_assignment(a6.id, mahbubur, db)

        print("Seeding submissions…")
        samiur = student("samiur@eclassroompro.com")
        ratin = student("ratin@eclassroompro.com")
        iffat = student("iffat@eclassroompro.com")

        s1 = submit_assignment(
            SubmitAssignmentSchema(
                assignment_id=a2.id,
                answer="Implemented both Caesar and Vigenère ciphers in Python with unit tests covering edge cases.",
            ), samiur, db,
        )
        grade_submission(s1.id, GradeSubmissionSchema(marks=45, feedback="Good implementation. Minor issues with edge cases."), mahbubur, db)

        s2 = submit_assignment(
            SubmitAssignmentSchema(
                assignment_id=a2.id,
                answer="Completed the substitution cipher lab with a brute-force helper for the Caesar cipher.",
            ), ratin, db,
        )
        grade_submission(s2.id, GradeSubmissionSchema(marks=42, feedback="Well done. Consider adding more test cases."), mahbubur, db)

        submit_assignment(
            SubmitAssignmentSchema(
                assignment_id=a2.id,
                answer="Attached my implementation along with a short report describing the test cases I ran.",
            ), iffat, db,
        )

        s4 = submit_assignment(
            SubmitAssignmentSchema(
                assignment_id=a3.id,
                answer="Answered all 10 multiple-choice questions on classical ciphers.",
            ), samiur, db,
        )
        grade_submission(s4.id, GradeSubmissionSchema(marks=9, feedback="Excellent understanding."), mahbubur, db)

        seed_notifications(db)

        print("\n✅ Seed complete. Login credentials:")
        print(f"   Admin   → {ADMIN['email']} / {ADMIN['password']}")
        print("   Teacher → mahbubur@eclassroompro.com / Teacher@123  (also: abdul@, farjana@, rafiqul@, nasreen@)")
        print("   Student → samiur@eclassroompro.com / Student@123  (also: ratin@, iffat@, partha@, kaium@, sadia@, dina@, tanvir@)")
    finally:
        db.close()


if __name__ == "__main__":
    seed()