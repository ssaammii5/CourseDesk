"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    Bell,
    Briefcase,
    CheckCircle2,
    GraduationCap,
    Lock,
    Mail,
    Shield,
    Sparkles,
    User,
} from "lucide-react";
import { currentUser, type CurrentUser } from "@/types";
import { SETTINGS_TABS, type SettingsTab } from "./constants";
import { ProfileCard } from "./ProfileCard";
import { SecurityCard } from "./SecurityCard";
import { NotificationsCard } from "./NotificationsCard";
import { initialOf, resolveAvatarUrl } from "@/lib/utils/format";

function normalizeTab(rawTab?: string | null): SettingsTab | null {
    if (!rawTab) return null;
    const lower = rawTab.toLowerCase().trim();
    if (lower === "notifications" || lower === "notification") return "notifications";
    if (lower === "security") return "security";
    if (lower === "profile") return "profile";
    return null;
}

export function SettingsView({
    user,
    userName = user?.name ?? currentUser.name,
    role = user?.role ?? currentUser.role,
    initialTab,
}: {
    user?: CurrentUser | null;
    userName?: string;
    role?: CurrentUser["role"];
    initialTab?: SettingsTab;
}) {
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const queryTab = normalizeTab(searchParams?.get("tab"));
    const activeTab = initialTab || queryTab || "profile";
    const [tab, setTab] = useState<SettingsTab>(activeTab);

    useEffect(() => {
        if (initialTab) {
            setTab(initialTab);
        } else if (queryTab && queryTab !== tab) {
            setTab(queryTab);
        }
    }, [initialTab, queryTab]);

    const handleTabChange = (newTab: SettingsTab) => {
        setTab(newTab);
        if (typeof window !== "undefined") {
            const nextUrl = `/settings?tab=${newTab}`;
            window.history.replaceState(null, "", nextUrl);
        }
    };

    const isInstructor = role === "Instructor";
    const isCoordinator = role === "Coordinator";
    const isAdmin = role === "Admin";
    const displayName = userName || user?.name || "User";
    const displayEmail = user?.email || "";
    const avatarUrl =
        user?.avatar ||
        (isInstructor
            ? (user?.instructorDetails?.avatar || (user?.instructorDetails as any)?.teacherDetails?.avatar)
            : isCoordinator
            ? user?.coordinatorDetails?.avatar
            : (user?.learnerDetails?.avatar || (user?.learnerDetails as any)?.studentDetails?.avatar));

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gray-50/50 pb-16 dark:bg-slate-950">
            {/* Top Brand Banner / Header */}
            <div className="border-b border-gray-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-8">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4 sm:gap-5">
                            {avatarUrl ? (
                                <img
                                    src={resolveAvatarUrl(avatarUrl)}
                                    alt={displayName}
                                    className="h-16 w-16 rounded-2xl object-cover border-2 border-gray-100 dark:border-slate-800 shadow-sm"
                                />
                            ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 text-2xl font-bold text-white shadow-md">
                                    {initialOf(displayName)}
                                </div>
                            )}

                            <div>
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
                                        Account Settings
                                    </h1>
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                            isAdmin
                                                ? "bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300"
                                                : isCoordinator || isInstructor
                                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300"
                                                : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300"
                                        }`}
                                    >
                                        {isAdmin ? (
                                            <Shield className="h-3.5 w-3.5" />
                                        ) : isCoordinator ? (
                                            <Briefcase className="h-3.5 w-3.5" />
                                        ) : isInstructor ? (
                                            <Briefcase className="h-3.5 w-3.5" />
                                        ) : (
                                            <GraduationCap className="h-3.5 w-3.5" />
                                        )}
                                        <span>{isCoordinator ? "Co-ordinator" : role}</span>
                                    </span>
                                </div>
                                <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                                    Manage your personal identity, login security, and notification preferences.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="mt-8 border-t border-gray-100 dark:border-slate-800/80 pt-4">
                        <nav className="flex gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
                            {SETTINGS_TABS.map((t) => {
                                const active = tab === t.id;
                                const Icon =
                                    t.id === "profile"
                                        ? User
                                        : t.id === "security"
                                        ? Shield
                                        : Bell;

                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => handleTabChange(t.id)}
                                        className={`cursor-pointer inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                                            active
                                                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span>{t.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="mx-auto w-full max-w-[1200px] px-4 pt-8 sm:px-8">
                {tab === "profile" && (
                    <ProfileCard user={user} userName={userName} readOnly={false} />
                )}
                {tab === "security" && <SecurityCard />}
                {tab === "notifications" && <NotificationsCard role={role} />}
            </div>
        </div>
    );
}