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
    headline?: string;
    organization?: string;
    bio?: string;
    address?: UserAddress;
}
export type StudentDetails = LearnerDetails;

export interface InstructorLink {
    title: string;
    url: string;
}

export interface InstructorDetails {
    instructorId?: string;
    teacherId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    avatar?: string;
    professionalHeadline?: string;
    headline?: string;
    timezone?: string;
    links?: InstructorLink[];
    organization?: string;
    bio?: string;
}
export type TeacherDetails = InstructorDetails;

export interface UserDto {
    id: number;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAtUtc: string;
    inviteToken?: string;
    learnerDetails?: LearnerDetails;
    instructorDetails?: InstructorDetails;
    studentDetails?: LearnerDetails;
    teacherDetails?: InstructorDetails;
}

export interface CreateUserPayload {
    name: string;
    email: string;
    password?: string;
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

export interface SetPasswordResponse {
    message: string;
}

export function setPasswordRequest(token: string, password: string, email: string): Promise<SetPasswordResponse> {
    return apiFetch<SetPasswordResponse>("/api/auth/set-password", {
        method: "POST",
        body: JSON.stringify({ token, password, email }),
        auth: false,
    });
}

export function uploadAvatarRequest(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<{ url: string }>("/api/users/avatar", {
        method: "POST",
        body: formData,
    });
}

export interface PendingInvitation {
    id: number;
    email: string;
    role: string;
    createdAtUtc: string;
    expiresAtUtc: string;
    inviteToken?: string;
}

export function inviteInstructorRequest(email: string): Promise<PendingInvitation> {
    return apiFetch<PendingInvitation>("/api/instructors/invite", {
        method: "POST",
        body: JSON.stringify({ email }),
    });
}

export function getPendingInvitationsRequest(): Promise<PendingInvitation[]> {
    return apiFetch<PendingInvitation[]>("/api/instructors/invitations", {
        method: "GET",
    });
}

export function revokeInvitationRequest(userId: number): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/api/instructors/invitations/${userId}`, {
        method: "DELETE",
    });
}