import { apiFetch } from "./client";

export interface CourseDto {
    id: number;
    name: string;
    subject: string;
    program: string;
    department: string;
    session: string;
    isActive: boolean;
    instructorId?: number | null;
    instructorName?: string | null;
    instructorIds?: number[];
    instructorNames?: string[];
    learnerIds?: number[];
    learnerCount?: number;
    teacherId?: number | null;
    teacherName?: string | null;
    teacherIds?: number[];
    teacherNames?: string[];
    studentIds?: number[];
    studentCount?: number;
    tags?: string[];
}

export interface CoursePayload {
    name: string;
    subject?: string;
    program?: string;
    department?: string;
    session?: string;
    isActive: boolean;
    tags?: string[];
    instructorIds?: number[];
    learnerIds?: number[];
    teacherIds?: number[];
    studentIds?: number[];
}

export interface CoursePersonDto {
    id: number;
    name: string;
    role: string;
    email: string;
}

export interface CoursePeopleDto {
    instructors?: CoursePersonDto[];
    learners?: CoursePersonDto[];
    teachers?: CoursePersonDto[];
    students?: CoursePersonDto[];
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
    const bodyPayload = {
        ...payload,
        program: payload.program || "",
        department: payload.department || "",
        session: payload.session || "",
        instructorIds: payload.instructorIds || payload.teacherIds || [],
        learnerIds: payload.learnerIds || payload.studentIds || [],
    };
    return apiFetch<CourseDto>("/api/courses", {
        method: "POST",
        body: JSON.stringify(bodyPayload),
    });
}

export function updateCourseRequest(id: number, payload: CoursePayload): Promise<void> {
    const bodyPayload = {
        ...payload,
        program: payload.program || "",
        department: payload.department || "",
        session: payload.session || "",
        instructorIds: payload.instructorIds || payload.teacherIds || [],
        learnerIds: payload.learnerIds || payload.studentIds || [],
    };
    return apiFetch<void>(`/api/courses/${id}`, {
        method: "PUT",
        body: JSON.stringify(bodyPayload),
    });
}

export function deleteCourseRequest(id: number): Promise<void> {
    return apiFetch<void>(`/api/courses/${id}`, { method: "DELETE" });
}

export function setCourseInstructorsRequest(
    courseId: number,
    instructorIds: number[],
): Promise<CourseDto> {
    return apiFetch<CourseDto>(`/api/courses/${courseId}/instructors`, {
        method: "PUT",
        body: JSON.stringify({ instructorIds }),
    });
}

export function setCourseLearnersRequest(
    courseId: number,
    learnerIds: number[],
): Promise<CourseDto> {
    return apiFetch<CourseDto>(`/api/courses/${courseId}/learners`, {
        method: "PUT",
        body: JSON.stringify({ learnerIds }),
    });
}

export function batchUpdateCourseLearnersRequest(
    courseId: number,
    addLearnerIds: number[],
    removeLearnerIds: number[],
): Promise<CourseDto> {
    return apiFetch<CourseDto>(`/api/courses/${courseId}/learners/batch`, {
        method: "POST",
        body: JSON.stringify({
            addLearnerIds,
            removeLearnerIds,
        }),
    });
}

export interface CoursePreferencesDto {
    hiddenCourseIds: number[];
    courseOrder: number[];
    sortMode: "custom" | "alphabetical" | "students";
    viewMode: "grid" | "list";
}

export function getCoursePreferencesRequest(): Promise<CoursePreferencesDto> {
    return apiFetch<CoursePreferencesDto>("/api/courses/preferences", { method: "GET" });
}

export function updateCoursePreferencesRequest(
    payload: CoursePreferencesDto,
): Promise<CoursePreferencesDto> {
    return apiFetch<CoursePreferencesDto>("/api/courses/preferences", {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export function updateCourseTagsRequest(
    courseId: number,
    tags: string[],
): Promise<CourseDto> {
    return apiFetch<CourseDto>(`/api/courses/${courseId}/tags`, {
        method: "PUT",
        body: JSON.stringify({ tags }),
    });
}