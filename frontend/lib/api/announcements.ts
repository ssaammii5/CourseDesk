import { apiFetch } from "./client";
import type {
    AnnouncementAttachmentDto,
    AnnouncementCommentDto,
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

export function getAnnouncementCommentsRequest(
    announcementId: number,
): Promise<AnnouncementCommentDto[]> {
    return apiFetch<AnnouncementCommentDto[]>(`/api/announcements/${announcementId}/comments`, {
        method: "GET",
    });
}

export function createAnnouncementCommentRequest(
    announcementId: number,
    content: string,
): Promise<AnnouncementCommentDto> {
    return apiFetch<AnnouncementCommentDto>(`/api/announcements/${announcementId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content }),
    });
}

export function deleteAnnouncementCommentRequest(commentId: number): Promise<void> {
    return apiFetch<void>(`/api/announcements/comments/${commentId}`, {
        method: "DELETE",
    });
}

export function uploadAnnouncementAttachmentRequest(
    announcementId: number,
    formData: FormData,
): Promise<AnnouncementAttachmentDto> {
    return apiFetch<AnnouncementAttachmentDto>(`/api/announcements/${announcementId}/attachments`, {
        method: "POST",
        body: formData,
    });
}

export function deleteAnnouncementAttachmentRequest(
    announcementId: number,
    attachmentId: number,
): Promise<void> {
    return apiFetch<void>(`/api/announcements/${announcementId}/attachments/${attachmentId}`, {
        method: "DELETE",
    });
}