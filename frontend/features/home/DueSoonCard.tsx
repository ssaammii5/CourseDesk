"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, Minimize2 } from "lucide-react";
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
    isPastDue: boolean;
}

function formatDueDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
}

function formatDueTime(iso: string): string {
    return new Date(iso).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    });
}

export function DueSoonCard() {
    const { user } = useAuth();
    const isTeacher = user?.role === "Teacher" || user?.role === "Admin";

    const [collapsed, setCollapsed] = useState(false);
    const [assignments, setAssignments] = useState<DashboardAssignmentItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        getAssignmentsRequest()
            .then((dtos) => {
                if (cancelled) return;
                const now = Date.now();

                let filtered: AssignmentDto[];
                if (isTeacher) {
                    // For teachers: show assignments with work to review or upcoming/recent deadlines
                    filtered = dtos.filter((d) => d.status !== "Draft");
                    // Sort: assignments with pending submissions first, then by nearest deadline
                    filtered.sort((a, b) => {
                        const aPending = (a.turnedInCount ?? a.submissionCount) > 0 ? 1 : 0;
                        const bPending = (b.turnedInCount ?? b.submissionCount) > 0 ? 1 : 0;
                        if (aPending !== bPending) return bPending - aPending;
                        return new Date(a.deadlineUtc).getTime() - new Date(b.deadlineUtc).getTime();
                    });
                } else {
                    // For students: show upcoming assignments that haven't been submitted yet
                    filtered = dtos
                        .filter(
                            (d) =>
                                d.mySubmissionStatus !== "Submitted" &&
                                d.mySubmissionStatus !== "Graded" &&
                                new Date(d.deadlineUtc).getTime() > now,
                        )
                        .sort(
                            (a, b) =>
                                new Date(a.deadlineUtc).getTime() - new Date(b.deadlineUtc).getTime(),
                        );
                }

                const mapped: DashboardAssignmentItem[] = filtered.slice(0, 5).map((d) => {
                    const deadlineMs = new Date(d.deadlineUtc).getTime();
                    return {
                        id: d.id,
                        courseId: d.courseId,
                        title: d.title,
                        courseName: d.courseName ?? "Course",
                        dueDate: d.deadlineUtc ? formatDueDate(d.deadlineUtc) : "No due date",
                        dueTime: d.deadlineUtc ? formatDueTime(d.deadlineUtc) : "",
                        turnedInCount: d.turnedInCount ?? d.submissionCount ?? 0,
                        assignedCount: d.assignedCount ?? 0,
                        gradedCount: d.gradedCount ?? 0,
                        isPastDue: d.deadlineUtc ? deadlineMs < now : false,
                    };
                });

                setAssignments(mapped);
            })
            .catch(() => {
                if (!cancelled) setAssignments([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isTeacher]);

    return (
        <section className="rounded-xl bg-[#f9fafc] px-6 py-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-medium text-gray-800">
                        {isTeacher ? "Work to review" : "Due soon"}
                    </h2>
                    {isTeacher && assignments.some((a) => a.turnedInCount > 0) && (
                        <span className="rounded-full bg-[#e8f0fe] px-2.5 py-0.5 text-xs font-semibold text-[#174ea6]">
                            Needs grading
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/todo"
                        className="text-sm font-medium text-[#1a73e8] hover:underline"
                    >
                        {isTeacher ? "View To-review" : "View To-do"}
                    </Link>
                    <IconButton
                        label={collapsed ? "Expand" : "Collapse"}
                        onClick={() => setCollapsed((v) => !v)}
                        className="h-9 w-9"
                    >
                        <Minimize2 className="h-5 w-5" />
                    </IconButton>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-6">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
                </div>
            ) : !collapsed && (
                assignments.length === 0 ? (
                    <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-600">
                        <CheckCircle2 className="h-4 w-4 text-[#137333]" />
                        <span>
                            {isTeacher
                                ? "All caught up — no submissions waiting for review."
                                : "Woohoo, no work due soon!"}
                        </span>
                    </div>
                ) : (
                    <ul className="mt-4 divide-y divide-gray-100">
                        {assignments.map((a) => (
                            <li
                                key={a.id}
                                className="flex flex-col gap-2 py-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between"
                            >
                                {/* Left: Icon + Title */}
                                <div className="flex min-w-0 flex-1 items-center gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e8f0fe] text-[#1a73e8]">
                                        <ClipboardList className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <Link
                                            href={`/class/${a.courseId}/assignments/${a.id}`}
                                            className="block truncate text-[15px] font-medium text-gray-900 hover:text-[#1a73e8]"
                                        >
                                            {a.title}
                                        </Link>
                                        <Link
                                            href={`/class/${a.courseId}`}
                                            className="block truncate text-xs text-gray-500 hover:text-gray-800 hover:underline"
                                        >
                                            {a.courseName}
                                        </Link>
                                    </div>
                                </div>

                                {/* Middle/Right: Teacher review metrics or Student due date */}
                                {isTeacher ? (
                                    <div className="flex shrink-0 items-center gap-4">
                                        <div className="flex items-center gap-2 rounded-md bg-white px-3 py-1.5 text-xs shadow-xs border border-gray-100">
                                            <span className="font-bold text-[#1a73e8]">
                                                {a.turnedInCount}
                                            </span>
                                            <span className="text-gray-500">turned in</span>
                                            <span className="text-gray-300">•</span>
                                            <span className="font-medium text-gray-700">
                                                {a.assignedCount}
                                            </span>
                                            <span className="text-gray-500">assigned</span>
                                        </div>

                                        <p className="min-w-[110px] text-right text-xs text-gray-600">
                                            <span className="block font-medium">{a.dueDate}</span>
                                            {a.dueTime && <span className="block text-gray-400">{a.dueTime}</span>}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="shrink-0 text-sm text-gray-700 sm:text-right">
                                        <span className="block font-medium">{a.dueDate}</span>
                                        {a.dueTime && (
                                            <span className="block text-xs text-gray-500">{a.dueTime}</span>
                                        )}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                )
            )}
        </section>
    );
}