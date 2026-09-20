"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
    BookOpen,
    CalendarDays,
    ChevronUp,
    ClipboardList,
    Cog,
    FileText,
    House,
    Layers,
    ListTodo,
    Settings,
    Tag,
    Users,
    UserRound,
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

    const mobileClasses = !mobileReady
        ? "max-lg:hidden"
        : open
            ? "max-lg:fixed max-lg:left-0 max-lg:top-16 max-lg:z-30 max-lg:h-[calc(100dvh-4rem)] max-lg:max-w-[85vw] max-lg:translate-x-0 max-lg:bg-[#eef1f4] max-lg:shadow-xl"
            : "max-lg:fixed max-lg:left-0 max-lg:top-16 max-lg:z-30 max-lg:h-[calc(100dvh-4rem)] max-lg:w-[300px] max-lg:max-w-[85vw] max-lg:-translate-x-full max-lg:invisible max-lg:pointer-events-none max-lg:bg-[#eef1f4]";

    const sectionTitle = user?.role === "Instructor" ? "Instructing" : "My Courses";

    return (
        <>
            {mobileReady && open && (
                <div
                    className="fixed inset-0 top-16 z-20 bg-black/40 lg:hidden"
                    aria-hidden
                    onClick={onClose}
                />
            )}

            <aside
                className={`sticky top-16 h-[calc(100vh-4rem)] shrink-0 self-start overflow-y-auto overflow-x-hidden pb-6 pt-2 transition-all duration-200 ${mobileClasses} ${open ? "w-[300px] px-2" : "w-[72px] px-1.5"}`}
            >
                <nav className="flex flex-col gap-0.5">
                    <NavItem
                        open={open}
                        active={pathname === "/"}
                        href="/"
                        icon={<House className="h-6 w-6" />}
                        label="Home"
                    />

                    {isAdmin && (
                        <>
                            <NavItem open={open} active={pathname.startsWith("/instructors") || pathname.startsWith("/teachers")} href="/instructors" icon={<UserRound className="h-6 w-6" />} label="Instructors" />
                            <NavItem open={open} active={pathname.startsWith("/learners") || pathname.startsWith("/students")} href="/learners" icon={<Users className="h-6 w-6" />} label="Learners" />
                            <NavItem open={open} active={pathname === "/courses"} href="/courses" icon={<BookOpen className="h-6 w-6" />} label="Courses" />
                            <NavItem open={open} active={pathname === "/academics"} href="/academics" icon={<Tag className="h-6 w-6" />} label="Categories & Tracks" />
                            <NavItem open={open} active={pathname === "/assignments"} href="/assignments" icon={<ClipboardList className="h-6 w-6" />} label="Assignments" />
                            <NavItem open={open} active={pathname === "/submissions"} href="/submissions" icon={<FileText className="h-6 w-6" />} label="Submissions" />
                            <NavItem open={open} active={pathname === "/app-settings"} href="/app-settings" icon={<Cog className="h-6 w-6" />} label="App Settings" />
                        </>
                    )}

                    {!isAdmin && (
                        <>
                            <NavItem open={open} active={pathname.startsWith("/calendar")} href="/calendar" icon={<CalendarDays className="h-6 w-6" />} label="Calendar" />
                            <NavItem open={open} active={pathname.startsWith("/todo")} href="/todo" icon={<ListTodo className="h-6 w-6" />} label={user?.role === "Instructor" ? "To-review" : "To-do"} />
                        </>
                    )}

                    {!isAdmin && enrolledCourses.length > 0 && (
                        <>
                            {open && <div className="my-2 h-px bg-gray-300/70" />}

                            {open ? (
                                <button
                                    type="button"
                                    onClick={() => setEnrolledOpen((v) => !v)}
                                    className="flex items-center justify-between rounded-full px-6 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-900/5"
                                >
                                    <span className="flex items-center gap-4">
                                        <BookOpen className="h-6 w-6 text-gray-600" />
                                        {sectionTitle}
                                    </span>
                                    <ChevronUp
                                        className={`h-5 w-5 text-gray-600 transition-transform ${enrolledOpen ? "" : "rotate-180"}`}
                                    />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    title={sectionTitle}
                                    aria-label={sectionTitle}
                                    onClick={onExpand}
                                    className="my-2 flex h-11 w-full items-center justify-center rounded-full text-gray-700 hover:bg-gray-900/5"
                                >
                                    <BookOpen className="h-6 w-6" />
                                </button>
                            )}

                            {open && enrolledOpen && (
                                <>
                                    {enrolledCourses.map((c) => (
                                        <Link
                                            key={c.id}
                                            href={`/course/${c.id}`}
                                            className={`flex items-center gap-3 rounded-full py-2 pl-4 pr-4 hover:bg-gray-900/5 ${pathname.startsWith(`/course/${c.id}`) ? "bg-[#cfe8fc] font-medium text-gray-900" : ""}`}
                                        >
                                            <span
                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${c.avatarClass}`}
                                            >
                                                {c.letter}
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm text-gray-800">{c.name}</span>
                                                {c.sub && <span className="block truncate text-xs text-gray-600">{c.sub}</span>}
                                            </span>
                                        </Link>
                                    ))}
                                </>
                            )}
                        </>
                    )}

                    <NavItem
                        open={open}
                        active={pathname.startsWith("/settings")}
                        href="/settings"
                        icon={<Settings className="h-6 w-6" />}
                        label="Settings"
                    />
                </nav>
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
            <a
                href={href}
                title={label}
                aria-label={label}
                className={`flex h-11 w-full items-center justify-center rounded-full ${active ? "bg-[#cfe8fc] text-[#1a73e8]" : "text-gray-700 hover:bg-gray-900/5"}`}
            >
                <span className="relative">
                    {icon}
                    {badge && <span className="absolute -right-1.5 -top-1 h-2 w-2 rounded-full bg-blue-600" />}
                </span>
            </a>
        );
    }

    return (
        <a
            href={href}
            className={`flex items-center gap-4 rounded-full px-6 py-2.5 text-sm ${active ? "bg-[#cfe8fc] font-medium text-gray-900" : "text-gray-800 hover:bg-gray-900/5"}`}
        >
            <span className={`relative ${active ? "text-[#1a73e8]" : "text-gray-600"}`}>
                {icon}
                {badge && <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-blue-600" />}
            </span>
            {label}
        </a>
    );
}