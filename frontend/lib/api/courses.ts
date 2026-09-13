import { apiFetch } from "./client";

export interface CourseDto {
    id: number;
    name: string;
    subject: string;
    program: string;
    department: string;
    session: string;
    isActive: boolean;
    teacherId: number | null;
    teacherName: string | null;
    teacherIds: number[];
    teacherNames: string[];
    studentIds: number[];
    studentCount: number;
    meetingProvider: string;
    meetingUrl: string | null;
    meetingId: string;
    meetingPasscode: string;
    scheduleNotes: string;
}

export interface CoursePayload {
    name: string;
    subject?: string;
    program: string;
    department: string;
    session: string;
    isActive: boolean;
    teacherIds: number[];
    studentIds: number[];
    meetingProvider?: string;
    meetingUrl?: string | null;
    meetingId?: string;
    meetingPasscode?: string;
    scheduleNotes?: string;
}

export interface CoursePersonDto {
    id: number;
    name: string;
    role: string;
    email: string;
}

export interface CoursePeopleDto {
    teachers: CoursePersonDto[];
    students: CoursePersonDto[];
}

export function getCoursesRequest(): Promise<CourseDto[]> {
    return apiFetch<CourseDto[]>("/api/courses", { method: "GET" });
}

export function getCourseRequest(id: number): Promise<CourseDto> {
    return apiFetch<CourseDto>(`/api/courses/${id}`, { method: "GET" });
}

export function getMyCoursesRequest(): Promise<CourseDto[]> {
    return apiFetch<CourseDto[]>("/api/courses/my", { method: "GET" });
}

export function getCoursePeopleRequest(courseId: number): Promise<CoursePeopleDto> {
    return apiFetch<CoursePeopleDto>(`/api/courses/${courseId}/people`, { method: "GET" });
}

export function createCourseRequest(payload: CoursePayload): Promise<CourseDto> {
    return apiFetch<CourseDto>("/api/courses", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function updateCourseRequest(id: number, payload: CoursePayload): Promise<void> {
    return apiFetch<void>(`/api/courses/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export function deleteCourseRequest(id: number): Promise<void> {
    return apiFetch<void>(`/api/courses/${id}`, { method: "DELETE" });
}