import { apiFetch } from "./client";

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
}

export function loginRequest(email: string, password: string): Promise<LoginResponse> {
    return apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        auth: false,
    });
}

export function getMeRequest(): Promise<MeResponse> {
    return apiFetch<MeResponse>("/api/auth/me", { method: "GET" });
}

export function logoutRequest(): Promise<void> {
    return apiFetch<void>("/api/auth/logout", { method: "POST" });
}