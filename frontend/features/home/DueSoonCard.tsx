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
    courseId: number;
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
            color: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
        };
    }
    const due = new Date(iso).getTime();
    const now = Date.now();
    const diffHours = (due - now) / (1000 * 60 * 60);

    if (diffHours < 0) {
        return {
            label: "Past deadline",
            color: "border-red-200/80 bg-red-50 text-red-700 dark:border-red-900/80 dark:bg-red-950/80 dark:text-red-300",
        };
    }
    if (diffHours <= 24) {
        return {
            label: diffHours < 1 ? "Due in < 1h" : `Due in ${Math.round(diffHours)}h`,
            color: "border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-900/80 dark:bg-rose-950/80 dark:text-rose-300 font-semibold",
        };
    }
    if (diffHours <= 48) {
        return {
            label: "Due tomorrow",
            color: "border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-900/80 dark:bg-amber-950/80 dark:text-amber-300 font-semibold",
        };
    }
    return {
        label: formatDueDate(iso),
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
                        courseId: d.courseId,
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
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4.5 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                            isInstructor
                                ? "border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-900/60 dark:bg-amber-950/70 dark:text-amber-400"
                                : "border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/60 dark:bg-blue-950/70 dark:text-blue-400"
                        }`}
                    >
                        {isInstructor ? (
                            <ClipboardCheck className="h-4.5 w-4.5" />
                        ) : (
                            <Clock className="h-4.5 w-4.5" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                {isInstructor ? "Submissions to Review" : "Upcoming Deadlines"}
                            </h2>
                            {totalCount > 0 && (
                                <span
                                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${
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
                    <div className="flex flex-col items-center justify-center gap-2.5 py-10 px-6 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-xs dark:border-emerald-900/60 dark:bg-emerald-950/70 dark:text-emerald-400">
                            <CheckCircle2 className="h-6 w-6" />
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
                    <div className="p-4 sm:p-5">
                        <div className="grid grid-cols-1 gap-3">
                            {assignments.map((a) => {
                                const pill = getDeadlinePill(a.deadlineUtc);
                                return (
                                    <div
                                        key={a.id}
                                        className="group relative flex flex-col justify-between gap-4 rounded-xl border border-slate-200/70 bg-slate-50/50 p-4 transition-all hover:border-slate-300 hover:bg-white hover:shadow-xs dark:border-slate-750 dark:border-slate-700/60 dark:bg-slate-800/40 dark:hover:border-slate-600 dark:hover:bg-slate-800/70 sm:flex-row sm:items-center"
                                    >
                                        {/* Left: Icon & Assignment Info */}
                                        <div className="flex min-w-0 flex-1 items-start gap-3.5">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 shadow-xs dark:border-blue-900/60 dark:bg-blue-950/70 dark:text-blue-400">
                                                <ClipboardList className="h-5 w-5" />
                                            </div>

                                            <div className="min-w-0 space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Link
                                                        href={`/course/${a.courseId}`}
                                                        className="inline-flex items-center rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:text-white"
                                                    >
                                                        {a.courseName}
                                                    </Link>

                                                    <span
                                                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] ${pill.color}`}
                                                    >
                                                        {pill.label}
                                                    </span>

                                                    {a.dueTime && (
                                                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                                            at {a.dueTime}
                                                        </span>
                                                    )}
                                                </div>

                                                <Link
                                                    href={`/course/${a.courseId}/assignments/${a.id}`}
                                                    className="block truncate text-sm font-bold text-slate-900 transition-colors hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400"
                                                >
                                                    {a.title}
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Right: Role Action */}
                                        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200/50 pt-3 dark:border-slate-700/60 sm:border-t-0 sm:pt-0">
                                            {isInstructor ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1.5 rounded-lg border border-amber-200/70 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/70 dark:text-amber-300">
                                                        <span>{a.turnedInCount}</span>
                                                        <span className="font-medium text-amber-700 dark:text-amber-400">to grade</span>
                                                    </div>

                                                    <Link
                                                        href={`/course/${a.courseId}/assignments/${a.id}`}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500"
                                                    >
                                                        <span>Review</span>
                                                        <ArrowRight className="h-3 w-3" />
                                                    </Link>
                                                </div>
                                            ) : (
                                                <Link
                                                    href={`/course/${a.courseId}/assignments/${a.id}`}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                                                >
                                                    <span>Open Task</span>
                                                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* More items indicator */}
                        {remainingCount > 0 && (
                            <div className="mt-3.5 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/50">
                                <span className="font-medium text-slate-600 dark:text-slate-300">
                                    +{remainingCount} more {isInstructor ? "submissions to review" : "assignments due"}
                                </span>
                                <Link
                                    href="/todo"
                                    className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                                >
                                    {isInstructor ? "Open To-Review Queue →" : "View Full To-Do List →"}
                                </Link>
                            </div>
                        )}
                    </div>
                )
            )}
        </section>
    );
}