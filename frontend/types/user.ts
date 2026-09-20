import type { LearnerDetails, InstructorDetails } from "@/lib/api/users";

export const ROLE_STYLES: Record<"Admin" | "Instructor" | "Learner", string> = {
    Admin: "bg-[#fce8e6] text-[#c5221f]",
    Instructor: "bg-[#fef7e0] text-[#b06000]",
    Learner: "bg-[#e6f4ea] text-[#137333]",
};

export const ROLE_LABELS: Record<"Admin" | "Instructor" | "Learner", string> = {
    Admin: "Admin",
    Instructor: "Instructor",
    Learner: "Learner",
};

export interface CurrentUser {
    id?: number;
    name: string;
    email: string;
    role: "Admin" | "Instructor" | "Learner";
    avatarClass: string;
    learnerDetails?: LearnerDetails;
    instructorDetails?: InstructorDetails;
    studentDetails?: LearnerDetails;
    teacherDetails?: InstructorDetails;
}

/** Normalize the role string coming from the API. */
export function mapRole(role: string): "Admin" | "Instructor" | "Learner" {
    if (role === "Admin") return "Admin";
    if (role === "Instructor" || role === "Teacher") return "Instructor";
    if (role === "Learner" || role === "Student") return "Learner";
    return "Learner";
}

/** Derive the avatar background from the role. */
export function avatarClassFor(role: string): string {
    switch (role) {
        case "Admin":
            return "bg-[#c5221f]";
        case "Instructor":
        case "Teacher":
            return "bg-amber-800";
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
