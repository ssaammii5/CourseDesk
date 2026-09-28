"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
    Award,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    ClipboardList,
    Users,
} from "lucide-react";

interface MetricCardProps {
    title: string;
    value: number | string;
    sublabel: string;
    icon: ReactNode;
    iconBg: string;
    iconColor: string;
    href?: string;
    badge?: string;
    badgeColor?: string;
}

function MetricCard({
    title,
    value,
    sublabel,
    icon,
    iconBg,
    iconColor,
    href,
    badge,
    badgeColor,
}: MetricCardProps) {
    const isTextValue = typeof value === "string" && isNaN(Number(value));

    const content = (
        <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {title}
                    </p>
                    <p
                        className={`truncate font-bold tracking-tight text-slate-900 dark:text-white ${
                            isTextValue
                                ? String(value).length > 8
                                    ? "text-base sm:text-lg"
                                    : "text-lg sm:text-xl"
                                : "text-2xl sm:text-3xl"
                        }`}
                        title={String(value)}
                    >
                        {value}
                    </p>
                </div>
                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${iconBg} ${iconColor} transition-transform duration-200 group-hover:scale-110 shadow-xs`}
                >
                    {icon}
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <span className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                    {sublabel}
                </span>
                {badge && (
                    <span
                        className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                            badgeColor || "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/80 dark:text-blue-300"
                        }`}
                    >
                        {badge}
                    </span>
                )}
            </div>
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="block transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-2xl">
                {content}
            </Link>
        );
    }

    return content;
}

interface HomeStatsOverviewProps {
    isInstructor: boolean;
    courseCount: number;
    pendingCount: number;
    completedCount: number;
    totalLearnersCount?: number;
    nextMilestoneText?: string;
}

export function HomeStatsOverview({
    isInstructor,
    courseCount,
    pendingCount,
    completedCount,
    totalLearnersCount = 0,
    nextMilestoneText = "All on track",
}: HomeStatsOverviewProps) {
    if (isInstructor) {
        return (
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Active Courses"
                    value={courseCount}
                    sublabel="Courses you instruct"
                    icon={<BookOpen className="h-5 w-5" />}
                    iconBg="bg-blue-50 border-blue-100 dark:bg-blue-950/70 dark:border-blue-900/60"
                    iconColor="text-blue-600 dark:text-blue-400"
                    href="#courses-section"
                    badge="Active"
                    badgeColor="border-blue-200/80 bg-blue-50 text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/70 dark:text-blue-300"
                />

                <MetricCard
                    title="Submissions to Review"
                    value={pendingCount}
                    sublabel={pendingCount > 0 ? "Awaiting your review" : "All graded"}
                    icon={<ClipboardCheck className="h-5 w-5" />}
                    iconBg={
                        pendingCount > 0
                            ? "bg-amber-50 border-amber-100 dark:bg-amber-950/70 dark:border-amber-900/60"
                            : "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/70 dark:border-emerald-900/60"
                    }
                    iconColor={
                        pendingCount > 0
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400"
                    }
                    href="/todo"
                    badge={pendingCount > 0 ? "Needs action" : "Up to date"}
                    badgeColor={
                        pendingCount > 0
                            ? "border-amber-200/80 bg-amber-100/80 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/80 dark:text-amber-300"
                            : "border-emerald-200/80 bg-emerald-100/80 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/80 dark:text-emerald-300"
                    }
                />

                <MetricCard
                    title="Total Learners"
                    value={totalLearnersCount.toLocaleString()}
                    sublabel="Enrolled across courses"
                    icon={<Users className="h-5 w-5" />}
                    iconBg="bg-indigo-50 border-indigo-100 dark:bg-indigo-950/70 dark:border-indigo-900/60"
                    iconColor="text-indigo-600 dark:text-indigo-400"
                    badge="Community"
                    badgeColor="border-indigo-200/80 bg-indigo-50 text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-950/70 dark:text-indigo-300"
                />

                <MetricCard
                    title="Evaluated Work"
                    value={completedCount}
                    sublabel="Total graded submissions"
                    icon={<Award className="h-5 w-5" />}
                    iconBg="bg-purple-50 border-purple-100 dark:bg-purple-950/70 dark:border-purple-900/60"
                    iconColor="text-purple-600 dark:text-purple-400"
                    href="/todo?tab=reviewed"
                    badge="Completed"
                    badgeColor="border-purple-200/80 bg-purple-50 text-purple-700 dark:border-purple-800/60 dark:bg-purple-950/70 dark:text-purple-300"
                />
            </div>
        );
    }

    // Learner Overview
    return (
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
                title="Enrolled Courses"
                value={courseCount}
                sublabel="Current term courses"
                icon={<BookOpen className="h-5 w-5" />}
                iconBg="bg-blue-50 border-blue-100 dark:bg-blue-950/70 dark:border-blue-900/60"
                iconColor="text-blue-600 dark:text-blue-400"
                href="#courses-section"
                badge="Enrolled"
                badgeColor="border-blue-200/80 bg-blue-50 text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/70 dark:text-blue-300"
            />

            <MetricCard
                title="Assignments Due"
                value={pendingCount}
                sublabel={pendingCount > 0 ? "Upcoming deadlines" : "No pending work"}
                icon={<ClipboardList className="h-5 w-5" />}
                iconBg={
                    pendingCount > 0
                        ? "bg-rose-50 border-rose-100 dark:bg-rose-950/70 dark:border-rose-900/60"
                        : "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/70 dark:border-emerald-900/60"
                }
                iconColor={
                    pendingCount > 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-emerald-600 dark:text-emerald-400"
                }
                href="/todo"
                badge={pendingCount > 0 ? "Pending" : "Completed"}
                badgeColor={
                    pendingCount > 0
                        ? "border-rose-200/80 bg-rose-100/80 text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/80 dark:text-rose-300"
                        : "border-emerald-200/80 bg-emerald-100/80 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/80 dark:text-emerald-300"
                }
            />

            <MetricCard
                title="Completed Work"
                value={completedCount}
                sublabel="Turned in or evaluated"
                icon={<CheckCircle2 className="h-5 w-5" />}
                iconBg="bg-emerald-50 border-emerald-100 dark:bg-emerald-950/70 dark:border-emerald-900/60"
                iconColor="text-emerald-600 dark:text-emerald-400"
                href="/todo"
                badge="Done"
                badgeColor="border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/70 dark:text-emerald-300"
            />

            <MetricCard
                title="Next Milestone"
                value={nextMilestoneText}
                sublabel="Upcoming schedule"
                icon={<CalendarDays className="h-5 w-5" />}
                iconBg="bg-purple-50 border-purple-100 dark:bg-purple-950/70 dark:border-purple-900/60"
                iconColor="text-purple-600 dark:text-purple-400"
                href="/calendar"
                badge="Schedule"
                badgeColor="border-purple-200/80 bg-purple-50 text-purple-700 dark:border-purple-800/60 dark:bg-purple-950/70 dark:text-purple-300"
            />
        </div>
    );
}
