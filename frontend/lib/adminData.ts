export interface StudentAddress {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}

export type StudentProgramType =
    | "Undergraduate"
    | "Postgraduate"
    | "Post Graduate Diploma"
    | "M.Phil"
    | "PhD";

export interface StudentDetails {
    fathersName: string;
    mothersName: string;
    dateOfBirth: string;
    mobile: string;
    nationality: string;
    studentId: string;
    regNo: string;
    department: string;
    currentProgram: StudentProgramType;
    session: string;
    semesterSession: string;
    address: StudentAddress;
}

export type TeacherDesignation =
    | "Professor"
    | "Associate Professor"
    | "Assistant Professor"
    | "Senior Lecturer"
    | "Lecturer";

export interface TeacherDetails {
    teacherId: string;
    designation: TeacherDesignation;
    department: string;
}

export const TEACHER_DEPARTMENTS = [
    "CSE",
    "EEE",
    "BBA",
    "English",
    "Economics",
    "Law",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Architecture",
    "Civil Engineering",
    "Mechanical Engineering",
] as const;

// ===== ACADEMICS DATA =====
export interface AcademicProgram {
    id: number;
    name: string;
    description: string;
}

export interface AcademicSemester {
    id: number;
    name: string;
}

export interface AcademicDepartment {
    id: number;
    name: string;
    code: string;
}

export const academicPrograms: AcademicProgram[] = [
    { id: 1, name: "Undergraduate", description: "Bachelor's degree programs (4 years)" },
    { id: 2, name: "Postgraduate", description: "Master's degree programs (2 years)" },
    { id: 3, name: "Post Graduate Diploma", description: "Postgraduate diploma programs (1 year)" },
    { id: 4, name: "M.Phil", description: "Master of Philosophy research program" },
    { id: 5, name: "PhD", description: "Doctoral research program" },
];

export const academicDepartments: AcademicDepartment[] = [
    { id: 1, name: "Computer Science and Engineering", code: "CSE" },
    { id: 2, name: "Electrical and Electronic Engineering", code: "EEE" },
    { id: 3, name: "Business Administration", code: "BBA" },
    { id: 4, name: "English", code: "ENG" },
    { id: 5, name: "Economics", code: "ECO" },
    { id: 6, name: "Law", code: "LAW" },
    { id: 7, name: "Mathematics", code: "MTH" },
    { id: 8, name: "Physics", code: "PHY" },
    { id: 9, name: "Chemistry", code: "CHM" },
    { id: 10, name: "Architecture", code: "ARCH" },
    { id: 11, name: "Civil Engineering", code: "CE" },
    { id: 12, name: "Mechanical Engineering", code: "ME" },
];

export const academicSemesters: AcademicSemester[] = [
    { id: 8, name: "July-December/2026" },
    { id: 7, name: "January-June/2026" },
    { id: 6, name: "July-December/2025" },
    { id: 5, name: "January-June/2025" },
    { id: 4, name: "July-December/2024" },
    { id: 3, name: "January-June/2024" },
    { id: 2, name: "July-December/2023" },
    { id: 1, name: "January-June/2023" },
];

export interface AdminUser {
    id: number;
    name: string;
    email: string;
    role: "Admin" | "Teacher" | "Student";
    isActive: boolean;
    createdAt: string;
    studentDetails?: StudentDetails;
    teacherDetails?: TeacherDetails;
}

/* ─── Course Catalog: structured by program + department ─── */
export interface CourseCatalogItem {
    name: string;
    program: string;
    department: string;
}

