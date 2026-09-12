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

export function getAppSettingsRequest(): Promise<AppSettingDto[]> {
    return apiFetch<AppSettingDto[]>("/api/app-settings", { method: "GET" });
}

export function upsertAppSettingRequest(payload: UpsertAppSettingPayload): Promise<AppSettingDto> {
    return apiFetch<AppSettingDto>("/api/app-settings", {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}