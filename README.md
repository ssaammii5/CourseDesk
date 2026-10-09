# 🎓 CourseDesk

<div align="center">

**A Modern, Role-Based Learning Management System (LMS) & Assignment Workflow Platform**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.141+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org)
[![Cloudflare R2](https://img.shields.io/badge/Storage-Cloudflare_R2-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://www.cloudflare.com/developer-platform/r2/)

<br />

[Explore Features](#-core-features) • [Demo Credentials](#-demo-login-credentials) • [System Architecture](#-system-architecture) • [Quickstart Guide](#-getting-started) • [API & Environment](#-configuration--environment-variables)

</div>

---

## 📌 Overview

**CourseDesk** is an enterprise-grade, multi-role academic and commercial training management platform. Designed from the ground up to replace fragmented classroom tools, CourseDesk connects **Admins**, **Academic Coordinators**, **Industry Instructors**, and **Learners** into an intuitive, unified hub.

Whether delivering intensive technical bootcamps (Full-Stack Web Dev, AI & Data Science, UI/UX, Cloud & DevOps) or managing structured university courses, CourseDesk provides comprehensive assignment pipelines, interactive video curricula with chapter markers, rubric-driven grading, community announcements, and granular role-based access control (RBAC).

---

## 🔑 Demo Login Credentials

> **Tip:** The CourseDesk sign-in screen includes a built-in **1-Click Demo Role Switcher**. Click any role badge on the login screen to instantly autofill test credentials!

All seeded accounts are pre-loaded with realistic courses, submissions, video lectures, grades, and forum interactions.

| Role | Name | Email | Password | Primary Responsibilities & Access |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | Mostafa Kamal | `admin@coursedesk.com` | `Admin@123` | Full system control: user provisioning, course lifecycle, global settings, platform analytics, system branding. |
| **Program Coordinator** | Dr. Shamsul Huda | `shamsul.huda@coursedesk.com` | `Coordinator@123` | Student success tracking, curriculum operations, learner batch monitoring, and program oversight. |
| **Instructor (Web Dev)** | Dr. Asaduzzaman Nur | `asaduzzaman.nur@coursedesk.com` | `Instructor@123` | Course creation, interactive assignment publication, rubric grading, video session marker editing, student Q&A. |
| **Instructor (AI & Data)** | Dr. Laila Arjumand Banu | `laila.banu@coursedesk.com` | `Instructor@123` | Data Science bootcamp curriculum, project reviews, announcements, and coding challenge feedback. |
| **Instructor (UI/UX)** | Shahana Parveen | `shahana.parveen@coursedesk.com` | `Instructor@123` | Design critiques, Figma design review assignments, syllabus materials, and video workshops. |
| **Learner / Student** | Shakil Mahmud | `shakil.mahmud@coursedesk.com` | `Learner@123` | Course enrollment, video player with chapters, project submissions (PDF/DOCX/code/ZIP), grades & feedback review. |
| **Learner / Student** | Maruf Billah | `maruf.billah@coursedesk.com` | `Learner@123` | Active student enrolled in multiple bootcamps, to-do task tracking, calendar schedule, peer discussions. |

> *(Note: All 100+ generated demo learners share the standard password `Learner@123`, all instructors use `Instructor@123`, and coordinators use `Coordinator@123`)*

---

## ✨ Core Features

### 👨‍💼 1. Super Admin Control Center
- **System-Wide Analytics:** Real-time visibility into enrollments, submission velocities, grading turnaround times, and active cohorts.
- **Academic & Taxonomy Management:** Dynamic category tree (Web Dev, AI, Cyber, Cloud, Product) and searchable tagging engine.
- **Enterprise User Management:** Create, suspend, role-transition, and audit Admins, Coordinators, Instructors, and Learners.
- **Global White-Labeling & Config:** Modify platform branding (light/dark logos, platform title, taglines), default file upload thresholds, allowed MIME types, and deadline penalty policies on the fly.

### 🧭 2. Coordinator Operations
- **Curriculum & Batch Oversight:** Monitor progress across parallel student cohorts.
- **Student Success Diagnostics:** Identify struggling learners with overdue coursework or low engagement.
- **Cross-Departmental Coordination:** Direct communication channels between instructional staff and students.

### 👨‍🏫 3. Instructor Studio
- **Assignment Builder:** Rich markdown task prompts, attachment attachments, point weights, strict deadlines, and late penalty rules.
- **Turnaround Grading Hub:** Dedicated assessment portal with inline file viewers (supports PDF, DOCX previews, images, archives) and private mentor feedback.
- **Video Lesson Publishing:** Upload or link interactive lecture recordings with timestamped chapter markers and attached courseware.
- **Broadcast Announcements:** Cohort-wide notifications with nested comment threads for community discourse.

### 🧑‍🎓 4. Learner Experience
- **Interactive Coursework Dashboard:** Clean curriculum outline showing completed vs. upcoming sessions and deliverables.
- **Multimedia Classroom:** Responsive video player featuring synchronized lesson chapters, downloadable slide decks, and code starter files.
- **Frictionless Submissions:** Multi-format file uploader supporting drag-and-drop, real-time submission status tracking, and resubmissions within policy limits.
- **Personal Productivity Suite:** Integrated calendar schedule and deadline-sorted To-Do checklist.

### 🛡️ 5. Security & Authentication
- **Argon2 Password Hashing:** Modern cryptographic storage via `pwdlib[argon2]`.
- **JWT Authentication Lifecycle:** Access and refresh token rotation with secure client-side session persistence.
- **Two-Factor & Email Verification:** 6-digit OTP email challenge workflow powered by Resend / SMTP.
- **S3 / Cloudflare R2 Object Storage:** Signed and public asset delivery for course collateral, profile avatars, and student work.

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph Client["Frontend Client (Next.js 16 + React 19)"]
        UI["Tailwind CSS v4 & Lucide UI"]
        AuthContext["Auth Context & Token Interceptor"]
        Router["App Router (Role Guards & Middleware)"]
    end

    subgraph Server["Backend API (FastAPI + Python 3.12)"]
        API["REST Endpoints (/api/v1)"]
        RBAC["Dependency Injection & RBAC Policy"]
        ORM["SQLAlchemy 2.0 (Async/Sync Engine)"]
    end

    subgraph Storage["Data & Object Tier"]
        DB[("PostgreSQL 16 Database")]
        R2[("Cloudflare R2 / S3 Bucket")]
        Mail["Resend / SMTP Gateway"]
    end

    UI --> Router
    Router --> AuthContext
    AuthContext -->|Bearer JWT & CORS| API
    API --> RBAC
    RBAC --> ORM
    ORM --> DB
    API -->|Direct Upload & Presigned URLs| R2
    API -->|Transactional OTP & Alerts| Mail
```

---

## 🛠️ Tech Stack Breakdown

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Library:** React 19
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS v4
- **State & Context:** React Hooks & Custom Context Providers (`useAuth`, `useAppSettings`)
- **Document Rendering:** `docx-preview`, `jszip` for in-browser client document rendering
- **Icons:** Lucide React

### Backend
- **Framework:** FastAPI (Python 3.12+)
- **ORM & Data Layer:** SQLAlchemy 2.0 with PostgreSQL driver (`psycopg 3`)
- **Migrations:** Alembic
- **Package & Dependency Manager:** Astral `uv`
- **Authentication & Crypto:** `pyjwt`, `pwdlib` with Argon2
- **Data Validation & Settings:** Pydantic v2 & Pydantic-Settings
- **Cloud Storage:** Boto3 (Cloudflare R2 / AWS S3 compatibility)
- **Email Service:** Resend SDK & fallback SMTP transport

### Infrastructure & Tooling
- **Database:** PostgreSQL 16 (Docker Compose)
- **Containerization:** Docker & Docker Compose

---

## 🚀 Getting Started

Follow these steps to run the complete CourseDesk stack locally.

### 📋 Prerequisites
- **Node.js:** v20.x or later
- **pnpm:** v9.x or later (`npm i -g pnpm`)
- **Python:** v3.12 or later
- **uv:** Astral Python runner (`curl -LsSf https://astral.sh/uv/install.sh | sh` or `brew install uv`)
- **Docker & Docker Compose:** Installed and running

---

### 1️⃣ Database Setup (PostgreSQL)

Start the local PostgreSQL container:

```bash
cd backend
docker compose up -d
```

*Verifies a healthy PostgreSQL instance running on `localhost:5432` with database `coursedesk`.*

---

### 2️⃣ Backend Setup (FastAPI)

1. **Install dependencies and create virtual environment using `uv`:**

   ```bash
   cd backend
   uv sync
   ```

2. **Configure Environment Variables:**

   Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

   *The default `.env.example` is preconfigured for the local Docker PostgreSQL database out of the box.*

3. **Run Database Migrations & Seed Commercial LMS Data:**

   ```bash
   # Generates schema and populates courses, instructors, 100 learners, assignments, and sessions
   uv run python -m app.utils.seed
   ```

4. **Start the FastAPI Development Server:**

   ```bash
   uv run fastapi dev app/main.py
   # Or using uvicorn:
   # uv run uvicorn app.main:app --port 8000 --reload
   ```

   The backend will be running at **http://localhost:8000**.
   - Interactive Swagger API Docs: **http://localhost:8000/docs**
   - ReDoc Documentation: **http://localhost:8000/redoc**

---

### 3️⃣ Frontend Setup (Next.js)

1. **Navigate to the frontend folder and install packages:**

   ```bash
   cd frontend
   pnpm install
   ```

2. **Configure Environment Variables:**

   Copy the sample environment file:

   ```bash
   cp .env.example .env.local
   ```

   Ensure `NEXT_PUBLIC_API_URL` points to your backend:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Start the Next.js Development Server:**

   ```bash
   pnpm dev
   ```

   The web application is now accessible at **http://localhost:3000**!

---

## ⚙️ Configuration & Environment Variables

### Backend Configuration (`backend/.env`)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DB_CONNECTION` | SQLAlchemy PostgreSQL connection URL | `postgresql+psycopg://myuser:mypassword@localhost:5432/coursedesk` |
| `SECRET_KEY` | Secret key used to sign JWT tokens | `<random-hex-string>` |
| `ALGORITHM` | JWT signing algorithm | `HS256` |
| `EXP_TIME` | Access token lifetime in minutes | `60` |
| `REFRESH_EXP_DAYS` | Refresh token duration in days | `7` |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | `http://localhost:3000` |
| `FRONTEND_URL` | Root URL of frontend client | `http://localhost:3000` |
| `UPLOAD_DIR` | Local static uploads directory fallback | `uploads` |
| `STORAGE_PROVIDER` | Asset storage backend (`local` or `r2`) | `local` |
| `R2_ACCOUNT_ID` | Cloudflare account identifier | *(Optional for local)* |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 API token access key | *(Optional for local)* |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 API token secret key | *(Optional for local)* |
| `R2_BUCKET_NAME` | Cloudflare R2 bucket name | *(Optional for local)* |
| `R2_PUBLIC_URL` | Public CDN URL or custom domain for assets | *(Optional for local)* |
| `RESEND_API_KEY` | Resend API key for OTP and transactional email | *(Optional)* |
| `RESEND_FROM` | Verified sender email address | `CourseDesk <onboarding@resend.dev>` |

### Frontend Configuration (`frontend/.env.local`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Target FastAPI backend URL | `http://localhost:8000` |

---

## 📂 Project Directory Structure

```text
CourseDesk/
├── backend/
│   ├── app/
│   │   ├── academic/       # Departments, course categories & tagging
│   │   ├── announcement/   # Class announcements & comment threads
│   │   ├── assignment/     # Assignments, rubrics & point settings
│   │   ├── auth/           # Login, signup, OTP verify & JWT tokens
│   │   ├── comment/        # Assignment & submission feedback discussions
│   │   ├── course/         # Course models, controllers & enrollments
│   │   ├── dashboard/      # Role-specific analytics & summary queries
│   │   ├── notification/   # In-app alerts & notification center
│   │   ├── session/        # Lecture sessions, video markers & attachments
│   │   ├── setting/        # Dynamic application settings & white-labeling
│   │   ├── submission/     # File uploads, grading & reviewer feedback
│   │   ├── user/           # User models (Admin, Coordinator, Instructor, Learner)
│   │   └── utils/          # DB engine, S3 storage client, seed script & security
│   ├── migrations/         # Alembic database schema migrations
│   ├── docker-compose.yml  # Local PostgreSQL service
│   ├── pyproject.toml      # Python dependencies (managed via uv)
│   └── README.md
│
├── frontend/
│   ├── app/                # Next.js App Router (dashboard, auth & public pages)
│   │   ├── (dashboard)/    # Authenticated user views & role-guarded routes
│   │   │   ├── (admin)/    # Administrative console & analytics
│   │   │   ├── course/     # Dynamic course view, syllabus & curriculum
│   │   │   ├── calendar/   # Academic calendar
│   │   │   └── todo/       # Personal assignment task list
│   │   ├── login/          # Sign-in portal (with 1-Click Role Switcher)
│   │   └── signup/         # Account registration & onboarding
│   ├── components/         # Reusable UI component library (modals, tables, cards)
│   ├── context/            # AuthContext & AppSettingsContext
│   ├── features/           # Modular domain views (auth, admin, course, submissions)
│   ├── hooks/              # Custom React hooks (useAuth, usePermissions)
│   ├── lib/                # API client SDK, formatting utilities & types
│   ├── package.json        # Node dependencies & scripts
│   └── README.md
│
└── README.md               # Root portfolio documentation (You are here)
```

---

## 🔒 Security Best Practices Implemented

- **Password Cryptography:** High-work-factor Argon2 hashing prevents brute-force credential stuffing.
- **Strict Role-Based Access Control (RBAC):** Backend route dependencies inspect the user's role on every sensitive endpoint.
- **Scoped File Handling:** File uploads are validated for allowed MIME types and size constraints before persisting to cloud object storage.
- **Separation of Concerns:** Modular domain architecture where models, DTOs, controllers, and routers remain isolated and unit-testable.

---

## 📄 License

This project is licensed under the terms of the [MIT License](LICENSE).

---

<div align="center">
  <b>CourseDesk</b> — Built with modern software craftsmanship for exceptional learning experiences.
</div>
