"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    Bell,
    CalendarDays,
    CheckCheck,
    ChevronDown,
    ChevronRight,
    ClipboardCheck,
    ClipboardList,
    GraduationCap,
    Info,
    LogOut,
    Megaphone,
    Menu,
    Settings,
    Star,
    Video,
    X,
    type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
    clearAllNotificationsRequest,
    getNotificationsRequest,
    markAllNotificationsReadRequest,
    markNotificationReadRequest,
    subscribeNotificationsStream,
} from "@/lib/api";
import { type NotificationItem, type NotificationKind } from "@/types";
import { getCourseRequest } from "@/lib/api/courses";
import { initialOf } from "@/lib/utils/format";
import { hasAccessToken } from "@/lib/auth/session";
import { ThemeToggle } from "./ThemeToggle";

interface TopBarProps {
    onMenuClick: () => void;
}

const NOTIFICATION_META: Record<
    NotificationKind,
    { icon: LucideIcon; classes: string }
> = {
    assignment: { icon: ClipboardList, classes: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60" },
    grade: { icon: Star, classes: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 ring-1 ring-amber-100 dark:ring-amber-900/60" },
    announcement: { icon: Megaphone, classes: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-100 dark:ring-emerald-900/60" },
    submission: { icon: ClipboardCheck, classes: "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 ring-1 ring-purple-100 dark:ring-purple-900/60" },
    due: { icon: CalendarDays, classes: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 ring-1 ring-rose-100 dark:ring-rose-900/60" },
    session: { icon: Video, classes: "bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 ring-1 ring-teal-100 dark:ring-teal-900/60" },
    system: { icon: Info, classes: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700" },
};

function formatRelativeTime(isoString?: string): string {
    if (!isoString) return "";
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (isNaN(diff) || diff < 0) return "Just now";
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 172800) return "Yesterday";
    return `${Math.floor(diff / 86400)}d ago`;
}

export function TopBar({ onMenuClick }: TopBarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const [accountOpen, setAccountOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const lastFetchRef = useRef<number>(0);

    const notifRef = useRef<HTMLDivElement>(null);
    const accountRef = useRef<HTMLDivElement>(null);

    // Global click-outside & escape listeners to ensure menus close when clicking anywhere else
    useEffect(() => {
        function handleClickOutside(event: MouseEvent | TouchEvent) {
            const target = event.target as Node;
            if (notifOpen && notifRef.current && !notifRef.current.contains(target)) {
                setNotifOpen(false);
            }
            if (accountOpen && accountRef.current && !accountRef.current.contains(target)) {
                setAccountOpen(false);
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setNotifOpen(false);
                setAccountOpen(false);
            }
        }

        if (notifOpen || accountOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [notifOpen, accountOpen]);

    const loadNotifications = useCallback(async (force = false) => {
        if (!user || !hasAccessToken()) return;
        const now = Date.now();
        if (!force && now - lastFetchRef.current < 60000) return;
        lastFetchRef.current = now;
        try {
            const res = await getNotificationsRequest();
            setNotifications(res.items);
            setUnreadCount(res.unreadCount);
        } catch {
            // ignore network issues gracefully
        }
    }, [user]);

    useEffect(() => {
        loadNotifications(true);

        // Real-time Server-Sent Events stream subscription
        const unsubscribe = subscribeNotificationsStream((newItem) => {
            setNotifications((prev) => {
                if (prev.some((n) => n.id === newItem.id)) {
                    return prev;
                }
                return [newItem, ...prev];
            });
            setUnreadCount((count) => count + (newItem.isRead ? 0 : 1));
        });

        const onFocus = () => loadNotifications(false);
        window.addEventListener("focus", onFocus);
        return () => {
            unsubscribe();
            window.removeEventListener("focus", onFocus);
        };
    }, [loadNotifications]);

    const classMatch = pathname.match(/^\/(?:course|class)\/(\d+)/);
    const classCourseId = classMatch ? Number(classMatch[1]) : null;
    const [classCourse, setClassCourse] = useState<{ id: number; name: string; sub?: string } | null>(null);

    useEffect(() => {
        if (!classCourseId) {
            setClassCourse(null);
            return;
        }

        let cancelled = false;
        const fetchCourse = () => {
            getCourseRequest(classCourseId)
                .then((dto) => {
                    if (!cancelled) {
                        setClassCourse({
                            id: dto.id,
                            name: dto.name,
                            sub: dto.session || dto.subject || undefined,
                        });
                    }
                })
                .catch(() => {
                    if (!cancelled) setClassCourse(null);
                });
        };

        fetchCourse();
        window.addEventListener("coursedesk:courses-updated", fetchCourse);
        return () => {
            cancelled = true;
            window.removeEventListener("coursedesk:courses-updated", fetchCourse);
        };
    }, [classCourseId]);

    const classSub = classCourse?.sub;

    const isTodo = pathname.startsWith("/todo");
    const isCalendar = pathname.startsWith("/calendar");
    const isSettings = pathname.startsWith("/settings");
    const isAppSettings = pathname === "/app-settings";
    const isInstructors = pathname === "/instructors" || pathname === "/teachers";
    const isLearners = pathname === "/learners" || pathname === "/students";
    const isCourses = pathname === "/courses";
    const isAcademics = pathname === "/academics";
    const isAssignments = pathname === "/assignments";
    const isSubmissions = pathname === "/submissions";
    const isAdminPage = isInstructors || isLearners || isCourses || isAcademics || isAssignments || isSubmissions || isAppSettings;

    const toggleAccount = () => {
        setNotifOpen(false);
        setAccountOpen((v) => !v);
    };

    const toggleNotif = () => {
        setAccountOpen(false);
        setNotifOpen((v) => {
            const next = !v;
            if (next) loadNotifications();
            return next;
        });
    };

    const handleNotificationClick = async (n: NotificationItem) => {
        if (!n.isRead) {
            setNotifications((prev) =>
                prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
            try {
                await markNotificationReadRequest(n.id);
            } catch {
                // ignore
            }
        }
        setNotifOpen(false);
        if (n.link) {
            let target = n.link;
            target = target.replace(/\/course\/(\d+)\/coursework\/?$/, "/course/$1?tab=coursework");
            target = target.replace(/\/course\/(\d+)\/curriculum\/?$/, "/course/$1?tab=curriculum");
            target = target.replace(/\/course\/(\d+)\/lectures\/?$/, "/course/$1?tab=curriculum");
            target = target.replace(/\/course\/(\d+)\/submissions\/?$/, "/course/$1?tab=coursework");
            target = target.replace(/\/course\/(\d+)\/people\/?$/, "/course/$1?tab=people");
            target = target.replace(/\/course\/(\d+)\/grades\/?$/, "/course/$1?tab=grades");
            target = target.replace(/\/course\/(\d+)\/announcements\/?$/, "/course/$1?tab=stream");
            router.push(target);
        }
    };

    const handleClearAll = async () => {
        setNotifications([]);
        setUnreadCount(0);
        try {
            await clearAllNotificationsRequest();
        } catch {
            loadNotifications();
        }
    };

    const handleMarkAllRead = async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        try {
            await markAllNotificationsReadRequest();
        } catch {
            loadNotifications();
        }
    };

    const handleLogout = async () => {
        setAccountOpen(false);
        await logout();
        router.push("/");
    };

    const displayName = user?.name ?? "";
    const displayEmail = user?.email ?? "";
    const displayRole = user?.role ?? "Learner";
    const avatarClass = user?.avatarClass ?? "bg-blue-600";

    return (
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-3 sm:px-6 backdrop-blur-md transition-colors">
            {/* Left side: Hamburger, Logo, Breadcrumbs */}
            <div className="flex min-w-0 items-center gap-2 sm:gap-3.5">
                <button
                    type="button"
                    onClick={onMenuClick}
                    aria-label="Toggle navigation menu"
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                    <Menu className="h-5 w-5" />
                </button>

                <Link href="/" className="group flex shrink-0 items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-blue-600 to-indigo-600 text-white shadow-xs shadow-blue-500/25 transition-transform group-hover:scale-105">
                        <GraduationCap className="h-5 w-5" />
                    </span>
                    <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        CourseDesk
                    </span>
                </Link>

                {/* Breadcrumb Info */}
                {classCourse && (
                    <div className="flex min-w-0 items-center gap-1.5 pl-1 sm:pl-2">
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
                        <div className="flex items-center gap-1.5 min-w-0 max-w-[160px] sm:max-w-xs md:max-w-md rounded-lg bg-slate-100/80 dark:bg-slate-800/80 px-2.5 py-1 border border-slate-200/60 dark:border-slate-700">
                            <span className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                                {classCourse.name}
                            </span>
                            {classSub && (
                                <span className="hidden truncate text-[11px] font-medium text-slate-400 dark:text-slate-500 md:inline">
                                    • {classSub}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {!classCourse && (isTodo || isCalendar || isSettings || isAdminPage) && (
                    <div className="flex min-w-0 items-center gap-1.5 pl-1 sm:pl-2">
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
                        <span className="inline-flex items-center rounded-lg bg-slate-100/80 dark:bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                            {isTodo && "To-do"}
                            {isCalendar && "Calendar"}
                            {isSettings && "Settings"}
                            {isInstructors && "Instructors"}
                            {isLearners && "Learners"}
                            {isCourses && "Courses"}
                            {isAcademics && "Categories & Tracks"}
                            {isAssignments && "Assignments"}
                            {isSubmissions && "Submissions"}
                            {isAppSettings && "App Settings"}
                        </span>
                    </div>
                )}
            </div>

            {/* Right side: Theme Toggle, Notifications, User Profile Menu */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                {/* Theme Selector (Light, Dark, System) */}
                <ThemeToggle />

                {/* Notifications Button & Dropdown */}
                <div ref={notifRef} className="relative">
                    <button
                        type="button"
                        aria-label="Notifications"
                        onClick={toggleNotif}
                        className={`relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 transition-all ${
                            notifOpen
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white ring-1 ring-slate-200 dark:ring-slate-700"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                    >
                        <Bell className="h-4.5 w-4.5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs ring-2 ring-white dark:ring-slate-900">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {notifOpen && (
                        <div className="absolute right-0 top-full z-50 mt-2 w-[400px] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/90 dark:border-slate-800 ring-1 ring-black/5 max-sm:fixed max-sm:inset-x-3 max-sm:top-20 max-sm:w-auto animate-in fade-in zoom-in-95 duration-150">
                            {/* Notification Header */}
                            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</span>
                                    {unreadCount > 0 && (
                                        <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/50">
                                            {unreadCount} new
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    {unreadCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleMarkAllRead}
                                            className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                        >
                                            <CheckCheck className="h-3.5 w-3.5" />
                                            Mark read
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        disabled={notifications.length === 0}
                                        onClick={handleClearAll}
                                        className="text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-40 disabled:hover:text-slate-400 transition-colors"
                                    >
                                        Clear all
                                    </button>
                                </div>
                            </div>

                            {/* Notification List */}
                            <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="flex flex-col items-center gap-2.5 px-6 py-12 text-center">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                                            <Bell className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">All caught up!</p>
                                            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">You don't have any unread notifications.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                        {notifications.map((n) => {
                                            const meta = NOTIFICATION_META[n.kind] || NOTIFICATION_META.system;
                                            const Icon = meta.icon;
                                            return (
                                                <li key={n.id}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleNotificationClick(n)}
                                                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                                                            !n.isRead ? "bg-blue-50/40 dark:bg-blue-950/30 hover:bg-blue-50/60 dark:hover:bg-blue-950/50" : ""
                                                        }`}
                                                    >
                                                        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${meta.classes}`}>
                                                            <Icon className="h-4 w-4" />
                                                        </span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="flex items-start justify-between gap-2">
                                                                <span className={`block text-xs leading-snug ${!n.isRead ? "font-semibold text-slate-900 dark:text-white" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                                                                    {n.title}
                                                                </span>
                                                                {!n.isRead && (
                                                                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600 dark:bg-blue-400" />
                                                                )}
                                                            </span>
                                                            {n.message && (
                                                                <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500 dark:text-slate-400">
                                                                    {n.message}
                                                                </span>
                                                            )}
                                                            <span className="mt-1 block text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                                                    {formatRelativeTime(n.createdAtUtc)}
                                                                </span>
                                                        </span>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Account Trigger & Dropdown Menu */}
                <div ref={accountRef} className="relative">
                    <button
                        type="button"
                        aria-label="User account menu"
                        onClick={toggleAccount}
                        className={`flex items-center gap-2 rounded-xl p-1 sm:pr-2.5 border transition-all duration-150 ${
                            accountOpen
                                ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 ring-1 ring-slate-200 dark:ring-slate-700"
                                : "border-slate-200/70 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:border-slate-300/70 dark:hover:border-slate-600 shadow-xs"
                        }`}
                    >
                        <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white shadow-xs ${avatarClass}`}>
                            {initialOf(displayName)}
                        </span>
                        <div className="hidden text-left sm:block">
                            <p className="max-w-[110px] truncate text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                                {displayName || "Account"}
                            </p>
                            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-400 capitalize leading-tight">
                                {displayRole}
                            </p>
                        </div>
                        <ChevronDown className={`hidden sm:block h-3.5 w-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${accountOpen ? "rotate-180" : ""}`} />
                    </button>

                    {accountOpen && (
                        <div className="absolute right-0 top-full z-50 mt-2 w-[300px] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/90 dark:border-slate-800 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
                            {/* User Card Header */}
                            <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 p-4">
                                <div className="flex items-center gap-3">
                                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white shadow-xs ${avatarClass}`}>
                                        {initialOf(displayName)}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{displayName}</p>
                                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{displayEmail}</p>
                                        <div className="mt-1">
                                            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border ${
                                                displayRole === "Admin"
                                                    ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-900/60"
                                                    : displayRole === "Instructor"
                                                    ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-900/60"
                                                    : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-900/60"
                                            }`}>
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${
                                                        displayRole === "Admin" ? "bg-rose-500" :
                                                        displayRole === "Instructor" ? "bg-amber-500" :
                                                        "bg-emerald-500"
                                                    }`}
                                                />
                                                {displayRole}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Menu Links */}
                            <div className="p-2 space-y-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAccountOpen(false);
                                        router.push("/settings");
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <Settings className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                    Account Settings
                                </button>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                >
                                    <LogOut className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                                    Sign out
                                </button>
                            </div>

                            {/* Footer Links */}
                            <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                                <span>CourseDesk LMS</span>
                                <div className="flex items-center gap-2">
                                    <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Privacy</a>
                                    <span>•</span>
                                    <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Terms</a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}