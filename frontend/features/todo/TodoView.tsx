"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    BookOpen,
    Check,
    ChevronDown,
    ClipboardCheck,
    ClipboardList,
    ExternalLink,
    FolderCheck,
    RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getAssignmentsRequest, type AssignmentDto } from "@/lib/api/assignments";
import { getMyCoursesRequest, type CourseDto } from "@/lib/api/courses";

const REVIEWED_STORAGE_KEY = "coursedesk.instructor.reviewed_assignments.v1";

function readReviewedStore(): number[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(REVIEWED_STORAGE_KEY) || window.localStorage.getItem("coursedesk.teacher.reviewed_assignments.v1");
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeReviewedStore(ids: number[]) {
    try {
        window.localStorage.setItem(REVIEWED_STORAGE_KEY, JSON.stringify(ids));
    } catch {
        /* ignore */
    }
}

type InstructorTab = "to-review" | "reviewed";
type LearnerTab = "assigned" | "missing" | "done";

type TimeSectionId = "no-due" | "earlier" | "this-week" | "next-week" | "later";

interface TimeSection {
    id: TimeSectionId;
    label: string;
    assignments: AssignmentDto[];
}

function categorizeByDueDate(assignments: AssignmentDto[]): TimeSection[] {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfWeek = startOfToday + (7 - now.getDay()) * 86400_000;
    const endOfNextWeek = endOfWeek + 7 * 86400_000;

    const noDue: AssignmentDto[] = [];
    const earlier: AssignmentDto[] = [];
    const thisWeek: AssignmentDto[] = [];
    const nextWeek: AssignmentDto[] = [];
    const later: AssignmentDto[] = [];

    for (const a of assignments) {
        if (!a.deadlineUtc) {
            noDue.push(a);
            continue;
        }
        const time = new Date(a.deadlineUtc).getTime();
        if (time < startOfToday) {
            earlier.push(a);
        } else if (time <= endOfWeek) {
            thisWeek.push(a);
        } else if (time <= endOfNextWeek) {
            nextWeek.push(a);
        } else {
            later.push(a);
        }
    }

    return [
        { id: "no-due", label: "No due date", assignments: noDue },
        { id: "this-week", label: "This week", assignments: thisWeek },
        { id: "next-week", label: "Next week", assignments: nextWeek },
        { id: "later", label: "Later", assignments: later },
        { id: "earlier", label: "Earlier / Past due", assignments: earlier },
    ];
}

function formatDueLabel(iso?: string | null): { text: string; tone: "default" | "green" | "red" } {
    if (!iso) return { text: "No due date", tone: "default" };
    const date = new Date(iso);
    const now = new Date();
    const isPast = date.getTime() < now.getTime();
    const formatted = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
    return {
        text: `Due ${formatted}`,
        tone: isPast ? "red" : "green",
    };
}

export function TodoView() {
    const router = useRouter();
    const { user } = useAuth();
    const isInstructor = user?.role === "Instructor" || user?.role === "Admin";

    const [instructorTab, setInstructorTab] = useState<InstructorTab>("to-review");
    const [learnerTab, setLearnerTab] = useState<LearnerTab>("assigned");
    const [courseFilter, setCourseFilter] = useState("all");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [courses, setCourses] = useState<CourseDto[]>([]);
    const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewedIds, setReviewedIds] = useState<number[]>([]);
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        "no-due": true,
        "this-week": true,
        "next-week": true,
        later: true,
        earlier: false,
    });

    useEffect(() => {
        setReviewedIds(readReviewedStore());
    }, []);

    useEffect(() => {
        if (!dropdownOpen) return;
        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setDropdownOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [dropdownOpen]);

    const loadData = () => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            getMyCoursesRequest().catch(() => [] as CourseDto[]),
            getAssignmentsRequest().catch(() => [] as AssignmentDto[]),
        ])
            .then(([coursesData, assignmentsData]) => {
                if (cancelled) return;
                setCourses(coursesData);
                setAssignments(assignmentsData);
            })
            .catch(() => {
                if (cancelled) return;
                setCourses([]);
                setAssignments([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    };

    useEffect(() => {
        const cleanup = loadData();
        const handleCoursesUpdated = () => {
            loadData();
        };
        window.addEventListener("coursedesk:courses-updated", handleCoursesUpdated);
        return () => {
            cleanup();
            window.removeEventListener("coursedesk:courses-updated", handleCoursesUpdated);
        };
    }, []);

    const toggleReviewed = useCallback(
        (id: number, e: React.MouseEvent) => {
            e.stopPropagation();
            setReviewedIds((prev) => {
                const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
                writeReviewedStore(next);
                return next;
            });
        },
        [],
    );

    const toggleSection = (id: string) =>
        setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

    // Course options for filter dropdown (all enrolled/instructed courses + any unique assignment courses)
    const courseOptions = useMemo(() => {
        const map = new Map<string, string>();
        for (const c of courses) {
            map.set(String(c.id), c.name);
        }
        for (const a of assignments) {
            if (a.courseName && !map.has(String(a.courseId))) {
                map.set(String(a.courseId), a.courseName);
            }
        }
        return Array.from(map.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [courses, assignments]);

    // Filter assignments by selected course
    const filteredAssignments = useMemo(() => {
        if (courseFilter === "all") return assignments;
        return assignments.filter(
            (a) => String(a.courseId) === courseFilter || a.courseName === courseFilter,
        );
    }, [assignments, courseFilter]);

    const selectedCourseLabel = useMemo(() => {
        if (courseFilter === "all") return "All courses";
        const found = courseOptions.find((c) => c.id === courseFilter);
        return found ? found.name : "All courses";
    }, [courseFilter, courseOptions]);

    // Split assignments for instructor: To Review vs Reviewed
    const instructorToReview = useMemo(
        () => filteredAssignments.filter((a) => !reviewedIds.includes(a.id)),
        [filteredAssignments, reviewedIds],
    );
    const instructorReviewed = useMemo(
        () => filteredAssignments.filter((a) => reviewedIds.includes(a.id)),
        [filteredAssignments, reviewedIds],
    );

    // Split assignments for learner: Assigned vs Missing vs Done
    const learnerAssigned = useMemo(() => {
        const now = Date.now();
        return filteredAssignments.filter(
            (a) =>
                a.mySubmissionStatus !== "Submitted" &&
                a.mySubmissionStatus !== "Graded" &&
                (!a.deadlineUtc || new Date(a.deadlineUtc).getTime() >= now),
        );
    }, [filteredAssignments]);

    const learnerMissing = useMemo(() => {
        const now = Date.now();
        return filteredAssignments.filter(
            (a) =>
                a.mySubmissionStatus !== "Submitted" &&
                a.mySubmissionStatus !== "Graded" &&
                a.deadlineUtc &&
                new Date(a.deadlineUtc).getTime() < now,
        );
    }, [filteredAssignments]);

    const learnerDone = useMemo(() => {
        return filteredAssignments.filter(
            (a) => a.mySubmissionStatus === "Submitted" || a.mySubmissionStatus === "Graded",
        );
    }, [filteredAssignments]);

    const activeList = isInstructor
        ? instructorTab === "to-review"
            ? instructorToReview
            : instructorReviewed
        : learnerTab === "assigned"
            ? learnerAssigned
            : learnerTab === "missing"
                ? learnerMissing
                : learnerDone;

    const sections = useMemo(() => categorizeByDueDate(activeList), [activeList]);

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-white pb-16 dark:bg-slate-950">
            {/* Top Navigation Tabs */}
            <div className="sticky top-16 z-30 border-b border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 sm:px-8">
                    <nav className="flex gap-6 sm:gap-10">
                        {isInstructor ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setInstructorTab("to-review")}
                                    className={`relative flex cursor-pointer items-center gap-2 py-4 text-sm font-medium transition-colors ${instructorTab === "to-review"
                                        ? "text-[#1a73e8]"
                                        : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
                                        }`}
                                >
                                    <ClipboardList className="h-4 w-4" />
                                    To review
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${instructorTab === "to-review"
                                            ? "bg-[#e8f0fe] text-[#174ea6] dark:bg-blue-950/60 dark:text-blue-300"
                                            : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300"
                                            }`}
                                    >
                                        {instructorToReview.length}
                                    </span>
                                    {instructorTab === "to-review" && (
                                        <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-t-full bg-[#1a73e8]" />
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setInstructorTab("reviewed")}
                                    className={`relative flex cursor-pointer items-center gap-2 py-4 text-sm font-medium transition-colors ${instructorTab === "reviewed"
                                        ? "text-[#1a73e8]"
                                        : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
                                        }`}
                                >
                                    <FolderCheck className="h-4 w-4" />
                                    Reviewed
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${instructorTab === "reviewed"
                                            ? "bg-[#e8f0fe] text-[#174ea6] dark:bg-blue-950/60 dark:text-blue-300"
                                            : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300"
                                            }`}
                                    >
                                        {instructorReviewed.length}
                                    </span>
                                    {instructorTab === "reviewed" && (
                                        <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-t-full bg-[#1a73e8]" />
                                    )}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setLearnerTab("assigned")}
                                    className={`relative flex cursor-pointer items-center gap-2 py-4 text-sm font-medium transition-colors ${learnerTab === "assigned"
                                        ? "text-[#1a73e8]"
                                        : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
                                        }`}
                                >
                                    Assigned
                                    <span className="rounded-full bg-[#e8f0fe] px-2 py-0.5 text-xs font-semibold text-[#174ea6] dark:bg-blue-950/60 dark:text-blue-300">
                                        {learnerAssigned.length}
                                    </span>
                                    {learnerTab === "assigned" && (
                                        <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-t-full bg-[#1a73e8]" />
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLearnerTab("missing")}
                                    className={`relative flex cursor-pointer items-center gap-2 py-4 text-sm font-medium transition-colors ${learnerTab === "missing"
                                        ? "text-[#c5221f]"
                                        : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
                                        }`}
                                >
                                    Missing
                                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-[#c5221f] dark:bg-rose-950/60 dark:text-rose-300">
                                        {learnerMissing.length}
                                    </span>
                                    {learnerTab === "missing" && (
                                        <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-t-full bg-[#c5221f]" />
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLearnerTab("done")}
                                    className={`relative flex cursor-pointer items-center gap-2 py-4 text-sm font-medium transition-colors ${learnerTab === "done"
                                        ? "text-[#137333]"
                                        : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
                                        }`}
                                >
                                    Done
                                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-[#137333] dark:bg-emerald-950/60 dark:text-emerald-300">
                                        {learnerDone.length}
                                    </span>
                                    {learnerTab === "done" && (
                                        <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-t-full bg-[#137333]" />
                                    )}
                                </button>
                            </>
                        )}
                    </nav>
                </div>
            </div>

            <div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-8">
                {/* Header & Course Filter */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
                            {isInstructor ? "To-review" : "To-do"}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                            {isInstructor
                                ? "Review learner submissions, manage deadlines, and track grading progress across your courses."
                                : "Keep track of your assigned coursework, upcoming deadlines, and grades."}
                        </p>
                    </div>

                    {/* Custom Course Filter Dropdown Button & Menu */}
                    <div ref={dropdownRef} className="relative w-full sm:w-72">
                        <button
                            type="button"
                            onClick={() => setDropdownOpen((v) => !v)}
                            aria-expanded={dropdownOpen}
                            aria-haspopup="listbox"
                            className={`group flex w-full cursor-pointer items-center justify-between gap-2.5 rounded-xl border bg-white px-3.5 py-2.5 text-sm font-semibold shadow-xs transition-all hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800 ${
                                dropdownOpen
                                    ? "border-blue-500 ring-2 ring-blue-500/20 dark:border-blue-400"
                                    : "border-slate-200 dark:border-slate-700"
                            }`}
                        >
                            <div className="flex min-w-0 items-center gap-2">
                                <BookOpen className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-blue-400" />
                                <span className="truncate text-left text-slate-800 dark:text-slate-100">
                                    {selectedCourseLabel}
                                </span>
                            </div>

                            <div className="flex shrink-0 items-center gap-1.5">
                                {courseFilter === "all" ? (
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                        {assignments.length}
                                    </span>
                                ) : (
                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                        {filteredAssignments.length}
                                    </span>
                                )}
                                <ChevronDown
                                    className={`h-4 w-4 text-slate-400 transition-transform duration-200 dark:text-slate-400 ${
                                        dropdownOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
                                    }`}
                                />
                            </div>
                        </button>

                        {/* Floating Dropdown Menu */}
                        {dropdownOpen && (
                            <div
                                role="listbox"
                                className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-xl backdrop-blur-xl transition-all dark:border-slate-700 dark:bg-slate-900/95 sm:left-auto sm:right-0 sm:w-80"
                            >
                                <div className="max-h-64 overflow-y-auto space-y-0.5 overscroll-contain">
                                    <button
                                        type="button"
                                        role="option"
                                        aria-selected={courseFilter === "all"}
                                        onClick={() => {
                                            setCourseFilter("all");
                                            setDropdownOpen(false);
                                        }}
                                        className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                                            courseFilter === "all"
                                                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300"
                                                : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                        }`}
                                    >
                                        <div className="flex min-w-0 items-center gap-2">
                                            <span className="truncate">All courses</span>
                                            {courseFilter === "all" && (
                                                <Check className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                                            )}
                                        </div>
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                            {assignments.length}
                                        </span>
                                    </button>

                                    {courseOptions.map((c) => {
                                        const count = assignments.filter(
                                            (a) => String(a.courseId) === c.id || a.courseName === c.name,
                                        ).length;
                                        const isSelected = courseFilter === c.id;

                                        return (
                                            <button
                                                key={c.id}
                                                type="button"
                                                role="option"
                                                aria-selected={isSelected}
                                                onClick={() => {
                                                    setCourseFilter(c.id);
                                                    setDropdownOpen(false);
                                                }}
                                                className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                                                    isSelected
                                                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300"
                                                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                                }`}
                                            >
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <span className="truncate">{c.name}</span>
                                                    {isSelected && (
                                                        <Check className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                                                    )}
                                                </div>
                                                {count > 0 && (
                                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                        {count}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
                    </div>
                ) : activeList.length === 0 ? (
                    <div className="mt-12 rounded-2xl border border-gray-200 bg-gray-50 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
                        <ClipboardCheck className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500" />
                        <h3 className="mt-3 text-lg font-medium text-gray-900 dark:text-slate-100">
                            {isInstructor
                                ? instructorTab === "to-review"
                                    ? "All caught up! No coursework needs review."
                                    : "No assignments marked as reviewed yet."
                                : "Woohoo, no work due!"}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                            {isInstructor
                                ? "When learners submit assignments, they will appear here ready for grading."
                                : "Check back later when instructors post new assignments."}
                        </p>
                    </div>
                ) : (
                    <div className="mt-8 space-y-4">
                        {sections.map((section) => {
                            if (section.assignments.length === 0) return null;
                            const count = section.assignments.length;
                            const isOpen = openSections[section.id] ?? true;

                            return (
                                <section
                                    key={section.id}
                                    className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleSection(section.id)}
                                        className="flex w-full cursor-pointer items-center justify-between border-b border-gray-100 bg-gray-50/70 px-5 py-3.5 text-left transition-colors hover:bg-gray-100/70 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-800/80"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-base font-semibold text-gray-800 dark:text-slate-100">
                                                {section.label}
                                            </span>
                                            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:bg-slate-700 dark:text-slate-300">
                                                {count}
                                            </span>
                                        </div>
                                        <ChevronDown
                                            className={`h-4 w-4 text-gray-500 dark:text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""
                                                }`}
                                        />
                                    </button>

                                    {isOpen && (
                                        <div className="divide-y divide-gray-100 dark:divide-slate-800">
                                            {section.assignments.map((assignment) => {
                                                const due = formatDueLabel(assignment.deadlineUtc);
                                                const isReviewed = reviewedIds.includes(assignment.id);

                                                return (
                                                    <div
                                                        key={assignment.id}
                                                        onClick={() =>
                                                            router.push(
                                                                `/course/${assignment.courseId}/assignments/${assignment.id}`,
                                                            )
                                                        }
                                                        className="group flex cursor-pointer flex-col gap-4 p-5 transition-colors hover:bg-blue-50/30 dark:hover:bg-slate-800/40 sm:flex-row sm:items-center sm:justify-between"
                                                    >
                                                        {/* Left info */}
                                                        <div className="flex min-w-0 items-start gap-4">
                                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f0fe] text-[#1a73e8] dark:bg-blue-950/60 dark:text-blue-300">
                                                                <ClipboardList className="h-5 w-5" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h4 className="truncate text-base font-semibold text-gray-900 group-hover:text-[#1a73e8] dark:text-slate-100 dark:group-hover:text-blue-400">
                                                                    {assignment.title}
                                                                </h4>
                                                                <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-slate-400">
                                                                    {assignment.courseName ?? "Course"}
                                                                    {assignment.department && ` • ${assignment.department}`}
                                                                    {assignment.topic && ` • ${assignment.topic}`}
                                                                </p>
                                                                <span
                                                                    className={`mt-1.5 inline-block text-xs font-medium ${due.tone === "red"
                                                                        ? "text-[#c5221f] dark:text-red-400"
                                                                        : due.tone === "green"
                                                                            ? "text-[#137333] dark:text-emerald-400"
                                                                            : "text-gray-500 dark:text-slate-400"
                                                                        }`}
                                                                >
                                                                    {due.text}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Right metrics / actions */}
                                                        <div className="flex shrink-0 flex-wrap items-center gap-3 sm:gap-6">
                                                            {isInstructor ? (
                                                                <>
                                                                    <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3.5 py-2 text-xs dark:border-slate-800 dark:bg-slate-800/70">
                                                                        <div className="text-center">
                                                                            <span className="block text-sm font-bold text-[#1a73e8] dark:text-blue-400">
                                                                                {assignment.turnedInCount ??
                                                                                    assignment.submissionCount}
                                                                            </span>
                                                                            <span className="text-gray-500 dark:text-slate-400">Turned in</span>
                                                                        </div>
                                                                        <div className="h-6 w-px bg-gray-200 dark:bg-slate-700" />
                                                                        <div className="text-center">
                                                                            <span className="block text-sm font-bold text-gray-700 dark:text-slate-200">
                                                                                {assignment.assignedCount ?? 0}
                                                                            </span>
                                                                            <span className="text-gray-500 dark:text-slate-400">Assigned</span>
                                                                        </div>
                                                                        <div className="h-6 w-px bg-gray-200 dark:bg-slate-750 dark:bg-slate-700" />
                                                                        <div className="text-center">
                                                                            <span className="block text-sm font-bold text-[#137333] dark:text-emerald-400">
                                                                                {assignment.gradedCount ?? 0}
                                                                            </span>
                                                                            <span className="text-gray-500 dark:text-slate-400">Graded</span>
                                                                        </div>
                                                                    </div>

                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => toggleReviewed(assignment.id, e)}
                                                                        title={
                                                                            isReviewed
                                                                                ? "Move to To-review"
                                                                                : "Mark as reviewed"
                                                                        }
                                                                        className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-colors ${isReviewed
                                                                            ? "border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                                                            : "bg-[#e8f0fe] text-[#174ea6] hover:bg-[#d2e3fc] dark:bg-blue-950/70 dark:text-blue-300 dark:hover:bg-blue-900/60"
                                                                            }`}
                                                                    >
                                                                        {isReviewed ? (
                                                                            <>
                                                                                <RotateCcw className="h-3.5 w-3.5" />
                                                                                Move to To-review
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Check className="h-3.5 w-3.5" />
                                                                                Mark reviewed
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <div className="flex items-center gap-2 text-xs">
                                                                    <span
                                                                        className={`rounded-full px-3 py-1 font-medium ${assignment.mySubmissionStatus === "Graded"
                                                                            ? "bg-green-100 text-[#137333] dark:bg-emerald-950/60 dark:text-emerald-300"
                                                                            : assignment.mySubmissionStatus === "Submitted"
                                                                                ? "bg-blue-100 text-[#174ea6] dark:bg-blue-950/60 dark:text-blue-300"
                                                                                : "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300"
                                                                            }`}
                                                                    >
                                                                        {assignment.mySubmissionStatus ?? "Assigned"}
                                                                    </span>
                                                                    <ExternalLink className="h-4 w-4 text-gray-400 dark:text-slate-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </section>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}