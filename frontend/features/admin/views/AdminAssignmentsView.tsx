"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
    Tag,
    BookOpen,
    Search,
    SlidersHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { AdminAssignment } from "@/types";
import { DataTable, StatusBadge, ModernDropdown } from "@/components/ui";
import {
    getAssignmentsRequest,
    type AssignmentDto,
} from "@/lib/api/assignments";

function mapDtoToAdminAssignment(dto: AssignmentDto): AdminAssignment {
    return {
        id: dto.id,
        code: dto.code,
        courseId: dto.courseId,
        courseCode: dto.courseCode,
        courseName: dto.courseName ?? "Unknown Course",
        program: dto.program ?? "Unknown",
        department: dto.department ?? "General",
        session: dto.session ?? "Unknown",
        title: dto.title,
        description: dto.description,
        deadline: dto.deadlineUtc.split("T")[0],
        maxMarks: dto.maxMarks,
        status: (dto.status === "Archived" ? "Pending" : dto.status) as AdminAssignment["status"],
        createdById: dto.createdById,
        createdBy: dto.createdByName ?? "Unknown",
        createdAt: dto.createdAtUtc.split("T")[0],
        submissionCount: dto.submissionCount,
    };
}

interface CourseGroup {
    courseId: number;
    courseName: string;
    assignments: AdminAssignment[];
}

interface CategoryGroup {
    name: string;
    courses: CourseGroup[];
    count: number;
}

const BATCH_SIZE = 50;

