"use client";

import { useEffect, useState } from "react";
import { Users, BookOpen, ClipboardList, FileText, UserRound, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAdminStats } from "@/lib/adminData";
import { getDashboardStatsRequest, type DashboardStats } from "@/lib/api/dashboard";
import { getUsersRequest } from "@/lib/api/users";

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: number;
    sublabel?: string;
    iconBg: string;
    onClick?: () => void;
}

function StatCard({ icon, label, value, sublabel, iconBg, onClick }: StatCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full cursor-pointer items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 text-left transition-shadow hover:shadow-md"
        >
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
                {icon}
            </span>
            <div className="min-w-0">
                <p className="text-2xl font-semibold text-gray-900">{value}</p>
                <p className="mt-0.5 truncate text-sm text-gray-600">{label}</p>
                {sublabel && <p className="mt-1 text-xs text-gray-500">{sublabel}</p>}
            </div>
        </button>
    );
}

export function AdminDashboardView() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [userCounts, setUserCounts] = useState<{ total: number; teachers: number; students: number } | null>(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const [dashboardStats, allUsers] = await Promise.all([
                    getDashboardStatsRequest(),
                    getUsersRequest(),
                ]);

                if (!cancelled) {
                    setStats(dashboardStats);
                    setUserCounts({
                        total: allUsers.length,
                        teachers: allUsers.filter((u) => u.role === "Teacher").length,
                        students: allUsers.filter((u) => u.role === "Student").length,
                    });
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error && err.message ? err.message : "Failed to load dashboard statistics.");
                }
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, []);

    if (error) {
        return (
            <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-8">
                <h1 className="text-3xl font-semibold text-gray-900">Admin Dashboard</h1>
                <div className="mt-8 rounded-lg bg-[#fce8e6] px-5 py-4 text-sm text-[#c5221f]">{error}</div>
            </div>
        );
    }

    if (!stats || !userCounts) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#eef1f4]">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
            </div>
        );
    }

    // Use real user counts from /api/users for the user distribution section
    const totalUsers = userCounts.total;
    const totalTeachers = userCounts.teachers;
    const totalStudents = userCounts.students;

    const teacherPct = totalUsers > 0 ? (totalTeachers / totalUsers) * 100 : 0;
    const studentPct = totalUsers > 0 ? (totalStudents / totalUsers) * 100 : 0;

    // Fall back to dashboard stats for course/assignment/submission counts
    const fallbackStats = getAdminStats();

    return (
        <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-8">
            <h1 className="text-3xl font-semibold text-gray-900">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
                Overview of your course & assignment management workspace
            </p>

            {/* Stat Cards */}
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <StatCard
                    icon={<UserRound className="h-6 w-6 text-[#174ea6]" />}
                    iconBg="bg-[#d7e3fd]"
                    label="Instructors"
                    value={totalTeachers}
                    onClick={() => router.push("/teachers")}
                />
                <StatCard
                    icon={<Users className="h-6 w-6 text-[#137333]" />}
                    iconBg="bg-[#ceead6]"
                    label="Learners"
                    value={totalStudents}
                    onClick={() => router.push("/students")}
                />
                <StatCard
                    icon={<BookOpen className="h-6 w-6 text-[#b06000]" />}
                    iconBg="bg-[#fef7e0]"
                    label="Courses"
                    value={stats.totalCourses}
                    sublabel={`${stats.activeCourses} active`}
                    onClick={() => router.push("/courses")}
                />
                <StatCard
                    icon={<ClipboardList className="h-6 w-6 text-[#174ea6]" />}
                    iconBg="bg-[#d7e3fd]"
                    label="Assignments"
                    value={stats.totalAssignments}
                    sublabel={`${stats.publishedAssignments} published`}
                    onClick={() => router.push("/assignments")}
                />
                <StatCard
                    icon={<FileText className="h-6 w-6 text-[#c5221f]" />}
                    iconBg="bg-[#fce8e6]"
                    label="Submissions"
                    value={stats.totalSubmissions}
                    sublabel={`${stats.pendingSubmissions} pending`}
                    onClick={() => router.push("/submissions")}
                />
            </div>

            {/* Distribution Sections */}
            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* User Distribution */}
                <section className="rounded-xl border border-gray-200 bg-white p-6">
                    <h2 className="text-lg font-medium text-gray-900">User Distribution</h2>
                    <div className="mt-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Instructors</span>
                            <span className="text-sm font-semibold text-gray-900">{totalTeachers}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200">
                            <div
                                className="h-2 rounded-full bg-[#1a73e8]"
                                style={{ width: `${teacherPct}%` }}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Learners</span>
                            <span className="text-sm font-semibold text-gray-900">{totalStudents}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200">
                            <div
                                className="h-2 rounded-full bg-[#188038]"
                                style={{ width: `${studentPct}%` }}
                            />
                        </div>
                    </div>
                </section>

                {/* Submission Status */}
                <section className="rounded-xl border border-gray-200 bg-white p-6">
                    <h2 className="text-lg font-medium text-gray-900">Submission Status</h2>
                    <div className="mt-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="flex h-3 w-3 rounded-full bg-[#188038]" />
                            <span className="text-sm text-gray-700">Graded</span>
                            <span className="ml-auto text-sm font-semibold text-gray-900">{stats.gradedSubmissions}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex h-3 w-3 rounded-full bg-[#1a73e8]" />
                            <span className="text-sm text-gray-700">Awaiting Review</span>
                            <span className="ml-auto text-sm font-semibold text-gray-900">{stats.pendingSubmissions}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex h-3 w-3 rounded-full bg-[#c5221f]" />
                            <span className="text-sm text-gray-700">Not Submitted</span>
                            <span className="ml-auto text-sm font-semibold text-gray-900">
                                {stats.totalSubmissions - stats.gradedSubmissions - stats.pendingSubmissions}
                            </span>
                        </div>
                    </div>

                    {stats.pendingSubmissions > 0 && (
                        <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#fef7e0] px-4 py-3">
                            <AlertCircle className="h-4 w-4 text-[#b06000]" />
                            <span className="text-sm text-[#b06000]">
                                {stats.pendingSubmissions} submission{stats.pendingSubmissions > 1 ? "s" : ""} need{stats.pendingSubmissions === 1 ? "s" : ""} grading
                            </span>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}