import { apiFetch } from "./client";
import type {
    AnnouncementDto,
    CreateAnnouncementPayload,
    UpdateAnnouncementPayload,
} from "@/types/session";

export function getCourseAnnouncementsRequest(
    courseId: number,
): Promise<AnnouncementDto[]> {
    return apiFetch<AnnouncementDto[]>(`/api/announcements/course/${courseId}`, {
        method: "GET",
    });
}

export function createAnnouncementRequest(
    payload: CreateAnnouncementPayload,
): Promise<AnnouncementDto> {
    return apiFetch<AnnouncementDto>("/api/announcements", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function updateAnnouncementRequest(
    announcementId: number,
    payload: UpdateAnnouncementPayload,
): Promise<AnnouncementDto> {
    return apiFetch<AnnouncementDto>(`/api/announcements/${announcementId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export function deleteAnnouncementRequest(announcementId: number): Promise<void> {
    return apiFetch<void>(`/api/announcements/${announcementId}`, { method: "DELETE" });
}