export interface StudentAddress {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
}

export type StudentProgramType =
    | "Professional Track"
    | "Foundations"
    | "Advanced Mastery"
    | "Certification Track"
    | "Self-Paced / Open"
    | "Undergraduate"
    | "Postgraduate"
    | "Post Graduate Diploma"
    | "M.Phil"
    | "PhD"
    | string;

export interface StudentDetails {
    fathersName?: string;
    mothersName?: string;
    dateOfBirth?: string;
    mobile?: string;
    nationality?: string;
    studentId?: string;
    regNo?: string;
    department?: string;
    currentProgram?: StudentProgramType;
    session?: string;
    semesterSession?: string;
    headline?: string;
    organization?: string;
    bio?: string;
    address?: StudentAddress;
}

export type TeacherDesignation =
    | "Lead Instructor"
    | "Senior Instructor"
    | "Staff Engineer"
    | "Principal Designer"
    | "Course Creator"
    | "Mentor"
    | "Professor"
    | "Associate Professor"
    | "Assistant Professor"
    | "Senior Lecturer"
    | "Lecturer"
    | string;

export interface TeacherDetails {
    teacherId?: string;
    designation?: TeacherDesignation;
    department?: string;
    headline?: string;
    organization?: string;
    bio?: string;
}

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

export interface CourseCatalogItem {
    name: string;
    program: string;
    department: string;
}

export interface AdminCourse {
    id: number;
    name: string;
    program: string;
    department: string;
    teacherIds: number[];
    studentIds: number[];
    session: string;
    isActive: boolean;
    meetingProvider?: string;
    meetingUrl?: string | null;
    meetingId?: string;
    meetingPasscode?: string;
    scheduleNotes?: string;
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