export const COURSE_CATALOG: CourseCatalogItem[] = [
    { name: "CIT-6102: Advanced Algorithms", program: "Postgraduate", department: "CSE" },
    { name: "CIT-5103: Symbolic Machines", program: "Postgraduate", department: "CSE" },
    { name: "CIT-5109: Natural Language Processing", program: "Postgraduate", department: "CSE" },
    { name: "CIT-6105: Information Security", program: "Postgraduate", department: "CSE" },
    { name: "CIT-5101: Computer Networks", program: "Postgraduate", department: "CSE" },
    { name: "CSE 415: Operating Systems", program: "Undergraduate", department: "CSE" },
    { name: "CSE 416: Computer Architecture", program: "Undergraduate", department: "CSE" },
    { name: "CSE 417: Database Systems", program: "Undergraduate", department: "CSE" },
    { name: "CSE 418: Software Engineering", program: "Undergraduate", department: "CSE" },
    { name: "CCE 423: Cryptography and Network Security", program: "Undergraduate", department: "CSE" },
    { name: "EEE 301: Circuit Analysis", program: "Undergraduate", department: "EEE" },
    { name: "EEE 302: Digital Electronics", program: "Undergraduate", department: "EEE" },
    { name: "EEE 401: Control Systems", program: "Undergraduate", department: "EEE" },
    { name: "EEE 501: Power Electronics", program: "Postgraduate", department: "EEE" },
    { name: "BBA 201: Principles of Management", program: "Undergraduate", department: "BBA" },
    { name: "BBA 301: Marketing Management", program: "Undergraduate", department: "BBA" },
    { name: "BBA 401: Strategic Management", program: "Postgraduate", department: "BBA" },
    { name: "ENG 101: English Composition", program: "Undergraduate", department: "English" },
    { name: "ENG 201: Advanced English", program: "Undergraduate", department: "English" },
    { name: "ENG 301: English Literature", program: "Postgraduate", department: "English" },
    { name: "ECO 101: Microeconomics", program: "Undergraduate", department: "Economics" },
    { name: "ECO 201: Macroeconomics", program: "Undergraduate", department: "Economics" },
    { name: "LAW 101: Introduction to Law", program: "Undergraduate", department: "Law" },
    { name: "MTH 101: Calculus I", program: "Undergraduate", department: "Mathematics" },
    { name: "MTH 201: Linear Algebra", program: "Undergraduate", department: "Mathematics" },
    { name: "PHY 101: Physics I", program: "Undergraduate", department: "Physics" },
    { name: "CHM 101: Chemistry I", program: "Undergraduate", department: "Chemistry" },
];

/* ─── Preassigned Sessions ─── */
export const AVAILABLE_SESSIONS: string[] = [
    "January-June/2023",
    "July-December/2023",
    "January-June/2024",
    "July-December/2024",
    "January-June/2025",
    "July-December/2025",
    "January-June/2026",
    "July-December/2026",
];

/* ─── AdminCourse Interface ─── */
export interface AdminCourse {
    id: number;
    name: string;
    program: string;
    department: string;
    teacherIds: number[];
    studentIds: number[];
    session: string;
    isActive: boolean;
}

export interface AdminAssignment {
    id: number;
    courseId: number;
    courseName: string;
    program: string;
    department: string;
    session: string;
    title: string;
    description: string;
    deadline: string;
    maxMarks: number;
    status: "Draft" | "Published" | "Pending";
    createdById: number;
    createdBy: string;
    createdAt: string;
    submissionCount: number;
}

export interface AdminSubmission {
    id: number;
    assignmentId: number;
    assignmentTitle: string;
    courseId: number;
    courseName: string;
    studentId: number;
    studentName: string;
    status: "Submitted" | "Graded" | "Pending";
    marks: number | null;
    feedback: string | null;
    submittedAt: string;
}

export interface AppSetting {
    key: string;
    value: string;
    description: string;
    category: "General" | "Notifications" | "Grading" | "Security";
}

/* ─── Users now come from the API (Phase 3) ─── */
export const adminUsers: AdminUser[] = [];

