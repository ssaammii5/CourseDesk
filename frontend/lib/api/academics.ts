import { apiFetch } from "./client";

export interface CategoryDto {
    id: number;
    name: string;
    code: string;
    description: string;
    courseCount?: number;
}

export type AcademicDepartmentDto = CategoryDto;

// Categories
export function getCategoriesRequest(): Promise<CategoryDto[]> {
    return apiFetch<CategoryDto[]>("/api/academics/categories", { method: "GET" });
}

export function createCategoryRequest(payload: {
    name: string;
    code?: string;
    description?: string;
}): Promise<CategoryDto> {
    return apiFetch<CategoryDto>("/api/academics/categories", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function updateCategoryRequest(
    id: number,
    payload: { name: string; code?: string; description?: string },
): Promise<CategoryDto> {
    return apiFetch<CategoryDto>(`/api/academics/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export function deleteCategoryRequest(id: number): Promise<void> {
    return apiFetch<void>(`/api/academics/categories/${id}`, { method: "DELETE" });
}

// Tags
export interface TagDto {
    id: number;
    name: string;
    description: string;
    courseCount?: number;
}

export function getTagsRequest(): Promise<TagDto[]> {
    return apiFetch<TagDto[]>("/api/academics/tags", { method: "GET" });
}

export function createTagRequest(payload: {
    name: string;
    description?: string;
}): Promise<TagDto> {
    return apiFetch<TagDto>("/api/academics/tags", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function updateTagRequest(
    id: number,
    payload: { name: string; description?: string },
): Promise<TagDto> {
    return apiFetch<TagDto>(`/api/academics/tags/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export function deleteTagRequest(id: number): Promise<void> {
    return apiFetch<void>(`/api/academics/tags/${id}`, { method: "DELETE" });
}

export function setTagCoursesRequest(
    tagId: number,
    courseIds: number[],
): Promise<TagDto> {
    return apiFetch<TagDto>(`/api/academics/tags/${tagId}/courses`, {
        method: "PUT",
        body: JSON.stringify({ courseIds }),
    });
}


// Backward-compatible aliases
export const getDepartmentsRequest = getCategoriesRequest;
export const createDepartmentRequest = (payload: { name: string; code: string; description?: string }) =>
    createCategoryRequest(payload);
export const updateDepartmentRequest = (id: number, payload: { name: string; code: string; description?: string }) =>
    updateCategoryRequest(id, payload);
export const deleteDepartmentRequest = deleteCategoryRequest;

// Deprecated legacy types & stubs
export interface AcademicProgramDto {
    id: number;
    name: string;
    description: string;
}

export interface AcademicSemesterDto {
    id: number;
    name: string;
}

export async function getProgramsRequest(): Promise<AcademicProgramDto[]> {
    return [];
}
export async function getSemestersRequest(): Promise<AcademicSemesterDto[]> {
    return [];
}