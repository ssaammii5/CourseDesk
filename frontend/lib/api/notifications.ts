import { apiFetch } from "./client";
import type {
    NotificationItem,
    NotificationListResponse,
    NotificationPreferences,
} from "@/types";

export function getNotificationsRequest(
    limit: number = 50
): Promise<NotificationListResponse> {
    return apiFetch<NotificationListResponse>(`/api/notifications?limit=${limit}`, {
        method: "GET",
    });
}

export function markNotificationReadRequest(
    id: number
): Promise<NotificationItem> {
    return apiFetch<NotificationItem>(`/api/notifications/${id}/read`, {
        method: "PATCH",
    });
}

export function markAllNotificationsReadRequest(): Promise<{
    status: string;
    markedCount: number;
}> {
    return apiFetch<{ status: string; markedCount: number }>(
        "/api/notifications/read-all",
        {
            method: "POST",
        }
    );
}

export function clearAllNotificationsRequest(): Promise<void> {
    return apiFetch<void>("/api/notifications/clear-all", {
        method: "DELETE",
    });
}

export function deleteNotificationRequest(id: number): Promise<void> {
    return apiFetch<void>(`/api/notifications/${id}`, {
        method: "DELETE",
    });
}

export function getNotificationPreferencesRequest(): Promise<NotificationPreferences> {
    return apiFetch<NotificationPreferences>("/api/notifications/preferences", {
        method: "GET",
    });
}

export function updateNotificationPreferencesRequest(
    payload: NotificationPreferences
): Promise<NotificationPreferences> {
    return apiFetch<NotificationPreferences>("/api/notifications/preferences", {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}
