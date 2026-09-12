"use client";

import { useState } from "react";
import {
    Bell,
    CalendarDays,
    ChevronRight,
    ClipboardList,
    GraduationCap,
    LogOut,
    Menu,
    MessageSquare,
    Settings,
    Star,
    X,
    type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IconButton } from "@/components/ui/IconButton";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ROLE_STYLES } from "@/lib/currentUser";
import { homeClasses, sidebarClasses } from "@/lib/mock-data";
import { initialOf } from "@/lib/schemas";

interface TopBarProps {
    onMenuClick: () => void;
}

interface NotificationItem {
    id: number;
    kind: "assignment" | "comment" | "due" | "grade";
    title: string;
    time: string;
}

const NOTIFICATION_META: Record<
    NotificationItem["kind"],
    { icon: LucideIcon; classes: string }
> = {
    assignment: { icon: ClipboardList, classes: "bg-[#d7e3fd] text-[#174ea6]" },
    comment: { icon: MessageSquare, classes: "bg-[#ceead6] text-[#137333]" },
    due: { icon: CalendarDays, classes: "bg-[#fef7e0] text-[#b06000]" },
    grade: { icon: Star, classes: "bg-[#fce8e6] text-[#c5221f]" },
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
    { id: 1, kind: "assignment", title: "New assignment: CIT-6105 Research Assignment", time: "2 hours ago" },
    { id: 2, kind: "comment", title: "Md. Mahbubur Rahman commented on your submission", time: "6 hours ago" },
    { id: 3, kind: "due", title: "Lab 1 - Substitution Cipher is due tomorrow at 11:59 PM", time: "1 day ago" },
    { id: 4, kind: "grade", title: "Quiz 1 - Classical Ciphers graded: 9/10", time: "2 days ago" },
];

