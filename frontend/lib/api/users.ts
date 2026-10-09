import { apiFetch } from "./client";

export interface UserAddress {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
}

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

export interface CoordinatorDetails {
    coordinatorId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    avatar?: string;
    phone?: string;
    shortBio?: string;
    timezone?: string;
    links?: InstructorLink[];
}

export interface UserDto {
    id: number;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    emailVerified?: boolean;
    createdAtUtc: string;
    avatar?: string;
    timezone?: string;
    inviteToken?: string;
    learnerDetails?: LearnerDetails;
    instructorDetails?: InstructorDetails;
    studentDetails?: LearnerDetails;
    teacherDetails?: InstructorDetails;
    coordinatorDetails?: CoordinatorDetails;
}

export interface CreateUserPayload {
    name: string;
    email: string;
    password?: string;
    role: string;
    timezone?: string;
    learnerDetails?: LearnerDetails;
    instructorDetails?: InstructorDetails;
    studentDetails?: LearnerDetails;
    teacherDetails?: InstructorDetails;
    coordinatorDetails?: CoordinatorDetails;
}

export interface UpdateUserPayload {
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    password?: string;
    timezone?: string;
    learnerDetails?: LearnerDetails;
    instructorDetails?: InstructorDetails;
    studentDetails?: LearnerDetails;
    teacherDetails?: InstructorDetails;
    coordinatorDetails?: CoordinatorDetails;
}

export interface GetUsersParams {
    role?: string;
    limit?: number;
    offset?: number;
}

export function getUsersRequest(params?: GetUsersParams): Promise<UserDto[]> {
    const query = new URLSearchParams();
    if (params?.role) query.set("role", params.role);
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    const qs = query.toString();
    return apiFetch<UserDto[]>(`/api/users${qs ? `?${qs}` : ""}`, { method: "GET" });
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

export interface UpdateProfilePayload {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    timezone?: string;
    professionalHeadline?: string;
    shortBio?: string;
    links?: InstructorLink[];
    mobile?: string;
    dateOfBirth?: string;
    nationality?: string;
    fathersName?: string;
    mothersName?: string;
    regNo?: string;
    address?: UserAddress;
}

export interface ChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}

export function updateProfileRequest(payload: UpdateProfilePayload): Promise<UserDto> {
    return apiFetch<UserDto>("/api/users/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export function changePasswordRequest(payload: ChangePasswordPayload): Promise<{ message: string }> {
    return apiFetch<{ message: string }>("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify(payload),
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

export function inviteLearnerRequest(email: string): Promise<PendingInvitation> {
    return apiFetch<PendingInvitation>("/api/learners/invite", {
        method: "POST",
        body: JSON.stringify({ email }),
    });
}

export function getPendingLearnerInvitationsRequest(): Promise<PendingInvitation[]> {
    return apiFetch<PendingInvitation[]>("/api/learners/invitations", {
        method: "GET",
    });
}

export function revokeLearnerInvitationRequest(userId: number): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/api/learners/invitations/${userId}`, {
        method: "DELETE",
    });
}

export function inviteCoordinatorRequest(email: string): Promise<PendingInvitation> {
    return apiFetch<PendingInvitation>("/api/coordinators/invite", {
        method: "POST",
        body: JSON.stringify({ email }),
    });
}

export function getPendingCoordinatorInvitationsRequest(): Promise<PendingInvitation[]> {
    return apiFetch<PendingInvitation[]>("/api/coordinators/invitations", {
        method: "GET",
    });
}

export function revokeCoordinatorInvitationRequest(userId: number): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/api/coordinators/invitations/${userId}`, {
        method: "DELETE",
    });
}