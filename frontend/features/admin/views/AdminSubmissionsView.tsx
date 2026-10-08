"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
    Tag,
    BookOpen,
    Search,
    SlidersHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DataTable, StatusBadge, ModernDropdown } from "@/components/ui";
import { getSubmissionsRequest, type SubmissionDto } from "@/lib/api/submissions";

/** Row shape used by the existing table / grouping logic */
interface SubmissionRow {
    id: number;
    assignmentId: number;
    assignmentTitle: string;
    courseId: number;
    courseName: string;
    learnerId: number;
    learnerName: string;
    learnerAcademicId: string;
    studentId: number;
    studentName: string;
    studentAcademicId: string;
    status: "Submitted" | "Graded" | "Pending";
    marks: number | null;
    feedback: string | null;
    submittedAt: string;
    program: string;
    department: string;
    session: string;
}

function mapDtoToRow(dto: SubmissionDto): SubmissionRow {
    const submitted = Boolean(dto.submittedAtUtc);
    const lId = dto.learnerId ?? dto.studentId;
    const lName = dto.learnerName ?? dto.studentName ?? "Unknown Learner";
    const lAcadId = dto.learnerAcademicId ?? dto.studentAcademicId ?? "";
    return {
        id: dto.id,
        assignmentId: dto.assignmentId,
        assignmentTitle: dto.assignmentTitle ?? "Unknown Assignment",
        courseId: dto.courseId,
        courseName: dto.courseName ?? "Unknown Course",
        learnerId: lId,
        learnerName: lName,
        learnerAcademicId: lAcadId,
        studentId: lId,
        studentName: lName,
        studentAcademicId: lAcadId,
        status: submitted ? (dto.status as "Submitted" | "Graded") : "Pending",
        marks: dto.marks,
        feedback: dto.feedback,
        submittedAt: dto.submittedAtUtc ? dto.submittedAtUtc.split("T")[0] : "",
        program: dto.program ?? "Unknown",
        department: dto.department ?? "General",
        session: dto.session ?? "Unknown",
    };
}

interface CourseGroup {
    courseId: number;
    courseName: string;
    submissions: SubmissionRow[];
}

interface CategoryGroup {
    name: string;
    courses: CourseGroup[];
    count: number;
}

