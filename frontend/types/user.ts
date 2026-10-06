import type { LearnerDetails, InstructorDetails, CoordinatorDetails } from "@/lib/api/users";

export const ROLE_STYLES: Record<"Admin" | "Instructor" | "Learner" | "Coordinator", string> = {
    Admin: "bg-[#fce8e6] text-[#c5221f]",
    Instructor: "bg-[#fef7e0] text-[#b06000]",
    Learner: "bg-[#e6f4ea] text-[#137333]",
    Coordinator: "bg-[#e8f0fe] text-[#1a73e8]",
};

export const ROLE_LABELS: Record<"Admin" | "Instructor" | "Learner" | "Coordinator", string> = {
    Admin: "Admin",
    Instructor: "Instructor",
    Learner: "Learner",
    Coordinator: "Co-ordinator",
};

export interface CurrentUser {
    id?: number;
    name: string;
    email: string;
    role: "Admin" | "Instructor" | "Learner" | "Coordinator";
    avatarClass: string;
    avatar?: string;
    timezone?: string;
    learnerDetails?: LearnerDetails;
    instructorDetails?: InstructorDetails;
    studentDetails?: LearnerDetails;
    teacherDetails?: InstructorDetails;
    coordinatorDetails?: CoordinatorDetails;
}

/** Normalize the role string coming from the API. */
export function mapRole(role: string): "Admin" | "Instructor" | "Learner" | "Coordinator" {
    if (role === "Admin") return "Admin";
    if (role === "Instructor" || role === "Teacher") return "Instructor";
    if (role === "Coordinator" || role === "Co-ordinator") return "Coordinator";
    if (role === "Learner" || role === "Student") return "Learner";
    return "Learner";
}

/** Format the role for user-facing display (e.g. Co-ordinator). */
export function formatRole(role?: string): string {
    if (!role) return "Learner";
    if (role === "Coordinator" || role === "Co-ordinator") return "Co-ordinator";
    if (role === "Instructor" || role === "Teacher") return "Instructor";
    if (role === "Admin") return "Admin";
    if (role === "Learner" || role === "Student") return "Learner";
    return role;
}

/** Derive the avatar background from the role. */
export function avatarClassFor(role: string): string {
    switch (role) {
        case "Admin":
            return "bg-[#c5221f]";
        case "Instructor":
        case "Teacher":
            return "bg-amber-800";
        case "Coordinator":
        case "Co-ordinator":
            return "bg-blue-600";
        case "Learner":
        case "Student":
            return "bg-purple-800";
        default:
            return "bg-gray-600";
    }
}

export const currentUser: CurrentUser = {
    name: "Admin User",
    email: "admin@coursedesk.com",
    role: "Admin",
    avatarClass: "bg-[#c5221f]",
};

export interface Address {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}

export type ProgramType =
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

export interface LearnerProfile {
    fullName: string;
    fathersName: string;
    mothersName: string;
    dateOfBirth: string;
    mobile: string;
    nationality: string;
    learnerId: string;
    studentId?: string;
    regNo: string;
    department: string;
    currentProgram: ProgramType;
    session: string;
    semesterSession?: string;
    level: number;
    semester: number;
    permanentAddress: Address;
}

export type StudentProfile = LearnerProfile;
