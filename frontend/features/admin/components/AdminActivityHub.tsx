"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    FileText,
    BookOpen,
    Users,
    ArrowRight,
    Clock,
    CheckCircle2,
    AlertCircle,
    GraduationCap,
    Layers,
    Search,
    ChevronRight,
    ExternalLink,
} from "lucide-react";
import type { SubmissionDto } from "@/lib/api/submissions";
import type { CourseDto } from "@/lib/api/courses";
import type { UserDto } from "@/lib/api/users";
import { StatusBadge } from "@/components/ui";
import { initialOf } from "@/lib/utils/format";

interface AdminActivityHubProps {
    submissions: SubmissionDto[];
    courses: CourseDto[];
    users: UserDto[];
    isCoordinator: boolean;
}

export function AdminActivityHub({
    submissions,
    courses,
    users,
    isCoordinator,
}: AdminActivityHubProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"submissions" | "courses" | "users">("submissions");
    const [submissionFilter, setSubmissionFilter] = useState<"all" | "pending" | "graded">("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Filtered submissions
    const filteredSubmissions = useMemo(() => {
        let list = [...submissions];
        if (submissionFilter === "pending") {
            list = list.filter((s) => s.status === "Submitted" || s.status === "Pending");
        } else if (submissionFilter === "graded") {
            list = list.filter((s) => s.status === "Graded");
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter((s) => {
                const name = (s.learnerName || s.studentName || "").toLowerCase();
                const title = (s.assignmentTitle || "").toLowerCase();
                const course = (s.courseName || "").toLowerCase();
                return name.includes(q) || title.includes(q) || course.includes(q);
            });
        }

        return list.slice(0, 7);
    }, [submissions, submissionFilter, searchQuery]);

    // Filtered courses
    const filteredCourses = useMemo(() => {
        let list = courses.filter((c) => c.isActive);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(
                (c) =>
                    c.name.toLowerCase().includes(q) ||
                    (c.department && c.department.toLowerCase().includes(q)) ||
                    (c.program && c.program.toLowerCase().includes(q))
            );
        }
        return list.slice(0, 6);
    }, [courses, searchQuery]);

    // Filtered users
    const filteredUsers = useMemo(() => {
        let list = [...users];
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(
                (u) =>
                    (u.name && u.name.toLowerCase().includes(q)) ||
                    (u.email && u.email.toLowerCase().includes(q)) ||
                    (u.role && u.role.toLowerCase().includes(q))
            );
        }
        return list.slice(0, 6);
    }, [users, searchQuery]);

    const formatTimestamp = (isoString?: string | null) => {
        if (!isoString) return "Recently";
        try {
            const d = new Date(isoString);
            if (isNaN(d.getTime())) return "Recently";
            return d.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return "Recently";
        }
    };

    return (
        <section className="rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/90 overflow-hidden">
            {/* Header & Tabs Ribbon */}
            <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                {/* Tabs */}
                <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100/80 p-1 dark:bg-slate-800/80">
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab("submissions");
                            setSearchQuery("");
                        }}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                            activeTab === "submissions"
                                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100"
                                : "text-slate-600 hover:bg-white/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-100"
                        }`}
                    >
                        <FileText className="h-3.5 w-3.5 text-rose-500" />
                        <span>Submissions Activity</span>
                        <span className="rounded-full bg-slate-200/70 px-1.5 py-0.2 text-[10px] text-slate-700 dark:bg-slate-600 dark:text-slate-200">
                            {submissions.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab("courses");
                            setSearchQuery("");
                        }}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                            activeTab === "courses"
                                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100"
                                : "text-slate-600 hover:bg-white/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-100"
                        }`}
                    >
                        <BookOpen className="h-3.5 w-3.5 text-amber-500" />
                        <span>Courses Showcase</span>
                        <span className="rounded-full bg-slate-200/70 px-1.5 py-0.2 text-[10px] text-slate-700 dark:bg-slate-600 dark:text-slate-200">
                            {courses.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab("users");
                            setSearchQuery("");
                        }}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                            activeTab === "users"
                                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100"
                                : "text-slate-600 hover:bg-white/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-100"
                        }`}
                    >
                        <Users className="h-3.5 w-3.5 text-blue-500" />
                        <span>Recent Members</span>
                        <span className="rounded-full bg-slate-200/70 px-1.5 py-0.2 text-[10px] text-slate-700 dark:bg-slate-600 dark:text-slate-200">
                            {users.length}
                        </span>
                    </button>
                </div>

                {/* Sub-Filters / Search */}
                <div className="flex items-center gap-2.5">
                    {activeTab === "submissions" && (
                        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/50 p-1 dark:border-slate-800 dark:bg-slate-800/80">
                            <button
                                type="button"
                                onClick={() => setSubmissionFilter("all")}
                                className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                    submissionFilter === "all"
                                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100"
                                        : "text-slate-600 hover:bg-white/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-100"
                                }`}
                            >
                                All
                            </button>
                            <button
                                type="button"
                                onClick={() => setSubmissionFilter("pending")}
                                className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                    submissionFilter === "pending"
                                        ? "bg-white text-amber-700 shadow-xs dark:bg-slate-700 dark:text-amber-300"
                                        : "text-slate-600 hover:bg-white/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-100"
                                }`}
                            >
                                Needs Review
                            </button>
                            <button
                                type="button"
                                onClick={() => setSubmissionFilter("graded")}
                                className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                    submissionFilter === "graded"
                                        ? "bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-300"
                                        : "text-slate-600 hover:bg-white/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-100"
                                }`}
                            >
                                Graded
                            </button>
                        </div>
                    )}

                    {/* Quick Search */}
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-36 rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 transition-all placeholder:text-slate-400 hover:border-slate-300 focus:w-48 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600 sm:w-44"
                        />
                    </div>
                </div>
            </div>

            {/* Tab Body */}
            <div className="p-6">
                {/* 1. Submissions Tab */}
                {activeTab === "submissions" && (
                    <div>
                        {filteredSubmissions.length === 0 ? (
                            <div className="py-12 text-center">
                                <FileText className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    No submissions found
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Try adjusting your search query or filter criteria.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                {filteredSubmissions.map((sub) => {
                                    const learnerName = sub.learnerName || sub.studentName || "Learner";
                                    const isPending = sub.status === "Submitted" || sub.status === "Pending";
                                    return (
                                        <div
                                            key={sub.id}
                                            className="group flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/60 rounded-xl px-3"
                                        >
                                            {/* Learner & Assignment Details */}
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 text-sm">
                                                    {initialOf(learnerName)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                            {learnerName}
                                                        </p>
                                                        {sub.isLate && (
                                                            <span className="rounded-md bg-rose-100 px-1.5 py-0.2 text-[10px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                                                Late
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                                        <span className="font-medium text-slate-700 dark:text-slate-300">
                                                            {sub.assignmentTitle || "Assignment"}
                                                        </span>
                                                        {sub.courseName && (
                                                            <>
                                                                <span className="mx-1.5">•</span>
                                                                <span>{sub.courseName}</span>
                                                            </>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Status, Time & Action */}
                                            <div className="flex items-center gap-4 self-end sm:self-center">
                                                <div className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <StatusBadge status={sub.status} />
                                                        {sub.marks !== null && (
                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                                {sub.marks} / {sub.maxMarks}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="mt-0.5 text-[11px] text-slate-400 flex items-center justify-end gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{formatTimestamp(sub.submittedAtUtc)}</span>
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => router.push(`/submissions/${sub.code || sub.id}`)}
                                                    className={`cursor-pointer inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all shadow-xs active:scale-95 ${
                                                        isPending
                                                            ? "bg-amber-600 text-white hover:bg-amber-700"
                                                            : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-white"
                                                    }`}
                                                >
                                                    <span>{isPending ? "Grade" : "Review"}</span>
                                                    <ChevronRight className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* View All Submissions Button */}
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                            <button
                                type="button"
                                onClick={() => router.push("/submissions")}
                                className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                <span>View all submissions & evaluations</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. Courses Tab */}
                {activeTab === "courses" && (
                    <div>
                        {filteredCourses.length === 0 ? (
                            <div className="py-12 text-center">
                                <BookOpen className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    No courses found
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredCourses.map((c) => (
                                    <div
                                        key={c.id}
                                        onClick={() => router.push(`/courses?courseId=${c.id}`)}
                                        className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-800/80 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:shadow-lg dark:hover:shadow-slate-950/40"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                    {c.name}
                                                </h3>
                                                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                                    {c.department || c.program || "General Course"}
                                                </p>
                                            </div>
                                            <StatusBadge status={c.isActive ? "Active" : "Inactive"} />
                                        </div>

                                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="flex items-center gap-1.5">
                                                <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                                                <span>{c.learnerCount ?? c.studentCount ?? 0} Learners</span>
                                            </span>
                                            <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 group-hover:underline">
                                                <span>Manage</span>
                                                <ArrowRight className="h-3 w-3" />
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                            <button
                                type="button"
                                onClick={() => router.push("/courses")}
                                className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                <span>Explore complete course catalog</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. Users Tab */}
                {activeTab === "users" && (
                    <div>
                        {filteredUsers.length === 0 ? (
                            <div className="py-12 text-center">
                                <Users className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    No members found
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                {filteredUsers.map((u) => {
                                    const roleClass =
                                        u.role === "Admin"
                                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                                            : u.role === "Instructor" || u.role === "Teacher"
                                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                            : u.role === "Coordinator"
                                            ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
                                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300";

                                    return (
                                        <div
                                            key={u.id}
                                            className="flex items-center justify-between py-3.5 px-3 rounded-xl transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/60"
                                        >
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-sm">
                                                    {initialOf(u.name || u.email)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                        {u.name || "Member"}
                                                    </p>
                                                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                                        {u.email}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${roleClass}`}
                                                >
                                                    {u.role}
                                                </span>
                                                <span className="text-xs text-slate-400 hidden sm:inline">
                                                    {u.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                            <button
                                type="button"
                                onClick={() => router.push(isCoordinator ? "/learners" : "/instructors")}
                                className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                <span>Manage all community members</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
