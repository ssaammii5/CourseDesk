"use client";

import { useEffect, useState } from "react";
import {
    ArrowRight,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    ClipboardCheck,
    ClipboardList,
    Clock,
} from "lucide-react";
import Link from "next/link";
import { getAssignmentsRequest, type AssignmentDto } from "@/lib/api/assignments";
import { useAuth } from "@/hooks/useAuth";

interface DashboardAssignmentItem {
    id: number;
    code?: string;
    courseId: number;
    courseCode?: string;
    title: string;
    courseName: string;
    dueDate: string;
    dueTime: string;
    deadlineUtc?: string | null;
    turnedInCount: number;
    assignedCount: number;
    gradedCount: number;
    maxMarks?: number;
}

const MAX_DISPLAY_ITEMS = 3;

function formatDueDate(iso?: string | null): string {
    if (!iso) return "No due date";
    return new Date(iso).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
}

function formatDueTime(iso?: string | null): string {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    });
}

function getDeadlinePill(iso?: string | null) {
    if (!iso) {
        return {
            label: "No due date",
            shortLabel: "No date",
            color: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
        };
    }
    const due = new Date(iso).getTime();
    const now = Date.now();
    const diffHours = (due - now) / (1000 * 60 * 60);

    if (diffHours < 0) {
        return {
            label: "Past deadline",
            shortLabel: "Overdue",
            color: "border-red-200/80 bg-red-50 text-red-700 dark:border-red-900/80 dark:bg-red-950/80 dark:text-red-300",
        };
    }
    if (diffHours <= 24) {
        return {
            label: diffHours < 1 ? "Due in < 1h" : `Due in ${Math.round(diffHours)}h`,
            shortLabel: diffHours < 1 ? "< 1h left" : `${Math.round(diffHours)}h left`,
            color: "border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-900/80 dark:bg-rose-950/80 dark:text-rose-300",
        };
    }
    if (diffHours <= 48) {
        return {
            label: "Due tomorrow",
            shortLabel: "Tomorrow",
            color: "border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-900/80 dark:bg-amber-950/80 dark:text-amber-300",
        };
    }
    return {
        label: formatDueDate(iso),
        shortLabel: formatDueDate(iso),
        color: "border-blue-200/80 bg-blue-50 text-blue-700 dark:border-blue-900/80 dark:bg-blue-950/80 dark:text-blue-300",
    };
}

