"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { calendarEvents } from "@/lib/calendarEvents";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

function fmt(d: Date): string {
    return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function CalendarView() {
    const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
    const [classFilter, setClassFilter] = useState("all");

    const days = useMemo(
        () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
        [weekStart],
    );
    const weekEnd = days[6];
    const today = new Date();

    const classOptions = useMemo(
        () => Array.from(new Set(calendarEvents.map((e) => e.courseName))),
        [],
    );

    const eventsFor = (day: Date) =>
        calendarEvents.filter(
            (e) => sameDay(e.date, day) && (classFilter === "all" || e.courseName === classFilter),
        );

    const weekHasEvents = days.some((d) => eventsFor(d).length > 0);

    const label =
        weekStart.getFullYear() === weekEnd.getFullYear()
            ? `${fmt(weekStart)} - ${fmt(weekEnd)}, ${weekEnd.getFullYear()}`
            : `${fmt(weekStart)}, ${weekStart.getFullYear()} - ${fmt(weekEnd)}, ${weekEnd.getFullYear()}`;

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-white">
            <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-8">
                {/* ---------- Controls ---------- */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Class filter */}
                    <div className="relative w-full max-w-[420px] rounded border border-gray-500/70 focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8]">
                        <select
                            value={classFilter}
                            onChange={(e) => setClassFilter(e.target.value)}
                            aria-label="Filter by class"
                            className="w-full appearance-none bg-transparent px-4 py-4 pr-10 text-[15px] text-gray-900 focus:outline-none"
                        >
                            <option value="all">All classes</option>
                            {classOptions.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-800" />
                    </div>

                    {/* Week navigation */}
                    <div className="flex min-w-0 items-center gap-1">
                        <button
                            type="button"
                            aria-label="Previous week"
                            onClick={() => setWeekStart((w) => addDays(w, -7))}
                            className="cursor-pointer rounded-full p-2 text-gray-700 hover:bg-gray-900/5"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <span
                            title={label}
                            className="min-w-0 flex-1 truncate text-center text-sm font-medium text-gray-900 sm:min-w-[220px] sm:flex-none sm:text-[15px]"
                        >
                            {label}
                        </span>
                        <button
                            type="button"
                            aria-label="Next week"
                            onClick={() => setWeekStart((w) => addDays(w, 7))}
                            className="cursor-pointer rounded-full p-2 text-gray-700 hover:bg-gray-900/5"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setWeekStart(startOfWeek(new Date()))}
                            className="ml-2 cursor-pointer rounded-full border border-gray-400 px-4 py-2 text-sm font-medium text-[#1a73e8] hover:bg-blue-50 sm:ml-3 sm:px-6"
                        >
                            Today
                        </button>
                    </div>
                </div>

                {/* ---------- Desktop: 7-column week grid (md and up) ---------- */}
                <div className="mt-6 hidden md:block">
                    <div className="overflow-x-auto">
                        <div className="grid min-w-[980px] grid-cols-7 overflow-hidden rounded-lg border border-gray-300">
                            {days.map((day, i) => {
                                const isToday = sameDay(day, today);
                                const dayEvents = eventsFor(day);
                                return (
                                    <div
                                        key={day.toISOString()}
                                        className={`flex min-h-[560px] flex-col bg-[#f8f9fa]/60 ${i > 0 ? "border-l border-gray-300" : ""
                                            }`}
                                    >
                                        {/* Day header */}
                                        <div className="flex flex-col items-center gap-1 border-b border-gray-200 py-3">
                                            <span className="text-sm text-gray-700">{DOW[day.getDay()]}</span>
                                            <span
                                                className={`flex h-10 w-10 items-center justify-center rounded-full text-2xl ${isToday ? "bg-[#1a73e8] font-medium text-white" : "text-gray-900"
                                                    }`}
                                            >
                                                {day.getDate()}
                                            </span>
                                        </div>

                                        {/* Events */}
                                        <div className="flex flex-1 flex-col gap-2 p-1.5">
                                            {dayEvents.map((e) => (
                                                <div
                                                    key={e.id}
                                                    title={`${e.title} (${e.courseName})`}
                                                    className={`cursor-pointer rounded px-2.5 py-2 text-white shadow-sm transition-opacity hover:opacity-90 ${e.color}`}
                                                >
                                                    <p className="text-sm font-medium leading-5">{e.title}</p>
                                                    <p className="mt-0.5 text-xs">{e.time}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ---------- Mobile: day-by-day agenda (below md) ---------- */}
                <div className="mt-6 md:hidden">
                    {!weekHasEvents ? (
                        <p className="py-16 text-center text-sm text-gray-600">
                            No events this week{classFilter !== "all" ? " for this class" : ""}.
                        </p>
                    ) : (
                        <div className="space-y-7">
                            {days.map((day) => {
                                const isToday = sameDay(day, today);
                                const dayEvents = eventsFor(day);
                                return (
                                    <section key={day.toISOString()}>
                                        {/* Day header */}
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${isToday ? "bg-[#1a73e8] font-medium text-white" : "text-gray-900"
                                                    }`}
                                            >
                                                {day.getDate()}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {DOW[day.getDay()]}
                                                    {isToday && <span className="ml-2 text-xs font-medium text-[#1a73e8]">Today</span>}
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    {MONTHS[day.getMonth()]} {day.getDate()}, {day.getFullYear()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Events for the day */}
                                        <div className="ml-5 mt-3 flex flex-col gap-2 border-l-2 border-gray-200 pl-4">
                                            {dayEvents.length === 0 ? (
                                                <p className="py-0.5 text-sm text-gray-500">No events</p>
                                            ) : (
                                                dayEvents.map((e) => (
                                                    <div
                                                        key={e.id}
                                                        className={`rounded-lg px-3.5 py-2.5 text-white shadow-sm ${e.color}`}
                                                    >
                                                        <p className="text-sm font-medium leading-5">{e.title}</p>
                                                        <p className="mt-0.5 truncate text-xs text-white/90">{e.courseName}</p>
                                                        <p className="mt-0.5 text-xs">{e.time}</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}