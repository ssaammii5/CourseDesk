"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
    CalendarDays,
    Clock,
    GraduationCap,
    ListTodo,
    Users,
} from "lucide-react";
import type { CurrentUser } from "@/types";

interface HomeHeroBannerProps {
    user: CurrentUser | null;
    isInstructor: boolean;
    courseCount: number;
    pendingCount: number;
    completedCount: number;
}

export function HomeHeroBanner({
    user,
    isInstructor,
    courseCount,
    pendingCount,
}: HomeHeroBannerProps) {
    const [greeting, setGreeting] = useState(() => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    });

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good morning");
        else if (hour < 17) setGreeting("Good afternoon");
        else setGreeting("Good evening");
    }, []);

    const currentDate = useMemo(() => {
        return new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
        });
    }, []);

    const firstName = user?.name ? user.name.trim().split(" ")[0] : "there";

    return (
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/50 p-6 shadow-xs transition-all dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900/95 dark:to-blue-950/30 sm:p-8">
            {/* Ambient background glows */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/15" />
            <div className="pointer-events-none absolute -bottom-16 right-1/4 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/15" />

            <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
                {/* Left column: Greetings & Context */}
                <div className="max-w-2xl space-y-2.5">
                    {/* Top tags row */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/70 bg-blue-100/70 px-3 py-1 text-xs font-semibold text-blue-800 backdrop-blur-md dark:border-blue-800/80 dark:bg-blue-950/80 dark:text-blue-300">
                            {isInstructor ? (
                                <>
                                    <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                    Instructor Workspace
                                </>
                            ) : (
                                <>
                                    <GraduationCap className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                    Learner Portal
                                </>
                            )}
                        </span>

                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/60 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700/80 dark:bg-slate-800/90 dark:text-slate-300">
                            <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
                            {currentDate}
                        </span>
                    </div>

                    {/* Main Greeting */}
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-4xl">
                        {greeting},{" "}
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
                            {firstName}
                        </span>
                    </h1>

                    {/* Personalized Context Subtitle */}
                    <p className="text-sm font-normal text-slate-600 dark:text-slate-300 sm:text-base">
                        {isInstructor ? (
                            pendingCount > 0 ? (
                                <>
                                    You have{" "}
                                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                                        {pendingCount} submission{pendingCount === 1 ? "" : "s"}
                                    </span>{" "}
                                    waiting for review across your {courseCount} active course
                                    {courseCount === 1 ? "" : "s"}.
                                </>
                            ) : (
                                <>
                                    All reviews are up to date! Managing{" "}
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        {courseCount} active course{courseCount === 1 ? "" : "s"}
                                    </span>
                                    .
                                </>
                            )
                        ) : pendingCount > 0 ? (
                            <>
                                You have{" "}
                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                    {pendingCount} assignment{pendingCount === 1 ? "" : "s"}
                                </span>{" "}
                                due soon across your {courseCount} enrolled course
                                {courseCount === 1 ? "" : "s"}.
                            </>
                        ) : (
                            <>
                                You&apos;re completely caught up on your assignments across {courseCount}{" "}
                                enrolled course{courseCount === 1 ? "" : "s"}!
                            </>
                        )}
                    </p>
                </div>

                {/* Right column: Quick Navigation Shortcuts */}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                    <Link
                        href="/todo"
                        className="group inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/90 px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-xs backdrop-blur-sm transition-all hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700 hover:shadow-xs dark:border-slate-700/80 dark:bg-slate-850 dark:bg-slate-800/90 dark:text-slate-100 dark:hover:border-blue-700 dark:hover:bg-slate-800 dark:hover:text-blue-300"
                    >
                        <ListTodo className="h-4 w-4 text-blue-600 transition-transform group-hover:scale-110 dark:text-blue-400" />
                        <span>{isInstructor ? "To-Review" : "To-Do List"}</span>
                        {pendingCount > 0 && (
                            <span className="ml-0.5 rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-xs dark:bg-blue-500">
                                {pendingCount}
                            </span>
                        )}
                    </Link>

                    <Link
                        href="/calendar"
                        className="group inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/90 px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-xs backdrop-blur-sm transition-all hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-700 hover:shadow-xs dark:border-slate-700/80 dark:bg-slate-800/90 dark:text-slate-100 dark:hover:border-indigo-700 dark:hover:bg-slate-800 dark:hover:text-indigo-300"
                    >
                        <CalendarDays className="h-4 w-4 text-indigo-600 transition-transform group-hover:scale-110 dark:text-indigo-400" />
                        <span>Schedule & Calendar</span>
                    </Link>
                </div>
            </div>
        </section>
    );
}
