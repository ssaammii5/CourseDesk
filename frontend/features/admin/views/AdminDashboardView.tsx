"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, X, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardStatsRequest, type DashboardStats } from "@/lib/api/dashboard";
import { getUsersRequest, type UserDto, type PendingInvitation } from "@/lib/api/users";
import { getCoursesRequest, createCourseRequest, type CourseDto, type CoursePayload } from "@/lib/api/courses";
import { getSubmissionsRequest, type SubmissionDto } from "@/lib/api/submissions";
import type { AdminCourse } from "@/types";

import { AdminHeroHeader } from "../components/AdminHeroHeader";
import { AdminStatCards } from "../components/AdminStatCards";
import { AdminUrgentQueue } from "../components/AdminUrgentQueue";
import { AdminAnalyticsFunnel } from "../components/AdminAnalyticsFunnel";
import { AdminActivityHub } from "../components/AdminActivityHub";
import { AdminQuickShortcuts } from "../components/AdminQuickShortcuts";
import { CourseFormModal } from "../components/CourseFormModal";
import { InviteUserModal } from "../components/InviteUserModal";

export function AdminDashboardView() {
    const { user: currentUser } = useAuth();
    const isCoordinator = currentUser?.role === "Coordinator" || (currentUser?.role as string) === "Co-ordinator";

    // Data States
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [userCounts, setUserCounts] = useState<{
        total: number;
        instructors: number;
        learners: number;
        coordinators: number;
        activeUsers?: number;
    } | null>(null);
    const [users, setUsers] = useState<UserDto[]>([]);
    const [courses, setCourses] = useState<CourseDto[]>([]);
    const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
    const [pendingSubmissions, setPendingSubmissions] = useState<SubmissionDto[]>([]);

    // Loading & Error States
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // Toast Feedback
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // Modal Visibility
    const [courseModalOpen, setCourseModalOpen] = useState(false);
    const [inviteUserOpen, setInviteUserOpen] = useState(false);

    // Toast Auto-Dismiss
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(timer);
    }, [toast]);

    // Data Fetcher - Production-Grade: Fetch aggregated stats + bounded preview datasets
    const fetchAllData = useCallback(async (isBackground = false) => {
        if (isBackground) {
            setIsRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            const [dashStats, previewUsers, allCourses, recentSubmissions, urgentSubmissions] = await Promise.all([
                getDashboardStatsRequest(),
                getUsersRequest({ limit: 10 }).catch(() => [] as UserDto[]),
                getCoursesRequest().catch(() => [] as CourseDto[]),
                getSubmissionsRequest({ limit: 10 }).catch(() => [] as SubmissionDto[]),
                getSubmissionsRequest({ status: "pending", limit: 5 }).catch(() => [] as SubmissionDto[]),
            ]);

            setStats(dashStats);
            setUsers(previewUsers);
            setCourses(allCourses);
            setSubmissions(recentSubmissions);
            setPendingSubmissions(urgentSubmissions);

            setUserCounts({
                total: dashStats.totalUsers,
                instructors: dashStats.totalInstructors,
                learners: dashStats.totalLearners,
                coordinators: dashStats.totalCoordinators ?? 0,
                activeUsers: dashStats.activeUsers,
            });

            setLastUpdated(new Date());
        } catch (err) {
            setError(err instanceof Error && err.message ? err.message : "Failed to load dashboard data.");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void fetchAllData();
    }, [fetchAllData]);

    // Handler: Create Course from Quick Action
    const handleSaveCourse = async (data: Omit<AdminCourse, "id">) => {
        try {
            const payload: CoursePayload = {
                name: data.name,
                department: data.department || undefined,
                isActive: data.isActive,
                tags: data.tags || [],
                instructorIds: data.instructorIds || [],
                learnerIds: data.learnerIds || [],
                teacherIds: data.instructorIds || [],
                studentIds: data.learnerIds || [],
            };

            await createCourseRequest(payload);
            setToast({
                type: "success",
                message: `Course "${data.name}" was successfully created!`,
            });
            setCourseModalOpen(false);
            await fetchAllData(true);

            if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("coursedesk:courses-updated"));
            }
        } catch (err) {
            setToast({
                type: "error",
                message: err instanceof Error ? err.message : "Failed to create course.",
            });
        }
    };

    // Handler: User Invitation Success
    const handleInviteSuccess = (invitation: PendingInvitation, inviteLink: string, roleName: string) => {
        setToast({
            type: "success",
            message: `Invitation generated for ${invitation.email} as ${roleName}. Link copied to clipboard.`,
        });
        void fetchAllData(true);
    };

    // ──────────────── SKELETON LOADING STATE ────────────────
    if (loading && !stats) {
        return (
            <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-pulse">
                {/* Hero Header Skeleton */}
                <div className="h-44 rounded-3xl bg-slate-200/80 dark:bg-slate-800/80" />

                {/* KPI Cards Skeleton */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-36 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80" />
                    ))}
                </div>

                {/* Attention Banner Skeleton */}
                <div className="h-20 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80" />

                {/* Analytics Funnel Skeleton */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="h-64 rounded-3xl bg-slate-200/80 dark:bg-slate-800/80" />
                    <div className="h-64 rounded-3xl bg-slate-200/80 dark:bg-slate-800/80" />
                </div>

                {/* Activity Hub Skeleton */}
                <div className="h-80 rounded-3xl bg-slate-200/80 dark:bg-slate-800/80" />
            </div>
        );
    }

    // ──────────────── ERROR STATE ────────────────
    if (error && !stats) {
        return (
            <div className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8">
                <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-8 text-center dark:border-rose-900/50 dark:bg-rose-950/20">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-400">
                        <AlertCircle className="h-6 w-6" />
                    </div>
                    <h2 className="mt-4 text-lg font-bold text-rose-950 dark:text-rose-200">
                        Unable to Load Dashboard
                    </h2>
                    <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">{error}</p>
                    <button
                        type="button"
                        onClick={() => void fetchAllData()}
                        className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-rose-700"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Retry Connection</span>
                    </button>
                </div>
            </div>
        );
    }

    // Pending submissions awaiting review
    const pendingSubmissionsList =
        pendingSubmissions.length > 0
            ? pendingSubmissions
            : submissions.filter((s) => s.status === "Submitted" || s.status === "Pending");

    return (
        <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 space-y-8">
            {/* Action Feedback Toast */}
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 ${
                        toast.type === "success"
                            ? "border-emerald-200 bg-emerald-50/95 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/95 dark:text-emerald-200"
                            : "border-rose-200 bg-rose-50/95 text-rose-900 dark:border-rose-800 dark:bg-rose-950/95 dark:text-rose-200"
                    }`}
                >
                    {toast.type === "success" ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                        <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
                    )}
                    <span className="text-xs font-semibold">{toast.message}</span>
                    <button
                        type="button"
                        onClick={() => setToast(null)}
                        className="ml-2 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* 1. Executive Hero Header */}
            <AdminHeroHeader
                user={currentUser}
                isCoordinator={isCoordinator}
                onRefresh={() => fetchAllData(true)}
                onOpenNewCourse={() => setCourseModalOpen(true)}
                onOpenInviteUser={() => setInviteUserOpen(true)}
                lastUpdated={lastUpdated}
                isRefreshing={isRefreshing}
            />

            {/* 2. High-Impact KPI Stat Cards */}
            {stats && userCounts && (
                <AdminStatCards
                    stats={stats}
                    userCounts={userCounts}
                    isCoordinator={isCoordinator}
                />
            )}

            {/* 3. Urgent Evaluation Queue Spotlight */}
            {stats && (
                <AdminUrgentQueue
                    pendingCount={stats.pendingSubmissions}
                    pendingSubmissions={pendingSubmissionsList}
                />
            )}

            {/* 4. Visual Analytics & Pipeline Funnel */}
            {stats && userCounts && (
                <AdminAnalyticsFunnel
                    stats={stats}
                    userCounts={userCounts}
                    isCoordinator={isCoordinator}
                />
            )}

            {/* 5. Live Activity Hub: Submissions, Courses, and Members */}
            <AdminActivityHub
                submissions={submissions}
                courses={courses}
                users={users}
                isCoordinator={isCoordinator}
            />

            {/* 6. Administrative Command Shortcuts */}
            <AdminQuickShortcuts isCoordinator={isCoordinator} />

            {/* ──────────────── MODALS ──────────────── */}
            {/* New Course Modal */}
            <CourseFormModal
                open={courseModalOpen}
                course={null}
                isCoordinator={isCoordinator}
                onSave={handleSaveCourse}
                onClose={() => setCourseModalOpen(false)}
            />

            {/* Unified Invite User Modal */}
            <InviteUserModal
                open={inviteUserOpen}
                isCoordinator={isCoordinator}
                onClose={() => setInviteUserOpen(false)}
                onSuccess={(invitation, link, role) => handleInviteSuccess(invitation, link, role)}
            />
        </div>
    );
}