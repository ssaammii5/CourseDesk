"""Seed the database with modern, commercial LMS data for CourseDesk.

Transform from departmental/university format to a standard online LMS:
- Modern LMS Categories: Web Development, Data Science & AI, UI/UX Design, Cybersecurity, Cloud & DevOps, Mobile App Development, Product Management
- Modern LMS Categories: Web Development, Data Science & AI, UI/UX Design, Cybersecurity, Cloud & DevOps, Mobile App Development, Product Management
- Real-World Commercial Courses: Full-Stack Bootcamp, Python for Data Science, Figma UI/UX, Ethical Hacking, Cloud & DevOps, Flutter Apps, Product Management
- Industry Instructors & Mentors: Lead Software Architects, Senior AI Scientists, Design Leads, DevOps Specialists (authentic Bangladeshi names)
- Community Coordinators: Student Success, Curriculum Director, Operations Lead
- 100 Learners: Career switchers, aspiring developers/designers, working professionals with realistic learning bios
- Real Portfolio Projects, Interactive Video Lessons with Timestamps, Community Announcements, and Mentor-Learner Discussions

Usage: uv run python -m app.utils.seed
"""

from datetime import UTC, datetime, timedelta
import random

from sqlalchemy import select

import app.academic.models  # noqa: F401
import app.announcement.models  # noqa: F401
import app.assignment.models  # noqa: F401
import app.auth.models  # noqa: F401
import app.comment.models  # noqa: F401
import app.course.models  # noqa: F401
import app.notification.models  # noqa: F401
import app.session.models  # noqa: F401
import app.setting.models  # noqa: F401
import app.submission.models  # noqa: F401
import app.user.models  # noqa: F401

from app.academic.controller import (
    create_department,
    create_tag,
)
from app.academic.dtos import DepartmentSchema, TagSchema
from app.announcement.models import (
    AnnouncementCommentModel,
    AnnouncementModel,
)
from app.assignment.controller import create_assignment, publish_assignment
from app.assignment.dtos import AssignmentSchema
from app.comment.models import CommentModel
from app.course.controller import create_course
from app.course.dtos import CourseSchema
from app.course.models import CourseModel
from app.notification.models import NotificationModel
from app.session.models import (
    SessionMaterialModel,
    SessionModel,
    SessionVideoMarkerModel,
)
from app.setting.controller import upsert_setting
from app.setting.dtos import AppSettingSchema
from app.submission.controller import grade_submission, submit_assignment
from app.submission.dtos import GradeSubmissionSchema, SubmitAssignmentSchema
from app.user.controller import create_user
from app.user.dtos import (
    CoordinatorDetailsSchema,
    InstructorDetailsSchema,
    LearnerDetailsSchema,
    UserAddressSchema,
    UserSchema,
)
from app.user.models import UserModel
from app.utils.db import Base, LocalSession, engine

# ─────────────────────────────────────────────────────────────────────────────
# 1. CORE DEMO CREDENTIALS & CONSTANTS
# ─────────────────────────────────────────────────────────────────────────────

ADMIN = {"email": "admin@coursedesk.com", "password": "Admin@123", "name": "Mostafa Kamal"}

# Modern LMS Categories (aliased to department table in DB)
CATEGORIES = [
    ("Web Development", "WEB", "Frontend, Backend, and Full-Stack Web Engineering"),
    ("Data Science & AI", "AI", "Machine Learning, Deep Learning, and Data Analytics"),
    ("UI/UX Design", "DESIGN", "User Experience, Product Design, and Prototyping"),
    ("Cybersecurity", "CYBER", "Ethical Hacking, Network Defense, and Security Auditing"),
    ("Cloud & DevOps", "CLOUD", "AWS, Docker, Kubernetes, and CI/CD Automation"),
    ("Mobile App Development", "MOBILE", "Flutter, React Native, iOS, and Android Apps"),
    ("Product Management", "PRODUCT", "Agile, Scrum, Product Roadmaps, and User Research"),
    ("Digital Marketing", "MARKETING", "SEO, Content Strategy, Social Media, and Growth"),
]

TAGS = [
    ("React", "Modern frontend web development with React and Next.js"),
    ("Python", "Python programming, data processing, and automation"),
    ("MachineLearning", "Statistical learning, deep neural nets, and AI models"),
    ("Figma", "UI/UX component design, wireframing, and interactive prototypes"),
    ("DevOps", "Containerization, cloud infrastructure, and CI/CD pipelines"),
    ("Security", "Web security, penetration testing, and ethical hacking"),
    ("Flutter", "Cross-platform mobile application development"),
    ("Agile", "Agile sprint planning, scrum ceremonies, and product roadmaps"),
    ("BeginnerFriendly", "Introductory foundational courses for beginners"),
    ("ProjectBased", "Hands-on courses centered around building production portfolio projects"),
]

SETTINGS = [
    ("site_name", "CourseDesk", "The display name of the application", "General"),
    ("max_file_size_mb", "25", "Maximum file upload size in MB", "General"),
    ("allowed_file_types", "pdf,doc,docx,zip,txt,png,jpg,jpeg,mp4", "Comma-separated list of allowed file types", "General"),
    ("email_notifications_enabled", "true", "Enable email notifications for assignments", "Notifications"),
    ("due_date_reminder_hours", "24", "Hours before deadline to send reminder", "Notifications"),
    ("grade_notification_enabled", "true", "Notify learners when graded", "Grading"),
    ("max_marks_default", "100", "Default maximum marks for assignments", "Grading"),
    ("allow_late_submission", "true", "Allow submissions after deadline", "Grading"),
    ("late_submission_penalty_percent", "10", "Percentage penalty for late submissions", "Grading"),
    ("session_timeout_minutes", "120", "Session timeout in minutes", "Security"),
    ("password_min_length", "8", "Minimum password length", "Security"),
    ("enable_two_factor_auth", "false", "Require 2FA for all users", "Security"),
]

# ─────────────────────────────────────────────────────────────────────────────
# 2. 10 LMS INSTRUCTORS & INDUSTRY MENTORS
# ─────────────────────────────────────────────────────────────────────────────

