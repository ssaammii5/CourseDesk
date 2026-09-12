import { apiFetch } from "./client";

export interface UserAddress {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
}

export interface StudentDetails {
    fathersName?: string;
    mothersName?: string;
    dateOfBirth?: string;
    mobile?: string;
    nationality?: string;
    studentId?: string;
    regNo?: string;
    department?: string;
    currentProgram?: string;
    session?: string;
    semesterSession?: string;
    address?: UserAddress;
}

export interface TeacherDetails {
    teacherId?: string;
    designation?: string;
    department?: string;
}

export interface UserDto {
    id: number;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAtUtc: string;
    studentDetails?: StudentDetails;
    teacherDetails?: TeacherDetails;
}

export interface CreateUserPayload {
    name: string;
    email: string;
    password: string;
    role: string;
    studentDetails?: StudentDetails;
    teacherDetails?: TeacherDetails;
}

export interface UpdateUserPayload {
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    password?: string;
    studentDetails?: StudentDetails;
    teacherDetails?: TeacherDetails;
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