export function TopBar({ onMenuClick }: TopBarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const [accountOpen, setAccountOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

    const classMatch = pathname.match(/^\/class\/(\d+)/);
    const classCourse = classMatch
        ? homeClasses.find((c) => c.id === Number(classMatch[1])) ??
        sidebarClasses.find((c) => c.id === Number(classMatch[1]))
        : undefined;
    const classSub = classCourse
        ? "subject" in classCourse ? classCourse.subject : classCourse.sub
        : undefined;

    const isTodo = pathname.startsWith("/todo");
    const isCalendar = pathname.startsWith("/calendar");
    const isSettings = pathname.startsWith("/settings");
    const isAppSettings = pathname === "/app-settings";
    const isTeachers = pathname === "/teachers";
    const isStudents = pathname === "/students";
    const isCourses = pathname === "/courses";
    const isAcademics = pathname === "/academics";
    const isAssignments = pathname === "/assignments";
    const isSubmissions = pathname === "/submissions";
    const isAdminPage = isTeachers || isStudents || isCourses || isAcademics || isAssignments || isSubmissions || isAppSettings;

    const toggleAccount = () => { setNotifOpen(false); setAccountOpen((v) => !v); };
    const toggleNotif = () => { setAccountOpen(false); setNotifOpen((v) => !v); };

    const handleLogout = async () => {
        setAccountOpen(false);
        await logout();
        router.push("/login");
    };

    const displayName = user?.name ?? "";
    const displayEmail = user?.email ?? "";
    const displayRole = user?.role ?? "Student";
    const avatarClass = user?.avatarClass ?? "bg-gray-600";

    return (
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-white px-3 sm:px-4">
            {/* Left side */}
            <div className="flex min-w-0 items-center gap-1">
                <IconButton label="Open menu" onClick={onMenuClick}>
                    <Menu className="h-6 w-6" />
                </IconButton>
                <Link href="/" className="ml-1 flex shrink-0 items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#188038]">
                        <GraduationCap className="h-6 w-6 text-white" />
                    </span>
                    <span className="text-[22px] text-gray-700 max-sm:hidden">Classroom</span>
                </Link>

                {/* Class breadcrumb */}
                {classCourse && (
                    <Link
                        href={`/class/${classCourse.id}`}
                        title={classCourse.name}
                        className="flex min-w-0 items-center rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-gray-900/5"
                    >
                        <ChevronRight className="mx-1 h-5 w-5 shrink-0 text-gray-500" />
                        <span className="min-w-0">
                            <span className="block truncate text-[15px] font-medium text-gray-800">{classCourse.name}</span>
                            {classSub && <span className="block truncate text-xs text-gray-600">{classSub}</span>}
                        </span>
                    </Link>
                )}

                {/* Page breadcrumbs */}
                {isTodo && (
                    <span className="flex min-w-0 items-center">
                        <ChevronRight className="mx-1 h-5 w-5 shrink-0 text-gray-500" />
                        <span className="truncate text-[15px] font-medium text-gray-800">To-do</span>
                    </span>
                )}
                {isCalendar && (
                    <span className="flex min-w-0 items-center">
                        <ChevronRight className="mx-1 h-5 w-5 shrink-0 text-gray-500" />
                        <span className="truncate text-[15px] font-medium text-gray-800">Calendar</span>
                    </span>
                )}
                {isSettings && (
                    <span className="flex min-w-0 items-center">
                        <ChevronRight className="mx-1 h-5 w-5 shrink-0 text-gray-500" />
                        <span className="truncate text-[15px] font-medium text-gray-800">Settings</span>
                    </span>
                )}
                {isAdminPage && (
                    <span className="flex min-w-0 items-center">
                        <ChevronRight className="mx-1 h-5 w-5 shrink-0 text-gray-500" />
                        <span className="truncate text-[15px] font-medium text-gray-800">
                            {isTeachers && "Manage Teachers"}
                            {isStudents && "Manage Students"}
                            {isCourses && "Manage Courses"}
                            {isAcademics && "Academics"}
                            {isAssignments && "All Assignments"}
                            {isSubmissions && "All Submissions"}
                            {isAppSettings && "App Settings"}
                        </span>
                    </span>
                )}
            </div>

            {/* Right side */}
            <div className="flex shrink-0 items-center gap-1">
                {/* Notifications */}
                <div className="relative">
                    <button
                        type="button"
                        aria-label="Notifications"
                        onClick={toggleNotif}
                        className={`relative z-50 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-900/10 ${notifOpen ? "bg-gray-900/10" : ""}`}
                    >
                        <Bell className="h-6 w-6" />
                        {notifications.length > 0 && (
                            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d93025] px-1 text-[10px] font-medium text-white">
                                {notifications.length}
                            </span>
                        )}
                    </button>
                    {notifOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                            <div className="absolute right-0 top-full z-50 mt-2 w-[380px] overflow-hidden rounded-2xl bg-[#e9eef4] shadow-xl max-sm:fixed max-sm:inset-x-2 max-sm:top-[4.5rem] max-sm:mt-0 max-sm:w-auto">
                                <div className="flex items-center justify-between px-5 py-4">
                                    <span className="text-base font-medium text-gray-900">Notifications</span>
                                    <button
                                        type="button"
                                        disabled={notifications.length === 0}
                                        onClick={() => setNotifications([])}
                                        className="cursor-pointer text-sm font-medium text-[#1a73e8] hover:underline disabled:cursor-default disabled:text-gray-500 disabled:no-underline"
                                    >
                                        Clear all
                                    </button>
                                </div>
                                <div className="max-h-[420px] overflow-y-auto border-t border-gray-300/60 max-sm:max-h-[min(26.25rem,calc(100dvh-9rem))]">
                                    {notifications.length === 0 ? (
                                        <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                                            <Bell className="h-8 w-8 text-gray-400" />
                                            <p className="text-sm text-gray-600">No new notifications</p>
                                        </div>
                                    ) : (
                                        <ul className="divide-y divide-gray-300/50">
                                            {notifications.map((n) => {
                                                const meta = NOTIFICATION_META[n.kind];
                                                const Icon = meta.icon;
                                                return (
                                                    <li key={n.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setNotifOpen(false)}
                                                            className="flex w-full cursor-pointer items-start gap-4 px-5 py-4 text-left hover:bg-gray-900/5"
                                                        >
                                                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.classes}`}>
                                                                <Icon className="h-5 w-5" />
                                                            </span>
                                                            <span className="min-w-0">
                                                                <span className="block text-sm leading-5 text-gray-900">{n.title}</span>
                                                                <span className="mt-1 block text-xs text-gray-600">{n.time}</span>
                                                            </span>
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Account */}
                <div className="relative ml-2">
                    <button
                        type="button"
                        aria-label="Account"
                        onClick={toggleAccount}
                        className={`relative z-50 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-sm font-medium text-white ring-2 ring-transparent transition-shadow hover:ring-gray-400/60 ${avatarClass}`}
                    >
                        {initialOf(displayName)}
                    </button>
                    {accountOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setAccountOpen(false)} />
                            <div className="absolute right-0 top-full z-50 mt-3 w-[340px] rounded-2xl bg-[#e9eef4] p-5 shadow-xl">
                                <div className="relative text-center">
                                    <p className="truncate text-sm text-gray-800">{displayEmail}</p>
                                    <button
                                        type="button"
                                        aria-label="Close"
                                        onClick={() => setAccountOpen(false)}
                                        className="absolute -right-1.5 -top-1.5 cursor-pointer rounded-full p-1.5 text-gray-700 hover:bg-gray-900/10"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                                <div className="mt-5 flex justify-center">
                                    <span className={`flex h-20 w-20 items-center justify-center rounded-full text-4xl text-white ${avatarClass}`}>
                                        {initialOf(displayName)}
                                    </span>
                                </div>
                                <p title={displayName} className="mt-4 truncate px-2 text-center text-xl text-gray-900">
                                    {displayName}
                                </p>
                                <div className="mt-2 flex justify-center">
                                    <span className={`rounded-full px-3.5 py-1 text-xs font-medium ${ROLE_STYLES[displayRole]}`}>
                                        {displayRole}
                                    </span>
                                </div>
                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => { setAccountOpen(false); router.push("/settings"); }}
                                        className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-gray-500/70 bg-white/70 py-2.5 text-sm font-medium text-[#1a73e8] hover:bg-white"
                                    >
                                        <Settings className="h-4 w-4" />
                                        Settings
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#c5221f] py-2.5 text-sm font-medium text-white hover:bg-[#a31815]"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Log out
                                    </button>
                                </div>
                                <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-700">
                                    <a href="#" className="hover:underline">Privacy Policy</a>
                                    <span>•</span>
                                    <a href="#" className="hover:underline">Terms of Service</a>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}