export function DueSoonCard() {
    const { user } = useAuth();
    const isInstructor = user?.role === "Instructor" || user?.role === "Admin";

    const [collapsed, setCollapsed] = useState(false);
    const [assignments, setAssignments] = useState<DashboardAssignmentItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        getAssignmentsRequest()
            .then((dtos) => {
                if (cancelled) return;
                const now = Date.now();

                let filtered: AssignmentDto[];
                if (isInstructor) {
                    filtered = dtos.filter(
                        (d) =>
                            d.status !== "Draft" &&
                            (d.turnedInCount ?? d.submissionCount ?? 0) > 0,
                    );
                    filtered.sort((a, b) => {
                        const aPending = a.turnedInCount ?? a.submissionCount ?? 0;
                        const bPending = b.turnedInCount ?? b.submissionCount ?? 0;
                        return bPending - aPending;
                    });
                } else {
                    filtered = dtos
                        .filter(
                            (d) =>
                                d.mySubmissionStatus !== "Submitted" &&
                                d.mySubmissionStatus !== "Graded" &&
                                d.deadlineUtc &&
                                new Date(d.deadlineUtc).getTime() > now,
                        )
                        .sort(
                            (a, b) =>
                                new Date(a.deadlineUtc!).getTime() -
                                new Date(b.deadlineUtc!).getTime(),
                        );
                }

                setTotalCount(filtered.length);

                const mapped: DashboardAssignmentItem[] = filtered
                    .slice(0, MAX_DISPLAY_ITEMS)
                    .map((d) => ({
                        id: d.id,
                        code: d.code,
                        courseId: d.courseId,
                        courseCode: d.courseCode,
                        title: d.title,
                        courseName: d.courseName ?? "Course",
                        dueDate: formatDueDate(d.deadlineUtc),
                        dueTime: formatDueTime(d.deadlineUtc),
                        deadlineUtc: d.deadlineUtc,
                        turnedInCount: d.turnedInCount ?? d.submissionCount ?? 0,
                        assignedCount: d.assignedCount ?? 0,
                        gradedCount: d.gradedCount ?? 0,
                        maxMarks: d.maxMarks,
                    }));

                setAssignments(mapped);
            })
            .catch(() => {
                if (!cancelled) {
                    setAssignments([]);
                    setTotalCount(0);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isInstructor]);

    const remainingCount = Math.max(0, totalCount - assignments.length);

    return (
        <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all dark:border-slate-800 dark:bg-slate-900">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 px-3.5 py-3 dark:border-slate-800 sm:gap-3 sm:px-6 sm:py-4.5">
                <div className="flex items-center gap-2.5 sm:gap-3">
                    <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border sm:h-9 sm:w-9 sm:rounded-xl ${
                            isInstructor
                                ? "border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-900/60 dark:bg-amber-950/70 dark:text-amber-400"
                                : "border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/60 dark:bg-blue-950/70 dark:text-blue-400"
                        }`}
                    >
                        {isInstructor ? (
                            <ClipboardCheck className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                        ) : (
                            <Clock className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 sm:gap-2.5">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                                {isInstructor ? "Submissions to Review" : "Upcoming Deadlines"}
                            </h2>
                            {totalCount > 0 && (
                                <span
                                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold sm:px-2.5 sm:text-xs ${
                                        isInstructor
                                            ? "border-amber-200/80 bg-amber-100 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/80 dark:text-amber-300"
                                            : "border-blue-200/80 bg-blue-100 text-blue-800 dark:border-blue-800/60 dark:bg-blue-950/80 dark:text-blue-300"
                                    }`}
                                >
                                    {totalCount} {isInstructor ? "needing review" : "due soon"}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/todo"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                    >
                        <span>{isInstructor ? "Open To-review" : "View all in To-do"}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>

                    <button
                        type="button"
                        onClick={() => setCollapsed((v) => !v)}
                        aria-label={collapsed ? "Expand section" : "Collapse section"}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                        {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* Content area */}
            {loading ? (
                <div className="flex items-center justify-center py-10">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent dark:border-blue-400" />
                </div>
            ) : !collapsed && (
                assignments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2.5 py-8 px-4 text-center sm:py-10 sm:px-6">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-xs dark:border-emerald-900/60 dark:bg-emerald-950/70 dark:text-emerald-400 sm:h-12 sm:w-12">
                            <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {isInstructor
                                ? "All caught up — no submissions waiting for review!"
                                : "Woohoo, you're all caught up! No assignments due soon."}
                        </p>
                        <p className="max-w-md text-xs text-slate-500 dark:text-slate-400">
                            {isInstructor
                                ? "You have evaluated all turned-in submissions. Enjoy your teaching flow!"
                                : "Great time to review your course materials or relax."}
                        </p>
                    </div>
                ) : (
                    <div className="p-3 sm:p-5">
                        <div className="grid grid-cols-1 gap-2 sm:gap-3">
                            {assignments.map((a) => {
                                const pill = getDeadlinePill(a.deadlineUtc);
                                return (
                                    <div
                                        key={a.id}
                                        className="group relative flex items-center justify-between gap-2 rounded-xl border border-slate-200/70 bg-slate-50/50 p-2.5 transition-all hover:border-slate-300 hover:bg-white hover:shadow-xs dark:border-slate-700/60 dark:bg-slate-800/40 dark:hover:border-slate-600 dark:hover:bg-slate-800/70 sm:gap-4 sm:p-4"
                                    >
                                        {/* Left: Icon & Assignment Info */}
                                        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:items-start sm:gap-3.5">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 shadow-xs dark:border-blue-900/60 dark:bg-blue-950/70 dark:text-blue-400 sm:h-10 sm:w-10 sm:rounded-xl">
                                                <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />
                                            </div>

                                            <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
                                                <div className="flex items-center gap-1.5 overflow-hidden sm:gap-2">
                                                    <Link
                                                        href={`/course/${a.courseCode || a.courseId}`}
                                                        className="inline-flex max-w-[90px] shrink truncate items-center whitespace-nowrap rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:text-white xs:max-w-[130px] sm:max-w-none sm:rounded-md sm:px-2 sm:text-[11px]"
                                                    >
                                                        {a.courseName}
                                                    </Link>

                                                    <span
                                                        className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold sm:px-2.5 sm:text-[11px] ${pill.color}`}
                                                    >
                                                        <span className="sm:hidden">{pill.shortLabel}</span>
                                                        <span className="hidden sm:inline">{pill.label}</span>
                                                    </span>

                                                    {a.dueTime && (
                                                        <span className="hidden whitespace-nowrap text-[10px] text-slate-500 dark:text-slate-400 sm:inline sm:text-[11px]">
                                                            at {a.dueTime}
                                                        </span>
                                                    )}
                                                </div>

                                                <Link
                                                    href={`/course/${a.courseCode || a.courseId}/assignments/${a.code || a.id}`}
                                                    className="block truncate text-xs font-semibold text-slate-900 transition-colors hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400 sm:text-sm sm:font-bold"
                                                >
                                                    {a.title}
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Right: Role Action */}
                                        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
                                            {isInstructor ? (
                                                <div className="flex items-center gap-1.5 sm:gap-3">
                                                    <div className="flex items-center gap-1 whitespace-nowrap rounded-md border border-amber-200/70 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/70 dark:text-amber-300 sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-xs">
                                                        <span>{a.turnedInCount}</span>
                                                        <span className="hidden font-medium text-amber-700 dark:text-amber-400 sm:inline">to grade</span>
                                                    </div>

                                                    <Link
                                                        href={`/course/${a.courseCode || a.courseId}/assignments/${a.code || a.id}`}
                                                        className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 sm:px-3.5 sm:py-1.5"
                                                    >
                                                        <span className="hidden sm:inline">Review</span>
                                                        <ArrowRight className="h-3 w-3" />
                                                    </Link>
                                                </div>
                                            ) : (
                                                <Link
                                                    href={`/course/${a.courseCode || a.courseId}/assignments/${a.code || a.id}`}
                                                    className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 sm:gap-1.5 sm:px-3.5 sm:py-1.5"
                                                >
                                                    <span className="hidden sm:inline">Open Task</span>
                                                    <span className="sm:hidden">Open</span>
                                                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 sm:h-3.5 sm:w-3.5" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* More items indicator */}
                        {remainingCount > 0 && (
                            <div className="mt-2.5 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-800/50 sm:mt-3.5 sm:px-4 sm:py-2.5">
                                <span className="font-medium text-slate-600 dark:text-slate-300">
                                    +{remainingCount} more {isInstructor ? "submissions" : "assignments"}
                                    <span className="hidden sm:inline"> {isInstructor ? "to review" : "due"}</span>
                                </span>
                                <Link
                                    href="/todo"
                                    className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                                >
                                    <span className="hidden sm:inline">{isInstructor ? "Open To-Review Queue →" : "View Full To-Do List →"}</span>
                                    <span className="sm:hidden">View all →</span>
                                </Link>
                            </div>
                        )}
                    </div>
                )
            )}
        </section>
    );
}