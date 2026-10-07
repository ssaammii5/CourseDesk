import { apiFetch } from "./client";

export interface AppSettingDto {
    key: string;
    value: string;
    description: string;
    category: string;
}

export interface UpsertAppSettingPayload {
    key: string;
    value: string;
    description?: string;
    category?: string;
}

export interface SystemHealthDto {
    totalCourses: number;
    totalAssignments: number;
    totalSubmissions: number;
    totalLearners: number;
    totalInstructors: number;
    estimatedStorageMb: number;
    storageQuotaMb: number;
    status: string;
    databaseStatus: string;
}

export interface SystemActivityDto {
    id: number | string;
    action: string;
    details: string;
    actor: string;
    timestamp: string;
    category: string;
}

export function getAppSettingsRequest(): Promise<AppSettingDto[]> {
    return apiFetch<AppSettingDto[]>("/api/app-settings", { method: "GET" });
}

export function upsertAppSettingRequest(payload: UpsertAppSettingPayload): Promise<AppSettingDto> {
    return apiFetch<AppSettingDto>("/api/app-settings", {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export function batchUpsertAppSettingsRequest(payload: UpsertAppSettingPayload[]): Promise<AppSettingDto[]> {
    return apiFetch<AppSettingDto[]>("/api/app-settings/batch", {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export function getSystemHealthRequest(): Promise<SystemHealthDto> {
    return apiFetch<SystemHealthDto>("/api/app-settings/health", { method: "GET" });
}

export function getSystemActivitiesRequest(): Promise<SystemActivityDto[]> {
    return apiFetch<SystemActivityDto[]>("/api/app-settings/activities", { method: "GET" });
}