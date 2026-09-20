import { apiFetch } from "./client";

export interface UserAddress {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
}

export interface LearnerDetails {
    fathersName?: string;
    mothersName?: string;
    dateOfBirth?: string;
    mobile?: string;
    nationality?: string;
    learnerId?: string;
    studentId?: string;
    regNo?: string;
    department?: string;
    currentProgram?: string;
    session?: string;
    semesterSession?: string;
    address?: UserAddress;
}
export type StudentDetails = LearnerDetails;

export interface InstructorDetails {
    instructorId?: string;
    teacherId?: string;
    designation?: string;
    department?: string;
}
export type TeacherDetails = InstructorDetails;

export interface UserDto {
    id: number;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAtUtc: string;
    learnerDetails?: LearnerDetails;
    instructorDetails?: InstructorDetails;
    studentDetails?: LearnerDetails;
    teacherDetails?: InstructorDetails;
}

export interface CreateUserPayload {
    name: string;
    email: string;
    password: string;
    role: string;
    learnerDetails?: LearnerDetails;
    instructorDetails?: InstructorDetails;
    studentDetails?: LearnerDetails;
    teacherDetails?: InstructorDetails;
}

export interface UpdateUserPayload {
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    password?: string;
    learnerDetails?: LearnerDetails;
    instructorDetails?: InstructorDetails;
    studentDetails?: LearnerDetails;
    teacherDetails?: InstructorDetails;
}

export function getUsersRequest(): Promise<UserDto[]> {
    return apiFetch<UserDto[]>("/api/users", { method: "GET" });
}

export function createUserRequest(payload: CreateUserPayload): Promise<UserDto> {
    return apiFetch<UserDto>("/api/users", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function updateUserRequest(id: number, payload: UpdateUserPayload): Promise<void> {
    return apiFetch<void>(`/api/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export function deleteUserRequest(id: number): Promise<void> {
    return apiFetch<void>(`/api/users/${id}`, { method: "DELETE" });
}