export function AdminSubmissionsView() {
    const router = useRouter();
    const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [courseFilter, setCourseFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    const loadSubmissions = useCallback(async () => {
        try {
            setError(null);
            const dtos = await getSubmissionsRequest();
            setSubmissions(dtos.map(mapDtoToRow));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load submissions.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadSubmissions();
    }, [loadSubmissions]);

    const categoryOptions = useMemo(() => {
        return Array.from(new Set(submissions.map((s) => s.department).filter(Boolean))).sort();
    }, [submissions]);

    const courseOptions = useMemo(() => {
        const base =
            categoryFilter === "all"
                ? submissions
                : submissions.filter((s) => s.department === categoryFilter);
        return Array.from(new Set(base.map((s) => s.courseName).filter(Boolean))).sort();
    }, [submissions, categoryFilter]);

    const filtered = useMemo(() => {
        return submissions.filter((s) => {
            const matchSearch =
                (s.learnerName || s.studentName).toLowerCase().includes(search.toLowerCase()) ||
                s.assignmentTitle.toLowerCase().includes(search.toLowerCase()) ||
                s.courseName.toLowerCase().includes(search.toLowerCase()) ||
                (s.learnerAcademicId || s.studentAcademicId).toLowerCase().includes(search.toLowerCase());
            const matchCategory = categoryFilter === "all" || s.department === categoryFilter;
            const matchCourse = courseFilter === "all" || s.courseName === courseFilter;
            const matchStatus = statusFilter === "all" || s.status === statusFilter;
            return matchSearch && matchCategory && matchCourse && matchStatus;
        });
    }, [submissions, search, categoryFilter, courseFilter, statusFilter]);

    const activeFilterCount = [categoryFilter, courseFilter, statusFilter].filter(
        (f) => f !== "all"
    ).length;

    const clearFilters = () => {
        setCategoryFilter("all");
        setCourseFilter("all");
        setStatusFilter("all");
    };

    const categoryGroups = useMemo<CategoryGroup[]>(() => {
        const map = new Map<string, Map<string, SubmissionRow[]>>();

        for (const s of filtered) {
            const cat = s.department || "General";
            if (!map.has(cat)) map.set(cat, new Map());
            const courseMap = map.get(cat)!;
            if (!courseMap.has(s.courseName)) courseMap.set(s.courseName, []);
            courseMap.get(s.courseName)!.push(s);
        }

        return Array.from(map.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([categoryName, courseMap]) => {
                const courses: CourseGroup[] = Array.from(courseMap.entries())
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([courseName, rows]) => ({
                        courseId: rows[0]?.courseId ?? 0,
                        courseName,
                        submissions: rows.sort((a, b) =>
                            (a.learnerName || a.studentName).localeCompare(b.learnerName || b.studentName)
                        ),
                    }));
                return {
                    name: categoryName,
                    courses,
                    count: courses.reduce((sum, c) => sum + c.submissions.length, 0),
                };
            });
    }, [filtered]);

    const handleRowClick = (submissionId: number) => {
        router.push(`/submissions/${submissionId}`);
    };

    const columns = [
        {
            key: "learnerId",
            header: "Learner ID",
            width: "13%",
            truncate: true,
            render: (s: SubmissionRow) => {
                const idVal = s.learnerAcademicId || s.studentAcademicId;
                return idVal ? (
                    <span className="text-sm text-gray-900 dark:text-slate-100" title={idVal}>{idVal}</span>
                ) : (
                    <span className="text-gray-400 dark:text-slate-500">—</span>
                );
            },
        },
        {
            key: "learnerName",
            header: "Learner",
            width: "18%",
            truncate: true,
            render: (s: SubmissionRow) => s.learnerName || s.studentName,
        },
        {
            key: "assignmentTitle",
            header: "Assignment",
            width: "22%",
            truncate: true,
        },
        {
            key: "status",
            header: "Status",
            width: "10%",
            render: (s: SubmissionRow) => <StatusBadge status={s.status} />,
        },
        {
            key: "marks",
            header: "Marks",
            className: "text-center",
            width: "8%",
            render: (s: SubmissionRow) =>
                s.marks !== null ? (
                    <span className="font-medium text-gray-900 dark:text-slate-100">{s.marks}</span>
                ) : (
                    <span className="text-gray-400 dark:text-slate-500">—</span>
                ),
        },
        {
            key: "submittedAt",
            header: "Submitted",
            width: "12%",
            render: (s: SubmissionRow) =>
                s.submittedAt ? s.submittedAt : <span className="italic text-gray-400 dark:text-slate-500">Not yet</span>,
        },
        {
            key: "feedback",
            header: "Feedback",
            width: "17%",
            truncate: true,
            render: (s: SubmissionRow) =>
                s.feedback ? (
                    <span className="text-sm text-gray-700 dark:text-slate-300">{s.feedback}</span>
                ) : (
                    <span className="text-gray-400 dark:text-slate-500">—</span>
                ),
        },
    ];

    if (loading) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-8">
            {error && (
                <div className="mb-4 rounded-lg bg-[#fce8e6] dark:bg-red-950/40 px-5 py-3.5 text-sm text-[#c5221f] dark:text-red-400">{error}</div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 sm:text-3xl">All Submissions</h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                        {submissions.length} submissions total • {filtered.length} shown
                    </p>
                </div>
            </div>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative w-full sm:max-w-sm sm:flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by learner, ID, assignment, or course..."
                        className="w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setFiltersOpen((v) => !v)}
                        className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${filtersOpen || activeFilterCount > 0
                            ? "border-[#1a63d8] bg-[#e8f0fe] dark:bg-blue-950/60 text-[#174ea6] dark:text-blue-300"
                            : "border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                            }`}
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1a63d8] px-1.5 text-xs font-semibold text-white">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                    {activeFilterCount > 0 && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="cursor-pointer text-sm font-medium text-[#1a73e8] dark:text-blue-400 hover:underline"
                        >
                            Clear all
                        </button>
                    )}
                </div>
            </div>

            {filtersOpen && (
                <div className="mt-4 grid gap-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm p-4 sm:grid-cols-2 lg:grid-cols-3 shadow-sm">
                    <div>
                        <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-slate-400">Category</span>
                        <ModernDropdown
                            value={categoryFilter}
                            onChange={(val) => {
                                setCategoryFilter(val);
                                setCourseFilter("all");
                            }}
                            options={[
                                { value: "all", label: "All Categories" },
                                ...categoryOptions.map((c) => ({ value: c, label: c })),
                            ]}
                            size="sm"
                        />
                    </div>

                    <div>
                        <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-slate-400">Course</span>
                        <ModernDropdown
                            value={courseFilter}
                            onChange={setCourseFilter}
                            options={[
                                { value: "all", label: "All Courses" },
                                ...courseOptions.map((c) => ({ value: c, label: c })),
                            ]}
                            size="sm"
                        />
                    </div>

                    <div>
                        <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-slate-400">Status</span>
                        <ModernDropdown
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={[
                                { value: "all", label: "All Status" },
                                { value: "Submitted", label: "Submitted" },
                                { value: "Graded", label: "Graded" },
                                { value: "Pending", label: "Pending" },
                            ]}
                            showStatusDot
                            size="sm"
                        />
                    </div>
                </div>
            )}

            <div className="mt-8 space-y-12">
                {filtered.length === 0 && (
                    <div className="rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-16 text-center">
                        <p className="text-sm text-gray-600 dark:text-slate-400">No submissions match your filters.</p>
                    </div>
                )}

                {categoryGroups.map((cat) => (
                    <section key={cat.name} className="space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-gray-200 dark:border-slate-800 pb-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d7e3fd] dark:bg-blue-950/60 text-[#174ea6] dark:text-blue-300 sm:h-10 sm:w-10">
                                    <Tag className="h-5 w-5" />
                                </span>
                                <h2 className="truncate text-xl font-semibold text-gray-900 dark:text-slate-100 sm:text-2xl">
                                    {cat.name}
                                </h2>
                            </div>
                            <span className="shrink-0 text-sm font-medium text-gray-600 dark:text-slate-400">
                                {cat.count} submission{cat.count === 1 ? "" : "s"}
                            </span>
                        </div>

                        <div className="space-y-8">
                            {cat.courses.map((course) => (
                                <div key={course.courseName} className="space-y-3">
                                    <div className="flex items-center gap-2 px-1">
                                        <BookOpen className="h-4 w-4 text-gray-600 dark:text-slate-400" />
                                        <span className="text-base font-semibold text-gray-800 dark:text-slate-200">
                                            {course.courseName}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-slate-400">
                                            ({course.submissions.length} submission
                                            {course.submissions.length === 1 ? "" : "s"})
                                        </span>
                                    </div>
                                    <DataTable
                                        columns={columns}
                                        data={course.submissions}
                                        keyExtractor={(s) => s.id}
                                        emptyMessage="No submissions in this course."
                                        tableLayout="fixed"
                                        minWidthClassName="min-w-[860px]"
                                        onRowClick={(s) => handleRowClick(s.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}