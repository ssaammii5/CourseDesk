import type { StudentDetails, TeacherDetails } from "@/lib/api/users";

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

/** Derive the avatar background from the role. */
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
export const currentUser: CurrentUser = {
    name: "Admin User",
    email: "admin@eclassroompro.com",
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
