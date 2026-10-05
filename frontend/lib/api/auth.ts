import { apiFetch } from "./client";
import type { InstructorDetails, InstructorLink, LearnerDetails } from "./users";

export interface LoginResponse {
    token: string;
    accessToken: string;
    accessTokenExpiresAtUtc: string;
    refreshToken: string;
    email: string;
    name: string;
    role: string;
}

export interface MeResponse {
    id: number;
    name: string;
    email: string;
    role: string;
    isActive?: boolean;
    learnerDetails?: LearnerDetails;
    instructorDetails?: InstructorDetails;
    studentDetails?: LearnerDetails;
    teacherDetails?: InstructorDetails;
}

export interface SignupResponse {
    id: number;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAtUtc: string;
}

export function loginRequest(email: string, password: string): Promise<LoginResponse> {
    return apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        auth: false,
    });
}

export function signupRequest(
    firstName: string,
    lastName: string,
    email: string,
    password: string
): Promise<SignupResponse> {
    return apiFetch<SignupResponse>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
            firstName,
            lastName,
            name: `${firstName} ${lastName}`.trim(),
            email,
            password,
        }),
        auth: false,
    });
}

export function getMeRequest(): Promise<MeResponse> {
    return apiFetch<MeResponse>("/api/auth/me", { method: "GET" });
}

export function logoutRequest(): Promise<void> {
    return apiFetch<void>(`/api/auth/logout`, { method: "POST" });
}

export interface VerifyInviteResponse {
    valid: boolean;
    role: string;
    email?: string;
}

export interface AcceptInvitePayload {
    token: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    professionalHeadline?: string;
    shortBio?: string;
    timezone: string;
    avatar?: string | null;
    links?: InstructorLink[];
}

export function verifyInviteRequest(token: string): Promise<VerifyInviteResponse> {
    return apiFetch<VerifyInviteResponse>(`/api/auth/invitation?token=${encodeURIComponent(token)}`, {
        method: "GET",
        auth: false,
    });
}

export function acceptInviteRequest(payload: AcceptInvitePayload): Promise<LoginResponse> {
    return apiFetch<LoginResponse>("/api/auth/accept-invite", {
        method: "POST",
        body: JSON.stringify(payload),
        auth: false,
    });
}

export { setPasswordRequest, type SetPasswordResponse } from "./users";