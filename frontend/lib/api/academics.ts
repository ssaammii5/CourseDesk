import { apiFetch } from "./client";

export interface AcademicProgramDto {
    id: number;
    name: string;
    description: string;
}

export interface AcademicDepartmentDto {
    id: number;
    name: string;
    code: string;
}

export interface AcademicSemesterDto {
    id: number;
    name: string;
}

// Programs
export function getProgramsRequest(): Promise<AcademicProgramDto[]> {
    return apiFetch<AcademicProgramDto[]>("/api/academics/programs", { method: "GET" });
}
export function createProgramRequest(payload: { name: string; description?: string }): Promise<AcademicProgramDto> {
    return apiFetch<AcademicProgramDto>("/api/academics/programs", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
export function updateProgramRequest(id: number, payload: { name: string; description?: string }): Promise<void> {
    return apiFetch<void>(`/api/academics/programs/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}
export function deleteProgramRequest(id: number): Promise<void> {
    return apiFetch<void>(`/api/academics/programs/${id}`, { method: "DELETE" });
}

// Departments
export function getDepartmentsRequest(): Promise<AcademicDepartmentDto[]> {
    return apiFetch<AcademicDepartmentDto[]>("/api/academics/departments", { method: "GET" });
}
export function createDepartmentRequest(payload: { name: string; code: string }): Promise<AcademicDepartmentDto> {
    return apiFetch<AcademicDepartmentDto>("/api/academics/departments", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
export function updateDepartmentRequest(id: number, payload: { name: string; code: string }): Promise<void> {
    return apiFetch<void>(`/api/academics/departments/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}
export function deleteDepartmentRequest(id: number): Promise<void> {
    return apiFetch<void>(`/api/academics/departments/${id}`, { method: "DELETE" });
}

// Semesters
export function getSemestersRequest(): Promise<AcademicSemesterDto[]> {
    return apiFetch<AcademicSemesterDto[]>("/api/academics/semesters", { method: "GET" });
}
export function createSemesterRequest(payload: { name: string }): Promise<AcademicSemesterDto> {
    return apiFetch<AcademicSemesterDto>("/api/academics/semesters", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
export function updateSemesterRequest(id: number, payload: { name: string }): Promise<void> {
    return apiFetch<void>(`/api/academics/semesters/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}
export function deleteSemesterRequest(id: number): Promise<void> {
    return apiFetch<void>(`/api/academics/semesters/${id}`, { method: "DELETE" });
}