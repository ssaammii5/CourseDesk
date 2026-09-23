import { apiFetch } from "./client";

export interface CommentDto {
    id: number;
    assignmentId: number;
    userId: number;
    userName: string | null;
    userEmail: string | null;
    userRole: string | null;
    learnerId: number | null;
    learnerName: string | null;
    content: string;
    isPrivate: boolean;
    createdAtUtc: string;
    updatedAtUtc: string | null;
}

export interface CreateCommentPayload {
    content: string;
    isPrivate?: boolean;
    learnerId?: number | null;
}

export function getAssignmentCommentsRequest(
    assignmentId: number,
    isPrivate: boolean = false,
    learnerId?: number | null
): Promise<CommentDto[]> {
    const params = new URLSearchParams();
    if (isPrivate) {
        params.set("isPrivate", "true");
        if (learnerId !== undefined && learnerId !== null) {
            params.set("learnerId", String(learnerId));
        }
    } else {
        params.set("isPrivate", "false");
    }

    const qs = params.toString();
    const url = `/api/assignments/${assignmentId}/comments${qs ? `?${qs}` : ""}`;
    return apiFetch<CommentDto[]>(url, { method: "GET" });
}

export function createAssignmentCommentRequest(
    assignmentId: number,
    payload: CreateCommentPayload
): Promise<CommentDto> {
    return apiFetch<CommentDto>(`/api/assignments/${assignmentId}/comments`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function deleteCommentRequest(commentId: number): Promise<void> {
    return apiFetch<void>(`/api/comments/${commentId}`, { method: "DELETE" });
}
