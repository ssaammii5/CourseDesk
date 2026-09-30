import { apiFetch } from "./client";

export interface AssignmentDto {
    id: number;
    courseId: number;
    courseName: string | null;
    subject: string | null;
    program: string | null;
    department: string | null;
    session: string | null;
    sessionId?: number | null;
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
    learnerCount?: number;
    studentCount?: number;
    mySubmissionStatus: string | null; // "Assigned" | "Submitted" | "Graded" (learners only)
    assignMode?: "all" | "selective" | "exclude";
    targetLearnerIds?: number[];
    allowLateSubmissions?: boolean;
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
    sessionId?: number | null;
    assignMode?: "all" | "selective" | "exclude";
    targetLearnerIds?: number[];
    allowLateSubmissions?: boolean;
}

export interface UpdateAssignmentPayload {
    title: string;
    description: string;
    topic?: string;
    kind?: string;
    deadlineUtc: string;
    maxMarks: number;
    sessionId?: number | null;
    assignMode?: "all" | "selective" | "exclude";
    targetLearnerIds?: number[];
    allowLateSubmissions?: boolean;
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

export function renameCourseTopicRequest(
    courseId: number,
    oldName: string,
    newName: string,
): Promise<{ success: boolean; old_name: string; new_name: string; updated_assignments_count: number }> {
    return apiFetch(`/api/courses/${courseId}/topics/rename`, {
        method: "PUT",
        body: JSON.stringify({ oldName, newName }),
    });
}

export function deleteCourseTopicRequest(
    courseId: number,
    topicName: string,
    fallbackTopic = "General",
): Promise<{ success: boolean; deleted_topic: string; fallback_topic: string }> {
    return apiFetch(`/api/courses/${courseId}/topics/delete`, {
        method: "POST",
        body: JSON.stringify({ topicName, fallbackTopic }),
    });
}