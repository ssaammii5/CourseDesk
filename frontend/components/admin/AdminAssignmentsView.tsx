"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
    ClipboardList,
    GraduationCap,
    Building2,
    CalendarRange,
    BookOpen,
    Search,
    SlidersHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { AdminAssignment } from "@/lib/adminData";
import { PROGRAM_TYPES } from "@/components/settings/constants";
import { DataTable } from "./DataTable";
import { StatusBadge } from "./StatusBadge";
import {
    getAssignmentsRequest,
    type AssignmentDto,
} from "@/lib/api/assignments";

function mapDtoToAdminAssignment(dto: AssignmentDto): AdminAssignment {
    return {
        id: dto.id,
        courseId: dto.courseId,
        courseName: dto.courseName ?? "Unknown Course",
        program: dto.program ?? "Unknown",
        department: dto.department ?? "Unknown",
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

function sessionRank(key: string): number {
    const [period, yearStr] = key.split("/");
    const year = Number(yearStr);
    if (!Number.isFinite(year)) return 0;
    const periodIndex = period === "July-December" ? 1 : 0;
    return year * 2 + periodIndex;
}

const PROGRAM_ORDER: Record<string, number> = Object.fromEntries(
    PROGRAM_TYPES.map((p, i) => [p, i])
);

interface CourseGroup {
    courseName: string;
    assignments: AdminAssignment[];
}

interface SessionGroup {
    session: string;
    courses: CourseGroup[];
    count: number;
}

interface DeptGroup {
    name: string;
    sessions: SessionGroup[];
    count: number;
}

interface ProgramGroup {
    name: string;
    departments: DeptGroup[];
    count: number;
}

export function AdminAssignmentsView() {
    const router = useRouter();
    const [assignments, setAssignments] = useState<AdminAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [programFilter, setProgramFilter] = useState("all");
    const [departmentFilter, setDepartmentFilter] = useState("all");
    const [sessionFilter, setSessionFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    const loadAssignments = useCallback(async () => {
        try {
            setError(null);
            const dtos = await getAssignmentsRequest();
            setAssignments(dtos.map(mapDtoToAdminAssignment));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load assignments.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadAssignments();
    }, [loadAssignments]);

    const departmentOptions = useMemo(() => {
        const base =
            programFilter === "all"
                ? assignments
                : assignments.filter((a) => a.program === programFilter);
        return Array.from(new Set(base.map((a) => a.department).filter(Boolean))).sort();
    }, [assignments, programFilter]);

    const sessionOptions = useMemo(() => {
        const base =
            programFilter === "all"
                ? assignments
                : assignments.filter((a) => a.program === programFilter);
        return Array.from(new Set(base.map((a) => a.session).filter(Boolean))).sort(
            (a, b) => sessionRank(b) - sessionRank(a)
        );
    }, [assignments, programFilter]);

    const filtered = useMemo(() => {
        return assignments.filter((a) => {
            const matchSearch =
                a.title.toLowerCase().includes(search.toLowerCase()) ||
                a.createdBy.toLowerCase().includes(search.toLowerCase()) ||
                a.courseName.toLowerCase().includes(search.toLowerCase());
            const matchProgram = programFilter === "all" || a.program === programFilter;
            const matchDept = departmentFilter === "all" || a.department === departmentFilter;
            const matchSession = sessionFilter === "all" || a.session === sessionFilter;
            const matchStatus = statusFilter === "all" || a.status === statusFilter;
            return matchSearch && matchProgram && matchDept && matchSession && matchStatus;
        });
    }, [assignments, search, programFilter, departmentFilter, sessionFilter, statusFilter]);

    const activeFilterCount = [programFilter, departmentFilter, sessionFilter, statusFilter].filter(
        (f) => f !== "all"
    ).length;

    const clearFilters = () => {
        setProgramFilter("all");
        setDepartmentFilter("all");
        setSessionFilter("all");
        setStatusFilter("all");
    };

    const programGroups = useMemo<ProgramGroup[]>(() => {
        const map = new Map<string, Map<string, Map<string, Map<string, AdminAssignment[]>>>>();

        for (const a of filtered) {
            if (!map.has(a.program)) map.set(a.program, new Map());
            const deptMap = map.get(a.program)!;
            if (!deptMap.has(a.department)) deptMap.set(a.department, new Map());
            const sessionMap = deptMap.get(a.department)!;
            if (!sessionMap.has(a.session)) sessionMap.set(a.session, new Map());
            const courseMap = sessionMap.get(a.session)!;
            if (!courseMap.has(a.courseName)) courseMap.set(a.courseName, []);
            courseMap.get(a.courseName)!.push(a);
        }

        const programs = Array.from(map.keys()).sort((a, b) => {
            const ia = PROGRAM_ORDER[a] ?? 99;
            const ib = PROGRAM_ORDER[b] ?? 99;
            return ia - ib || a.localeCompare(b);
        });

        return programs.map((program) => {
            const deptMap = map.get(program)!;
            const departments: DeptGroup[] = Array.from(deptMap.keys())
                .sort((a, b) => a.localeCompare(b))
                .map((deptName) => {
                    const sessionMap = deptMap.get(deptName)!;
                    const sessions: SessionGroup[] = Array.from(sessionMap.entries())
                        .sort((a, b) => sessionRank(b[0]) - sessionRank(a[0]))
                        .map(([session, courseMap]) => {
                            const courses: CourseGroup[] = Array.from(courseMap.entries())
                                .sort((a, b) => a[0].localeCompare(b[0]))
                                .map(([courseName, assignments]) => ({
                                    courseName,
                                    assignments: assignments.sort((a, b) => a.title.localeCompare(b.title)),
                                }));
                            return {
                                session,
                                courses,
                                count: courses.reduce((s, c) => s + c.assignments.length, 0),
                            };
                        });
                    return {
                        name: deptName,
                        sessions,
                        count: sessions.reduce((s, sess) => s + sess.count, 0),
                    };
                });
            return {
                name: program,
                departments,
                count: departments.reduce((s, d) => s + d.count, 0),
            };
        });
    }, [filtered]);

    const handleRowClick = (assignmentId: number) => {
        router.push(`/assignments/${assignmentId}`);
    };

    const columns = [
        {
            key: "title",
            header: "Title",
            truncate: true,
            render: (a: AdminAssignment) => (
                <button
                    type="button"
                    onClick={() => handleRowClick(a.id)}
                    className="cursor-pointer text-left text-sm font-medium text-[#1a73e8] hover:underline"
                >
                    {a.title}
                </button>
            ),
        },
        { key: "createdBy", header: "Created By", truncate: true },
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
                <div className="mb-4 rounded-lg bg-[#fce8e6] px-5 py-3.5 text-sm text-[#c5221f]">{error}</div>
            )}

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">All Assignments</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        {assignments.length} assignments total • {filtered.length} shown
                    </p>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative w-full sm:max-w-sm sm:flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by title, creator, or course..."
                        className="w-full rounded-md border border-gray-400/80 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setFiltersOpen((v) => !v)}
                        className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${filtersOpen || activeFilterCount > 0
                            ? "border-[#1a63d8] bg-[#e8f0fe] text-[#174ea6]"
                            : "border-gray-400 text-gray-700 hover:bg-gray-50"
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
                            className="cursor-pointer text-sm font-medium text-[#1a73e8] hover:underline"
                        >
                            Clear all
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Panel */}
            {filtersOpen && (
                <div className="mt-4 grid gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="block">
                        <span className="mb-1.5 block text-xs font-medium text-gray-600">Program</span>
                        <select
                            value={programFilter}
                            onChange={(e) => { setProgramFilter(e.target.value); setDepartmentFilter("all"); setSessionFilter("all"); }}
                            className="w-full rounded-md border border-gray-400/80 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                        >
                            <option value="all">All Programs</option>
                            {PROGRAM_TYPES.map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </label>

                    <label className="block">
                        <span className="mb-1.5 block text-xs font-medium text-gray-600">Department</span>
                        <select
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            className="w-full rounded-md border border-gray-400/80 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                        >
                            <option value="all">All Departments</option>
                            {departmentOptions.map((d) => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </label>

                    <label className="block">
                        <span className="mb-1.5 block text-xs font-medium text-gray-600">Session</span>
                        <select
                            value={sessionFilter}
                            onChange={(e) => setSessionFilter(e.target.value)}
                            className="w-full rounded-md border border-gray-400/80 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                        >
                            <option value="all">All Sessions</option>
                            {sessionOptions.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </label>

                    <label className="block">
                        <span className="mb-1.5 block text-xs font-medium text-gray-600">Status</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full rounded-md border border-gray-400/80 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                        >
                            <option value="all">All Status</option>
                            <option value="Draft">Draft</option>
                            <option value="Pending">Pending</option>
                            <option value="Published">Published</option>
                        </select>
                    </label>
                </div>
            )}

            {/* Grouped Content */}
            <div className="mt-8 space-y-12">
                {filtered.length === 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white py-16 text-center">
                        <p className="text-sm text-gray-600">No assignments match your filters.</p>
                    </div>
                )}

                {programGroups.map((pg) => (
                    <section key={pg.name}>
                        {/* Program Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-gray-300 pb-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d7e3fd] text-[#174ea6] sm:h-10 sm:w-10">
                                    <GraduationCap className="h-5 w-5" />
                                </span>
                                <h2 className="truncate text-xl text-gray-900 sm:text-2xl">{pg.name}</h2>
                            </div>
                            <span className="shrink-0 text-sm font-medium text-gray-600">
                                {pg.count} assignment{pg.count === 1 ? "" : "s"}
                            </span>
                        </div>

                        {/* Departments */}
                        {pg.departments.map((dept) => (
                            <div key={dept.name} className="mt-6">
                                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <Building2 className="h-4 w-4 shrink-0 text-gray-500" />
                                        <h3 className="min-w-0 truncate text-lg text-gray-800 sm:text-xl">{dept.name}</h3>
                                    </div>
                                    <span className="shrink-0 text-xs font-medium text-gray-500">
                                        {dept.count} assignment{dept.count === 1 ? "" : "s"}
                                    </span>
                                </div>

                                {/* Sessions */}
                                <div className="mt-4 space-y-6">
                                    {dept.sessions.map((sess) => (
                                        <div key={sess.session}>
                                            <div className="mb-3 flex flex-wrap items-center gap-2 px-1">
                                                <CalendarRange className="h-4 w-4 text-[#174ea6]" />
                                                <span className="rounded-full bg-[#e8f0fe] px-3 py-1 text-xs font-medium text-[#174ea6]">
                                                    {sess.session}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {sess.count} assignment{sess.count === 1 ? "" : "s"}
                                                </span>
                                            </div>

                                            {/* Courses */}
                                            <div className="space-y-5">
                                                {sess.courses.map((course) => (
                                                    <div key={course.courseName}>
                                                        <div className="mb-2 flex items-center gap-2 px-1">
                                                            <BookOpen className="h-4 w-4 text-gray-600" />
                                                            <span className="text-sm font-semibold text-gray-800">
                                                                {course.courseName}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
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
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </section>
                ))}
            </div>
        </div>
    );
}