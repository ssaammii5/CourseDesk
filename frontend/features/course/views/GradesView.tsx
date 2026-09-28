"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Award,
    CheckCircle2,
    ChevronRight,
    Clock,
    Download,
    ExternalLink,
    Filter,
    HelpCircle,
    Layers,
    Percent,
    Search,
    Sparkles,
    TrendingUp,
    Users,
    X,
} from "lucide-react";
import type { ClassPerson, ClassworkEntry } from "@/types";
import type { SubmissionDto } from "@/lib/api/submissions";
import { initialOf } from "@/lib/utils/format";
import { avatarClassFor } from "@/lib/utils/theme";

interface GradesViewProps {
    people: ClassPerson[];
    items: ClassworkEntry[];
    submissions?: SubmissionDto[];
    courseId?: number;
    courseTitle?: string;
}

type SortField = "name" | "average" | "submissions";
type SortOrder = "asc" | "desc";
type FilterStatus = "all" | "needs-grading" | "high" | "low";
type DisplayMode = "score" | "percentage";

interface ModalDetail {
    learner: ClassPerson;
    assignment: ClassworkEntry;
    submission?: SubmissionDto;
}

export function GradesView({
    people,
    items,
    submissions = [],
    courseId,
    courseTitle,
}: GradesViewProps) {
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
    const [sortField, setSortField] = useState<SortField>("name");
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
    const [displayMode, setDisplayMode] = useState<DisplayMode>("percentage");
    const [selectedDetail, setSelectedDetail] = useState<ModalDetail | null>(null);

    // Eligible learners and graded items
    const learners = useMemo(
        () => people.filter((p) => p.role === "Learner" || (p.role as string) === "Student"),
        [people],
    );

    const columns = useMemo(
        () => items.filter((i) => i.status !== "Draft" && i.kind !== "material"),
        [items],
    );

    // Lookup submission helper
    const getSubmissionFor = (learnerId: number, assignmentId: number) =>
        submissions.find(
            (s) =>
                (s.learnerId === learnerId || s.studentId === learnerId) &&
                s.assignmentId === assignmentId,
        );

    // Calculate learner grade records
    const learnerRecords = useMemo(() => {
        return learners.map((learner) => {
            let totalPossible = 0;
            let totalEarned = 0;
            let gradedCount = 0;
            let submittedCount = 0;
            let pendingGradingCount = 0;

            const grades = columns.map((col) => {
                const sub = getSubmissionFor(learner.id, col.id);
                const maxMarks = col.maxMarks && col.maxMarks > 0 ? col.maxMarks : 100;

                if (sub) {
                    submittedCount += 1;
                    if (sub.marks !== null && sub.marks !== undefined) {
                        gradedCount += 1;
                        totalEarned += sub.marks;
                        totalPossible += maxMarks;
                    } else {
                        pendingGradingCount += 1;
                    }
                }

                return {
                    assignmentId: col.id,
                    submission: sub,
                    marks: sub?.marks ?? null,
                    maxMarks,
                    isSubmitted: Boolean(sub),
                    isGraded: sub?.marks !== null && sub?.marks !== undefined,
                };
            });

            const overallPercentage =
                totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : null;

            return {
                learner,
                grades,
                overallPercentage,
                totalEarned,
                totalPossible,
                gradedCount,
                submittedCount,
                pendingGradingCount,
            };
        });
    }, [learners, columns, submissions]);

    // Analytics summary
    const stats = useMemo(() => {
        if (learnerRecords.length === 0 || columns.length === 0) {
            return {
                classAverage: 0,
                evaluatedCount: 0,
                totalSubmissions: 0,
                pendingCount: 0,
                topScore: 0,
                turnInRate: 0,
            };
        }

        const validAverages = learnerRecords
            .map((r) => r.overallPercentage)
            .filter((p): p is number => p !== null);

        const classAverage =
            validAverages.length > 0
                ? Math.round(validAverages.reduce((acc, val) => acc + val, 0) / validAverages.length)
                : 0;

        let evaluatedCount = 0;
        let totalSubmissions = 0;
        let pendingCount = 0;

        learnerRecords.forEach((r) => {
            evaluatedCount += r.gradedCount;
            totalSubmissions += r.submittedCount;
            pendingCount += r.pendingGradingCount;
        });

        const topScore = validAverages.length > 0 ? Math.max(...validAverages) : 0;
        const totalPossibleDeliverables = learners.length * columns.length;
        const turnInRate =
            totalPossibleDeliverables > 0
                ? Math.round((totalSubmissions / totalPossibleDeliverables) * 100)
                : 0;

        return {
            classAverage,
            evaluatedCount,
            totalSubmissions,
            pendingCount,
            topScore,
            turnInRate,
        };
    }, [learnerRecords, columns.length, learners.length]);

    // Column-level statistics
    const columnStats = useMemo(() => {
        return columns.map((col) => {
            const maxMarks = col.maxMarks && col.maxMarks > 0 ? col.maxMarks : 100;
            let sumMarks = 0;
            let countGraded = 0;
            let countSubmitted = 0;

            learners.forEach((learner) => {
                const sub = getSubmissionFor(learner.id, col.id);
                if (sub) {
                    countSubmitted += 1;
                    if (sub.marks !== null && sub.marks !== undefined) {
                        sumMarks += sub.marks;
                        countGraded += 1;
                    }
                }
            });

            const avgMarks = countGraded > 0 ? Math.round(sumMarks / countGraded) : null;
            const avgPct = avgMarks !== null ? Math.round((avgMarks / maxMarks) * 100) : null;

            return {
                assignmentId: col.id,
                avgMarks,
                avgPct,
                maxMarks,
                countGraded,
                countSubmitted,
                totalStudents: learners.length,
            };
        });
    }, [columns, learners, submissions]);

    // Filtered and sorted learner records
    const displayedRecords = useMemo(() => {
        let result = [...learnerRecords];

        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter(
                (r) =>
                    r.learner.name.toLowerCase().includes(q) ||
                    (r.learner.email && r.learner.email.toLowerCase().includes(q)),
            );
        }

        // Status filter
        if (filterStatus === "needs-grading") {
            result = result.filter((r) => r.pendingGradingCount > 0);
        } else if (filterStatus === "high") {
            result = result.filter((r) => r.overallPercentage !== null && r.overallPercentage >= 85);
        } else if (filterStatus === "low") {
            result = result.filter((r) => r.overallPercentage !== null && r.overallPercentage < 60);
        }

        // Sorting
        result.sort((a, b) => {
            let comparison = 0;
            if (sortField === "name") {
                comparison = a.learner.name.localeCompare(b.learner.name);
            } else if (sortField === "average") {
                const avgA = a.overallPercentage ?? -1;
                const avgB = b.overallPercentage ?? -1;
                comparison = avgA - avgB;
            } else if (sortField === "submissions") {
                comparison = a.submittedCount - b.submittedCount;
            }

            return sortOrder === "asc" ? comparison : -comparison;
        });

        return result;
    }, [learnerRecords, searchQuery, filterStatus, sortField, sortOrder]);

    // Export CSV handler
    const handleExportCsv = () => {
        if (learnerRecords.length === 0 || columns.length === 0) return;

        const headers = [
            "Learner Name",
            "Email",
            "Overall Average (%)",
            ...columns.map((c) => `"${c.title.replace(/"/g, '""')} (Max: ${c.maxMarks ?? 100})"`),
        ];

        const rows = learnerRecords.map((r) => {
            const rowData = [
                `"${r.learner.name.replace(/"/g, '""')}"`,
                `"${r.learner.email ?? ""}"`,
                r.overallPercentage !== null ? `${r.overallPercentage}%` : "N/A",
                ...r.grades.map((g) => {
                    if (g.marks !== null) return `${g.marks}`;
                    if (g.isSubmitted) return "Turned In (Ungraded)";
                    return "Unsubmitted";
                }),
            ];
            return rowData.join(",");
        });

        const csvString = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const cleanTitle = courseTitle ? courseTitle.toLowerCase().replace(/[^a-z0-9]/g, "_") : "course";
        link.setAttribute("href", url);
        link.setAttribute("download", `${cleanTitle}_grades.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const getScoreBadgeClass = (percentage: number | null) => {
        if (percentage === null) return "text-slate-400 dark:text-slate-500";
        if (percentage >= 85)
            return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 ring-1 ring-emerald-200/70 dark:ring-emerald-800/60";
        if (percentage >= 70)
            return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 ring-1 ring-indigo-200/70 dark:ring-indigo-800/60";
        if (percentage >= 50)
            return "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 ring-1 ring-amber-200/70 dark:ring-amber-800/60";
        return "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 ring-1 ring-rose-200/70 dark:ring-rose-800/60";
    };

    return (
        <div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-8 sm:px-8">
            {/* Top Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        <Award className="h-4 w-4" />
                        <span>Academic Performance</span>
                    </div>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                        Gradebook &amp; Analytics
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Track submissions, grade distribution, and individual student progress across all assignments.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Toggle Raw vs Percentage */}
                    <button
                        type="button"
                        onClick={() =>
                            setDisplayMode((prev) => (prev === "percentage" ? "score" : "percentage"))
                        }
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        title="Toggle score display mode"
                    >
                        <Percent className="h-3.5 w-3.5 text-slate-500" />
                        <span>{displayMode === "percentage" ? "Showing %" : "Showing Points"}</span>
                    </button>

                    {/* Export CSV button */}
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        disabled={columns.length === 0 || learners.length === 0}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600"
                    >
                        <Download className="h-3.5 w-3.5" />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* KPI Metric Cards */}
            {columns.length > 0 && learners.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Card 1: Class Average */}
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800/80 dark:bg-slate-900/90">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Class Average
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {stats.classAverage}%
                            </span>
                            <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                    stats.classAverage >= 75
                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                                }`}
                            >
                                {stats.classAverage >= 75 ? "Healthy" : "Needs Attention"}
                            </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Calculated across all evaluated submissions
                        </p>
                    </div>

                    {/* Card 2: Evaluation Rate */}
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800/80 dark:bg-slate-900/90">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Grading Status
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {stats.evaluatedCount}
                            </span>
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                / {stats.totalSubmissions} turned in
                            </span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                    style={{
                                        width: `${
                                            stats.totalSubmissions > 0
                                                ? Math.round((stats.evaluatedCount / stats.totalSubmissions) * 100)
                                                : 0
                                        }%`,
                                    }}
                                />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                {stats.pendingCount > 0 ? `${stats.pendingCount} pending` : "All evaluated"}
                            </span>
                        </div>
                    </div>

                    {/* Card 3: Top Score */}
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800/80 dark:bg-slate-900/90">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Top Performance
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                                <Sparkles className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-3xl font-bold tracking-tight text-slate-900 dark:white">
                                {stats.topScore}%
                            </span>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                highest student average
                            </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Based on completed graded assignments
                        </p>
                    </div>

                    {/* Card 4: Active Learners */}
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800/80 dark:bg-slate-900/90">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Enrolled Learners
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                                <Users className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {learners.length}
                            </span>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                enrolled in course
                            </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            {columns.length} active assignment{columns.length === 1 ? "" : "s"} tracked
                        </p>
                    </div>
                </div>
            )}

            {/* Filter and Search Toolbar */}
            {columns.length > 0 && learners.length > 0 && (
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800/80 dark:bg-slate-900/90 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search learner name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:bg-slate-800"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Status Filter */}
                        <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
                            <button
                                type="button"
                                onClick={() => setFilterStatus("all")}
                                className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                                    filterStatus === "all"
                                        ? "bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-white"
                                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                }`}
                            >
                                All ({learnerRecords.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterStatus("needs-grading")}
                                className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                                    filterStatus === "needs-grading"
                                        ? "bg-white text-amber-700 shadow-2xs dark:bg-slate-900 dark:text-amber-400"
                                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                }`}
                            >
                                Needs Grading
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterStatus("high")}
                                className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                                    filterStatus === "high"
                                        ? "bg-white text-emerald-700 shadow-2xs dark:bg-slate-900 dark:text-emerald-400"
                                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                }`}
                            >
                                High (&ge;85%)
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterStatus("low")}
                                className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                                    filterStatus === "low"
                                        ? "bg-white text-rose-700 shadow-2xs dark:bg-slate-900 dark:text-rose-400"
                                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                }`}
                            >
                                Attention (&lt;60%)
                            </button>
                        </div>

                        {/* Sort selector */}
                        <div className="flex items-center gap-1.5">
                            <select
                                value={`${sortField}-${sortOrder}`}
                                onChange={(e) => {
                                    const [f, o] = e.target.value.split("-") as [SortField, SortOrder];
                                    setSortField(f);
                                    setSortOrder(o);
                                }}
                                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                            >
                                <option value="name-asc">Name (A &rarr; Z)</option>
                                <option value="name-desc">Name (Z &rarr; A)</option>
                                <option value="average-desc">Grade (Highest)</option>
                                <option value="average-asc">Grade (Lowest)</option>
                                <option value="submissions-desc">Most Submissions</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty States */}
            {columns.length === 0 || learners.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white/60 p-12 text-center backdrop-blur-md shadow-2xs dark:border-slate-800/80 dark:bg-slate-900/60">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                        <Layers className="h-8 w-8" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
                        {columns.length === 0 ? "No Graded Assignments" : "No Learners Enrolled"}
                    </h3>
                    <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
                        {columns.length === 0
                            ? "Create an assignment in Coursework to begin recording and tracking student scores."
                            : "Students will appear here once they enroll in this course."}
                    </p>
                    {columns.length === 0 && courseId && (
                        <button
                            type="button"
                            onClick={() => router.push(`/course/${courseId}?tab=coursework`)}
                            className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                        >
                            <span>Go to Coursework</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            ) : displayedRecords.length === 0 ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-2xs dark:border-slate-800/80 dark:bg-slate-900">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        No learners match the current filter or search criteria
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            setSearchQuery("");
                            setFilterStatus("all");
                        }}
                        className="mt-3 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                        Reset filters
                    </button>
                </div>
            ) : (
                /* Main Gradebook Grid / Table with Sticky Learner Column */
                <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs dark:border-slate-800/90 dark:bg-slate-900">
                    <div className="relative overflow-x-auto">
                        <table className="w-full min-w-[800px] border-collapse text-left">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-800/70">
                                    {/* Sticky Learner Name Header */}
                                    <th className="sticky left-0 z-20 min-w-[260px] bg-slate-50/95 px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-700 backdrop-blur-md dark:bg-slate-800/95 dark:text-slate-200 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-3.5 w-3.5 text-slate-400" />
                                            <span>Learner</span>
                                        </div>
                                    </th>

                                    {/* Assignment Column Headers */}
                                    {columns.map((c) => (
                                        <th
                                            key={c.id}
                                            className="min-w-[170px] max-w-[220px] px-4 py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                                        >
                                            <div className="flex items-start justify-between gap-1.5">
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate font-semibold text-slate-900 dark:text-slate-100" title={c.title}>
                                                        {c.title}
                                                    </div>
                                                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-normal text-slate-500 dark:text-slate-400">
                                                        <span>{c.maxMarks ?? 100} pts</span>
                                                        {c.dueLabel && (
                                                            <>
                                                                <span>&bull;</span>
                                                                <span className="truncate">{c.dueLabel}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {courseId && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            router.push(`/course/${courseId}/assignments/${c.id}`)
                                                        }
                                                        title="Open assignment grading"
                                                        className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </th>
                                    ))}

                                    {/* Overall Average Header */}
                                    <th className="min-w-[120px] px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 text-right">
                                        Overall Grade
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                {displayedRecords.map((record) => {
                                    const { learner, grades, overallPercentage } = record;
                                    const avatarBg = learner.avatarClass || avatarClassFor(learner.id);

                                    return (
                                        <tr
                                            key={learner.id}
                                            className="group transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                                        >
                                            {/* Sticky Learner Cell */}
                                            <td className="sticky left-0 z-10 bg-white/95 px-4 py-3 backdrop-blur-md dark:bg-slate-900/95 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)] group-hover:bg-slate-50/95 dark:group-hover:bg-slate-800/90 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-2xs ${avatarBg}`}
                                                    >
                                                        {initialOf(learner.name)}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <div className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                                                            {learner.name}
                                                        </div>
                                                        <div className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                                                            {learner.email || `Student ID: #${learner.id}`}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Assignment Score Cells */}
                                            {grades.map((gradeItem, idx) => {
                                                const col = columns[idx];
                                                const { marks, maxMarks, isSubmitted, isGraded, submission } =
                                                    gradeItem;

                                                const pct =
                                                    marks !== null && maxMarks > 0
                                                        ? Math.round((marks / maxMarks) * 100)
                                                        : null;

                                                return (
                                                    <td
                                                        key={col.id}
                                                        onClick={() =>
                                                            setSelectedDetail({
                                                                learner,
                                                                assignment: col,
                                                                submission,
                                                            })
                                                        }
                                                        className="cursor-pointer px-4 py-3 transition-colors hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20"
                                                    >
                                                        {isGraded ? (
                                                            <div className="inline-flex items-center gap-1.5">
                                                                <span
                                                                    className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold ${getScoreBadgeClass(
                                                                        pct,
                                                                    )}`}
                                                                >
                                                                    {displayMode === "percentage"
                                                                        ? `${pct}%`
                                                                        : `${marks} / ${maxMarks}`}
                                                                </span>
                                                            </div>
                                                        ) : isSubmitted ? (
                                                            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/60">
                                                                <Clock className="h-3 w-3" />
                                                                <span>Turned In</span>
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs font-medium text-slate-300 dark:text-slate-700">
                                                                &mdash;
                                                            </span>
                                                        )}
                                                    </td>
                                                );
                                            })}

                                            {/* Overall Grade Cell */}
                                            <td className="px-4 py-3 text-right">
                                                {overallPercentage !== null ? (
                                                    <div className="inline-flex items-center gap-2">
                                                        <span
                                                            className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-bold ${getScoreBadgeClass(
                                                                overallPercentage,
                                                            )}`}
                                                        >
                                                            {overallPercentage}%
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs font-medium text-slate-400 dark:text-slate-600">
                                                        &mdash;
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>

                            {/* Class Statistics Footer Row */}
                            <tfoot>
                                <tr className="border-t-2 border-slate-200 bg-slate-50/80 font-semibold dark:border-slate-800 dark:bg-slate-850">
                                    <td className="sticky left-0 z-10 bg-slate-50/95 px-4 py-3 text-xs uppercase tracking-wider text-slate-600 backdrop-blur-md dark:bg-slate-800/95 dark:text-slate-300 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                                        <span>Class Average</span>
                                    </td>

                                    {columnStats.map((colStat) => (
                                        <td key={colStat.assignmentId} className="px-4 py-3 text-xs">
                                            {colStat.avgMarks !== null ? (
                                                <div>
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                                        {displayMode === "percentage"
                                                            ? `${colStat.avgPct}%`
                                                            : `${colStat.avgMarks} / ${colStat.maxMarks}`}
                                                    </span>
                                                    <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                                        {colStat.countSubmitted}/{colStat.totalStudents} submitted
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 dark:text-slate-600">&mdash;</span>
                                            )}
                                        </td>
                                    ))}

                                    <td className="px-4 py-3 text-right text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                        {stats.classAverage}%
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* Quick Inspection Detail Modal */}
            {selectedDetail && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-150"
                    onClick={() => setSelectedDetail(null)}
                >
                    <div
                        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3.5 dark:border-slate-800">
                            <div>
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                    <Award className="h-3.5 w-3.5" />
                                    <span>Submission Details</span>
                                </span>
                                <h3 className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">
                                    {selectedDetail.assignment.title}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedDetail(null)}
                                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Learner Info */}
                        <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                            <span
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-2xs ${
                                    selectedDetail.learner.avatarClass ||
                                    avatarClassFor(selectedDetail.learner.id)
                                }`}
                            >
                                {initialOf(selectedDetail.learner.name)}
                            </span>
                            <div className="min-w-0">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                    {selectedDetail.learner.name}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {selectedDetail.learner.email || `Student #${selectedDetail.learner.id}`}
                                </p>
                            </div>
                        </div>

                        {/* Submission status and score */}
                        <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Evaluation Status
                                </span>
                                {selectedDetail.submission?.marks !== null &&
                                selectedDetail.submission?.marks !== undefined ? (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        <span>Graded</span>
                                    </span>
                                ) : selectedDetail.submission ? (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>Turned In &bull; Ungraded</span>
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                        <span>Unsubmitted</span>
                                    </span>
                                )}
                            </div>

                            {selectedDetail.submission?.marks !== null &&
                                selectedDetail.submission?.marks !== undefined && (
                                    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                            Score Awarded
                                        </span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                            {selectedDetail.submission.marks} /{" "}
                                            {selectedDetail.assignment.maxMarks ?? 100} pts (
                                            {Math.round(
                                                (selectedDetail.submission.marks /
                                                    (selectedDetail.assignment.maxMarks ?? 100)) *
                                                    100,
                                            )}
                                            %)
                                        </span>
                                    </div>
                                )}

                            {/* Feedback if any */}
                            {selectedDetail.submission?.feedback && (
                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                    <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                                        Instructor Feedback
                                    </span>
                                    <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                                        &ldquo;{selectedDetail.submission.feedback}&rdquo;
                                    </p>
                                </div>
                            )}

                            {/* Answer preview */}
                            {selectedDetail.submission?.answer && (
                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                    <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                                        Student Submission Preview
                                    </span>
                                    <p className="mt-1 max-h-24 overflow-y-auto whitespace-pre-wrap text-xs text-slate-600 dark:text-slate-300">
                                        {selectedDetail.submission.answer}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setSelectedDetail(null)}
                                className="cursor-pointer rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                                Close
                            </button>
                            {courseId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const aid = selectedDetail.assignment.id;
                                        setSelectedDetail(null);
                                        router.push(`/course/${courseId}/assignments/${aid}`);
                                    }}
                                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                                >
                                    <span>Open Assignment</span>
                                    <ExternalLink className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}