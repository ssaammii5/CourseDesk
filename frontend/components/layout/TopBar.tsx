"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    Bell,
    CalendarDays,
    CheckCheck,
    ChevronRight,
    ClipboardCheck,
    ClipboardList,
    GraduationCap,
    Info,
    Layers,
    LogOut,
    Megaphone,
    Menu,
    MessageSquare,
    Settings,
    Star,
    Video,
    X,
    type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IconButton } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import {
    clearAllNotificationsRequest,
    getNotificationsRequest,
    markAllNotificationsReadRequest,
    markNotificationReadRequest,
    subscribeNotificationsStream,
} from "@/lib/api";
import { ROLE_STYLES, type NotificationItem, type NotificationKind } from "@/types";
import { getCourseRequest } from "@/lib/api/courses";
import { initialOf } from "@/lib/utils/format";
import { hasAccessToken } from "@/lib/auth/session";

interface TopBarProps {
    onMenuClick: () => void;
}

const NOTIFICATION_META: Record<
    NotificationKind,
    { icon: LucideIcon; classes: string }
> = {
    assignment: { icon: ClipboardList, classes: "bg-[#d7e3fd] text-[#174ea6]" },
    grade: { icon: Star, classes: "bg-[#fce8e6] text-[#c5221f]" },
    announcement: { icon: Megaphone, classes: "bg-[#ceead6] text-[#137333]" },
    submission: { icon: ClipboardCheck, classes: "bg-[#ede7f6] text-[#5e35b1]" },
    due: { icon: CalendarDays, classes: "bg-[#fef7e0] text-[#b06000]" },
    session: { icon: Video, classes: "bg-[#e0f2f1] text-[#00796b]" },
    system: { icon: Info, classes: "bg-[#e8eaed] text-[#3c4043]" },
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

    const toggleAccount = () => { setNotifOpen(false); setAccountOpen((v) => !v); };
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
    const avatarClass = user?.avatarClass ?? "bg-gray-600";

    return (
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white px-3 sm:px-4">
            {/* Left side */}
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <IconButton label="Main menu" onClick={onMenuClick}>
                    <Menu className="h-6 w-6" />
                </IconButton>

                <Link href="/" className="flex shrink-0 items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a73e8] to-[#174ea6] text-white shadow-sm">
                        <GraduationCap className="h-5 w-5" />
                    </span>
                    <span className="text-xl font-normal tracking-tight text-gray-800 hover:text-gray-900">
                        CourseDesk
                    </span>
                </Link>

                {classCourse && (
                    <span className="flex min-w-0 items-center gap-1 text-sm text-gray-700">
                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-600" />
                        <span className="truncate font-medium text-gray-800">
                            {classCourse.name}
                        </span>
                        {classSub && (
                            <span className="hidden truncate text-xs text-gray-600 sm:inline">
                                ({classSub})
                            </span>
                        )}
                    </span>
                )}

                {!classCourse && (isTodo || isCalendar || isSettings || isAdminPage) && (
                    <span className="flex min-w-0 items-center gap-1 text-sm text-gray-700">
                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-600" />
                        <span className="truncate font-medium text-gray-800">
                            {isTodo && "To-do"}
                            {isCalendar && "Calendar"}
                            {isSettings && "Settings"}
                            {isInstructors && "Instructors"}
                            {isLearners && "Learners"}
                            {isCourses && "Courses"}
                            {isAcademics && "Academic"}
                            {isAssignments && "Assignments"}
                            {isSubmissions && "Submissions"}
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
                        {unreadCount > 0 && (
                            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d93025] px-1 text-[10px] font-semibold text-white shadow-sm">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </button>
                    {notifOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                            <div className="absolute right-0 top-full z-50 mt-2 w-[400px] overflow-hidden rounded-2xl bg-[#e9eef4] shadow-xl max-sm:fixed max-sm:inset-x-2 max-sm:top-[4.5rem] max-sm:mt-0 max-sm:w-auto">
                                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-300/60 bg-white/70 backdrop-blur-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base font-semibold text-gray-900">Notifications</span>
                                        {unreadCount > 0 && (
                                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-[#1a73e8]">
                                                {unreadCount} new
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {unreadCount > 0 && (
                                            <button
                                                type="button"
                                                onClick={handleMarkAllRead}
                                                className="cursor-pointer text-xs font-medium text-[#1a73e8] hover:underline"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            disabled={notifications.length === 0}
                                            onClick={handleClearAll}
                                            className="cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-900 disabled:cursor-default disabled:text-gray-400 disabled:no-underline"
                                        >
                                            Clear all
                                        </button>
                                    </div>
                                </div>
                                <div className="max-h-[420px] overflow-y-auto max-sm:max-h-[min(26.25rem,calc(100dvh-9rem))]">
                                    {notifications.length === 0 ? (
                                        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200/70 text-gray-400">
                                                <Bell className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">No notifications</p>
                                                <p className="mt-0.5 text-xs text-gray-500">You're all caught up!</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <ul className="divide-y divide-gray-300/50">
                                            {notifications.map((n) => {
                                                const meta = NOTIFICATION_META[n.kind] || NOTIFICATION_META.system;
                                                const Icon = meta.icon;
                                                return (
                                                    <li key={n.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleNotificationClick(n)}
                                                            className={`flex w-full cursor-pointer items-start gap-3.5 px-5 py-3.5 text-left transition-colors hover:bg-gray-900/5 ${!n.isRead ? "bg-white/50" : ""}`}
                                                        >
                                                            <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.classes}`}>
                                                                <Icon className="h-4 w-4" />
                                                            </span>
                                                            <span className="min-w-0 flex-1">
                                                                <span className="flex items-start justify-between gap-2">
                                                                    <span className={`block text-sm leading-snug ${!n.isRead ? "font-semibold text-gray-900" : "font-medium text-gray-800"}`}>
                                                                        {n.title}
                                                                    </span>
                                                                    {!n.isRead && (
                                                                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1a73e8]" />
                                                                    )}
                                                                </span>
                                                                {n.message && (
                                                                    <span className="mt-0.5 line-clamp-2 block text-xs text-gray-600">
                                                                        {n.message}
                                                                    </span>
                                                                )}
                                                                <span className="mt-1 block text-[11px] text-gray-400">
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