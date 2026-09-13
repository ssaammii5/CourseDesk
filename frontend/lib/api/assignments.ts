import { apiFetch } from "./client";

export interface AssignmentDto {
    id: number;
    courseId: number;
    courseName: string | null;
    subject: string | null;
    program: string | null;
    department: string | null;
    session: string | null;
    title: string;
    description: string;
    topic: string;
    kind: string; // "Assignment" | "Material" | "Quiz"
    deadlineUtc: string;
    maxMarks: number;
    status: string;
    createdById: number;
    createdByName: string | null;
    createdAtUtc: string;
    submissionCount: number;
    turnedInCount?: number;
    gradedCount?: number;
    assignedCount?: number;
    studentCount?: number;
    mySubmissionStatus: string | null; // "Assigned" | "Submitted" | "Graded" (students only)
    attachments?: AssignmentAttachmentDto[];
}

export interface CreateAssignmentPayload {
    courseId: number;
    title: string;
    description: string;
    topic?: string;
    kind?: string;
    deadlineUtc: string;
    maxMarks: number;
}

export interface UpdateAssignmentPayload {
    title: string;
    description: string;
    topic?: string;
    kind?: string;
    deadlineUtc: string;
    maxMarks: number;
}

export interface AssignmentAttachmentDto {
    id: number;
    fileName: string;
    fileType: string;
    fileSize: string;
    uploadedAtUtc: string;
    kind: string;
    url: string | null;
}

export function getAssignmentsRequest(): Promise<AssignmentDto[]> {
    return apiFetch<AssignmentDto[]>("/api/assignments", { method: "GET" });
}

export function getAssignmentRequest(id: number): Promise<AssignmentDto> {
    return apiFetch<AssignmentDto>(`/api/assignments/${id}`, { method: "GET" });
}

export function getCourseAssignmentsRequest(courseId: number): Promise<AssignmentDto[]> {
    return apiFetch<AssignmentDto[]>(`/api/courses/${courseId}/assignments`, { method: "GET" });
}

export function createAssignmentRequest(payload: CreateAssignmentPayload): Promise<{ id: number }> {
    return apiFetch<{ id: number }>("/api/assignments", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function updateAssignmentRequest(id: number, payload: UpdateAssignmentPayload): Promise<void> {
    return apiFetch<void>(`/api/assignments/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export function deleteAssignmentRequest(id: number): Promise<void> {
    return apiFetch<void>(`/api/assignments/${id}`, { method: "DELETE" });
}

export function publishAssignmentRequest(id: number): Promise<void> {
    return apiFetch<void>(`/api/assignments/${id}/publish`, { method: "POST" });
}


export function uploadAssignmentAttachmentRequest(assignmentId: number, formData: FormData): Promise<AssignmentAttachmentDto> {
    return apiFetch<AssignmentAttachmentDto>(`/api/assignments/${assignmentId}/attachments`, {
        method: "POST",
        body: formData,
    });
}

export function deleteAssignmentAttachmentRequest(assignmentId: number, attachmentId: number): Promise<void> {
    return apiFetch<void>(`/api/assignments/${assignmentId}/attachments/${attachmentId}`, { method: "DELETE" });
}