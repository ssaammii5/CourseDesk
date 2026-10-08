import { apiFetch } from "./client";

export interface AppSettingDto {
    key: string;
    value: string;
    description: string;
    category: string;
}

export interface PublicPlatformSettingsDto {
    platformName: string;
    siteName: string;
    platformTagline: string;
    brandLogoLight: string;
    brandLogoDark: string;
    brandFavicon: string;
    maintenanceMode: boolean;
    maintenanceBannerMessage: string;
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

export function getPublicPlatformSettingsRequest(): Promise<PublicPlatformSettingsDto> {
    return apiFetch<PublicPlatformSettingsDto>("/api/app-settings/public", {
        method: "GET",
        auth: false,
    });
}

export function uploadBrandingAssetRequest(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<{ url: string }>("/api/app-settings/upload-asset", {
        method: "POST",
        body: formData,
    });
}