"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Sparkles,
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
    onOpenInviteLearner: () => void;
    onOpenInviteInstructor: () => void;
    onOpenInviteCoordinator: () => void;
    lastUpdated: Date;
    isRefreshing: boolean;
}

export function AdminHeroHeader({
    user,
    isCoordinator,
    onRefresh,
    onOpenNewCourse,
    onOpenInviteLearner,
    onOpenInviteInstructor,
    onOpenInviteCoordinator,
    lastUpdated,
    isRefreshing,
}: AdminHeroHeaderProps) {
    const router = useRouter();
    const { maintenanceMode, platformName } = useAppSettings();
    const [inviteMenuOpen, setInviteMenuOpen] = useState(false);
    const inviteMenuRef = useRef<HTMLDivElement>(null);

    // Close invite menu on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (inviteMenuRef.current && !inviteMenuRef.current.contains(event.target as Node)) {
                setInviteMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return "Good morning";
        if (hour >= 12 && hour < 17) return "Good afternoon";
        return "Good evening";
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
                                <>
                                    <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                    Coordinator Workspace
                                </>
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
                <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
                    {/* Primary Button: New Course */}
                    <button
                        type="button"
                        onClick={onOpenNewCourse}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-500/20 active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                        <span>New Course</span>
                    </button>

                    {/* Secondary Action: Invite Member Menu */}
                    <div className="relative" ref={inviteMenuRef}>
                        <button
                            type="button"
                            onClick={() => setInviteMenuOpen((v) => !v)}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80 active:scale-95"
                        >
                            <UserPlus className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            <span>Invite User</span>
                            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                        </button>

                        {inviteMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in zoom-in-95">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setInviteMenuOpen(false);
                                        onOpenInviteLearner();
                                    }}
                                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    <span>Invite Learner / Student</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setInviteMenuOpen(false);
                                        onOpenInviteInstructor();
                                    }}
                                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <span>Invite Instructor</span>
                                </button>
                                {!isCoordinator && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setInviteMenuOpen(false);
                                            onOpenInviteCoordinator();
                                        }}
                                        className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                        <UserCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        <span>Invite Coordinator</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Assignment Shortcut */}
                    <button
                        type="button"
                        onClick={() => router.push("/assignments")}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80 active:scale-95"
                    >
                        <FilePlus2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <span className="hidden sm:inline">Assignments</span>
                    </button>

                    {/* App Settings Shortcut */}
                    {!isCoordinator && (
                        <button
                            type="button"
                            onClick={() => router.push("/app-settings")}
                            aria-label="Platform Settings"
                            className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80 active:scale-95"
                        >
                            <Settings className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}