/* ─── Mock courses with new fields ─── */
export const adminCourses: AdminCourse[] = [
    { id: 1, name: "CIT-6102: Advanced Algorithms", program: "Postgraduate", department: "CSE", teacherIds: [3], studentIds: [9, 23, 24, 25, 26, 27, 28, 29, 30, 31], session: "January-June/2025", isActive: true },
    { id: 2, name: "CIT-5103: Symbolic Machines", program: "Postgraduate", department: "CSE", teacherIds: [3], studentIds: [23, 24, 27, 28], session: "January-June/2025", isActive: true },
    { id: 3, name: "CIT-5109: Natural Language Processing", program: "Postgraduate", department: "CSE", teacherIds: [4], studentIds: [29, 30, 31], session: "January-June/2025", isActive: true },
    { id: 4, name: "CIT-6105: Information Security", program: "Postgraduate", department: "CSE", teacherIds: [2], studentIds: [25, 26, 27, 28], session: "January-June/2024", isActive: true },
    { id: 5, name: "CIT-5101: Computer Networks", program: "Postgraduate", department: "CSE", teacherIds: [2], studentIds: [9, 10, 23, 24], session: "July-December/2023", isActive: false },
    { id: 6, name: "CCE 423: Cryptography and Network Security", program: "Undergraduate", department: "CSE", teacherIds: [], studentIds: [6, 7, 8, 11, 12, 13, 14, 15], session: "January-June/2024", isActive: true },
    { id: 7, name: "CSE 415: Operating Systems", program: "Undergraduate", department: "CSE", teacherIds: [2, 4], studentIds: [16, 17, 18, 19, 20, 21, 22], session: "July-December/2024", isActive: true },
    { id: 8, name: "CSE 416: Computer Architecture", program: "Undergraduate", department: "CSE", teacherIds: [3], studentIds: [60, 61, 62], session: "January-June/2025", isActive: true },
    { id: 9, name: "EEE 301: Circuit Analysis", program: "Undergraduate", department: "EEE", teacherIds: [41], studentIds: [32, 33, 34], session: "January-June/2023", isActive: true },
    { id: 10, name: "EEE 302: Digital Electronics", program: "Undergraduate", department: "EEE", teacherIds: [41], studentIds: [35, 36], session: "July-December/2023", isActive: true },
    { id: 11, name: "EEE 501: Power Electronics", program: "Postgraduate", department: "EEE", teacherIds: [41], studentIds: [37, 38], session: "January-June/2024", isActive: true },
    { id: 12, name: "BBA 201: Principles of Management", program: "Undergraduate", department: "BBA", teacherIds: [42], studentIds: [39, 40], session: "January-June/2024", isActive: true },
    { id: 13, name: "BBA 301: Marketing Management", program: "Undergraduate", department: "BBA", teacherIds: [42], studentIds: [47, 48], session: "July-December/2024", isActive: true },
    { id: 14, name: "BBA 401: Strategic Management", program: "Postgraduate", department: "BBA", teacherIds: [42], studentIds: [49, 50], session: "January-June/2025", isActive: true },
    { id: 15, name: "ENG 101: English Composition", program: "Undergraduate", department: "English", teacherIds: [43], studentIds: [51, 52], session: "January-June/2024", isActive: true },
    { id: 16, name: "ENG 201: Advanced English", program: "Undergraduate", department: "English", teacherIds: [43], studentIds: [53], session: "July-December/2024", isActive: true },
    { id: 17, name: "ECO 101: Microeconomics", program: "Undergraduate", department: "Economics", teacherIds: [44], studentIds: [54, 55], session: "January-June/2024", isActive: true },
    { id: 18, name: "LAW 101: Introduction to Law", program: "Undergraduate", department: "Law", teacherIds: [45], studentIds: [56, 57], session: "January-June/2024", isActive: true },
    { id: 19, name: "MTH 101: Calculus I", program: "Undergraduate", department: "Mathematics", teacherIds: [46], studentIds: [58, 59], session: "July-December/2024", isActive: true },
];

