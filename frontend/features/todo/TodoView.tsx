"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
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
        let cancelled = false;
        setLoading(true);
        getAssignmentsRequest()
            .then((data) => {
                if (!cancelled) setAssignments(data);
            })
            .catch(() => {
                if (!cancelled) setAssignments([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
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

    // Course options for filter dropdown
    const courseOptions = useMemo(() => {
        const set = new Set<string>();
        for (const a of assignments) {
            if (a.courseName) set.add(a.courseName);
        }
        return Array.from(set);
    }, [assignments]);

    // Filter assignments by selected course
    const filteredAssignments = useMemo(() => {
        if (courseFilter === "all") return assignments;
        return assignments.filter((a) => a.courseName === courseFilter);
    }, [assignments, courseFilter]);

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

                    <div className="relative w-full sm:max-w-xs">
                        <select
                            value={courseFilter}
                            onChange={(e) => setCourseFilter(e.target.value)}
                            className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-9 text-sm font-medium text-gray-800 shadow-sm focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        >
                            <option value="all">All courses</option>
                            {courseOptions.map((c) => (
                                <option key={c} value={c} className="bg-white text-gray-900 dark:bg-slate-900 dark:text-slate-100">
                                    {c}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-slate-400" />
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
                                                                    {assignment.session && ` • ${assignment.session}`}
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
                                                                        <div className="h-6 w-px bg-gray-200" />
                                                                        <div className="text-center">
                                                                            <span className="block text-sm font-bold text-[#137333]">
                                                                                {assignment.gradedCount ?? 0}
                                                                            </span>
                                                                            <span className="text-gray-500">Graded</span>
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
                                                                            ? "border border-gray-300 text-gray-700 hover:bg-gray-100"
                                                                            : "bg-[#e8f0fe] text-[#174ea6] hover:bg-[#d2e3fc]"
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
                                                                            ? "bg-green-100 text-[#137333]"
                                                                            : assignment.mySubmissionStatus === "Submitted"
                                                                                ? "bg-blue-100 text-[#174ea6]"
                                                                                : "bg-gray-100 text-gray-700"
                                                                            }`}
                                                                    >
                                                                        {assignment.mySubmissionStatus ?? "Assigned"}
                                                                    </span>
                                                                    <ExternalLink className="h-4 w-4 text-gray-400" />
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