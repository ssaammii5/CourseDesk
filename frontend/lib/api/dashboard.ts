import { apiFetch } from "./client";

export interface DashboardStats {
    totalUsers: number;
    activeUsers: number;
    totalTeachers: number;
    totalStudents: number;
    totalCourses: number;
    activeCourses: number;
    totalAssignments: number;
    publishedAssignments: number;
    totalSubmissions: number;
    gradedSubmissions: number;
    pendingSubmissions: number;
}

export function getDashboardStatsRequest(): Promise<DashboardStats> {
    return apiFetch<DashboardStats>("/api/dashboard/stats", { method: "GET" });
}