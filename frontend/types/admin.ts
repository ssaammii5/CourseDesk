export interface LearnerAddress {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
}
export type StudentAddress = LearnerAddress;

export type LearnerProgramType =
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
export type StudentProgramType = LearnerProgramType;

export interface LearnerDetails {
    firstName?: string;
    lastName?: string;
    email?: string;
    avatar?: string;
    shortBio?: string;
    timezone?: string;
    links?: InstructorLink[];
    fathersName?: string;
    mothersName?: string;
    dateOfBirth?: string;
    mobile?: string;
    nationality?: string;
    learnerId?: string;
    studentId?: string;
    regNo?: string;
    headline?: string;
    organization?: string;
    bio?: string;
    address?: LearnerAddress;
}
export type StudentDetails = LearnerDetails;

export type InstructorDesignation =
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
export type TeacherDesignation = InstructorDesignation;

import type { CoordinatorDetails, InstructorDetails, InstructorLink, TeacherDetails } from "@/lib/api/users";
export type { CoordinatorDetails, InstructorDetails, InstructorLink, TeacherDetails };

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
    role: "Admin" | "Instructor" | "Learner" | "Teacher" | "Student" | "Coordinator";
    isActive: boolean;
    emailVerified?: boolean;
    createdAt: string;
    learnerDetails?: LearnerDetails;
    instructorDetails?: InstructorDetails;
    studentDetails?: LearnerDetails;
    teacherDetails?: InstructorDetails;
    coordinatorDetails?: CoordinatorDetails;
}

export interface CourseCatalogItem {
    name: string;
    program: string;
    department: string;
}

export interface AdminCourse {
    id: number;
    name: string;
    program?: string;
    department: string;
    instructorIds: number[];
    teacherIds?: number[];
    learnerIds: number[];
    studentIds?: number[];
    session?: string;
    isActive: boolean;
    tags?: string[];
}

export interface AdminAssignment {
    id: number;
    code?: string;
    courseId: number;
    courseCode?: string;
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
    code?: string;
    assignmentId: number;
    assignmentCode?: string;
    assignmentTitle: string;
    courseId: number;
    courseCode?: string;
    courseName: string;
    learnerId: number;
    learnerName: string;
    studentId?: number;
    studentName?: string;
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
