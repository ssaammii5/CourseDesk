"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { SessionDto } from "@/types/session";
import type { ClassDetails } from "@/types";
import type { CourseDto } from "@/lib/api/courses";
import type { CourseTab } from "./CourseTabs";
import { initialOf } from "@/lib/utils/format";
import { avatarClassFor } from "@/lib/utils/theme";

interface StreamSidebarProps {
    courseId: number;
    details: ClassDetails;
    course?: CourseDto | null;
    nextSession?: SessionDto | null;
    isInstructor?: boolean;
    onTabChange?: (tab: CourseTab) => void;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function parseDeadlineDate(item: {
    dueLabel?: string;
    deadlineUtc?: string;
    dueDate?: string;
}): Date | null {
    if (item.deadlineUtc) {
        const d = new Date(item.deadlineUtc);
        if (!isNaN(d.getTime())) return d;
    }
    if (item.dueDate) {
        const d = new Date(item.dueDate);
        if (!isNaN(d.getTime())) return d;
    }
    if (!item.dueLabel) return null;
    const cleaned = item.dueLabel.replace(/^Due\s*/i, "").trim();
    if (!cleaned || /no due date/i.test(cleaned)) return null;

    if (/^tomorrow/i.test(cleaned)) {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(23, 59, 59, 999);
        return d;
    }
    if (/^today/i.test(cleaned)) {
        const d = new Date();
        d.setHours(23, 59, 59, 999);
        return d;
    }

    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) {
        return parsed;
    }
    return null;
}

function formatDeadlineBadge(
    parsed: Date,
    now: number
): { text: string; exact: string; isUrgent: boolean } {
    const diffMs = parsed.getTime() - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    const exact =
        parsed.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        }) +
        " at " +
        parsed.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
        });

    if (diffMs < 0) {
        return { text: "Due now", exact, isUrgent: true };
    }
    if (diffHours < 1) {
        const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
        return { text: `Due in ${diffMins}m`, exact, isUrgent: true };
    }
    if (diffHours < 24) {
        return { text: `Due in ${diffHours}h`, exact, isUrgent: true };
    }
    if (diffDays === 1) {
        return { text: "Due tomorrow", exact, isUrgent: true };
    }
    return {
        text: `Due in ${diffDays}d`,
        exact,
        isUrgent: diffDays <= 3,
    };
}

export function StreamSidebar({
    courseId,
    details,
    onTabChange,
}: StreamSidebarProps) {
    const now = Date.now();

    // Upcoming assignments ending within 7 days, sorted nearest first
    const upcomingDeadlines = (details.classwork || [])
        .filter((item) => item.status === "Assigned")
        .map((item) => {
            const deadlineDate = parseDeadlineDate(item);
            if (!deadlineDate) return null;
            const diffMs = deadlineDate.getTime() - now;
            return {
                assignment: item,
                deadlineDate,
                diffMs,
                badge: formatDeadlineBadge(deadlineDate, now),
            };
        })
        .filter(
            (entry): entry is NonNullable<typeof entry> =>
                entry !== null && entry.diffMs >= -60000 && entry.diffMs <= SEVEN_DAYS_MS
        )
        .sort((a, b) => a.diffMs - b.diffMs);

    // Instructors
    const instructors = details.people.filter(
        (p) => p.role === "Instructor" || (p.role as string) === "Teacher"
    );

    const navigateTab = (tab: CourseTab) => {
        if (onTabChange) {
            onTabChange(tab);
        } else if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("tab", tab);
            window.history.pushState(null, "", url.toString());
            window.dispatchEvent(new CustomEvent("coursedesk:tab-changed", { detail: { tab } }));
        }
    };

    return (
        <aside className="w-full space-y-6 lg:w-[320px] shrink-0">
            {/* Deadlines Radar */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/90">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Upcoming Deadlines
                        </span>
                        {upcomingDeadlines.length > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                                {upcomingDeadlines.length}
                            </span>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => navigateTab("coursework")}
                        className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400 cursor-pointer"
                    >
                        View all
                    </button>
                </div>

                <div className="mt-3.5 space-y-2.5">
                    {upcomingDeadlines.length > 0 ? (
                        upcomingDeadlines.map(({ assignment, badge }) => (
                            <Link
                                key={assignment.id}
                                href={`/course/${courseId}/assignments/${assignment.id}`}
                                className="group flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition-all hover:border-indigo-200 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-indigo-800/80 dark:hover:bg-slate-800/80"
                            >
                                <div className="min-w-0 flex-1">
                                    <h5 className="truncate text-xs font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400">
                                        {assignment.title}
                                    </h5>
                                    <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                                        {assignment.topic}
                                    </p>
                                </div>

                                <span
                                    title={badge.exact}
                                    className={`shrink-0 rounded-md px-2 py-0.5 text-[10.5px] font-semibold cursor-help ${
                                        badge.isUrgent
                                            ? "border border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-300"
                                            : "border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                    }`}
                                >
                                    {badge.text}
                                </span>
                            </Link>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <p className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                                You&apos;re all caught up!
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                No deadlines ending in the next 7 days.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Teaching Staff */}
            {instructors.length > 0 && (
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/90">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Instructor
                    </span>

                    <div className="mt-3 space-y-3">
                        {instructors.map((inst) => (
                            <div key={inst.id} className="flex items-center gap-3">
                                <span
                                    className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white shadow-2xs ${avatarClassFor(
                                        inst.id
                                    )}`}
                                >
                                    {initialOf(inst.name)}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                                        {inst.name}
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {inst.role}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </aside>
    );
}

