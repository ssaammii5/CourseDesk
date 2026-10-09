"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Shield,
    Plus,
    UserPlus,
    FilePlus2,
    Settings,
    RefreshCw,
    Activity,
    AlertTriangle,
    ChevronDown,
    GraduationCap,
    Users,
    UserCheck,
} from "lucide-react";
import type { CurrentUser } from "@/types";
import { useAppSettings } from "@/context";

interface AdminHeroHeaderProps {
    user: CurrentUser | null;
    isCoordinator: boolean;
    onRefresh: () => Promise<void>;
    onOpenNewCourse: () => void;
    onOpenInviteUser: () => void;
    lastUpdated: Date;
    isRefreshing: boolean;
}

export function AdminHeroHeader({
    user,
    isCoordinator,
    onRefresh,
    onOpenNewCourse,
    onOpenInviteUser,
    lastUpdated,
    isRefreshing,
}: AdminHeroHeaderProps) {
    const router = useRouter();
    const { maintenanceMode, platformName } = useAppSettings();

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

    const formattedTime = useMemo(() => {
        return lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }, [lastUpdated]);

    const firstName = user?.name ? user.name.trim().split(" ")[0] : "Admin";

    return (
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/60 to-blue-50/40 p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900/95 dark:to-blue-950/25">
            {/* Ambient background glows */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/15" />
            <div className="pointer-events-none absolute -bottom-16 right-1/3 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/15" />

            <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                {/* Left Column: Greeting, Role & System Status */}
                <div className="max-w-2xl space-y-3">
                    {/* Status & Role Chips */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/70 bg-blue-100/70 px-3 py-1 text-xs font-semibold text-blue-800 backdrop-blur-md dark:border-blue-800/80 dark:bg-blue-950/80 dark:text-blue-300">
                            {isCoordinator ? (
                                "Coordinator Workspace"
                            ) : (
                                <>
                                    <Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                    Executive Administrator Hub
                                </>
                            )}
                        </span>

                        {maintenanceMode ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/80 bg-amber-100/80 px-3 py-1 text-xs font-semibold text-amber-900 dark:border-amber-800/80 dark:bg-amber-950/80 dark:text-amber-300">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                Maintenance Mode Active
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-800/80 dark:bg-emerald-950/80 dark:text-emerald-300">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                                </span>
                                System Operational
                            </span>
                        )}

                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/60 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700/80 dark:bg-slate-800/90 dark:text-slate-300">
                            <Activity className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                            {platformName || "CourseDesk"} LMS
                        </span>
                    </div>

                    {/* Headline Greeting */}
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                            {greeting}, {firstName}!
                        </h1>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                            {isCoordinator
                                ? "Manage your assigned academic programs, oversee course syllabus, and track student grading pipelines in real time."
                                : "Welcome to the centralized administration portal. Monitor platform performance, manage faculties and students, and orchestrate curriculum delivery."}
                        </p>
                    </div>

                    {/* Live Sync Timestamp */}
                    <div className="flex items-center gap-3 pt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        <span>Updated at {formattedTime}</span>
                        <span>•</span>
                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            className="inline-flex cursor-pointer items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
                            <span>{isRefreshing ? "Syncing..." : "Sync Live Data"}</span>
                        </button>
                    </div>
                </div>

                {/* Right Column: Quick Action Ribbon */}
                <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 overflow-x-auto no-scrollbar self-start lg:self-center">
                    {/* Primary Button: New Course */}
                    <button
                        type="button"
                        onClick={onOpenNewCourse}
                        className="inline-flex h-10 cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl bg-blue-600 px-3.5 sm:px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-500/20 active:scale-95 shrink-0"
                    >
                        <Plus className="h-4 w-4 shrink-0" />
                        <span>New Course</span>
                    </button>

                    {/* Secondary Action: Invite User */}
                    <button
                        type="button"
                        onClick={onOpenInviteUser}
                        className="group inline-flex h-10 cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3.5 sm:px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-white active:scale-95 shrink-0"
                    >
                        <UserPlus className="h-4 w-4 shrink-0 text-slate-500 transition-colors group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white" />
                        <span>Invite User</span>
                    </button>

                    {/* Assignment Shortcut */}
                    <button
                        type="button"
                        onClick={() => router.push("/assignments")}
                        className="group inline-flex h-10 cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3.5 sm:px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-white active:scale-95 shrink-0"
                    >
                        <FilePlus2 className="h-4 w-4 shrink-0 text-slate-500 transition-colors group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white" />
                        <span>Assignments</span>
                    </button>

                    {/* App Settings Shortcut */}
                    {!isCoordinator && (
                        <button
                            type="button"
                            onClick={() => router.push("/app-settings")}
                            aria-label="Platform Settings"
                            title="Platform Settings"
                            className="group inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-white active:scale-95 shrink-0"
                        >
                            <Settings className="h-4 w-4 shrink-0 text-slate-500 transition-colors group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white" />
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}
