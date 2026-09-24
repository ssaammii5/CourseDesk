"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
    BookOpen,
    CalendarDays,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Cog,
    FileText,
    GraduationCap,
    House,
    ListTodo,
    Settings,
    Tag,
    Users,
    UserRound,
    X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getMyCoursesRequest, type CourseDto } from "@/lib/api/courses";
import { avatarClassFor, letterOf } from "@/lib/utils/theme";
import { useAuth } from "@/hooks/useAuth";

const DESKTOP_QUERY = "(min-width: 1024px)";

interface SidebarProps {
    open: boolean;
    mobileReady?: boolean;
    onExpand?: () => void;
    onClose?: () => void;
}

interface EnrolledCourse {
    id: number;
    name: string;
    sub?: string;
    letter: string;
    avatarClass: string;
}

function mapCourseToEnrolled(c: CourseDto): EnrolledCourse {
    return {
        id: c.id,
        name: c.name,
        sub: c.session || c.subject || undefined,
        letter: letterOf(c.name),
        avatarClass: avatarClassFor(c.id),
    };
}

export function Sidebar({ open, mobileReady = true, onExpand, onClose }: SidebarProps) {
    const [enrolledOpen, setEnrolledOpen] = useState(true);
    const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
    const pathname = usePathname();
    const prevPathname = useRef(pathname);
    const { user } = useAuth();
    const isAdmin = user?.role === "Admin";

    // Load courses for sidebar (enrolled/instructing for learners/instructors; admin manages courses via /courses).
    const loadCourses = useCallback(() => {
        if (isAdmin) {
            setEnrolledCourses([]);
            return () => {};
        }
        let cancelled = false;
        getMyCoursesRequest()
            .then((dtos) => {
                if (!cancelled) setEnrolledCourses(dtos.map(mapCourseToEnrolled));
            })
            .catch(() => {
                if (!cancelled) setEnrolledCourses([]);
            });
        return () => {
            cancelled = true;
        };
    }, [isAdmin]);

    useEffect(() => {
        const cleanup = loadCourses();

        const handleCourseUpdate = () => {
            loadCourses();
        };

        window.addEventListener("coursedesk:courses-updated", handleCourseUpdate);
        window.addEventListener("focus", handleCourseUpdate);
        return () => {
            cleanup();
            window.removeEventListener("coursedesk:courses-updated", handleCourseUpdate);
            window.removeEventListener("focus", handleCourseUpdate);
        };
    }, [loadCourses, user?.id, user?.role, isAdmin]);

    useEffect(() => {
        if (prevPathname.current === pathname) return;
        prevPathname.current = pathname;
        if (typeof window !== "undefined" && !window.matchMedia(DESKTOP_QUERY).matches) {
            onClose?.();
        }
    }, [pathname, onClose]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const mq = window.matchMedia(DESKTOP_QUERY);
        const update = () => {
            document.body.style.overflow = open && !mq.matches ? "hidden" : "";
        };
        update();
        mq.addEventListener("change", update);
        return () => {
            mq.removeEventListener("change", update);
            document.body.style.overflow = "";
        };
    }, [open]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !window.matchMedia(DESKTOP_QUERY).matches) onClose?.();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const sectionTitle = user?.role === "Instructor" ? "Instructing" : "My Courses";

    const sidebarContent = (
        <div className="flex h-full flex-col justify-between">
            {/* Scrollable Nav Area */}
            <div className="flex-1 overflow-y-auto px-3 py-3 no-scrollbar space-y-4">
                {/* Main / Overview */}
                <div className="space-y-1">
                    {open && (
                        <p className="px-3 pt-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Overview
                        </p>
                    )}
                    <NavItem
                        open={open}
                        active={pathname === "/"}
                        href="/"
                        icon={<House className="h-[18px] w-[18px]" />}
                        label="Home"
                    />

                    {!isAdmin && (
                        <>
                            <NavItem
                                open={open}
                                active={pathname.startsWith("/calendar")}
                                href="/calendar"
                                icon={<CalendarDays className="h-[18px] w-[18px]" />}
                                label="Calendar"
                            />
                            <NavItem
                                open={open}
                                active={pathname.startsWith("/todo")}
                                href="/todo"
                                icon={<ListTodo className="h-[18px] w-[18px]" />}
                                label={user?.role === "Instructor" ? "To-review" : "To-do"}
                            />
                        </>
                    )}
                </div>

                {/* Admin Management Section */}
                {isAdmin && (
                    <div className="space-y-1">
                        {open && (
                            <p className="px-3 pt-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                Management
                            </p>
                        )}
                        <NavItem
                            open={open}
                            active={pathname.startsWith("/instructors") || pathname.startsWith("/teachers")}
                            href="/instructors"
                            icon={<UserRound className="h-[18px] w-[18px]" />}
                            label="Instructors"
                        />
                        <NavItem
                            open={open}
                            active={pathname.startsWith("/learners") || pathname.startsWith("/students")}
                            href="/learners"
                            icon={<Users className="h-[18px] w-[18px]" />}
                            label="Learners"
                        />
                        <NavItem
                            open={open}
                            active={pathname === "/courses"}
                            href="/courses"
                            icon={<BookOpen className="h-[18px] w-[18px]" />}
                            label="Courses"
                        />
                        <NavItem
                            open={open}
                            active={pathname === "/academics"}
                            href="/academics"
                            icon={<Tag className="h-[18px] w-[18px]" />}
                            label="Categories & Tracks"
                        />
                    </div>
                )}

                {/* Admin Academics Section */}
                {isAdmin && (
                    <div className="space-y-1">
                        {open && (
                            <p className="px-3 pt-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                Academics
                            </p>
                        )}
                        <NavItem
                            open={open}
                            active={pathname === "/assignments"}
                            href="/assignments"
                            icon={<ClipboardList className="h-[18px] w-[18px]" />}
                            label="Assignments"
                        />
                        <NavItem
                            open={open}
                            active={pathname === "/submissions"}
                            href="/submissions"
                            icon={<FileText className="h-[18px] w-[18px]" />}
                            label="Submissions"
                        />
                    </div>
                )}

                {/* Courses Section for Instructor / Learner */}
                {!isAdmin && enrolledCourses.length > 0 && (
                    <div className="space-y-1 pt-1">
                        {open ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setEnrolledOpen((v) => !v)}
                                    className="flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-700 transition-colors group"
                                >
                                    <span className="flex items-center gap-2">
                                        <BookOpen className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                        {sectionTitle}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-100 px-1.5 text-[10px] font-bold text-slate-500">
                                            {enrolledCourses.length}
                                        </span>
                                        <ChevronDown
                                            className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                                                enrolledOpen ? "rotate-0" : "-rotate-90"
                                            }`}
                                        />
                                    </div>
                                </button>

                                {enrolledOpen && (
                                    <div className="space-y-0.5 pt-0.5">
                                        {enrolledCourses.map((c) => {
                                            const isActive = pathname.startsWith(`/course/${c.id}`);
                                            return (
                                                <Link
                                                    key={c.id}
                                                    href={`/course/${c.id}`}
                                                    className={`group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs transition-all duration-150 ${
                                                        isActive
                                                            ? "bg-blue-50/90 font-medium text-blue-900 ring-1 ring-blue-100/80"
                                                            : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900"
                                                    }`}
                                                >
                                                    {isActive && (
                                                        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-600" />
                                                    )}
                                                    <span
                                                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold text-white shadow-xs transition-transform group-hover:scale-105 ${c.avatarClass}`}
                                                    >
                                                        {c.letter}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <span className="block truncate font-medium text-slate-800 group-hover:text-slate-900">
                                                            {c.name}
                                                        </span>
                                                        {c.sub && (
                                                            <span className="block truncate text-[10px] text-slate-400">
                                                                {c.sub}
                                                            </span>
                                                        )}
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="relative group">
                                <button
                                    type="button"
                                    title={sectionTitle}
                                    aria-label={sectionTitle}
                                    onClick={onExpand}
                                    className="relative flex h-10 w-10 mx-auto items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                                >
                                    <BookOpen className="h-[18px] w-[18px]" />
                                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white shadow-xs">
                                        {enrolledCourses.length}
                                    </span>
                                </button>
                                <div className="pointer-events-none absolute left-full ml-3.5 top-1/2 -translate-y-1/2 z-50 hidden rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white shadow-xl whitespace-nowrap group-hover:flex items-center">
                                    {sectionTitle} ({enrolledCourses.length})
                                    <div className="absolute top-1/2 -left-1 -mt-1 border-4 border-transparent border-r-slate-900" />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* System / Preferences Section */}
                <div className="space-y-1">
                    {open && (
                        <p className="px-3 pt-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            {isAdmin ? "System" : "Preferences"}
                        </p>
                    )}
                    {isAdmin && (
                        <NavItem
                            open={open}
                            active={pathname === "/app-settings"}
                            href="/app-settings"
                            icon={<Cog className="h-[18px] w-[18px]" />}
                            label="App Settings"
                        />
                    )}
                    <NavItem
                        open={open}
                        active={pathname.startsWith("/settings")}
                        href="/settings"
                        icon={<Settings className="h-[18px] w-[18px]" />}
                        label="Settings"
                    />
                </div>
            </div>

            {/* Bottom Footer User & Collapse Strip */}
            <div className="border-t border-slate-100 bg-slate-50/50 p-2.5">
                {open ? (
                    <div className="flex items-center justify-between gap-2 rounded-xl bg-white p-2 shadow-xs border border-slate-200/60">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white shadow-xs ${
                                    user?.avatarClass ?? "bg-blue-600"
                                }`}
                            >
                                {letterOf(user?.name ?? "User")}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-slate-800">
                                    {user?.name ?? "Account"}
                                </p>
                                <span className="inline-block text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                                    {user?.role ?? "Learner"}
                                </span>
                            </div>
                        </div>

                        {onClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                title="Collapse sidebar"
                                aria-label="Collapse sidebar"
                                className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        {onExpand && (
                            <button
                                type="button"
                                onClick={onExpand}
                                title="Expand sidebar"
                                aria-label="Expand sidebar"
                                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-white hover:text-slate-700 hover:shadow-xs border border-transparent hover:border-slate-200/60 transition-all"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    // Mobile classes & drawer rendering
    const mobileClasses = !mobileReady
        ? "max-lg:hidden"
        : open
            ? "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:w-[280px] max-lg:translate-x-0 max-lg:bg-white max-lg:shadow-2xl"
            : "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:w-[280px] max-lg:-translate-x-full max-lg:invisible max-lg:pointer-events-none max-lg:bg-white";

    return (
        <>
            {/* Mobile backdrop */}
            {mobileReady && open && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
                    aria-hidden
                    onClick={onClose}
                />
            )}

            <aside
                className={`sticky top-16 h-[calc(100vh-4rem)] shrink-0 self-start border-r border-slate-200/80 bg-white/95 backdrop-blur-md transition-[width,transform] duration-250 ease-in-out z-20 ${mobileClasses} ${
                    open ? "w-[264px]" : "w-[68px]"
                }`}
            >
                {/* Mobile Header (only visible on mobile screens) */}
                <div className="flex lg:hidden items-center justify-between border-b border-slate-100 px-4 py-3.5 bg-slate-50/60">
                    <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#1a73e8] to-[#174ea6] text-white shadow-xs">
                            <GraduationCap className="h-4 w-4" />
                        </span>
                        <span className="font-semibold text-slate-800 text-sm">CourseDesk</span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close sidebar"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="h-full max-lg:h-[calc(100%-57px)]">
                    {sidebarContent}
                </div>
            </aside>
        </>
    );
}

interface NavItemProps {
    href: string;
    icon: ReactNode;
    label: string;
    active?: boolean;
    badge?: boolean;
    open: boolean;
}

function NavItem({ href, icon, label, active = false, badge = false, open }: NavItemProps) {
    if (!open) {
        return (
            <div className="group relative flex justify-center">
                <Link
                    href={href}
                    title={label}
                    aria-label={label}
                    className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150 ${
                        active
                            ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200/80 font-semibold shadow-xs"
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                >
                    <span className="relative">
                        {icon}
                        {badge && (
                            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
                        )}
                    </span>
                </Link>

                {/* Modern Hover Tooltip */}
                <div className="pointer-events-none absolute left-full ml-3.5 top-1/2 -translate-y-1/2 z-50 hidden rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white shadow-xl whitespace-nowrap group-hover:flex items-center animate-in fade-in zoom-in-95 duration-100">
                    {label}
                    <div className="absolute top-1/2 -left-1 -mt-1 border-4 border-transparent border-r-slate-900" />
                </div>
            </div>
        );
    }

    return (
        <Link
            href={href}
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-150 ${
                active
                    ? "bg-blue-50 text-blue-700 font-semibold shadow-xs ring-1 ring-blue-100/90"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium"
            }`}
        >
            {active && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-600" />
            )}
            <span
                className={`relative shrink-0 transition-colors ${
                    active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                }`}
            >
                {icon}
                {badge && (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
                )}
            </span>
            <span className="truncate">{label}</span>
        </Link>
    );
}