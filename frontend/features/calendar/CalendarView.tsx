"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    CalendarDays,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    FileText,
    HelpCircle,
    Video,
    Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAssignmentsRequest, type AssignmentDto } from "@/lib/api/assignments";
import { getMyCoursesRequest, type CourseDto } from "@/lib/api/courses";
import { getCourseSessionsRequest } from "@/lib/api/sessions";
import type { SessionDto } from "@/types/session";
import { headerColorFor } from "@/lib/utils/theme";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface CalendarEventItem {
    id: string;
    sourceId: number;
    title: string;
    courseId: number;
    courseName: string;
    date: Date;
    time: string;
    kind: "assignment" | "quiz" | "material" | "session";
    link: string;
    status?: string | null;
}

function startOfWeek(d: Date): Date {
    const c = new Date(d);
    c.setDate(c.getDate() - c.getDay());
    c.setHours(0, 0, 0, 0);
    return c;
}

function addDays(d: Date, n: number): Date {
    const c = new Date(d);
    c.setDate(c.getDate() + n);
    return c;
}

function sameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function fmtShort(d: Date): string {
    return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

function formatEventTime(d: Date): string {
    return d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    });
}

export function CalendarView() {
    const router = useRouter();
    const { user } = useAuth();
    const isAdmin = user?.role === "Admin";

    const [viewMode, setViewMode] = useState<"week" | "month">("week");
    const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
    const [courseFilter, setCourseFilter] = useState<string>("all");

    const [courses, setCourses] = useState<CourseDto[]>([]);
    const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
    const [sessions, setSessions] = useState<SessionDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        Promise.all([
            getMyCoursesRequest().catch(() => [] as CourseDto[]),
            getAssignmentsRequest().catch(() => [] as AssignmentDto[]),
        ])
            .then(async ([userCourses, userAssignments]) => {
                if (cancelled) return;
                setCourses(userCourses);
                setAssignments(userAssignments);

                try {
                    const sessionPromises = userCourses.map((c) =>
                        getCourseSessionsRequest(c.id).catch(() => [] as SessionDto[])
                    );
                    const courseSessions = await Promise.all(sessionPromises);
                    if (!cancelled) {
                        setSessions(courseSessions.flat());
                    }
                } catch {
                    // ignore session errors gracefully
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const events = useMemo<CalendarEventItem[]>(() => {
        const courseMap = new Map<number, string>();
        courses.forEach((c) => courseMap.set(c.id, c.name));

        const items: CalendarEventItem[] = [];

        for (const a of assignments) {
            if (!a.deadlineUtc) continue;
            const d = new Date(a.deadlineUtc);
            if (isNaN(d.getTime())) continue;

            const cName = a.courseName || courseMap.get(a.courseId) || "Course";
            const kindLower = (a.kind || "assignment").toLowerCase();
            const link = `/course/${a.courseId}/assignments/${a.id}`;

            items.push({
                id: `assignment-${a.id}`,
                sourceId: a.id,
                title: a.title,
                courseId: a.courseId,
                courseName: cName,
                date: d,
                time: formatEventTime(d),
                kind: kindLower === "quiz" ? "quiz" : kindLower === "material" ? "material" : "assignment",
                link,
                status: a.mySubmissionStatus,
            });
        }

        for (const s of sessions) {
            if (!s.scheduledAtUtc) continue;
            const d = new Date(s.scheduledAtUtc);
            if (isNaN(d.getTime())) continue;

            const cName = courseMap.get(s.courseId) || "Course";
            items.push({
                id: `session-${s.id}`,
                sourceId: s.id,
                title: s.title,
                courseId: s.courseId,
                courseName: cName,
                date: d,
                time: formatEventTime(d),
                kind: "session",
                link: `/course/${s.courseId}?tab=curriculum`,
                status: s.status,
            });
        }

        return items;
    }, [assignments, sessions, courses, isAdmin]);

    // Filter events by selected course
    const filteredEvents = useMemo(() => {
        if (courseFilter === "all") return events;
        const filterCourseId = Number(courseFilter);
        return events.filter((e) => e.courseId === filterCourseId);
    }, [events, courseFilter]);

    const eventsForDay = (day: Date) =>
        filteredEvents.filter((e) => sameDay(e.date, day));

    // Week view days
    const weekStart = useMemo(() => startOfWeek(currentDate), [currentDate]);
    const weekDays = useMemo(
        () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
        [weekStart]
    );
    const weekEnd = weekDays[6];

    // Month view days
    const monthDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const startDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday
        const startDate = addDays(firstDayOfMonth, -startDayOfWeek);

        // Generate 5 or 6 weeks (35 or 42 days)
        const daysCount = 42;
        return Array.from({ length: daysCount }, (_, i) => {
            const d = addDays(startDate, i);
            return {
                date: d,
                isCurrentMonth: d.getMonth() === month,
            };
        });
    }, [currentDate]);

    const today = new Date();

    const weekHasEvents = weekDays.some((d) => eventsForDay(d).length > 0);
    const monthHasEvents = filteredEvents.some(
        (e) =>
            e.date.getFullYear() === currentDate.getFullYear() &&
            e.date.getMonth() === currentDate.getMonth()
    );

    // Header label
    const headerLabel = useMemo(() => {
        if (viewMode === "month") {
            return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        }
        return weekStart.getFullYear() === weekEnd.getFullYear()
            ? `${fmtShort(weekStart)} – ${fmtShort(weekEnd)}, ${weekEnd.getFullYear()}`
            : `${fmtShort(weekStart)}, ${weekStart.getFullYear()} – ${fmtShort(weekEnd)}, ${weekEnd.getFullYear()}`;
    }, [viewMode, currentDate, weekStart, weekEnd]);

    const handlePrev = () => {
        if (viewMode === "week") {
            setCurrentDate((d) => addDays(d, -7));
        } else {
            setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
        }
    };

    const handleNext = () => {
        if (viewMode === "week") {
            setCurrentDate((d) => addDays(d, 7));
        } else {
            setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
        }
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const renderEventIcon = (kind: CalendarEventItem["kind"]) => {
        switch (kind) {
            case "quiz":
                return <HelpCircle className="h-3.5 w-3.5 shrink-0" />;
            case "session":
                return <Video className="h-3.5 w-3.5 shrink-0" />;
            case "material":
                return <FileText className="h-3.5 w-3.5 shrink-0" />;
            default:
                return <ClipboardList className="h-3.5 w-3.5 shrink-0" />;
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-white dark:bg-slate-950">
            <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-8">
                {/* ---------- Header Controls ---------- */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Class filter */}
                    <div className="relative w-full max-w-[360px] rounded-xl border border-gray-300 bg-white shadow-2xs focus-within:border-[#1a73e8] focus-within:ring-2 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:ring-blue-900/30">
                        <select
                            value={courseFilter}
                            onChange={(e) => setCourseFilter(e.target.value)}
                            aria-label="Filter by course"
                            className="w-full appearance-none bg-transparent px-4 py-3 pr-10 text-sm font-medium text-gray-800 focus:outline-none dark:text-slate-100"
                        >
                            <option value="all" className="bg-white text-gray-900 dark:bg-slate-900 dark:text-slate-100">All courses</option>
                            {courses.map((c) => (
                                <option key={c.id} value={c.id} className="bg-white text-gray-900 dark:bg-slate-900 dark:text-slate-100">
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-slate-400" />
                    </div>

                    {/* View Switcher and Navigation */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                        {/* Week / Month Toggle */}
                        <div className="inline-flex rounded-xl border border-gray-200 bg-gray-100/80 p-1 dark:border-slate-800 dark:bg-slate-900">
                            <button
                                type="button"
                                onClick={() => setViewMode("week")}
                                className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${viewMode === "week"
                                    ? "bg-white text-[#1a73e8] shadow-xs dark:bg-slate-800 dark:text-blue-400"
                                    : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
                                    }`}
                            >
                                Week
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode("month")}
                                className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${viewMode === "month"
                                    ? "bg-white text-[#1a73e8] shadow-xs dark:bg-slate-800 dark:text-blue-400"
                                    : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
                                    }`}
                            >
                                Month
                            </button>
                        </div>

                        {/* Navigation arrows & label */}
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                aria-label="Previous"
                                onClick={handlePrev}
                                className="cursor-pointer rounded-full p-2 text-gray-700 hover:bg-gray-100 transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <span
                                title={headerLabel}
                                className="min-w-[170px] text-center text-sm font-semibold text-gray-900 dark:text-slate-100 sm:text-[15px]"
                            >
                                {headerLabel}
                            </span>
                            <button
                                type="button"
                                aria-label="Next"
                                onClick={handleNext}
                                className="cursor-pointer rounded-full p-2 text-gray-700 hover:bg-gray-100 transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                            <button
                                type="button"
                                onClick={handleToday}
                                className="ml-1 cursor-pointer rounded-full border border-gray-300 px-4 py-1.5 text-xs font-semibold text-[#1a73e8] hover:bg-blue-50/60 transition-colors dark:border-slate-700 dark:text-blue-400 dark:hover:bg-blue-950/40"
                            >
                                Today
                            </button>
                        </div>
                    </div>
                </div>

                {/* ---------- Loading State ---------- */}
                {loading && (
                    <div className="mt-8 flex flex-col items-center justify-center py-20">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
                        <p className="mt-3 text-sm font-medium text-gray-500">Loading your schedule...</p>
                    </div>
                )}

                {/* ---------- DESKTOP / TABLET: Week View ---------- */}
                {!loading && viewMode === "week" && (
                    <div className="mt-6 hidden md:block">
                        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="grid min-w-[980px] grid-cols-7 divide-x divide-gray-200 dark:divide-slate-800">
                                {weekDays.map((day) => {
                                    const isToday = sameDay(day, today);
                                    const dayEvents = eventsForDay(day);
                                    return (
                                        <div
                                            key={day.toISOString()}
                                            className={`flex min-h-[580px] flex-col transition-colors ${isToday ? "bg-blue-50/20 dark:bg-blue-950/20" : "bg-white dark:bg-slate-900"
                                                }`}
                                        >
                                            {/* Day header */}
                                            <div
                                                className={`flex flex-col items-center gap-1 border-b border-gray-200 py-3.5 dark:border-slate-800 ${isToday ? "bg-blue-50/40 dark:bg-blue-950/30" : "bg-gray-50/60 dark:bg-slate-800/40"
                                                    }`}
                                            >
                                                <span
                                                    className={`text-xs font-semibold uppercase tracking-wider ${isToday ? "text-[#1a73e8] dark:text-blue-400" : "text-gray-500 dark:text-slate-400"
                                                        }`}
                                                >
                                                    {DOW[day.getDay()]}
                                                </span>
                                                <span
                                                    className={`flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold transition-colors ${isToday
                                                        ? "bg-[#1a73e8] text-white shadow-sm"
                                                        : "text-gray-900 dark:text-slate-100"
                                                        }`}
                                                >
                                                    {day.getDate()}
                                                </span>
                                            </div>

                                            {/* Events column */}
                                            <div className="flex flex-1 flex-col gap-2 p-2">
                                                {dayEvents.map((e) => {
                                                    const color = headerColorFor(e.courseId);
                                                    return (
                                                        <button
                                                            key={e.id}
                                                            type="button"
                                                            onClick={() => router.push(e.link)}
                                                            title={`${e.title}\n${e.courseName}\nDue: ${e.time}`}
                                                            style={{ borderLeftColor: color }}
                                                            className="group flex w-full cursor-pointer flex-col gap-1 rounded-xl border border-gray-200/90 border-l-[4px] bg-white p-2.5 text-left shadow-2xs transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md active:translate-y-0 dark:border-slate-800 dark:bg-slate-800 dark:hover:border-slate-700"
                                                        >
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <span
                                                                    style={{ color }}
                                                                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gray-50 dark:bg-slate-700/60"
                                                                >
                                                                    {renderEventIcon(e.kind)}
                                                                </span>
                                                                <span className="truncate text-xs font-semibold text-gray-900 group-hover:text-[#1a73e8] dark:text-slate-100 dark:group-hover:text-blue-400">
                                                                    {e.title}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-1 pl-6 text-[11px] text-gray-500 dark:text-slate-400">
                                                                <span
                                                                    className="truncate max-w-[100px]"
                                                                    title={e.courseName}
                                                                >
                                                                    {e.courseName}
                                                                </span>
                                                                <span className="shrink-0 font-medium text-gray-700 dark:text-slate-300">
                                                                    {e.time}
                                                                </span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ---------- DESKTOP / TABLET: Month View ---------- */}
                {!loading && viewMode === "month" && (
                    <div className="mt-6 hidden md:block">
                        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="min-w-[980px]">
                                {/* Weekday header row */}
                                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/80 dark:border-slate-800 dark:bg-slate-800/60">
                                    {DOW.map((d) => (
                                        <div
                                            key={d}
                                            className="py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-400"
                                        >
                                            {d}
                                        </div>
                                    ))}
                                </div>

                                {/* Month grid */}
                                <div className="grid grid-cols-7 divide-x divide-y divide-gray-200 dark:divide-slate-800">
                                    {monthDays.map(({ date, isCurrentMonth }) => {
                                        const isToday = sameDay(date, today);
                                        const dayEvents = eventsForDay(date);

                                        return (
                                            <div
                                                key={date.toISOString()}
                                                className={`flex min-h-[110px] flex-col p-1.5 transition-colors ${!isCurrentMonth
                                                    ? "bg-gray-50/50 text-gray-400 dark:bg-slate-950/40 dark:text-slate-600"
                                                    : isToday
                                                        ? "bg-blue-50/25 dark:bg-blue-950/20"
                                                        : "bg-white dark:bg-slate-900"
                                                    }`}
                                            >
                                                {/* Date number */}
                                                <div className="flex items-center justify-end pb-1">
                                                    <span
                                                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${isToday
                                                            ? "bg-[#1a73e8] text-white shadow-xs"
                                                            : isCurrentMonth
                                                                ? "text-gray-800 dark:text-slate-200"
                                                                : "text-gray-400 dark:text-slate-600"
                                                            }`}
                                                    >
                                                        {date.getDate()}
                                                    </span>
                                                </div>

                                                {/* Day events pills */}
                                                <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                                                    {dayEvents.slice(0, 3).map((e) => {
                                                        const color = headerColorFor(e.courseId);
                                                        return (
                                                            <button
                                                                key={e.id}
                                                                type="button"
                                                                onClick={() => router.push(e.link)}
                                                                title={`${e.title}\n${e.courseName}\nDue: ${e.time}`}
                                                                style={{ borderLeftColor: color }}
                                                                className="group flex w-full cursor-pointer items-center gap-1.5 truncate rounded-md border border-gray-200 border-l-[3px] bg-white px-2 py-1 text-left shadow-2xs transition-all hover:border-gray-300 hover:bg-blue-50/40 hover:shadow-xs dark:border-slate-800 dark:bg-slate-800/90 dark:hover:border-slate-700 dark:hover:bg-slate-700/60"
                                                            >
                                                                <span style={{ color }}>
                                                                    {renderEventIcon(e.kind)}
                                                                </span>
                                                                <span className="truncate text-[11px] font-medium text-gray-900 group-hover:text-[#1a73e8] dark:text-slate-100 dark:group-hover:text-blue-400">
                                                                    {e.title}
                                                                </span>
                                                                <span className="ml-auto shrink-0 text-[10px] font-medium text-gray-500 dark:text-slate-400">
                                                                    {e.time}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                    {dayEvents.length > 3 && (
                                                        <span className="px-1 text-[10px] font-semibold text-gray-500 dark:text-slate-400">
                                                            +{dayEvents.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ---------- MOBILE: Day-by-Day Agenda View (below md) ---------- */}
                {!loading && (
                    <div className="mt-6 md:hidden">
                        {((viewMode === "week" && !weekHasEvents) ||
                            (viewMode === "month" && !monthHasEvents)) ? (
                            <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-8 text-center dark:border-slate-800 dark:bg-slate-900">
                                <CalendarDays className="mx-auto h-8 w-8 text-gray-400 dark:text-slate-500" />
                                <p className="mt-2 text-sm font-semibold text-gray-800 dark:text-slate-200">
                                    No events scheduled
                                </p>
                                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                    No assignments or sessions due during this {viewMode}.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {(viewMode === "week" ? weekDays : monthDays.map((m) => m.date))
                                    .filter((day) => eventsForDay(day).length > 0 || sameDay(day, today))
                                    .map((day) => {
                                        const isToday = sameDay(day, today);
                                        const dayEvents = eventsForDay(day);

                                        return (
                                            <section key={day.toISOString()}>
                                                {/* Day header */}
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-semibold ${isToday
                                                            ? "bg-[#1a73e8] text-white shadow-sm"
                                                            : "bg-gray-100 text-gray-900 dark:bg-slate-800 dark:text-slate-100"
                                                            }`}
                                                    >
                                                        {day.getDate()}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                                                            {DOW[day.getDay()]}
                                                            {isToday && (
                                                                <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-[#1a73e8] dark:bg-blue-950/80 dark:text-blue-300">
                                                                    Today
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-slate-400">
                                                            {MONTHS[day.getMonth()]} {day.getDate()},{" "}
                                                            {day.getFullYear()}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Events list */}
                                                <div className="ml-4 mt-3 flex flex-col gap-2.5 border-l-2 border-gray-200 pl-4 dark:border-slate-800">
                                                    {dayEvents.length === 0 ? (
                                                        <p className="py-1 text-xs text-gray-400 dark:text-slate-500">
                                                            No assignments due
                                                        </p>
                                                    ) : (
                                                        dayEvents.map((e) => {
                                                            const color = headerColorFor(e.courseId);
                                                            return (
                                                                <button
                                                                    key={e.id}
                                                                    type="button"
                                                                    onClick={() => router.push(e.link)}
                                                                    style={{ borderLeftColor: color }}
                                                                    className="flex w-full cursor-pointer flex-col gap-1 rounded-xl border border-gray-200 border-l-[4px] bg-white p-3.5 text-left shadow-2xs transition-all active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <span style={{ color }}>
                                                                            {renderEventIcon(e.kind)}
                                                                        </span>
                                                                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-slate-100">
                                                                            {e.title}
                                                                        </p>
                                                                    </div>
                                                                    <p className="truncate pl-6 text-xs text-gray-500 dark:text-slate-400">
                                                                        {e.courseName}
                                                                    </p>
                                                                    <div className="flex items-center gap-1 pl-6 pt-1 text-xs font-medium text-gray-700 dark:text-slate-300">
                                                                        <Clock className="h-3.5 w-3.5 text-gray-400 dark:text-slate-500" />
                                                                        <span>Due {e.time}</span>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </section>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}