export const adminAssignments: AdminAssignment[] = [
    {
        id: 1, courseId: 4, courseName: "CIT-6105: Information Security",
        program: "Postgraduate", department: "CSE", session: "January-June/2024",
        title: "CIT-6105 Research Assignment", description: "Follow IEEE Conference Paper format",
        deadline: "2025-09-16", maxMarks: 100, status: "Published",
        createdById: 2, createdBy: "Md. Mahbubur Rahman", createdAt: "2025-10-04", submissionCount: 18,
    },
    {
        id: 2, courseId: 4, courseName: "CIT-6105: Information Security",
        program: "Postgraduate", department: "CSE", session: "January-June/2024",
        title: "Lab 1 - Substitution Cipher", description: "Implement Caesar and Vigenère ciphers",
        deadline: "2025-07-30", maxMarks: 50, status: "Published",
        createdById: 2, createdBy: "Md. Mahbubur Rahman", createdAt: "2025-07-20", submissionCount: 28,
    },
    {
        id: 3, courseId: 4, courseName: "CIT-6105: Information Security",
        program: "Postgraduate", department: "CSE", session: "January-June/2024",
        title: "Quiz 1 - Classical Ciphers", description: "10 multiple-choice questions",
        deadline: "2025-07-12", maxMarks: 10, status: "Published",
        createdById: 2, createdBy: "Md. Mahbubur Rahman", createdAt: "2025-07-05", submissionCount: 30,
    },
    {
        id: 4, courseId: 1, courseName: "CIT-6102: Advanced Algorithms",
        program: "Postgraduate", department: "CSE", session: "January-June/2025",
        title: "Quiz 2 - Hashing", description: "Hash functions and collision resolution",
        deadline: "2025-08-20", maxMarks: 20, status: "Published",
        createdById: 3, createdBy: "Prof. Dr. Abdul Masud", createdAt: "2025-08-10", submissionCount: 12,
    },
    {
        id: 5, courseId: 3, courseName: "CIT-5109: Natural Language Processing",
        program: "Postgraduate", department: "CSE", session: "January-June/2025",
        title: "CIT-6109 Research Work", description: "NLP research paper analysis",
        deadline: "2025-08-16", maxMarks: 100, status: "Published",
        createdById: 4, createdBy: "Farjana Sultana Mim", createdAt: "2025-08-01", submissionCount: 8,
    },
    {
        id: 6, courseId: 1, courseName: "CIT-6102: Advanced Algorithms",
        program: "Postgraduate", department: "CSE", session: "January-June/2025",
        title: "Assignment on Dynamic Programming", description: "Solve DP problems",
        deadline: "2025-09-01", maxMarks: 50, status: "Draft",
        createdById: 3, createdBy: "Prof. Dr. Abdul Masud", createdAt: "2025-08-15", submissionCount: 0,
    },
    {
        id: 7, courseId: 6, courseName: "CCE 423: Cryptography and Network Security",
        program: "Undergraduate", department: "CSE", session: "January-June/2024",
        title: "Problem Set 1 - Symmetric Encryption", description: "AES and DES problems",
        deadline: "2025-06-15", maxMarks: 30, status: "Published",
        createdById: 2, createdBy: "Md. Mahbubur Rahman", createdAt: "2025-06-01", submissionCount: 22,
    },
    {
        id: 8, courseId: 6, courseName: "CCE 423: Cryptography and Network Security",
        program: "Undergraduate", department: "CSE", session: "January-June/2024",
        title: "Lab 2 - RSA Implementation", description: "Implement RSA key generation",
        deadline: "2025-06-25", maxMarks: 40, status: "Published",
        createdById: 2, createdBy: "Md. Mahbubur Rahman", createdAt: "2025-06-10", submissionCount: 20,
    },
    {
        id: 9, courseId: 7, courseName: "CSE 415: Operating Systems",
        program: "Undergraduate", department: "CSE", session: "July-December/2024",
        title: "Assignment 1 - Process Scheduling", description: "Implement FCFS and SJF schedulers",
        deadline: "2025-08-10", maxMarks: 25, status: "Published",
        createdById: 4, createdBy: "Farjana Sultana Mim", createdAt: "2025-07-25", submissionCount: 15,
    },
    {
        id: 10, courseId: 7, courseName: "CSE 415: Operating Systems",
        program: "Undergraduate", department: "CSE", session: "July-December/2024",
        title: "Quiz 1 - Memory Management", description: "Paging and segmentation concepts",
        deadline: "2025-08-20", maxMarks: 15, status: "Draft",
        createdById: 4, createdBy: "Farjana Sultana Mim", createdAt: "2025-08-05", submissionCount: 0,
    },
    {
        id: 11, courseId: 9, courseName: "EEE 301: Circuit Analysis",
        program: "Undergraduate", department: "EEE", session: "January-June/2023",
        title: "Problem Set - Kirchhoff's Laws", description: "Circuit analysis problems",
        deadline: "2025-05-20", maxMarks: 20, status: "Published",
        createdById: 41, createdBy: "Dr. Rafiqul Islam", createdAt: "2025-05-05", submissionCount: 10,
    },
    {
        id: 12, courseId: 12, courseName: "BBA 201: Principles of Management",
        program: "Undergraduate", department: "BBA", session: "January-June/2024",
        title: "Case Study - Organizational Behavior", description: "Analyze a management case study",
        deadline: "2025-06-30", maxMarks: 50, status: "Published",
        createdById: 42, createdBy: "Dr. Nasreen Akter", createdAt: "2025-06-10", submissionCount: 8,
    },
];

