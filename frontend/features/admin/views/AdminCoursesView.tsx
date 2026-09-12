"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import type { AdminCourse } from "@/types";
import { DataTable, StatusBadge, ConfirmDialog } from "@/components/ui";
import { CourseFormModal } from "../components/CourseFormModal";
import {
    getCoursesRequest, createCourseRequest, updateCourseRequest, deleteCourseRequest,
    type CourseDto,
} from "@/lib/api/courses";
import {
    getProgramsRequest,
    getDepartmentsRequest,
    getSemestersRequest,
    type AcademicProgramDto,
    type AcademicDepartmentDto,
    type AcademicSemesterDto,
} from "@/lib/api/academics";

function mapCourseDtoToAdminCourse(dto: CourseDto): AdminCourse {
    return {
        id: dto.id,
        name: dto.name,
        program: dto.program,
        department: dto.department,
        teacherIds: dto.teacherIds,
        studentIds: dto.studentIds,
        session: dto.session,
        isActive: dto.isActive,
    };
}

export function AdminCoursesView() {
    const [courses, setCourses] = useState<AdminCourse[]>([]);
    const [courseNames, setCourseNames] = useState<Record<number, string[]>>({});
    const [academicPrograms, setAcademicPrograms] = useState<AcademicProgramDto[]>([]);
    const [academicDepartments, setAcademicDepartments] = useState<AcademicDepartmentDto[]>([]);
    const [academicSemesters, setAcademicSemesters] = useState<AcademicSemesterDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("all");
    const [programFilter, setProgramFilter] = useState("all");
    const [sessionFilter, setSessionFilter] = useState("all");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AdminCourse | null>(null);

    const loadCourses = useCallback(async () => {
        try {
            setError(null);
            const [dtos, progs, depts, sems] = await Promise.all([
                getCoursesRequest(),
                getProgramsRequest().catch(() => []),
                getDepartmentsRequest().catch(() => []),
                getSemestersRequest().catch(() => []),
            ]);
            setCourses(dtos.map(mapCourseDtoToAdminCourse));
            setAcademicPrograms(progs);
            setAcademicDepartments(depts);
            setAcademicSemesters(sems);
            const names: Record<number, string[]> = {};
            for (const d of dtos) names[d.id] = d.teacherNames;
            setCourseNames(names);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load courses.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadCourses();
    }, [loadCourses]);

    const departmentOptions = useMemo(() => {
        const fromDepts = academicDepartments.map((d) => d.code || d.name);
        const fromCourses = courses.map((c) => c.department).filter(Boolean);
        return Array.from(new Set([...fromDepts, ...fromCourses])).sort();
    }, [academicDepartments, courses]);

    const programOptions = useMemo(() => {
        const fromProgs = academicPrograms.map((p) => p.name);
        const fromCourses = courses.map((c) => c.program).filter(Boolean);
        return Array.from(new Set([...fromProgs, ...fromCourses])).sort();
    }, [academicPrograms, courses]);

    const sessionOptions = useMemo(() => {
        const fromSems = academicSemesters.map((s) => s.name);
        const fromCourses = courses.map((c) => c.session).filter(Boolean);
        return Array.from(new Set([...fromSems, ...fromCourses])).sort();
    }, [academicSemesters, courses]);

    const filtered = useMemo(() => {
        return courses.filter((c) => {
            const teacherNames = (courseNames[c.id] ?? []).join(", ");
            const matchSearch =
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                teacherNames.toLowerCase().includes(search.toLowerCase());
            const matchDept = departmentFilter === "all" || c.department === departmentFilter;
            const matchProgram = programFilter === "all" || c.program === programFilter;
            const matchSession = sessionFilter === "all" || c.session === sessionFilter;
            return matchSearch && matchDept && matchProgram && matchSession;
        });
    }, [courses, courseNames, search, departmentFilter, programFilter, sessionFilter]);

    const handleSave = async (data: Omit<AdminCourse, "id">) => {
        try {
            setError(null);
            const payload = {
                name: data.name,
                subject: "",
                program: data.program,
                department: data.department,
                session: data.session,
                isActive: data.isActive,
                teacherIds: data.teacherIds,
                studentIds: data.studentIds,
            };
            if (editingCourse) {
                await updateCourseRequest(editingCourse.id, payload);
            } else {
                await createCourseRequest(payload);
            }
            setModalOpen(false);
            setEditingCourse(null);
            await loadCourses();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save course.");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setError(null);
            await deleteCourseRequest(deleteTarget.id);
            setDeleteTarget(null);
            await loadCourses();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete course.");
            setDeleteTarget(null);
        }
    };

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

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold text-gray-900">Manage Courses</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        {courses.length} courses total • {filtered.length} shown
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => { setEditingCourse(null); setModalOpen(true); }}
                    className="flex cursor-pointer items-center gap-2 rounded-full bg-[#1a63d8] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1554b5]"
                >
                    <Plus className="h-4 w-4" />
                    Add Course
                </button>
            </div>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search courses or instructors..."
                        className="w-full rounded-md border border-gray-400/80 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                    />
                </div>
                <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="rounded-md border border-gray-400/80 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                >
                    <option value="all">All Categories</option>
                    {departmentOptions.map((d) => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>
                <select
                    value={programFilter}
                    onChange={(e) => setProgramFilter(e.target.value)}
                    className="rounded-md border border-gray-400/80 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                >
                    <option value="all">All Tracks / Levels</option>
                    {programOptions.map((p) => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </select>
                <select
                    value={sessionFilter}
                    onChange={(e) => setSessionFilter(e.target.value)}
                    className="rounded-md border border-gray-400/80 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                >
                    <option value="all">All Cohorts / Schedules</option>
                    {sessionOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>

            <div className="mt-6">
                <DataTable
                    columns={[
                        { key: "name", header: "Course Title" },
                        { key: "department", header: "Category" },
                        { key: "program", header: "Track / Level" },
                        {
                            key: "teachers",
                            header: "Instructors",
                            render: (c: AdminCourse) => {
                                const names = (courseNames[c.id] ?? []).join(", ");
                                return names ? (
                                    <span className="text-sm text-gray-900" title={names}>{names}</span>
                                ) : (
                                    <span className="text-sm italic text-gray-500">Not assigned</span>
                                );
                            },
                        },
                        {
                            key: "students",
                            header: "Learners",
                            className: "text-center",
                            render: (c: AdminCourse) => (
                                <span className="text-sm text-gray-900">{c.studentIds.length}</span>
                            ),
                        },
                        { key: "session", header: "Cohort / Schedule" },
                        {
                            key: "isActive",
                            header: "Status",
                            render: (c: AdminCourse) => <StatusBadge status={c.isActive ? "Active" : "Inactive"} />,
                        },
                        {
                            key: "actions",
                            header: "Actions",
                            className: "text-right",
                            render: (c: AdminCourse) => (
                                <div className="flex items-center justify-end gap-1">
                                    <button type="button" title="Edit" onClick={() => { setEditingCourse(c); setModalOpen(true); }} className="cursor-pointer rounded p-2 text-gray-600 hover:bg-gray-100">
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button type="button" title="Delete" onClick={() => setDeleteTarget(c)} className="cursor-pointer rounded p-2 text-[#c5221f] hover:bg-red-50">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ),
                        },
                    ]}
                    data={filtered}
                    keyExtractor={(c) => c.id}
                    emptyMessage="No courses match your filters."
                />
            </div>

            <CourseFormModal
                open={modalOpen}
                course={editingCourse}
                onSave={handleSave}
                onClose={() => { setModalOpen(false); setEditingCourse(null); }}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                title="Delete Course"
                message={`Are you sure you want to delete "${deleteTarget?.name}"? All associated assignments will be affected.`}
                confirmLabel="Delete"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}