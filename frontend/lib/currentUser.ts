import type { StudentDetails, TeacherDetails } from "./api/users";

// lib/currentUser.ts
export const ROLE_STYLES: Record<"Admin" | "Teacher" | "Student", string> = {
    Admin: "bg-[#fce8e6] text-[#c5221f]",
    Teacher: "bg-[#fef7e0] text-[#b06000]",
    Student: "bg-[#e6f4ea] text-[#137333]",
};

export interface CurrentUser {
    id?: number;
    name: string;
    email: string;
    role: keyof typeof ROLE_STYLES;
    avatarClass: string;
    studentDetails?: StudentDetails;
    teacherDetails?: TeacherDetails;
}

/** Normalize the role string coming from the API. */
export function mapRole(role: string): CurrentUser["role"] {
    if (role === "Admin" || role === "Teacher" || role === "Student") {
        return role;
    }
    return "Student";
}

/** Derive the avatar background from the role (matches the mock styling). */
export function avatarClassFor(role: string): string {
    switch (role) {
        case "Admin":
            return "bg-[#c5221f]";
        case "Teacher":
            return "bg-amber-800";
        case "Student":
            return "bg-purple-800";
        default:
            return "bg-gray-600";
    }
}

/**
 * Fallback user only. The real signed-in user is provided by AuthProvider /
 * useAuth(). A few components still reference this as a prop default.
 */
export const currentUser: CurrentUser = {
    name: "Admin User",
    email: "admin@eclassroompro.com",
    role: "Admin",
    avatarClass: "bg-[#c5221f]",
};

// ─── Student Profile (unchanged) ───
export interface Address {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}

export type ProgramType =
    | "Undergraduate"
    | "Postgraduate"
    | "Post Graduate Diploma"
    | "M.Phil"
    | "PhD";

export interface StudentProfile {
    fullName: string;
    fathersName: string;
    mothersName: string;
    dateOfBirth: string;
    mobile: string;
    nationality: string;
    studentId: string;
    regNo: string;
    department: string;
    currentProgram: ProgramType;
    session: string;
    semesterSession?: string;
    level: number;
    semester: number;
    permanentAddress: Address;
}

export const currentStudentProfile: StudentProfile = {
    fullName: "Md. Samiur Rahman",
    fathersName: "Father Name Here",
    mothersName: "Mother Name Here",
    dateOfBirth: "2002-05-15",
    mobile: "+880 1712-345678",
    nationality: "Bangladeshi",
    studentId: "201-15-0000",
    regNo: "1234567890",
    department: "Computer Science and Engineering",
    currentProgram: "Undergraduate",
    session: "2021-2022",
    level: 1,
    semester: 1,
    permanentAddress: {
        street: "House 12, Road 5, Dhanmondi",
        city: "Dhaka",
        state: "Dhaka Division",
        zip: "1205",
        country: "Bangladesh",
    },
};