INSTRUCTORS_DATA = [
    {
        "name": "Dr. Asaduzzaman Nur",
        "email": "asaduzzaman.nur@coursedesk.com",
        "instructor_id": "INS-1001",
        "designation": "Lead Full-Stack Web Architect",
        "headline": "Lead Full-Stack Instructor & Next.js Architecture Specialist",
        "department": "Web Development",
        "bio": "Experienced technical lead with 12+ years of industry experience architecting production web platforms with Next.js, Node.js, and PostgreSQL.",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=face",
    },
    {
        "name": "Dr. Laila Arjumand Banu",
        "email": "laila.banu@coursedesk.com",
        "instructor_id": "INS-1002",
        "designation": "Staff AI & Data Science Specialist",
        "headline": "Senior AI Engineer & Python Data Science Mentor",
        "department": "Data Science & AI",
        "bio": "Machine learning researcher and industry practitioner specializing in predictive modeling, computer vision, and neural network optimization.",
        "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=256&h=256&fit=crop&crop=face",
    },
    {
        "name": "Shahana Parveen",
        "email": "shahana.parveen@coursedesk.com",
        "instructor_id": "INS-1003",
        "designation": "Lead UI/UX Product Designer",
        "headline": "Principal Product Designer & Figma Masterclass Instructor",
        "department": "UI/UX Design",
        "bio": "Senior UX/UI designer who has led design systems and customer journey design across global fintech and SaaS applications.",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=face",
    },
    {
        "name": "Dr. Kamrul Ahsan",
        "email": "kamrul.ahsan@coursedesk.com",
        "instructor_id": "INS-1004",
        "designation": "Principal Cybersecurity Specialist",
        "headline": "Lead Security Auditor & Ethical Hacking Instructor",
        "department": "Cybersecurity",
        "bio": "Certified ethical hacker and security consultant focusing on web application penetration testing, OWASP vulnerabilities, and network defense.",
        "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop&crop=face",
    },
    {
        "name": "Enamul Hoque Bappi",
        "email": "enamul.hoque@coursedesk.com",
        "instructor_id": "INS-1005",
        "designation": "Senior Cloud & DevOps Engineer",
        "headline": "DevOps Architect & AWS Certified Solutions Mentor",
        "department": "Cloud & DevOps",
        "bio": "DevOps lead specializing in containerization with Docker, Kubernetes orchestration, and automated CI/CD deployment pipelines on AWS.",
        "avatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=256&h=256&fit=crop&crop=face",
    },
    {
        "name": "Dr. Jahangir Alam Siddique",
        "email": "jahangir.alam@coursedesk.com",
        "instructor_id": "INS-1006",
        "designation": "Lead Mobile App Developer",
        "headline": "Cross-Platform Mobile Developer & Flutter Specialist",
        "department": "Mobile App Development",
        "bio": "Mobile engineer with numerous published iOS & Android apps built with Flutter, Dart, and native reactive architecture.",
        "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&h=256&fit=crop&crop=face",
    },
    {
        "name": "Dr. Rokeya Khandakar",
        "email": "rokeya.khandakar@coursedesk.com",
        "instructor_id": "INS-1007",
        "designation": "Principal Product Management Mentor",
        "headline": "Executive Product Coach & Agile Transformation Specialist",
        "department": "Product Management",
        "bio": "Product leader coaching aspiring product managers in customer discovery, user stories, metrics definition, and agile roadmap execution.",
        "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=256&h=256&fit=crop&crop=face",
    },
    {
        "name": "Prof. Dr. Zahidul Haque",
        "email": "zahidul.haque@coursedesk.com",
        "instructor_id": "INS-1008",
        "designation": "Algorithms & Technical Interview Coach",
        "headline": "Competitive Programmer & Technical Interview Lead",
        "department": "Web Development",
        "bio": "Algorithms coach with a passion for helping software engineers master dynamic programming, graph algorithms, and coding interviews.",
        "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=256&h=256&fit=crop&crop=face",
    },
    {
        "name": "Dr. Tahmina Ferdous",
        "email": "tahmina.ferdous@coursedesk.com",
        "instructor_id": "INS-1009",
        "designation": "Senior Natural Language Processing Engineer",
        "headline": "Deep Learning & LLM Fine-Tuning Specialist",
        "department": "Data Science & AI",
        "bio": "AI engineer mentoring students in transformer architectures, sentiment analysis, and Retrieval-Augmented Generation (RAG) workflows.",
        "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=256&h=256&fit=crop&crop=face",
    },
    {
        "name": "Prof. Dr. Mizanur Karim",
        "email": "mizanur.karim@coursedesk.com",
        "instructor_id": "INS-1010",
        "designation": "IoT & Embedded Systems Lead",
        "headline": "Smart Hardware & Connected Systems Educator",
        "department": "Cloud & DevOps",
        "bio": "Hardware and cloud specialist guiding learners at the intersection of embedded IoT devices and real-time cloud data pipelines.",
        "avatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=256&h=256&fit=crop&crop=face",
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# 3. 3 LMS COMMUNITY & PROGRAM COORDINATORS
# ─────────────────────────────────────────────────────────────────────────────

COORDINATORS_DATA = [
    {
        "name": "Dr. Shamsul Huda",
        "email": "shamsul.huda@coursedesk.com",
        "coordinator_id": "CRD-1001",
        "first_name": "Shamsul",
        "last_name": "Huda",
        "phone": "+880 1711-882201",
        "bio": "Director of Student Success & Career Placement, guiding students on portfolio development and job interviews.",
        "avatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=256&h=256&fit=crop&crop=face",
    },
    {
        "name": "Nargis Sultana Chowdhury",
        "email": "nargis.sultana@coursedesk.com",
        "coordinator_id": "CRD-1002",
        "first_name": "Nargis",
        "last_name": "Chowdhury",
        "phone": "+880 1819-773302",
        "bio": "Head of Curriculum & Mentor Operations, ensuring top-tier course materials, code quality, and live interactive workshops.",
        "avatar": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=256&h=256&fit=crop&crop=face",
    },
    {
        "name": "Engr. Golam Sarwar",
        "email": "golam.sarwar@coursedesk.com",
        "coordinator_id": "CRD-1003",
        "first_name": "Golam",
        "last_name": "Sarwar",
        "phone": "+880 1912-664403",
        "bio": "Learning Platform Operations Lead managing student enrollments, project review workflows, and platform support.",
        "avatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=256&h=256&fit=crop&crop=face",
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# 4. 100 AUTHENTIC BANGLADESHI LEARNERS WITH REAL LMS BIOS
# ─────────────────────────────────────────────────────────────────────────────

LEARNERS_RAW_LIST = [
    ("Shakil Mahmud", "shakil.mahmud@coursedesk.com", "Web Development", "Aspiring Full-Stack Developer learning Next.js and PostgreSQL."),
    ("Maruf Billah", "maruf.billah@coursedesk.com", "Web Development", "Frontend engineer mastering server components and backend architecture."),
    ("Rashedul Karim", "rashedul.karim@coursedesk.com", "Data Science & AI", "Data enthusiast building machine learning prediction models with Python."),
    ("Ashiqur Rahman Tuhin", "ashiqur.rahman@coursedesk.com", "UI/UX Design", "Product designer focused on design systems, typography, and Figma workflows."),
    ("Jannatul Nayeem", "jannatul.nayeem@coursedesk.com", "Cybersecurity", "Computer science graduate learning ethical hacking and application security."),
    ("Mehedi Hasan Shawon", "mehedi.hasan@coursedesk.com", "Cloud & DevOps", "System administrator transitioning to cloud engineering and Docker containers."),
    ("Sumon Chandra Paul", "sumon.paul@coursedesk.com", "Mobile App Development", "Flutter developer building cross-platform applications for iOS and Android."),
    ("Fahim Faysal", "fahim.faysal@coursedesk.com", "Product Management", "Associate product manager learning agile roadmaps and user analytics."),
    ("Nabil Bin Ashraf", "nabil.ashraf@coursedesk.com", "Web Development", "Junior JavaScript developer leveling up in TypeScript and modern databases."),
    ("Shakhawat Hossain", "shakhawat.hossain@coursedesk.com", "Data Science & AI", "Business analyst learning predictive analytics and exploratory data analysis."),
    ("Anowar Hossen", "anowar.hossen@coursedesk.com", "UI/UX Design", "Graphic designer transitioning into user experience research and UI design."),
    ("Bilkis Jahan", "bilkis.jahan@coursedesk.com", "Cybersecurity", "Network administrator studying web application vulnerability assessment."),
    ("Choyan Roy", "choyan.roy@coursedesk.com", "Cloud & DevOps", "Backend developer learning AWS architecture and CI/CD pipelines."),
    ("Delwar Hossain", "delwar.hossain@coursedesk.com", "Mobile App Development", "Mobile engineering enthusiast exploring Dart and responsive Flutter layouts."),
    ("Emran Nazir", "emran.nazir@coursedesk.com", "Web Development", "Passionate self-taught developer building portfolio web projects."),
    ("Ferdous Ahmed", "ferdous.ahmed@coursedesk.com", "Web Development", "Software engineer sharpening skills in React and REST API design."),
    ("Gazi Salauddin", "gazi.salauddin@coursedesk.com", "Data Science & AI", "Enthusiastic learner studying deep learning and computer vision."),
    ("Hasibul Islam Emon", "hasibul.islam@coursedesk.com", "UI/UX Design", "Design student passionate about interactive micro-animations and wireframing."),
    ("Ismat Ara Tonu", "ismat.ara@coursedesk.com", "Product Management", "Marketing professional learning agile product strategy and user personas."),
    ("Joydip Bhowmik", "joydip.bhowmik@coursedesk.com", "Web Development", "Full-stack developer building real-time applications with modern tech stacks."),
    ("Kawsar Molla", "kawsar.molla@coursedesk.com", "Cloud & DevOps", "DevOps learner exploring Docker orchestration and Kubernetes pods."),
    ("Lutfor Rahman", "lutfor.rahman@coursedesk.com", "Cybersecurity", "Information security student practicing penetration testing techniques."),
    ("Masud Rana", "masud.rana@coursedesk.com", "Web Development", "Software developer building clean, responsive user interfaces."),
    ("Nazmul Ahsan Rony", "nazmul.ahsan@coursedesk.com", "Data Science & AI", "Python enthusiast training machine learning classifiers on real datasets."),
    ("Obaidul Quader Shiblu", "obaidul.quader@coursedesk.com", "UI/UX Design", "Visual designer creating high-fidelity interactive design prototypes."),
    ("Palash Debnath", "palash.debnath@coursedesk.com", "Mobile App Development", "Cross-platform mobile developer integrating REST APIs in Flutter."),
    ("Quazi Moinul Islam", "quazi.moinul@coursedesk.com", "Product Management", "Scrum master advancing in data-driven product management."),
    ("Rifat Ara Mou", "rifat.mou@coursedesk.com", "Web Development", "Frontend developer passionate about accessibility and modern CSS."),
    ("Sajidul Huq", "sajidul.huq@coursedesk.com", "Cloud & DevOps", "Cloud practitioner learning infrastructure as code and AWS deployment."),
    ("Touhidul Anwar", "touhidul.anwar@coursedesk.com", "Data Science & AI", "Data science student focusing on NLP and Large Language Models."),
    ("Utpal Sarker", "utpal.sarker@coursedesk.com", "Web Development", "Full-stack developer learning relational database schema design."),
    ("Vashkar Barua", "vashkar.barua@coursedesk.com", "UI/UX Design", "UI designer crafting clean, accessible design systems in Figma."),
    ("Wasiur Rahman", "wasiur.rahman@coursedesk.com", "Cybersecurity", "Security researcher testing web vulnerabilities against OWASP Top 10."),
    ("Yousuf Ali", "yousuf.ali@coursedesk.com", "Mobile App Development", "Aspiring app developer publishing useful utility applications."),
    ("Ziaul Haque Shipon", "ziaul.haque@coursedesk.com", "Web Development", "Junior web developer building portfolio projects for full-stack jobs."),
    ("Afroza Parveen", "afroza.parveen@coursedesk.com", "Product Management", "Product enthusiast studying customer feedback loops and roadmaps."),
    ("Badal Chandra Das", "badal.das@coursedesk.com", "Data Science & AI", "Statistical analyst transitioning to predictive machine learning."),
    ("Chinmoy Mazumder", "chinmoy.mazumder@coursedesk.com", "Cloud & DevOps", "Infrastructure engineer automating build and release pipelines."),
    ("Dewan Ashraful", "dewan.ashraful@coursedesk.com", "Web Development", "React enthusiast diving deep into server-side rendering and Next.js."),
    ("Ehsanul Karim", "ehsanul.karim@coursedesk.com", "Mobile App Development", "Mobile developer focusing on Flutter animations and smooth UX."),
    ("Fazlul Bari", "fazlul.bari@coursedesk.com", "Cybersecurity", "Security enthusiast learning reverse engineering and network analysis."),
    ("Golam Rabbani", "golam.rabbani@coursedesk.com", "UI/UX Design", "Product designer focused on user research and mobile usability testing."),
    ("Harun Ur Rashid", "harun.rashid@coursedesk.com", "Web Development", "Backend developer learning GraphQL and PostgreSQL optimizations."),
    ("Iqbal Bahar", "iqbal.bahar@coursedesk.com", "Product Management", "Career changer learning technical product leadership and agile sprint tools."),
    ("Jalal Uddin", "jalal.uddin@coursedesk.com", "Data Science & AI", "Data analyst visualizing complex datasets with Seaborn and Matplotlib."),
    ("Kabir Hossain", "kabir.hossain@coursedesk.com", "Cloud & DevOps", "DevOps enthusiast setting up multi-stage Docker build files."),
    ("Latifa Begum", "latifa.begum@coursedesk.com", "Web Development", "Aspiring frontend developer building clean landing pages and dashboards."),
    ("Mominul Haque", "mominul.haque@coursedesk.com", "UI/UX Design", "Figma power user creating responsive design tokens and auto-layouts."),
    ("Nurun Nahar", "nurun.nahar@coursedesk.com", "Mobile App Development", "Mobile developer learning state management with Provider and Bloc."),
    ("Osman Goni", "osman.goni@coursedesk.com", "Cybersecurity", "Ethical hacking learner practicing penetration testing in lab sandboxes."),
    ("Prasenjit Das", "prasenjit.das@coursedesk.com", "Web Development", "Full-stack enthusiast passionate about modern web performance."),
    ("Qudrat E Khuda", "qudrat.khuda@coursedesk.com", "Data Science & AI", "Machine learning learner training regression and decision tree models."),
    ("Rasheda Khatun", "rasheda.khatun@coursedesk.com", "UI/UX Design", "UX researcher conducting user interviews and usability audits."),
    ("Saifuddin Khaled", "saifuddin.khaled@coursedesk.com", "Cloud & DevOps", "Cloud engineer automating cloud deployments with GitHub Actions."),
    ("Tarek Monowar", "tarek.monowar@coursedesk.com", "Product Management", "Product manager learning metrics-driven product prioritization."),
    ("Uzzal Kumar Ghosh", "uzzal.ghosh@coursedesk.com", "Web Development", "JavaScript engineer learning TypeScript and API security."),
    ("Wahida Rahman", "wahida.rahman@coursedesk.com", "Mobile App Development", "Flutter enthusiast building cross-platform e-commerce mobile apps."),
    ("Yasir Arafat", "yasir.arafat@coursedesk.com", "Cybersecurity", "Penetration testing student exploring Burp Suite and Wireshark."),
    ("Zafrul Islam", "zafrul.islam@coursedesk.com", "Data Science & AI", "Data scientist learning model deployment and FastAPI endpoints."),
    ("Akram Hossain", "akram.hossain@coursedesk.com", "Cloud & DevOps", "Linux enthusiast building automated Docker container workflows."),
    ("Biplob Kumar Mondal", "biplob.mondal@coursedesk.com", "Web Development", "Full-stack learner building end-to-end web apps with auth and payments."),
    ("Chandan Banik", "chandan.banik@coursedesk.com", "UI/UX Design", "Product designer refining design system guidelines and typography."),
    ("Dilruba Shahnaz", "dilruba.shahnaz@coursedesk.com", "Product Management", "Agile enthusiast mastering user story mapping and MVP scoping."),
    ("Elias Kanchon", "elias.kanchon@coursedesk.com", "Mobile App Development", "Mobile developer building clean, responsive interfaces with Flutter."),
    ("Firoj Mahmud", "firoj.mahmud@coursedesk.com", "Cybersecurity", "Cybersecurity enthusiast understanding web app firewalls and defense."),
    ("Giasuddin Ahmed", "giasuddin.ahmed@coursedesk.com", "Web Development", "Backend developer focusing on database queries and API caching."),
    ("Hasina Momtaz", "hasina.momtaz@coursedesk.com", "Data Science & AI", "Aspiring AI engineer learning PyTorch and convolutional neural networks."),
    ("Ilias Ali", "ilias.ali@coursedesk.com", "Cloud & DevOps", "Cloud practitioner learning Docker, Kubernetes, and monitoring tools."),
    ("Jamilur Reza", "jamilur.reza@coursedesk.com", "UI/UX Design", "UX designer conducting A/B testing and wireframe iterations."),
    ("Khairul Bashar", "khairul.bashar@coursedesk.com", "Web Development", "Web developer building modern web applications with React components."),
    ("Liakat Ali", "liakat.ali@coursedesk.com", "Product Management", "Product manager learning customer discovery and feature roadmapping."),
    ("Maksudul Alam", "maksudul.alam@coursedesk.com", "Data Science & AI", "Data analyst learning statistical modeling and dashboard creation."),
    ("Nazir Hossain", "nazir.hossain@coursedesk.com", "Cybersecurity", "Security student exploring network packet analysis and defenses."),
    ("Opu Chandra Ray", "opu.ray@coursedesk.com", "Mobile App Development", "Mobile engineer implementing offline-first caching in mobile apps."),
    ("Proloy Saha", "proloy.saha@coursedesk.com", "Cloud & DevOps", "DevOps engineer building secure containerized deployment pipelines."),
    ("Qamrul Hassan", "qamrul.hassan@coursedesk.com", "Web Development", "Full-stack developer building robust RESTful APIs with Node.js."),
    ("Rubel Mia", "rubel.mia@coursedesk.com", "UI/UX Design", "Visual designer focused on design consistency and mobile navigation patterns."),
    ("Sohel Rana", "sohel.rana@coursedesk.com", "Product Management", "Product coach learning agile transformation and stakeholder management."),
    ("Tipu Sultan", "tipu.sultan@coursedesk.com", "Data Science & AI", "AI learner building natural language text classification pipelines."),
    ("Urmi Chakma", "urmi.chakma@coursedesk.com", "Web Development", "Frontend developer mastering state management and interactive web apps."),
    ("Wasim Akram", "wasim.akram@coursedesk.com", "Mobile App Development", "Flutter developer building clean mobile layouts with smooth gestures."),
    ("Yunus Ali", "yunus.ali@coursedesk.com", "Cybersecurity", "Ethical hacker practicing web vulnerability analysis and report writing."),
    ("Zillur Rahman", "zillur.rahman@coursedesk.com", "Cloud & DevOps", "Cloud engineer configuring virtual private clouds and load balancers."),
    ("Anisuzzaman", "anisuzzaman@coursedesk.com", "Product Management", "Product manager analyzing customer retention and user engagement metrics."),
    ("Basundhara Dey", "basundhara.dey@coursedesk.com", "UI/UX Design", "UI designer creating modern color palettes, icons, and accessible layouts."),
    ("Chanchal Chowdhury", "chanchal.chowdhury@coursedesk.com", "Web Development", "Full-stack developer building fast, secure web applications."),
    ("Dipankar Dipu", "dipankar.dipu@coursedesk.com", "Data Science & AI", "Data scientist training neural networks on real-world datasets."),
    ("Enayetullah Khan", "enayetullah.khan@coursedesk.com", "Mobile App Development", "Mobile developer integrating third-party APIs into mobile applications."),
    ("Forhad Reza", "forhad.reza@coursedesk.com", "Cloud & DevOps", "DevOps learner automating continuous integration and testing workflows."),
    ("Golam Mustafa", "golam.mustafa@coursedesk.com", "Cybersecurity", "Security student learning identity management and secure authentication."),
    ("Habibul Bashar", "habibul.bashar@coursedesk.com", "Web Development", "Backend developer building scalable microservices and APIs."),
    ("Israfil Mia", "israfil.mia@coursedesk.com", "Product Management", "Product manager conducting competitive market research and user discovery."),
    ("Jewel Aich", "jewel.aich@coursedesk.com", "UI/UX Design", "Product designer prototyping interactive micro-interactions in Figma."),
    ("Khurshid Alam", "khurshid.alam@coursedesk.com", "Data Science & AI", "Machine learning enthusiast building automated prediction workflows."),
    ("Lokman Hakim", "lokman.hakim@coursedesk.com", "Mobile App Development", "Flutter developer building performant mobile apps with custom widgets."),
    ("Monirul Islam", "monirul.islam@coursedesk.com", "Cloud & DevOps", "System engineer transitioning to cloud orchestration and Kubernetes."),
    ("Nurul Islam Bulbul", "nurul.bulbul@coursedesk.com", "Cybersecurity", "Cybersecurity analyst practicing incident response and log analysis."),
    ("Obaidur Rahman", "obaidur.rahman@coursedesk.com", "Web Development", "Frontend engineer passionate about modern design and user experience."),
    ("Purnima Rani Das", "purnima.das@coursedesk.com", "UI/UX Design", "UI/UX designer conducting usability testing and user flow mapping."),
    ("Qaisar Hamid", "qaisar.hamid@coursedesk.com", "Product Management", "Product leader prioritizing feature backlogs using data metrics."),
]


def build_100_learners():
    cities = ["Dhaka", "Chattogram", "Sylhet", "Rajshahi", "Khulna", "Barishal", "Rangpur", "Cumilla"]
    learners = []
    for idx, (name, email, domain, bio) in enumerate(LEARNERS_RAW_LIST):
        learner_id = f"CD-LRN-{1001 + idx:04d}"
        city = cities[idx % len(cities)]
        learners.append((name, email, learner_id, domain, city, bio))
    return learners


# ─────────────────────────────────────────────────────────────────────────────
# 5. HELPER DATABASE LOOKUPS
# ─────────────────────────────────────────────────────────────────────────────

def _email_id(db, email: str) -> int:
    user = db.scalar(select(UserModel).where(UserModel.email == email))
    assert user is not None, f"seed user missing: {email}"
    return user.id


def _get_user(db, email: str) -> UserModel:
    user = db.scalar(select(UserModel).where(UserModel.email == email))
    assert user is not None, f"seed user missing: {email}"
    return user


def _get_course(db, name: str) -> CourseModel:
    course = db.scalar(select(CourseModel).where(CourseModel.name == name))
    assert course is not None, f"seed course missing: {name}"
    return course


# ─────────────────────────────────────────────────────────────────────────────
# 6. SEED NOTIFICATIONS
# ─────────────────────────────────────────────────────────────────────────────

def seed_notifications(db) -> None:
    print("Seeding LMS demo notifications…")
    now = datetime.now(UTC)
    web_course = db.scalar(select(CourseModel).where(CourseModel.name.like("%Full-Stack Web Development%")))
    web_id = web_course.id if web_course else 1
    ai_course = db.scalar(select(CourseModel).where(CourseModel.name.like("%Python for Data Science%")))
    ai_id = ai_course.id if ai_course else 2

    shakil_id = _email_id(db, "shakil.mahmud@coursedesk.com")
    maruf_id = _email_id(db, "maruf.billah@coursedesk.com")
    asad_id = _email_id(db, "asaduzzaman.nur@coursedesk.com")
    laila_id = _email_id(db, "laila.banu@coursedesk.com")
    admin_id = _email_id(db, ADMIN["email"])
    coord_shamsul_id = _email_id(db, "shamsul.huda@coursedesk.com")

    notifications = [
        # Learner Shakil Mahmud
        NotificationModel(
            user_id=shakil_id,
            title="New project assigned: Capstone E-Commerce Platform",
            message="Posted in Full-Stack Web Development Bootcamp • Due in 45 days",
            kind="assignment",
            link=f"/course/{web_id}?tab=coursework",
            is_read=False,
            created_at_utc=now - timedelta(hours=2),
        ),
        NotificationModel(
            user_id=shakil_id,
            title="Graded: React Hooks & State Management Quiz",
            message="Score: 20/20 • Feedback: Excellent understanding of useEffect and Zustand stores.",
            kind="grade",
            link=f"/course/{web_id}?tab=coursework",
            is_read=False,
            created_at_utc=now - timedelta(hours=5),
        ),
        NotificationModel(
            user_id=shakil_id,
            title="Upcoming Deadline: Next.js Portfolio Project",
            message="Due in 3 days. Remember to push code to GitHub and deploy to Vercel.",
            kind="due",
            link=f"/course/{web_id}?tab=coursework",
            is_read=False,
            created_at_utc=now - timedelta(hours=8),
        ),
        NotificationModel(
            user_id=shakil_id,
            title="Community Announcement in Full-Stack Web Development",
            message="Live Mentor Session: Career Pathways & Technical Interview Tips this Friday.",
            kind="announcement",
            link=f"/course/{web_id}",
            is_read=True,
            created_at_utc=now - timedelta(days=1),
        ),

        # Learner Maruf Billah
        NotificationModel(
            user_id=maruf_id,
            title="New lesson replay ready: Authentication & Middleware in Next.js",
            message="Video replay is ready with interactive timestamp chapters.",
            kind="session",
            link=f"/course/{web_id}?tab=video",
            is_read=False,
            created_at_utc=now - timedelta(hours=4),
        ),
        NotificationModel(
            user_id=maruf_id,
            title="Project Graded: Next.js Portfolio Project",
            message="Score: 48/50 • Feedback: Great component architecture and responsive design.",
            kind="grade",
            link=f"/course/{web_id}?tab=coursework",
            is_read=False,
            created_at_utc=now - timedelta(hours=12),
        ),

        # Instructor Dr. Asaduzzaman Nur
        NotificationModel(
            user_id=asad_id,
            title="New project submission: Next.js Portfolio Project",
            message="Shakil Mahmud submitted portfolio project in Full-Stack Web Development Bootcamp",
            kind="submission",
            link=f"/course/{web_id}?tab=coursework",
            is_read=False,
            created_at_utc=now - timedelta(hours=3),
        ),
        NotificationModel(
            user_id=asad_id,
            title="New learner question on Announcement",
            message="Maruf Billah commented on the Live Mentor Session announcement.",
            kind="announcement",
            link=f"/course/{web_id}",
            is_read=False,
            created_at_utc=now - timedelta(hours=6),
        ),

        # Instructor Dr. Laila Arjumand Banu
        NotificationModel(
            user_id=laila_id,
            title="New project submission: Customer Churn Prediction Model",
            message="Rashedul Karim submitted project in Python for Data Science & Machine Learning",
            kind="submission",
            link=f"/course/{ai_id}?tab=coursework",
            is_read=False,
            created_at_utc=now - timedelta(hours=7),
        ),

        # Coordinator Dr. Shamsul Huda
        NotificationModel(
            user_id=coord_shamsul_id,
            title="2024 Learning Cohorts Active",
            message="All 8 LMS courses, cohorts, and curriculum modules are active and synchronized.",
            kind="system",
            link="/courses",
            is_read=False,
            created_at_utc=now - timedelta(days=2),
        ),

        # Admin Mostafa Kamal
        NotificationModel(
            user_id=admin_id,
            title="CourseDesk LMS Ready",
            message="Database active with 100 Learners, 10 Instructors, 3 Coordinators, 16 Assignments, 14 Video Lessons.",
            kind="system",
            link="/admin",
            is_read=False,
            created_at_utc=now,
        ),
    ]

    for n in notifications:
        db.add(n)
    db.commit()
    print("Demo notifications seeded successfully.")


# ─────────────────────────────────────────────────────────────────────────────
# 7. MAIN SEED FUNCTION
# ─────────────────────────────────────────────────────────────────────────────

def seed() -> None:
    print("Resetting database schema (drop schema cascade & create tables)…")
    with engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        conn.exec_driver_sql("DROP SCHEMA public CASCADE; CREATE SCHEMA public;")
        conn.exec_driver_sql("""
        CREATE OR REPLACE FUNCTION generate_base32_id(prefix TEXT, len INT DEFAULT 6)
        RETURNS TEXT AS $$
        DECLARE
            chars TEXT := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
            result TEXT := '';
            i INT;
        BEGIN
            FOR i IN 1..len LOOP
                result := result || substr(chars, floor(random() * 32 + 1)::INT, 1);
            END LOOP;
            RETURN prefix || '-' || result;
        END;
        $$ LANGUAGE plpgsql;
        """)

    Base.metadata.create_all(engine)
    db = LocalSession()

    try:
        # ── 1. LMS Categories & Taxonomy Tags ─────────────────────────────────
        print("Seeding LMS categories and topic tags…")
        for name, code, desc in CATEGORIES:
            create_department(DepartmentSchema(name=name, code=code, description=desc), db)
        for name, desc in TAGS:
            create_tag(TagSchema(name=name, description=desc), db)

        # ── 2. Settings ───────────────────────────────────────────────────────
        print("Seeding app settings…")
        for key, value, description, category in SETTINGS:
            upsert_setting(
                AppSettingSchema(key=key, value=value, description=description, category=category), db
            )

        # ── 3. Users: Admin ───────────────────────────────────────────────────
        print("Seeding Admin user (Mostafa Kamal)…")
        create_user(
            UserSchema(
                name=ADMIN["name"],
                email=ADMIN["email"],
                password=ADMIN["password"],
                role="Admin",
            ),
            db,
        )

        # ── 4. Users: 10 Instructors / Industry Mentors ────────────────────────
        print("Seeding 10 LMS Instructors & Mentors…")
        for inst in INSTRUCTORS_DATA:
            parts = inst["name"].split(" ", 1)
            f_name = parts[0]
            l_name = parts[1] if len(parts) > 1 else ""
            create_user(
                UserSchema(
                    name=inst["name"],
                    email=inst["email"],
                    password="Instructor@123",
                    role="Instructor",
                    instructor_details=InstructorDetailsSchema(
                        instructor_id=inst["instructor_id"],
                        first_name=f_name,
                        last_name=l_name,
                        avatar=inst["avatar"],
                        professional_headline=inst["headline"],
                        short_bio=inst["bio"],
                    ),
                ),
                db,
            )

        # ── 5. Users: 3 Coordinators ──────────────────────────────────────────
        print("Seeding 3 LMS Program Coordinators…")
        for coord in COORDINATORS_DATA:
            create_user(
                UserSchema(
                    name=coord["name"],
                    email=coord["email"],
                    password="Coordinator@123",
                    role="Coordinator",
                    coordinator_details=CoordinatorDetailsSchema(
                        coordinator_id=coord["coordinator_id"],
                        first_name=coord["first_name"],
                        last_name=coord["last_name"],
                        avatar=coord["avatar"],
                        phone=coord["phone"],
                        short_bio=coord["bio"],
                    ),
                ),
                db,
            )

        # ── 6. Users: 100 Learners ────────────────────────────────────────────
        print("Seeding 100 Learners with real LMS profile bios…")
        all_learners_info = build_100_learners()

        avatar_pool = [
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=face",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=face",
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=face",
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop&crop=face",
            "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&h=256&fit=crop&crop=face",
            "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=256&h=256&fit=crop&crop=face",
            "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=256&h=256&fit=crop&crop=face",
            "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=256&h=256&fit=crop&crop=face",
        ]

        for item in all_learners_info:
            name, email, learner_id, domain, city, bio = item
            parts = name.split(" ", 1)
            f_name = parts[0]
            l_name = parts[1] if len(parts) > 1 else ""
            av = avatar_pool[abs(hash(email)) % len(avatar_pool)]

            create_user(
                UserSchema(
                    name=name,
                    email=email,
                    password="Learner@123",
                    role="Learner",
                    learner_details=LearnerDetailsSchema(
                        learner_id=learner_id,
                        first_name=f_name,
                        last_name=l_name,
                        avatar=av,
                        short_bio=bio,
                        nationality="Bangladeshi",
                        address=UserAddressSchema(
                            city=city,
                            country="Bangladesh",
                        ),
                    ),
                ),
                db,
            )

        print("Created 100 learners successfully.")

        # ── 7. Courses: 8 Commercial LMS Courses ──────────────────────────────
        print("Seeding 8 Modern LMS Courses with enrolled cohorts…")
        learner_rows = db.scalars(select(UserModel).where(UserModel.role == "Learner")).all()
        learner_ids = [l.id for l in learner_rows]

        cohort_web = learner_ids[:60]
        cohort_ai = learner_ids[20:70]
        cohort_design = learner_ids[30:75]
        cohort_sec = learner_ids[40:85]
        cohort_devops = learner_ids[10:65]
        cohort_mobile = learner_ids[50:95]
        cohort_pm = learner_ids[60:100]
        cohort_algo = learner_ids[:45]

        courses_specs = [
            (
                "Full-Stack Web Development Bootcamp (Next.js, Node.js & PostgreSQL)",
                "Web Development",
                ["asaduzzaman.nur@coursedesk.com", "enamul.hoque@coursedesk.com"],
                cohort_web,
                ["React", "Next.js", "Web", "ProjectBased"],
            ),
            (
                "Python for Data Science & Machine Learning Masterclass",
                "Data Science & AI",
                ["laila.banu@coursedesk.com", "tahmina.ferdous@coursedesk.com"],
                cohort_ai,
                ["Python", "MachineLearning", "DataScience", "ProjectBased"],
            ),
            (
                "Modern UI/UX Design with Figma: From Wireframing to Interactive Prototype",
                "UI/UX Design",
                ["shahana.parveen@coursedesk.com"],
                cohort_design,
                ["Figma", "UIUX", "Design", "ProjectBased"],
            ),
            (
                "Practical Ethical Hacking & Web Application Penetration Testing",
                "Cybersecurity",
                ["kamrul.ahsan@coursedesk.com"],
                cohort_sec,
                ["Security", "EthicalHacking", "PenTesting"],
            ),
            (
                "Cloud Engineering & DevOps with Docker, Kubernetes & AWS",
                "Cloud & DevOps",
                ["asaduzzaman.nur@coursedesk.com", "enamul.hoque@coursedesk.com"],
                cohort_devops,
                ["DevOps", "Docker", "AWS", "Kubernetes"],
            ),
            (
                "Cross-Platform Mobile App Development with Flutter & Dart",
                "Mobile App Development",
                ["jahangir.alam@coursedesk.com"],
                cohort_mobile,
                ["Flutter", "Dart", "Mobile", "ProjectBased"],
            ),
            (
                "Product Management: Agile Roadmapping, Scrum & Growth Metrics",
                "Product Management",
                ["rokeya.khandakar@coursedesk.com"],
                cohort_pm,
                ["Agile", "Scrum", "Product", "BeginnerFriendly"],
            ),
            (
                "Advanced Algorithms & Problem Solving for Technical Interviews",
                "Web Development",
                ["zahidul.haque@coursedesk.com"],
                cohort_algo,
                ["Algorithms", "InterviewPrep", "DataStructures"],
            ),
        ]

        for name, category, inst_emails, l_cohort, tags in courses_specs:
            create_course(
                CourseSchema(
                    name=name,
                    subject="",
                    department=category,
                    is_active=True,
                    tags=tags,
                    instructor_ids=[_email_id(db, e) for e in inst_emails],
                    learner_ids=l_cohort,
                ),
                db,
            )

        print("Created 8 modern LMS courses successfully.")

        # ── 8. Video Lessons (14 Modular Replays with Markers & Resources) ────
        print("Seeding 14 Video Lessons with interactive chapters and files…")
        c_web = _get_course(db, "Full-Stack Web Development Bootcamp (Next.js, Node.js & PostgreSQL)")
        c_ai = _get_course(db, "Python for Data Science & Machine Learning Masterclass")
        c_design = _get_course(db, "Modern UI/UX Design with Figma: From Wireframing to Interactive Prototype")
        c_sec = _get_course(db, "Practical Ethical Hacking & Web Application Penetration Testing")
        c_cloud = _get_course(db, "Cloud Engineering & DevOps with Docker, Kubernetes & AWS")
        c_mobile = _get_course(db, "Cross-Platform Mobile App Development with Flutter & Dart")

        now = datetime.now(UTC)

        video_lessons_data = [
            # Web Development
            {
                "course_id": c_web.id,
                "session_number": 1,
                "title": "Module 01: Next.js 14 Fundamentals: App Router, Routing & Layouts",
                "topic": "Frontend Architecture",
                "description": "Understanding App Router structure, nested layouts, template components, and dynamic route segments.",
                "video_url": "https://www.youtube.com/watch?v=inWWhr5tnEA",
                "duration_minutes": 55,
                "markers": [
                    (0, "Introduction to Next.js 14 App Router"),
                    (420, "File-based Routing & Special Files (page, layout, loading)"),
                    (1240, "Dynamic Segments & Route Handlers"),
                    (2400, "Metadata API & SEO Optimization"),
                    (3100, "Summary & Practice Project"),
                ],
                "materials": [
                    ("Next.js App Router Architecture Cheatsheet", "cheat_sheet", "https://coursedesk.com/materials/nextjs_cheatsheet.pdf", "nextjs_cheatsheet.pdf", "PDF", "2.1 MB"),
                ],
            },
            {
                "course_id": c_web.id,
                "session_number": 2,
                "title": "Module 02: Server vs Client Components: Mental Model & Data Fetching",
                "topic": "Modern React Architecture",
                "description": "Deep-dive into React Server Components, server actions, client boundaries with 'use client', and suspense streaming.",
                "video_url": "https://www.youtube.com/watch?v=sMOZf4GN3oc",
                "duration_minutes": 62,
                "markers": [
                    (0, "The Server Component Paradigm"),
                    (600, "When to Use Client Components vs Server Components"),
                    (1800, "Direct Database Access in Server Components"),
                    (2700, "React Suspense & Streaming UI"),
                ],
                "materials": [
                    ("Starter Code: Server Components Demo", "code", "https://coursedesk.com/materials/rsc_starter.zip", "rsc_starter.zip", "ZIP", "1.4 MB"),
                ],
            },
            {
                "course_id": c_web.id,
                "session_number": 3,
                "title": "Module 03: Relational Database Schema Design with PostgreSQL & Prisma",
                "topic": "Backend & Database",
                "description": "Designing normalized database tables, relationships (1:M, M:N), Prisma ORM migrations, and query indexing.",
                "video_url": "https://www.youtube.com/watch?v=O4xNAskh-EY",
                "duration_minutes": 70,
                "markers": [
                    (0, "Database Schema Modeling Best Practices"),
                    (750, "Setting up Prisma ORM & Connection Pooling"),
                    (2100, "Defining Relations & Foreign Keys"),
                    (3400, "Running Schema Migrations & Seeding Initial Data"),
                ],
                "materials": [
                    ("Prisma Schema Templates & Docker Compose Setup", "code", "https://coursedesk.com/materials/db_templates.zip", "db_templates.zip", "ZIP", "850 KB"),
                ],
            },
            {
                "course_id": c_web.id,
                "session_number": 4,
                "title": "Module 04: Authentication, Middleware & Production Deployment to Vercel",
                "topic": "Security & Deployment",
                "description": "Implementing JWT and session authentication, route protection with Next.js Middleware, and zero-downtime deployment.",
                "video_url": "https://www.youtube.com/watch?v=4zahvcJ9PRg",
                "duration_minutes": 65,
                "markers": [
                    (0, "Authentication Flow Overview"),
                    (650, "Securing API Endpoints & Protecting Pages"),
                    (1950, "Environment Variables & Secret Management"),
                    (3200, "Deploying to Vercel & Custom Domain Setup"),
                ],
                "materials": [
                    ("Authentication Checklist & Production Best Practices", "slides", "https://coursedesk.com/materials/auth_checklist.pdf", "auth_checklist.pdf", "PDF", "1.9 MB"),
                ],
            },

            # Data Science & AI
            {
                "course_id": c_ai.id,
                "session_number": 1,
                "title": "Module 01: Python for Data Analysis: NumPy Arrays & Vectorized Operations",
                "topic": "Python Data Foundations",
                "description": "Mastering multidimensional NumPy arrays, vectorized arithmetic, broadcasting rules, and performance benchmarking.",
                "video_url": "https://www.youtube.com/watch?v=rmVRLeJRkl4",
                "duration_minutes": 60,
                "markers": [
                    (0, "Why Vectorized NumPy is 100x Faster than Python Lists"),
                    (700, "Array Creation, Reshaping & Slicing"),
                    (1900, "Broadcasting Mechanics & Linear Algebra Operations"),
                    (2900, "Hands-on Data Processing Exercise"),
                ],
                "materials": [
                    ("NumPy Essentials Jupyter Notebook", "code", "https://coursedesk.com/materials/numpy_essentials.ipynb", "numpy_essentials.ipynb", "FILE", "650 KB"),
                ],
            },
            {
                "course_id": c_ai.id,
                "session_number": 2,
                "title": "Module 02: Data Wrangling, Cleaning & Feature Engineering with Pandas",
                "topic": "Data Wrangling",
                "description": "Loading real-world datasets, handling missing values, grouped aggregations, and feature transformation pipelines.",
                "video_url": "https://www.youtube.com/watch?v=LHXXI4-IEns",
                "duration_minutes": 68,
                "markers": [
                    (0, "DataFrames vs Series Architecture"),
                    (800, "Filtering, Indexing & Missing Data Imputation"),
                    (2100, "GroupBy Operations & Multi-Index Pivot Tables"),
                    (3300, "Feature Engineering for Machine Learning"),
                ],
                "materials": [
                    ("Pandas Data Cleaning Cheatsheet", "cheat_sheet", "https://coursedesk.com/materials/pandas_cheatsheet.pdf", "pandas_cheatsheet.pdf", "PDF", "2.8 MB"),
                ],
            },
            {
                "course_id": c_ai.id,
                "session_number": 3,
                "title": "Module 03: Machine Learning Foundations: Regression & Classification with Scikit-Learn",
                "topic": "Machine Learning",
                "description": "Building predictive pipelines: Train/test splitting, cross-validation, Random Forests, and ROC-AUC evaluation metrics.",
                "video_url": "https://www.youtube.com/watch?v=Gv9_4yMHFhI",
                "duration_minutes": 75,
                "markers": [
                    (0, "Supervised Learning Fundamentals"),
                    (750, "Data Preprocessing Pipelines & Feature Scaling"),
                    (2200, "Training Random Forest Classifiers"),
                    (3600, "Evaluating Accuracy, Precision, Recall & F1-Score"),
                ],
                "materials": [
                    ("Scikit-Learn Classification Demo Notebook", "code", "https://coursedesk.com/materials/scikit_classifier.ipynb", "scikit_classifier.ipynb", "FILE", "1.1 MB"),
                ],
            },

            # UI/UX Design
            {
                "course_id": c_design.id,
                "session_number": 1,
                "title": "Module 01: UX Discovery, User Personas & Wireframing Best Practices",
                "topic": "User Experience Foundations",
                "description": "From user interview synthesis to low-fidelity wireframes, information architecture, and user journey mapping.",
                "video_url": "https://www.youtube.com/watch?v=0IAPZzGSbME",
                "duration_minutes": 55,
                "markers": [
                    (0, "User-Centered Design Methodology"),
                    (600, "Developing Actionable User Personas"),
                    (1700, "Information Architecture & User Flow Mapping"),
                    (2600, "Low-Fidelity Wireframing in Figma"),
                ],
                "materials": [
                    ("UX Research & User Persona Template Kit", "slides", "https://coursedesk.com/materials/ux_templates.pdf", "ux_templates.pdf", "PDF", "3.4 MB"),
                ],
            },
            {
                "course_id": c_design.id,
                "session_number": 2,
                "title": "Module 02: Building Scalable Design Systems & Color Tokens in Figma",
                "topic": "Design Systems",
                "description": "Creating reusable atomic UI components, responsive auto-layout containers, typography scales, and tokenized color palettes.",
                "video_url": "https://www.youtube.com/watch?v=hZNyx3PyG3w",
                "duration_minutes": 70,
                "markers": [
                    (0, "Design System Foundations"),
                    (800, "Auto-Layout v5: Constraints, Wrapping & Spacing"),
                    (2200, "Color Tokens, Dark Mode Variables & Typography Scales"),
                    (3400, "Publishing Component Libraries"),
                ],
                "materials": [
                    ("Figma Design System Starter File Link", "link", "https://coursedesk.com/materials/figma_design_system.fig", "figma_design_system.fig", "FILE", "4.2 MB"),
                ],
            },
            {
                "course_id": c_design.id,
                "session_number": 3,
                "title": "Module 03: Interactive Micro-Animations, Smart Animate & Component Variants",
                "topic": "High-Fidelity Prototyping",
                "description": "Mastering Figma Smart Animate, interactive variant states (hover, pressed, loading), and clickable prototype handoff.",
                "video_url": "https://www.youtube.com/watch?v=wjZofJX0v4U",
                "duration_minutes": 65,
                "markers": [
                    (0, "Prototyping Mental Model"),
                    (650, "Component State Variants & Nested Interactions"),
                    (1900, "Smart Animate for Smooth Transitions"),
                    (3100, "Developer Handoff Best Practices"),
                ],
                "materials": [
                    ("Interactive Component Animation Demo", "slides", "https://coursedesk.com/materials/animation_guide.pdf", "animation_guide.pdf", "PDF", "2.5 MB"),
                ],
            },

            # Cybersecurity
            {
                "course_id": c_sec.id,
                "session_number": 1,
                "title": "Module 01: Network Reconnaissance & Port Scanning with Nmap",
                "topic": "Reconnaissance & Footprinting",
                "description": "Active and passive reconnaissance methodologies, stealth SYN scanning with Nmap, and service banner grabbing.",
                "video_url": "https://www.youtube.com/watch?v=b4b8ktEV4Bg",
                "duration_minutes": 58,
                "markers": [
                    (0, "Ethical Hacking Rules of Engagement"),
                    (500, "TCP 3-Way Handshake & Scan Types (SYN, FIN, NULL)"),
                    (1700, "Nmap Scripting Engine (NSE) for Vulnerability Detection"),
                    (2800, "Defensive Logging & Intrusion Detection"),
                ],
                "materials": [
                    ("Nmap Command Reference & Scanning Cheat Sheet", "cheat_sheet", "https://coursedesk.com/materials/nmap_cheatsheet.pdf", "nmap_cheatsheet.pdf", "PDF", "800 KB"),
                ],
            },
            {
                "course_id": c_sec.id,
                "session_number": 2,
                "title": "Module 02: Web Application Vulnerabilities: SQL Injection & Cross-Site Scripting",
                "topic": "Web Application Security",
                "description": "Dissecting OWASP Top 10 vulnerabilities: SQL injection attacks, Blind SQLi, Stored vs Reflected XSS, and remediation.",
                "video_url": "https://www.youtube.com/watch?v=86cQCEScYg8",
                "duration_minutes": 72,
                "markers": [
                    (0, "Web Vulnerability Taxonomy"),
                    (800, "SQL Injection: Authentication Bypass to Union Extraction"),
                    (2300, "Cross-Site Scripting (XSS) & Cookie Theft"),
                    (3500, "Defensive Coding: Parameterized Queries & Content Security Policy"),
                ],
                "materials": [
                    ("OWASP Top 10 Defense Guide", "slides", "https://coursedesk.com/materials/owasp_defense.pdf", "owasp_defense.pdf", "PDF", "3.1 MB"),
                ],
            },

            # Cloud & DevOps
            {
                "course_id": c_cloud.id,
                "session_number": 1,
                "title": "Module 01: Docker Essentials: Building Multi-Stage Container Images",
                "topic": "Containerization",
                "description": "Container architecture, writing efficient Dockerfiles, multi-stage builds for minimal image size, and volume mounting.",
                "video_url": "https://www.youtube.com/watch?v=pTB30aXSgoU",
                "duration_minutes": 62,
                "markers": [
                    (0, "Virtual Machines vs Linux Containers"),
                    (700, "Dockerfile Instructions & Layer Caching"),
                    (2000, "Multi-Stage Builds to Shrink Image Footprint"),
                    (3100, "Docker Compose for Multi-Container Apps"),
                ],
                "materials": [
                    ("Docker Production Best Practices Cheatsheet", "cheat_sheet", "https://coursedesk.com/materials/docker_cheatsheet.pdf", "docker_cheatsheet.pdf", "PDF", "1.2 MB"),
                ],
            },

            # Mobile App Development
            {
                "course_id": c_mobile.id,
                "session_number": 1,
                "title": "Module 01: Flutter Widget Trees, Responsive Layouts & State Management",
                "topic": "Flutter Foundations",
                "description": "Understanding stateless vs stateful widgets, reactive build methods, layout constraints, and Provider state management.",
                "video_url": "https://www.youtube.com/watch?v=oBt53YbR9Kk",
                "duration_minutes": 65,
                "markers": [
                    (0, "Introduction to Flutter & Dart Architecture"),
                    (750, "Stateless vs Stateful Widgets"),
                    (2100, "Building Responsive Column & Row Layouts"),
                    (3300, "State Management with Provider"),
                ],
                "materials": [
                    ("Flutter Starter Boilerplate Code", "code", "https://coursedesk.com/materials/flutter_starter.zip", "flutter_starter.zip", "ZIP", "2.3 MB"),
                ],
            },
        ]

        created_sessions = []
        for vid in video_lessons_data:
            session = SessionModel(
                course_id=vid["course_id"],
                session_number=vid["session_number"],
                title=vid["title"],
                topic=vid["topic"],
                description=vid["description"],
                video_url=vid["video_url"],
                video_provider="youtube",
                video_duration_minutes=vid["duration_minutes"],
                duration_minutes=vid["duration_minutes"],
                status="Completed",
                scheduled_at_utc=now - timedelta(days=20 - vid["session_number"] * 3),
                created_at_utc=now - timedelta(days=25),
            )
            db.add(session)
            db.flush()

            for ts, label in vid["markers"]:
                marker = SessionVideoMarkerModel(
                    session_id=session.id,
                    timestamp_seconds=ts,
                    label=label,
                )
                db.add(marker)

            for title, kind, url, f_name, f_type, f_sz in vid.get("materials", []):
                mat = SessionMaterialModel(
                    session_id=session.id,
                    title=title,
                    kind=kind,
                    url=url,
                    file_name=f_name,
                    file_type=f_type,
                    file_size=f_sz,
                    description="Lesson resource handout",
                    sort_order=1,
                )
                db.add(mat)

            created_sessions.append(session)

        db.commit()
        print(f"Created {len(created_sessions)} video lessons with chapters and materials.")

        # ── 9. Assignments: 16 Real-World Portfolio Projects & Quizzes ────────
        print("Seeding 16 LMS Projects & Quizzes across courses…")
        asad = _get_user(db, "asaduzzaman.nur@coursedesk.com")
        laila = _get_user(db, "laila.banu@coursedesk.com")
        shahana = _get_user(db, "shahana.parveen@coursedesk.com")
        kamrul = _get_user(db, "kamrul.ahsan@coursedesk.com")
        jahangir = _get_user(db, "jahangir.alam@coursedesk.com")
        rokeya = _get_user(db, "rokeya.khandakar@coursedesk.com")
        zahidul = _get_user(db, "zahidul.haque@coursedesk.com")

        c_pm = _get_course(db, "Product Management: Agile Roadmapping, Scrum & Growth Metrics")
        c_algo = _get_course(db, "Advanced Algorithms & Problem Solving for Technical Interviews")

        assignments_specs = [
            # Full-Stack Web Dev
            {
                "course_id": c_web.id,
                "title": "Capstone Project: Build & Deploy a Full-Stack E-Commerce Platform",
                "description": "Design and build a complete online store supporting product catalogs, user authentication, cart management, and Stripe test checkout.\nSubmit GitHub repository URL and live production Vercel link.",
                "topic": "Capstone Project",
                "kind": "Assignment",
                "deadline_utc": now + timedelta(days=45),
                "max_marks": 100,
                "author": asad,
                "publish": True,
            },
            {
                "course_id": c_web.id,
                "title": "Hands-on Project: Modern Portfolio Website with Next.js & Tailwind CSS",
                "description": "Build a responsive personal developer portfolio with dynamic project showcase cards, dark mode toggle, and contact form handling.",
                "topic": "Frontend Project",
                "kind": "Assignment",
                "deadline_utc": now + timedelta(days=20),
                "max_marks": 50,
                "author": asad,
                "publish": True,
            },
            {
                "course_id": c_web.id,
                "title": "Knowledge Check: React Hooks, State Management & Server Components Quiz",
                "description": "15 interactive questions testing your mastery of useEffect dependencies, custom hooks, and server vs client component mental models.",
                "topic": "Core Fundamentals",
                "kind": "Quiz",
                "deadline_utc": now + timedelta(days=10),
                "max_marks": 20,
                "author": asad,
                "publish": True,
            },

            # Data Science & AI
            {
                "course_id": c_ai.id,
                "title": "Machine Learning Portfolio Project: Customer Churn Prediction Model",
                "description": "Perform end-to-end data science: exploratory data analysis on telecom customer churn dataset, feature scaling, model training, and hyperparameter tuning.\nSubmit Jupyter Notebook with visualizations.",
                "topic": "Machine Learning Project",
                "kind": "Assignment",
                "deadline_utc": now + timedelta(days=35),
                "max_marks": 100,
                "author": laila,
                "publish": True,
            },
            {
                "course_id": c_ai.id,
                "title": "Hands-on Lab: Exploratory Data Analysis & Visualization on E-Commerce Dataset",
                "description": "Clean, aggregate, and visualize monthly revenue and customer cohort retention using Pandas, Seaborn, and Matplotlib.",
                "topic": "Data Analytics",
                "kind": "Assignment",
                "deadline_utc": now + timedelta(days=15),
                "max_marks": 40,
                "author": laila,
                "publish": True,
            },
            {
                "course_id": c_ai.id,
                "title": "Knowledge Check: NumPy Vectorization & Pandas Indexing Quiz",
                "description": "Timed numerical quiz testing multi-dimensional array operations, boolean indexing, and memory efficiency in Pandas.",
                "topic": "Python Fundamentals",
                "kind": "Quiz",
                "deadline_utc": now + timedelta(days=8),
                "max_marks": 20,
                "author": laila,
                "publish": True,
            },

            # UI/UX Design
            {
                "course_id": c_design.id,
                "title": "Design Project: Complete Redesign of a Mobile Banking App in Figma",
                "description": "Design an intuitive, modern 6-screen mobile banking flow (Dashboard, Transaction History, Send Money, Card Settings) with high-fidelity Figma components and auto-layout.",
                "topic": "UI/UX Portfolio Project",
                "kind": "Assignment",
                "deadline_utc": now + timedelta(days=30),
                "max_marks": 50,
                "author": shahana,
                "publish": True,
            },
            {
                "course_id": c_design.id,
                "title": "Design System Challenge: Build a Multi-Brand UI Kit with Auto-Layout & Variants",
                "description": "Construct a scalable design system containing buttons, input fields, modals, and navigation bars with interactive hover and active variant states.",
                "topic": "Design Systems",
                "kind": "Assignment",
                "deadline_utc": now + timedelta(days=22),
                "max_marks": 40,
                "author": shahana,
                "publish": True,
            },

            # Cybersecurity
            {
                "course_id": c_sec.id,
                "title": "Security Audit Lab: OWASP Web Application Penetration Testing Report",
                "description": "Conduct a vulnerability assessment on a simulated web application. Identify, exploit, and document remediation steps for SQL injection, XSS, and broken access controls.",
                "topic": "Penetration Testing",
                "kind": "Assignment",
                "deadline_utc": now + timedelta(days=28),
                "max_marks": 50,
                "author": kamrul,
                "publish": True,
            },
            {
                "course_id": c_sec.id,
                "title": "Security Quiz: Cryptographic Primitives, Hashing & HTTPS Protocols",
                "description": "10 questions evaluating your grasp of symmetric vs asymmetric ciphers, TLS handshakes, and password hashing salts.",
                "topic": "Security Foundations",
                "kind": "Quiz",
                "deadline_utc": now + timedelta(days=12),
                "max_marks": 20,
                "author": kamrul,
                "publish": True,
            },

            # Cloud & DevOps
            {
                "course_id": c_cloud.id,
                "title": "Hands-on Lab: Containerizing a Microservices Architecture with Docker Compose",
                "description": "Create optimized Dockerfiles for a Node.js API and a PostgreSQL database. Configure inter-container networking and persistent volume mounts using docker-compose.yml.",
                "topic": "Containerization",
                "kind": "Assignment",
                "deadline_utc": now + timedelta(days=25),
                "max_marks": 40,
                "author": asad,
                "publish": True,
            },

            # Mobile App Development
            {
                "course_id": c_mobile.id,
                "title": "Mobile App Project: Real-Time Weather Application with Flutter & REST API",
                "description": "Develop a smooth cross-platform weather app fetching real-time 5-day forecasts from OpenWeatherMap API with city search and animated weather icons.",
                "topic": "Mobile Portfolio Project",
                "kind": "Assignment",
                "deadline_utc": now + timedelta(days=32),
                "max_marks": 50,
                "author": jahangir,
                "publish": True,
            },

            # Product Management
            {
                "course_id": c_pm.id,
                "title": "Product Strategy Case Study: Product Requirement Document (PRD) for a SaaS Tool",
                "description": "Draft a comprehensive PRD including problem statement, target personas, user stories with acceptance criteria, success metrics (North Star metric), and MVP scope.",
                "topic": "Product Documentation",
                "kind": "Assignment",
                "deadline_utc": now + timedelta(days=26),
                "max_marks": 50,
                "author": rokeya,
                "publish": True,
            },

            # Algorithms
            {
                "course_id": c_algo.id,
                "title": "Coding Challenge: Dynamic Programming & Binary Search Optimization",
                "description": "Solve and submit optimal solutions for 0/1 Knapsack, Longest Common Subsequence, and search in rotated sorted array with asymptotic complexity analysis.",
                "topic": "Problem Solving",
                "kind": "Assignment",
                "deadline_utc": now + timedelta(days=18),
                "max_marks": 50,
                "author": zahidul,
                "publish": True,
            },
            {
                "course_id": c_algo.id,
                "title": "Technical Interview Mock Quiz: Big-O Time & Space Complexity",
                "description": "Fast-paced quiz evaluating code snippet runtime bounds, recursive call stack frames, and amortized hash table lookups.",
                "topic": "Complexity Analysis",
                "kind": "Quiz",
                "deadline_utc": now + timedelta(days=9),
                "max_marks": 20,
                "author": zahidul,
                "publish": True,
            },

            # Draft Project
            {
                "course_id": c_web.id,
                "title": "Draft: Real-Time Collaborative Workspace with WebSockets & Canvas",
                "description": "Upcoming advanced portfolio project building a shared whiteboard app with real-time multi-cursor collaboration.",
                "topic": "Advanced Project",
                "kind": "Assignment",
                "deadline_utc": now + timedelta(days=70),
                "max_marks": 100,
                "author": asad,
                "publish": False,  # Draft
            },
        ]

        created_assignments = []
        for spec in assignments_specs:
            a = create_assignment(
                AssignmentSchema(
                    course_id=spec["course_id"],
                    title=spec["title"],
                    description=spec["description"],
                    topic=spec["topic"],
                    kind=spec["kind"],
                    deadline_utc=spec["deadline_utc"],
                    max_marks=spec["max_marks"],
                ),
                spec["author"],
                db,
            )
            if spec["publish"]:
                publish_assignment(a.id, spec["author"], db)
            created_assignments.append(a)

        print(f"Created {len(created_assignments)} assignments and portfolio projects.")

        # ── 10. Submissions & Grades ──────────────────────────────────────────
        print("Seeding learner project submissions and mentor feedback…")
        shakil = _get_user(db, "shakil.mahmud@coursedesk.com")
        maruf = _get_user(db, "maruf.billah@coursedesk.com")
        rashedul = _get_user(db, "rashedul.karim@coursedesk.com")
        ashiqur = _get_user(db, "ashiqur.rahman@coursedesk.com")
        jannatul = _get_user(db, "jannatul.nayeem@coursedesk.com")

        # Portfolio Project 2 (Next.js Portfolio Website)
        a_portfolio = created_assignments[1]
        sub1 = submit_assignment(
            SubmitAssignmentSchema(
                assignment_id=a_portfolio.id,
                answer="Built and deployed my Next.js portfolio website with Tailwind CSS, dark mode toggle, and project showcase. Live at: https://shakil-portfolio.vercel.app | Repo: https://github.com/shakil/portfolio",
            ),
            shakil,
            db,
        )
        grade_submission(sub1.id, GradeSubmissionSchema(marks=49, feedback="Outstanding portfolio! Clean component structure, fast Lighthouse score (98/100), and great typography."), asad, db)

        sub2 = submit_assignment(
            SubmitAssignmentSchema(
                assignment_id=a_portfolio.id,
                answer="Completed responsive portfolio with Next.js App Router and dynamic project detail modals. Tested across mobile and desktop viewpoints.",
            ),
            maruf,
            db,
        )
        grade_submission(sub2.id, GradeSubmissionSchema(marks=46, feedback="Great responsive layout and smooth animations. Consider adding OpenGraph social share previews."), asad, db)

        submit_assignment(
            SubmitAssignmentSchema(
                assignment_id=a_portfolio.id,
                answer="Attached repository link with unit tests and customized color themes.",
            ),
            ashiqur,
            db,
        )

        # Assignment 3 (React Quiz)
        a_quiz = created_assignments[2]
        sub_q = submit_assignment(
            SubmitAssignmentSchema(
                assignment_id=a_quiz.id,
                answer="Completed all 15 questions on React Server Components, useCallback, and Zustand stores.",
            ),
            shakil,
            db,
        )
        grade_submission(sub_q.id, GradeSubmissionSchema(marks=20, feedback="Perfect score! Thorough understanding of client boundaries."), asad, db)

        # Assignment 4 (Customer Churn Prediction)
        a_churn = created_assignments[3]
        sub_churn = submit_assignment(
            SubmitAssignmentSchema(
                assignment_id=a_churn.id,
                answer="Completed end-to-end churn model using Random Forest with 87% accuracy and 0.89 ROC-AUC score. Clean feature importance graph included.",
            ),
            rashedul,
            db,
        )
        grade_submission(sub_churn.id, GradeSubmissionSchema(marks=95, feedback="Exceptional exploratory data analysis and feature engineering! Well documented notebook."), laila, db)

        # Assignment 7 (Figma Mobile Banking App)
        a_figma = created_assignments[6]
        submit_assignment(
            SubmitAssignmentSchema(
                assignment_id=a_figma.id,
                answer="Completed 6 mobile screens with interactive prototype link: https://figma.com/file/sample/banking-app-redesign. Included light & dark variants.",
            ),
            ashiqur,
            db,
        )

        print("Submissions and mentor grades seeded.")

        # ── 11. Announcements: 14 Community & Learning Notices ────────────────
        print("Seeding 14 LMS Community Announcements…")
        announcements_specs = [
            # Web Development
            (
                c_web.id,
                asad.id,
                "Welcome to the 2024 Learning Cohort! Live Orientation Schedule & Roadmap",
                "Welcome everyone to the Full-Stack Web Development Bootcamp! Over the next 12 weeks, we will transition from fundamentals to building production-grade web applications with Next.js, Node.js, and PostgreSQL.\n\nMake sure to check our weekly live schedule, join the community Discord, and review the starter resources in Module 01.",
                True,
            ),
            (
                c_web.id,
                asad.id,
                "Live Mentor Session: Career Pathways, Resume Reviews & Technical Interview Tips",
                "This Saturday at 7:00 PM BST, we are hosting a live workshop focused on building an exceptional developer resume, optimizing your GitHub profile, and tackling live coding interviews.\n\nJoin the live Zoom stream link from the course dashboard. A recording will be available afterwards.",
                True,
            ),
            (
                c_web.id,
                asad.id,
                "Capstone Project Submission Guidelines & Code Review Rubric Uploaded",
                "The detailed rubric for your Capstone E-Commerce Project is now live under course resources. Projects will be evaluated on UI responsiveness, database normalization, security, and test coverage.\n\nStart brainstorming your product catalog and data models early!",
                False,
            ),
            (
                c_web.id,
                _email_id(db, "nargis.sultana@coursedesk.com"),
                "Bonus Resource: Full-Stack Architecture Cheatsheets & Code Boilerplates",
                "We have added downloadable starter templates for Next.js authentication, Prisma migrations, and Tailwind CSS component libraries in the curriculum materials tab.",
                False,
            ),

            # Data Science & AI
            (
                c_ai.id,
                laila.id,
                "Welcome to Data Science & Machine Learning: Course Syllabus & Cloud GPU Access",
                "Welcome data enthusiasts! We will cover exploratory data analysis, feature engineering, classic statistical models, and neural networks.\n\nCheck your student email for Google Colab Pro and Kaggle team invite links.",
                True,
            ),
            (
                c_ai.id,
                laila.id,
                "Kaggle Community Mini-Competition: Customer Churn Benchmark Leaderboard",
                "We have launched a private community competition where you can test and benchmark your churn prediction models. Top 3 submissions receive 1-on-1 resume reviews!",
                False,
            ),

            # UI/UX Design
            (
                c_design.id,
                shahana.id,
                "Figma Community UI Kits & Design Tokens Library Released",
                "The official course Figma component kit is now published! Duplicate the file to your personal drafts to follow along during our auto-layout and interactive variant workshops.",
                True,
            ),
            (
                c_design.id,
                shahana.id,
                "Weekly Design Critique: Submit Your Figma Links for Live Feedback",
                "Every Wednesday at 6:00 PM, we hold live design critique sessions. Submit your mobile banking wireframes by Tuesday evening to have them reviewed live on stream.",
                False,
            ),

            # Cybersecurity
            (
                c_sec.id,
                kamrul.id,
                "Penetration Testing Lab Environment Setup & Docker Container Credentials",
                "Our pre-configured vulnerability testing sandbox is ready for download. Run `docker pull coursedesk/security-lab:latest` to access OWASP Juice Shop and mock vulnerable APIs locally.",
                True,
            ),
            (
                c_sec.id,
                kamrul.id,
                "Industry Spotlight: Zero Trust Architecture in Modern Cloud Deployments",
                "Guest speaker Engr. Maksudul Alam will join us next Thursday to discuss real-world threat modeling and defending enterprise cloud networks.",
                False,
            ),

            # Cloud & DevOps
            (
                c_cloud.id,
                asad.id,
                "Docker & Kubernetes Free AWS Sandbox Credits Distributed",
                "All enrolled learners have been credited with AWS Educate sandbox credits to run container clusters and EC2 instances without personal billing.",
                True,
            ),

            # Mobile App Development
            (
                c_mobile.id,
                jahangir.id,
                "Flutter 3.19 Upgrade & Cross-Platform Emulator Setup Guide",
                "Please update your Flutter SDK to 3.19 and verify your Android Studio and Xcode simulators before our hands-on REST API integration session.",
                False,
            ),

            # Product Management
            (
                c_pm.id,
                rokeya.id,
                "Product Case Study: Scaling EdTech Platforms to 1M+ Active Users",
                "The Harvard Business Review case study reading for Milestone 1 has been uploaded. Prepare user journey maps for our interactive socratic seminar.",
                False,
            ),

            # Algorithms
            (
                c_algo.id,
                zahidul.id,
                "Weekly LeetCode Problem Set: Dynamic Programming & Binary Search Patterns",
                "We have posted 8 curated LeetCode problems matching the patterns discussed in this week's lesson. Solutions with time and space complexity walkthroughs will be discussed this Friday.",
                True,
            ),
        ]

        created_announcements = []
        for c_id, author_id, title, body, is_pinned in announcements_specs:
            ann = AnnouncementModel(
                course_id=c_id,
                author_id=author_id,
                title=title,
                body=body,
                is_pinned=is_pinned,
                created_at_utc=now - timedelta(days=random.randint(1, 15)),
            )
            db.add(ann)
            db.flush()
            created_announcements.append(ann)

        db.commit()
        print(f"Created {len(created_announcements)} announcements successfully.")

        # ── 12. Comments: 36 Discussions & Mentor Q&A ─────────────────────────
        print("Seeding learner questions and mentor feedback comments…")

        ann_1 = created_announcements[0]  # Welcome Web Dev
        ann_2 = created_announcements[1]  # Live Mentor Session
        ann_3 = created_announcements[2]  # Capstone Guidelines
        ann_7 = created_announcements[6]  # Figma UI Kits
        ann_9 = created_announcements[8]  # Pentesting Lab
        ann_14 = created_announcements[13] # Algorithms LeetCode

        ann_comments = [
            # Welcome Web Dev
            (ann_1.id, shakil.id, "Excited for this bootcamp! Will we also cover Stripe webhook signatures and idempotent event processing?"),
            (ann_1.id, asad.id, "Yes Shakil! We will build a complete webhook listener with Stripe CLI testing for local events."),
            (ann_1.id, maruf.id, "Looking forward to mastering Server Components and Prisma!"),

            # Live Mentor Session
            (ann_2.id, rashedul.id, "Will we be able to share our GitHub profile links for live feedback during the stream?"),
            (ann_2.id, asad.id, "Absolutely! We will review 5 volunteer student profiles on stream and share actionable improvements."),
            (ann_2.id, ashiqur.id, "Thank you, this will be super valuable for job applications!"),

            # Capstone Guidelines
            (ann_3.id, jannatul.id, "Can we use Supabase for PostgreSQL database hosting and storage bucket uploads?"),
            (ann_3.id, asad.id, "Yes, Supabase or Neon PostgreSQL are both great choices for hosting your database."),

            # Figma UI Kits
            (ann_7.id, ashiqur.id, "The Figma component library is very well organized! The auto-layout tokens make building mobile screens so quick."),
            (ann_7.id, shahana.id, "Glad you like it Ashiqur! Check out the variable tokens for seamless dark mode switching."),

            # Pentesting Lab
            (ann_9.id, jannatul.id, "Successfully pulled the Docker container! Everything is running smoothly on port 3000."),
            (ann_9.id, kamrul.id, "Great! Remember to run Burp Suite proxy on loopback 127.0.0.1:8080 to intercept HTTP requests."),

            # Algorithms LeetCode
            (ann_14.id, shakil.id, "Prof. Zahidul, problem 3 on coin change has both memoized and iterative DP solutions. Which one is preferred in interviews?"),
            (ann_14.id, zahidul.id, "Interviewers usually prefer the bottom-up tabulated solution because of O(1) recursion call stack overhead, but explaining top-down first demonstrates great thinking."),
        ]

        for a_id, u_id, content in ann_comments:
            db.add(AnnouncementCommentModel(
                announcement_id=a_id,
                user_id=u_id,
                content=content,
                created_at_utc=now - timedelta(days=random.randint(1, 10)),
            ))

        # Assignment Comments (Public questions & Private mentor feedback)
        assign_capstone = created_assignments[0]
        assign_portfolio = created_assignments[1]
        assign_churn = created_assignments[3]
        assign_figma = created_assignments[6]
        assign_algo = created_assignments[13]

        assignment_comments = [
            # Capstone Project (Public class comments)
            (assign_capstone.id, shakil.id, None, "Are we allowed to use Tailwind UI or Shadcn UI components for our e-commerce frontend?", False),
            (assign_capstone.id, asad.id, None, "Yes! Shadcn UI and Tailwind are highly recommended for clean, production-ready interfaces.", False),
            (assign_capstone.id, maruf.id, None, "Should we include automated tests with Jest or Playwright?", False),
            (assign_capstone.id, asad.id, None, "Including end-to-end checkout flow tests with Playwright will earn bonus points!", False),

            # Capstone Project (Private comments between Shakil and Mentor Asad)
            (assign_capstone.id, shakil.id, shakil.id, "Mentor Asad, I am planning to add search filtering with Meilisearch or PostgreSQL Full-Text Search. What do you recommend?", True),
            (assign_capstone.id, asad.id, shakil.id, "PostgreSQL Full-Text Search with `tsvector` and `tsquery` is great to keep your stack minimal and fast.", True),

            # Portfolio Project (Public class comments)
            (assign_portfolio.id, maruf.id, None, "Should our contact form send real emails via Resend or Nodemailer?", False),
            (assign_portfolio.id, asad.id, None, "Yes, integrating Resend API or Formspree makes your portfolio fully functional.", False),

            # Portfolio Project (Private comments for Maruf)
            (assign_portfolio.id, maruf.id, maruf.id, "My Vercel deployment build time was 42 seconds with static generation. Is that good?", True),
            (assign_portfolio.id, asad.id, maruf.id, "42 seconds is very fast Maruf. Excellent job leveraging ISR and static pages.", True),

            # Churn Project (Public class comments)
            (assign_churn.id, rashedul.id, None, "Should we use SMOTE for balancing the churn classes before training?", False),
            (assign_churn.id, laila.id, None, "Yes Rashedul, synthetic oversampling with SMOTE prevents class imbalance bias on the minority churn class.", False),

            # Figma Project (Public class comments)
            (assign_figma.id, ashiqur.id, None, "Do we need to design both iOS and Android navigation bars?", False),
            (assign_figma.id, shahana.id, None, "Focus on iOS Human Interface Guidelines first, or Material 3 if targeting Android.", False),

            # Algorithms Challenge (Public class comments)
            (assign_algo.id, shakil.id, None, "Should inputs be read from standard input or passed via class method signatures?", False),
            (assign_algo.id, zahidul.id, None, "Implement the standard method signature as defined in the starter file.", False),
        ]

        for a_id, u_id, l_id, content, is_priv in assignment_comments:
            db.add(CommentModel(
                assignment_id=a_id,
                user_id=u_id,
                learner_id=l_id,
                content=content,
                is_private=is_priv,
                created_at_utc=now - timedelta(days=random.randint(1, 8)),
            ))

        db.commit()
        print("Discussions and comments seeded successfully.")

        # ── 13. Notifications ─────────────────────────────────────────────────
        seed_notifications(db)

        # ── Summary ───────────────────────────────────────────────────────────
        print("\n" + "=" * 65)
        print("✅ MODERN LMS SEED COMPLETE (COMMERCIAL ONLINE LEARNING FORMAT)")
        print("=" * 65)
        print("LMS Statistics:")
        print(f"  • Learners      : 100 learners enrolled in career bootcamps")
        print(f"  • Instructors   : {len(INSTRUCTORS_DATA)} tech leads, industry mentors & design leads")
        print(f"  • Coordinators  : {len(COORDINATORS_DATA)} student success & curriculum managers")
        print(f"  • LMS Courses   : 8 modern commercial bootcamps & masterclasses")
        print(f"  • Portfolio Work: {len(created_assignments)} projects, quizzes & coding challenges")
        print(f"  • Video Lessons : {len(created_sessions)} modular lessons with chapter markers & resources")
        print(f"  • Announcements : {len(created_announcements)} community, workshop & milestone notices")
        print(f"  • Discussions   : {len(ann_comments) + len(assignment_comments)} comments & mentor answers")
        print(f"  • Submissions   : Multiple graded learner projects with constructive mentor reviews")
        print("\nLogin Credentials:")
        print(f"  • Admin         : {ADMIN['email']} / {ADMIN['password']} ({ADMIN['name']})")
        print(f"  • Instructor    : asaduzzaman.nur@coursedesk.com / Instructor@123 (Lead Web Architect)")
        print(f"  • Instructor    : laila.banu@coursedesk.com / Instructor@123 (AI & Data Science Lead)")
        print(f"  • Instructor    : shahana.parveen@coursedesk.com / Instructor@123 (Principal UI/UX Designer)")
        print(f"  • Coordinator   : shamsul.huda@coursedesk.com / Coordinator@123 (Student Success Director)")
        print(f"  • Learner       : shakil.mahmud@coursedesk.com / Learner@123 (Shakil Mahmud)")
        print(f"  • Learner       : maruf.billah@coursedesk.com / Learner@123 (Maruf Billah)")
        print(f"  • (All learners password: Learner@123, all instructors: Instructor@123)")
        print("=" * 65)

    finally:
        db.close()


if __name__ == "__main__":
    seed()