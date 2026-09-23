import { apiFetch, API_URL } from "./client";
import { getAccessToken } from "@/lib/auth/session";
import type {
    NotificationItem,
    NotificationListResponse,
    NotificationPreferences,
} from "@/types";

export function subscribeNotificationsStream(
    onNotification: (item: NotificationItem) => void,
    onConnected?: () => void
): () => void {
    if (typeof window === "undefined") {
        return () => {};
    }

    let isDisposed = false;
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let reconnectDelay = 1000;

    const connect = () => {
        if (isDisposed) return;

        const token = getAccessToken();
        if (!token) return;

        const url = `${API_URL}/api/notifications/stream?token=${encodeURIComponent(token)}`;
        eventSource = new EventSource(url);

        eventSource.addEventListener("connected", () => {
            reconnectDelay = 1000;
            onConnected?.();
        });

        eventSource.addEventListener("notification", (event: MessageEvent) => {
            try {
                const item = JSON.parse(event.data) as NotificationItem;
                onNotification(item);
            } catch {
                // Ignore malformed payloads
            }
        });

        eventSource.onerror = () => {
            if (eventSource) {
                eventSource.close();
                eventSource = null;
            }
            if (isDisposed) return;

            reconnectTimeout = setTimeout(() => {
                reconnectDelay = Math.min(reconnectDelay * 1.5, 15000);
                connect();
            }, reconnectDelay);
        };
    };

    connect();

    return () => {
        isDisposed = true;
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
        }
        if (eventSource) {
            eventSource.close();
            eventSource = null;
        }
    };
}

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
