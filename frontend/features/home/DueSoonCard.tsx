"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, ClipboardList, Minimize2 } from "lucide-react";
import Link from "next/link";
import { getAssignmentsRequest, type AssignmentDto } from "@/lib/api/assignments";
import { IconButton } from "@/components/ui/IconButton";
import { useAuth } from "@/hooks/useAuth";

interface DashboardAssignmentItem {
    id: number;
    courseId: number;
    title: string;
    courseName: string;
    dueDate: string;
    dueTime: string;
    turnedInCount: number;
    assignedCount: number;
    gradedCount: number;
}

const MAX_DISPLAY_ITEMS = 2;

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
                    // For instructors: only show items that ACTUALLY have submissions waiting to be graded
                    filtered = dtos.filter(
                        (d) =>
                            d.status !== "Draft" &&
                            (d.turnedInCount ?? d.submissionCount ?? 0) > 0,
                    );
                    // Sort by highest number of pending submissions first
                    filtered.sort((a, b) => {
                        const aPending = a.turnedInCount ?? a.submissionCount ?? 0;
                        const bPending = b.turnedInCount ?? b.submissionCount ?? 0;
                        return bPending - aPending;
                    });
                } else {
                    // For learners: show upcoming assignments that haven't been submitted yet
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
                        turnedInCount: d.turnedInCount ?? d.submissionCount ?? 0,
                        assignedCount: d.assignedCount ?? 0,
                        gradedCount: d.gradedCount ?? 0,
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
        <section className="rounded-xl bg-[#f9fafc] px-6 py-4 shadow-xs border border-gray-200/70">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-800">
                        {isInstructor ? "Work to review" : "Due soon"}
                    </h2>
                    {isInstructor && totalCount > 0 && (
                        <span className="rounded-full bg-[#e8f0fe] px-2.5 py-0.5 text-xs font-semibold text-[#174ea6]">
                            {totalCount} needing review
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/todo"
                        className="text-sm font-medium text-[#1a73e8] hover:underline"
                    >
                        {isInstructor ? "Open To-review" : "View To-do"}
                    </Link>
                    <IconButton
                        label={collapsed ? "Expand" : "Collapse"}
                        onClick={() => setCollapsed((v) => !v)}
                        className="h-8 w-8"
                    >
                        <Minimize2 className="h-4 w-4" />
                    </IconButton>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-5">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
                </div>
            ) : !collapsed && (
                assignments.length === 0 ? (
                    <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-500">
                        <CheckCircle2 className="h-4 w-4 text-[#137333]" />
                        <span>
                            {isInstructor
                                ? "All caught up — no submissions waiting for review."
                                : "Woohoo, no work due soon!"}
                        </span>
                    </div>
                ) : (
                    <div className="mt-3">
                        <ul className="divide-y divide-gray-100">
                            {assignments.map((a) => (
                                <li
                                    key={a.id}
                                    className="flex flex-col gap-2 py-3 transition-colors sm:flex-row sm:items-center sm:justify-between"
                                >
                                    {/* Left: Icon + Title */}
                                    <div className="flex min-w-0 flex-1 items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8f0fe] text-[#1a73e8]">
                                            <ClipboardList className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <Link
                                                href={`/course/${a.courseId}/assignments/${a.id}`}
                                                className="block truncate text-sm font-medium text-gray-900 hover:text-[#1a73e8]"
                                            >
                                                {a.title}
                                            </Link>
                                            <Link
                                                href={`/course/${a.courseId}`}
                                                className="block truncate text-xs text-gray-500 hover:text-gray-800 hover:underline"
                                            >
                                                {a.courseName}
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Right: Review chip + date */}
                                    {isInstructor ? (
                                        <div className="flex shrink-0 items-center gap-3">
                                            <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-[#174ea6] border border-blue-100">
                                                <span className="font-bold">{a.turnedInCount}</span>
                                                <span>to grade</span>
                                            </div>

                                            <p className="min-w-[90px] text-right text-xs text-gray-500">
                                                <span className="block font-medium text-gray-700">{a.dueDate}</span>
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="shrink-0 text-sm text-gray-700 sm:text-right">
                                            <span className="block text-xs font-medium">{a.dueDate}</span>
                                            {a.dueTime && (
                                                <span className="block text-xs text-gray-400">{a.dueTime}</span>
                                            )}
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ul>

                        {/* If there are more remaining reviews beyond what is shown */}
                        {remainingCount > 0 && (
                            <div className="mt-2 border-t border-gray-100 pt-2.5 text-right">
                                <Link
                                    href="/todo"
                                    className="inline-flex items-center gap-1 text-xs font-medium text-[#1a73e8] hover:underline"
                                >
                                    +{remainingCount} more in To-review
                                    <ArrowRight className="h-3 w-3" />
                                </Link>
                            </div>
                        )}
                    </div>
                )
            )}
        </section>
    );
}