export const adminSubmissions: AdminSubmission[] = [
    { id: 1, assignmentId: 2, assignmentTitle: "Lab 1 - Substitution Cipher", courseId: 4, courseName: "CIT-6105: Information Security", studentId: 6, studentName: "Md. Samiur Rahman", status: "Graded", marks: 45, feedback: "Good implementation. Minor issues with edge cases.", submittedAt: "2025-07-28" },
    { id: 2, assignmentId: 2, assignmentTitle: "Lab 1 - Substitution Cipher", courseId: 4, courseName: "CIT-6105: Information Security", studentId: 7, studentName: "Habibur Rahman Khan Ratin", status: "Graded", marks: 42, feedback: "Well done. Consider adding more test cases.", submittedAt: "2025-07-29" },
    { id: 3, assignmentId: 2, assignmentTitle: "Lab 1 - Substitution Cipher", courseId: 4, courseName: "CIT-6105: Information Security", studentId: 8, studentName: "Iffat Ara Babli", status: "Submitted", marks: null, feedback: null, submittedAt: "2025-07-30" },
    { id: 4, assignmentId: 3, assignmentTitle: "Quiz 1 - Classical Ciphers", courseId: 4, courseName: "CIT-6105: Information Security", studentId: 6, studentName: "Md. Samiur Rahman", status: "Graded", marks: 9, feedback: "Excellent understanding.", submittedAt: "2025-07-11" },
    { id: 5, assignmentId: 1, assignmentTitle: "CIT-6105 Research Assignment", courseId: 4, courseName: "CIT-6105: Information Security", studentId: 6, studentName: "Md. Samiur Rahman", status: "Pending", marks: null, feedback: null, submittedAt: "" },
    { id: 6, assignmentId: 4, assignmentTitle: "Quiz 2 - Hashing", courseId: 1, courseName: "CIT-6102: Advanced Algorithms", studentId: 6, studentName: "Md. Samiur Rahman", status: "Submitted", marks: null, feedback: null, submittedAt: "2025-08-19" },
    { id: 7, assignmentId: 5, assignmentTitle: "CIT-6109 Research Work", courseId: 3, courseName: "CIT-5109: Natural Language Processing", studentId: 9, studentName: "Partha Bhakta", status: "Graded", marks: 88, feedback: "Thorough analysis. Good references.", submittedAt: "2025-08-14" },
];

export const appSettings: AppSetting[] = [
    { key: "site_name", value: "eClassroomPro", description: "The display name of the application", category: "General" },
    { key: "max_file_size_mb", value: "10", description: "Maximum file upload size in MB", category: "General" },
    { key: "allowed_file_types", value: "pdf,doc,docx,zip,txt", description: "Comma-separated list of allowed file types", category: "General" },
    { key: "email_notifications_enabled", value: "true", description: "Enable email notifications for assignments", category: "Notifications" },
    { key: "due_date_reminder_hours", value: "24", description: "Hours before deadline to send reminder", category: "Notifications" },
    { key: "grade_notification_enabled", value: "true", description: "Notify students when graded", category: "Notifications" },
    { key: "max_marks_default", value: "100", description: "Default maximum marks for assignments", category: "Grading" },
    { key: "allow_late_submission", value: "false", description: "Allow submissions after deadline", category: "Grading" },
    { key: "late_submission_penalty_percent", value: "10", description: "Percentage penalty for late submissions", category: "Grading" },
    { key: "session_timeout_minutes", value: "60", description: "Session timeout in minutes", category: "Security" },
    { key: "password_min_length", value: "8", description: "Minimum password length", category: "Security" },
    { key: "enable_two_factor_auth", value: "false", description: "Require 2FA for all users", category: "Security" },
];

export function getAdminStats() {
    return {
        totalUsers: adminUsers.length,
        activeUsers: adminUsers.filter((u) => u.isActive).length,
        totalTeachers: adminUsers.filter((u) => u.role === "Teacher").length,
        totalStudents: adminUsers.filter((u) => u.role === "Student").length,
        totalCourses: adminCourses.length,
        activeCourses: adminCourses.filter((c) => c.isActive).length,
        totalAssignments: adminAssignments.length,
        publishedAssignments: adminAssignments.filter((a) => a.status === "Published").length,
        totalSubmissions: adminSubmissions.length,
        gradedSubmissions: adminSubmissions.filter((s) => s.status === "Graded").length,
        pendingSubmissions: adminSubmissions.filter((s) => s.status === "Submitted").length,
    };
}