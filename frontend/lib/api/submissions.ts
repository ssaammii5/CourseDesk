import { apiFetch } from "./client";

export interface SubmissionAttachmentDto {
    id: number;
    fileName: string;
    fileType: string;
    fileSize: string;
    uploadedAtUtc: string;
    kind: string;
    url: string | null;
}

export interface SubmissionActivityDto {
    id: number;
    action: string;
    actorName: string;
    timestampUtc: string;
}

export interface SubmissionDto {
    id: number;
    assignmentId: number;
    assignmentTitle: string | null;
    courseId: number;
    courseName: string | null;
    program: string | null;
    department: string | null;
    session: string | null;
    studentId: number;
    studentName: string | null;
    studentEmail: string | null;
    studentAcademicId: string | null;
    studentDepartment: string | null;
    studentProgram: string | null;
    answer: string;
    status: string;
    marks: number | null;
    feedback: string | null;
    submittedAtUtc: string | null;
    createdAtUtc: string;
    gradedById: number | null;
    gradedByName: string | null;
    gradedAtUtc: string | null;
    isLate: boolean;
    maxMarks: number;
    attachments: SubmissionAttachmentDto[];
    activities: SubmissionActivityDto[];
    privateNote?: string;
    externalUrl?: string | null;
}

export interface GradeSubmissionPayload {
    marks: number;
    feedback?: string | null;
}

export interface SubmitAssignmentPayload {
    assignmentId: number;
    answer: string;
}

export function getSubmissionsRequest(): Promise<SubmissionDto[]> {
    return apiFetch<SubmissionDto[]>("/api/submissions", { method: "GET" });
}

export function getSubmissionRequest(id: number): Promise<SubmissionDto> {
    return apiFetch<SubmissionDto>(`/api/submissions/${id}`, { method: "GET" });
}

export function getMySubmissionsRequest(): Promise<SubmissionDto[]> {
    return apiFetch<SubmissionDto[]>("/api/submissions/my", { method: "GET" });
}

export function getSubmissionsByAssignmentRequest(assignmentId: number): Promise<SubmissionDto[]> {
    return apiFetch<SubmissionDto[]>(`/api/assignments/${assignmentId}/submissions`, { method: "GET" });
}

export function submitAssignmentRequest(payload: SubmitAssignmentPayload): Promise<SubmissionDto> {
    return apiFetch<SubmissionDto>("/api/submissions", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function gradeSubmissionRequest(id: number, payload: GradeSubmissionPayload): Promise<SubmissionDto> {
    return apiFetch<SubmissionDto>(`/api/submissions/${id}/grade`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}



export function uploadSubmissionAttachmentRequest(submissionId: number, formData: FormData): Promise<SubmissionAttachmentDto> {
    return apiFetch<SubmissionAttachmentDto>(`/api/submissions/${submissionId}/attachments`, {
        method: "POST",
        body: formData,
    });
}

export function deleteSubmissionAttachmentRequest(submissionId: number, attachmentId: number): Promise<void> {
    return apiFetch<void>(`/api/submissions/${submissionId}/attachments/${attachmentId}`, { method: "DELETE" });
}

export interface DraftSubmissionPayload {
    assignmentId: number;
}

export function getOrCreateDraftSubmissionRequest(payload: DraftSubmissionPayload): Promise<SubmissionDto> {
    return apiFetch<SubmissionDto>("/api/submissions/draft", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function unsubmitSubmissionRequest(submissionId: number): Promise<SubmissionDto> {
    return apiFetch<SubmissionDto>(`/api/submissions/${submissionId}/unsubmit`, {
        method: "POST",
    });
}