export function AdminAssignmentsView() {
    const router = useRouter();
    const [assignments, setAssignments] = useState<AdminAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [courseFilter, setCourseFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    const loadInitialAssignments = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const dtos = await getAssignmentsRequest({
                limit: BATCH_SIZE,
                offset: 0,
            });
            const rows = dtos.map(mapDtoToAdminAssignment);
            setAssignments(rows);
            setHasMore(rows.length === BATCH_SIZE);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load assignments.");
        } finally {
            setLoading(false);
        }
    }, []);

    const handleLoadMore = async () => {
        if (loadingMore || !hasMore) return;
        try {
            setLoadingMore(true);
            const dtos = await getAssignmentsRequest({
                limit: BATCH_SIZE,
                offset: assignments.length,
            });
            const newRows = dtos.map(mapDtoToAdminAssignment);
            setAssignments((prev) => [...prev, ...newRows]);
            setHasMore(newRows.length === BATCH_SIZE);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load more assignments.");
        } finally {
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        void loadInitialAssignments();
    }, [loadInitialAssignments]);

    const categoryOptions = useMemo(() => {
        return Array.from(new Set(assignments.map((a) => a.department).filter(Boolean))).sort();
    }, [assignments]);

    const courseOptions = useMemo(() => {
        const base =
            categoryFilter === "all"
                ? assignments
                : assignments.filter((a) => a.department === categoryFilter);
        return Array.from(new Set(base.map((a) => a.courseName).filter(Boolean))).sort();
    }, [assignments, categoryFilter]);

    const filtered = useMemo(() => {
        return assignments.filter((a) => {
            const matchSearch =
                a.title.toLowerCase().includes(search.toLowerCase()) ||
                a.createdBy.toLowerCase().includes(search.toLowerCase()) ||
                a.courseName.toLowerCase().includes(search.toLowerCase());
            const matchCategory = categoryFilter === "all" || a.department === categoryFilter;
            const matchCourse = courseFilter === "all" || a.courseName === courseFilter;
            const matchStatus = statusFilter === "all" || a.status === statusFilter;
            return matchSearch && matchCategory && matchCourse && matchStatus;
        });
    }, [assignments, search, categoryFilter, courseFilter, statusFilter]);

    const activeFilterCount = [categoryFilter, courseFilter, statusFilter].filter(
        (f) => f !== "all"
    ).length;

    const clearFilters = () => {
        setCategoryFilter("all");
        setCourseFilter("all");
        setStatusFilter("all");
    };

    const categoryGroups = useMemo<CategoryGroup[]>(() => {
        const map = new Map<string, Map<string, AdminAssignment[]>>();

        for (const a of filtered) {
            const cat = a.department || "General";
            if (!map.has(cat)) map.set(cat, new Map());
            const courseMap = map.get(cat)!;
            if (!courseMap.has(a.courseName)) courseMap.set(a.courseName, []);
            courseMap.get(a.courseName)!.push(a);
        }

        return Array.from(map.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([categoryName, courseMap]) => {
                const courses: CourseGroup[] = Array.from(courseMap.entries())
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([courseName, list]) => ({
                        courseId: list[0]?.courseId ?? 0,
                        courseName,
                        assignments: list.sort((a, b) => a.title.localeCompare(b.title)),
                    }));
                return {
                    name: categoryName,
                    courses,
                    count: courses.reduce((s, c) => s + c.assignments.length, 0),
                };
            });
    }, [filtered]);

    const handleRowClick = (a: AdminAssignment) => {
        router.push(`/assignments/${a.code || a.id}`);
    };

    const columns = [
        {
            key: "title",
            header: "Title",
            truncate: true,
            render: (a: AdminAssignment) => (
                <button
                    type="button"
                    onClick={() => handleRowClick(a)}
                    className="cursor-pointer text-left text-sm font-medium text-[#1a73e8] dark:text-blue-400 hover:underline"
                >
                    {a.title}
                </button>
            ),
        },
        { key: "createdBy", header: "Instructor / Creator", truncate: true },
        { key: "deadline", header: "Deadline", width: "120px" },
        { key: "maxMarks", header: "Max Marks", className: "text-center", width: "90px" },
        {
            key: "status",
            header: "Status",
            width: "110px",
            render: (a: AdminAssignment) => <StatusBadge status={a.status} />,
        },
        {
            key: "submissionCount",
            header: "Submissions",
            className: "text-center",
            width: "100px",
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

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 sm:text-3xl">All Assignments</h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                        {assignments.length} assignments total • {filtered.length} shown
                    </p>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative w-full sm:max-w-sm sm:flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by title, instructor, or course..."
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

            {/* Filter Panel */}
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
                                { value: "Draft", label: "Draft" },
                                { value: "Pending", label: "Pending" },
                                { value: "Published", label: "Published" },
                            ]}
                            showStatusDot
                            size="sm"
                        />
                    </div>
                </div>
            )}

            {/* Grouped Content */}
            <div className="mt-8 space-y-12">
                {filtered.length === 0 && (
                    <div className="rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-16 text-center">
                        <p className="text-sm text-gray-600 dark:text-slate-400">No assignments match your filters.</p>
                    </div>
                )}

                {categoryGroups.map((cat) => (
                    <section key={cat.name} className="space-y-6">
                        {/* Category Header */}
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
                                {cat.count} assignment{cat.count === 1 ? "" : "s"}
                            </span>
                        </div>

                        {/* Courses */}
                        <div className="space-y-8">
                            {cat.courses.map((course) => (
                                <div key={course.courseName} className="space-y-3">
                                    <div className="flex items-center gap-2 px-1">
                                        <BookOpen className="h-4 w-4 text-gray-600 dark:text-slate-400" />
                                        <span className="text-base font-semibold text-gray-800 dark:text-slate-200">
                                            {course.courseName}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-slate-400">
                                            ({course.assignments.length} assignment{course.assignments.length === 1 ? "" : "s"})
                                        </span>
                                    </div>
                                    <DataTable
                                        columns={columns}
                                        data={course.assignments}
                                        keyExtractor={(a) => a.id}
                                        emptyMessage="No assignments in this course."
                                    />
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            {hasMore ? (
                <div className="mt-10 flex flex-col items-center justify-center gap-3 pb-8">
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                        Showing {assignments.length} loaded assignments
                    </p>
                    <button
                        type="button"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-200 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none disabled:opacity-50 transition-colors"
                    >
                        {loadingMore ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
                                <span>Loading more assignments...</span>
                            </>
                        ) : (
                            <span>Load More ({BATCH_SIZE} more)</span>
                        )}
                    </button>
                </div>
            ) : assignments.length > BATCH_SIZE ? (
                <div className="mt-10 py-6 text-center text-xs text-gray-400 dark:text-slate-500">
                    All {assignments.length} assignments loaded
                </div>
            ) : null}
        </div>
    );
}