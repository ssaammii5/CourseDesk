import { apiFetch } from "./client";
import type {
    SessionDto,
    CreateSessionPayload,
    UpdateSessionPayload,
    SessionMaterial,
    VideoMarker,
} from "@/types/session";

export function getCourseSessionsRequest(courseId: number): Promise<SessionDto[]> {
    return apiFetch<SessionDto[]>(`/api/sessions/course/${courseId}`, { method: "GET" });
}

export function getNextSessionRequest(courseId: number): Promise<SessionDto | null> {
    return apiFetch<SessionDto | null>(`/api/sessions/course/${courseId}/next`, {
        method: "GET",
    });
}

export function getSessionRequest(sessionId: number): Promise<SessionDto> {
    return apiFetch<SessionDto>(`/api/sessions/${sessionId}`, { method: "GET" });
}

export function createSessionRequest(payload: CreateSessionPayload): Promise<SessionDto> {
    return apiFetch<SessionDto>("/api/sessions", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function updateSessionRequest(
    sessionId: number,
    payload: UpdateSessionPayload,
): Promise<SessionDto> {
    return apiFetch<SessionDto>(`/api/sessions/${sessionId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export function deleteSessionRequest(sessionId: number): Promise<void> {
    return apiFetch<void>(`/api/sessions/${sessionId}`, { method: "DELETE" });
}

export function addSessionMaterialRequest(
    sessionId: number,
    formData: FormData,
): Promise<SessionMaterial> {
    return apiFetch<SessionMaterial>(`/api/sessions/${sessionId}/materials`, {
        method: "POST",
        body: formData,
    });
}

export function deleteSessionMaterialRequest(
    sessionId: number,
    materialId: number,
): Promise<void> {
    return apiFetch<void>(`/api/sessions/${sessionId}/materials/${materialId}`, {
        method: "DELETE",
    });
}

export function addVideoMarkerRequest(
    sessionId: number,
    formData: FormData,
): Promise<VideoMarker> {
    return apiFetch<VideoMarker>(`/api/sessions/${sessionId}/markers`, {
        method: "POST",
        body: formData,
    });
}

export function deleteVideoMarkerRequest(
    sessionId: number,
    markerId: number,
): Promise<void> {
    return apiFetch<void>(`/api/sessions/${sessionId}/markers/${markerId}`, {
        method: "DELETE",
    });
}