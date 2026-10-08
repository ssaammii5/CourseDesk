"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    GraduationCap,
    Users,
    UserCheck,
    BookOpen,
    ClipboardList,
    FileText,
    ArrowUpRight,
    AlertCircle,
} from "lucide-react";
import type { DashboardStats } from "@/lib/api/dashboard";

interface AdminStatCardsProps {
    stats: DashboardStats;
    userCounts: {
        total: number;
        instructors: number;
        learners: number;
        coordinators: number;
        activeUsers?: number;
    };
    isCoordinator: boolean;
}

interface MetricCardProps {
    title: string;
    value: number;
    sublabel: string;
    badgeText?: string;
    badgeVariant?: "success" | "warning" | "info" | "neutral" | "urgent";
    icon: React.ReactNode;
    iconBg: string;
    accentGlow: string;
    onClick: () => void;
}

function MetricCard({
    title,
    value,
    sublabel,
    badgeText,
    badgeVariant = "info",
    icon,
    iconBg,
    accentGlow,
    onClick,
}: MetricCardProps) {
    const badgeColors = {
        success: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/40",
        warning: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/40",
        urgent: "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/40",
        info: "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/40",
        neutral: "bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/60",
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className="group relative flex w-full cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-slate-700"
        >
            {/* Ambient subtle glow backdrop */}
            <div
                className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40 ${accentGlow}`}
            />

            <div>
                {/* Header row: Icon & Status Badge (Uniform size across all cards) */}
                <div className="flex items-center justify-between gap-2">
                    <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-xs transition-transform duration-300 group-hover:scale-105 ${iconBg}`}
                    >
                        {icon}
                    </div>

                    {badgeText && (
                        <span
                            className={`inline-flex h-6 min-w-[82px] items-center justify-center rounded-full border px-2.5 text-[11px] font-semibold tracking-tight whitespace-nowrap text-center ${badgeColors[badgeVariant]}`}
                        >
                            {badgeVariant === "urgent" && <AlertCircle className="h-3 w-3 shrink-0 mr-1" />}
                            {badgeText}
                        </span>
                    )}
                </div>

                {/* Metric value and title */}
                <div className="mt-4">
                    <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        {value.toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                        {title}
                    </p>
                </div>
            </div>

            {/* Bottom Sublabel / Trend micro-bar */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="truncate">{sublabel}</span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-400 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-slate-500 dark:group-hover:text-blue-400" />
            </div>
        </button>
    );
}

export function AdminStatCards({ stats, userCounts, isCoordinator }: AdminStatCardsProps) {
    const router = useRouter();

    const activeCourseRatio = useMemo(() => {
        if (!stats.totalCourses) return 0;
        return Math.round((stats.activeCourses / stats.totalCourses) * 100);
    }, [stats.totalCourses, stats.activeCourses]);

    const publishedAssignmentRatio = useMemo(() => {
        if (!stats.totalAssignments) return 0;
        return Math.round((stats.publishedAssignments / stats.totalAssignments) * 100);
    }, [stats.totalAssignments, stats.publishedAssignments]);

    return (
        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${!isCoordinator ? "xl:grid-cols-6" : "xl:grid-cols-5"}`}>
            {/* 1. Learners */}
            <MetricCard
                title="Learners"
                value={userCounts.learners}
                sublabel="Enrolled platform learners"
                badgeText={`${userCounts.learners} Active`}
                badgeVariant="success"
                icon={<GraduationCap className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />}
                iconBg="bg-emerald-50 dark:bg-emerald-950/60"
                accentGlow="bg-emerald-500"
                onClick={() => router.push("/learners")}
            />

            {/* 2. Instructors */}
            <MetricCard
                title="Instructors"
                value={userCounts.instructors}
                sublabel="Course faculty & mentors"
                badgeText={`${userCounts.instructors} Active`}
                badgeVariant="info"
                icon={<Users className="h-5 w-5 text-blue-600 dark:text-blue-300" />}
                iconBg="bg-blue-50 dark:bg-blue-950/60"
                accentGlow="bg-blue-500"
                onClick={() => router.push("/instructors")}
            />

            {/* 3. Co-ordinators (Admin Only) */}
            {!isCoordinator && (
                <MetricCard
                    title="Co-ordinators"
                    value={userCounts.coordinators}
                    sublabel="Academic managers"
                    badgeText={`${userCounts.coordinators} Active`}
                    badgeVariant="neutral"
                    icon={<UserCheck className="h-5 w-5 text-purple-600 dark:text-purple-300" />}
                    iconBg="bg-purple-50 dark:bg-purple-950/60"
                    accentGlow="bg-purple-500"
                    onClick={() => router.push("/coordinators")}
                />
            )}

            {/* 4. Courses */}
            <MetricCard
                title="Courses"
                value={stats.totalCourses}
                sublabel={`${stats.activeCourses} active courses`}
                badgeText={`${activeCourseRatio}% Live`}
                badgeVariant="success"
                icon={<BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-300" />}
                iconBg="bg-amber-50 dark:bg-amber-950/60"
                accentGlow="bg-amber-500"
                onClick={() => router.push("/courses")}
            />

            {/* 5. Assignments */}
            <MetricCard
                title="Assignments"
                value={stats.totalAssignments}
                sublabel={`${stats.publishedAssignments} currently published`}
                badgeText={`${publishedAssignmentRatio}% Live`}
                badgeVariant="info"
                icon={<ClipboardList className="h-5 w-5 text-sky-600 dark:text-sky-300" />}
                iconBg="bg-sky-50 dark:bg-sky-950/60"
                accentGlow="bg-sky-500"
                onClick={() => router.push("/assignments")}
            />

            {/* 6. Submissions & Grading Queue */}
            <MetricCard
                title="Submissions"
                value={stats.totalSubmissions}
                sublabel={`${stats.gradedSubmissions} evaluated`}
                badgeText={
                    stats.pendingSubmissions > 0
                        ? `${stats.pendingSubmissions} Pending`
                        : "All Done"
                }
                badgeVariant={stats.pendingSubmissions > 0 ? "urgent" : "success"}
                icon={<FileText className="h-5 w-5 text-rose-600 dark:text-rose-300" />}
                iconBg="bg-rose-50 dark:bg-rose-950/60"
                accentGlow="bg-rose-500"
                onClick={() => router.push("/submissions")}
            />
        </div>
    );
}
