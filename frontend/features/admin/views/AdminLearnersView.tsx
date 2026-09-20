"use client";

import { useEffect, useMemo, useState } from "react";
import { GraduationCap, Pencil, Plus, Search, SlidersHorizontal, Trash2, Mail, X } from "lucide-react";
import type { AdminUser, LearnerDetails, LearnerProgramType } from "@/types";
import {
    createUserRequest,
    deleteUserRequest,
    getUsersRequest,
    updateUserRequest,
    type UserDto,
} from "@/lib/api/users";
import { PROGRAM_TYPES } from "@/features/settings";
import { DataTable, StatusBadge, ConfirmDialog } from "@/components/ui";
import { LearnerFormModal } from "../components/LearnerFormModal";

const PROGRAM_ORDER: Record<string, number> = Object.fromEntries(
    PROGRAM_TYPES.map((p, i) => [p, i])
);

function sessionRank(key: string): number {
    const [period, yearStr] = key.split("/");
    const year = Number(yearStr);
    if (!Number.isFinite(year)) return 0;
    const periodIndex = period === "July-December" ? 1 : 0;
    return year * 2 + periodIndex;
}

function mapUserDtoToAdminUser(dto: UserDto): AdminUser {
    const details = dto.learnerDetails ?? dto.studentDetails;
    const learnerIdVal = details?.learnerId ?? details?.studentId ?? "";
    return {
        id: dto.id,
        name: dto.name,
        email: dto.email,
        role: (dto.role === "Student" ? "Learner" : dto.role) as AdminUser["role"],
        isActive: dto.isActive,
        createdAt: dto.createdAtUtc.split("T")[0],
        learnerDetails: details
            ? {
                fathersName: details.fathersName ?? "",
                mothersName: details.mothersName ?? "",
                dateOfBirth: details.dateOfBirth ?? "",
                mobile: details.mobile ?? "",
                nationality: details.nationality ?? "",
                learnerId: learnerIdVal,
                studentId: learnerIdVal,
                regNo: details.regNo ?? "",
                department: details.department ?? "",
                currentProgram: (details.currentProgram ?? "Undergraduate") as LearnerProgramType,
                session: details.session ?? "",
                semesterSession: details.semesterSession ?? "",
                address: {
                    street: details.address?.street ?? "",
                    city: details.address?.city ?? "",
                    state: details.address?.state ?? "",
                    zip: details.address?.zip ?? "",
                    country: details.address?.country ?? "",
                },
            }
            : undefined,
        studentDetails: details
            ? {
                fathersName: details.fathersName ?? "",
                mothersName: details.mothersName ?? "",
                dateOfBirth: details.dateOfBirth ?? "",
                mobile: details.mobile ?? "",
                nationality: details.nationality ?? "",
                learnerId: learnerIdVal,
                studentId: learnerIdVal,
                regNo: details.regNo ?? "",
                department: details.department ?? "",
                currentProgram: (details.currentProgram ?? "Undergraduate") as LearnerProgramType,
                session: details.session ?? "",
                semesterSession: details.semesterSession ?? "",
                address: {
                    street: details.address?.street ?? "",
                    city: details.address?.city ?? "",
                    state: details.address?.state ?? "",
                    zip: details.address?.zip ?? "",
                    country: details.address?.country ?? "",
                },
            }
            : undefined,
        instructorDetails: undefined,
        teacherDetails: undefined,
    };
}

function hasFullDetails(u: AdminUser): boolean {
    const d = u.learnerDetails ?? u.studentDetails;
    return (
        !!d &&
        !!d.currentProgram &&
        !!d.department?.trim() &&
        !!d.semesterSession?.trim()
    );
}

interface SemesterSessionGroup {
    key: string;
    learners: AdminUser[];
}

interface DeptGroup {
    name: string;
    groups: SemesterSessionGroup[];
    count: number;
}

interface ProgramGroup {
    name: string;
    depts: DeptGroup[];
    count: number;
}

type SessionSortOrder = "newest" | "oldest";

export function AdminLearnersView() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [programFilter, setProgramFilter] = useState("all");
    const [departmentFilter, setDepartmentFilter] = useState("all");
    const [semesterSessionFilter, setSemesterSessionFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sessionSort, setSessionSort] = useState<SessionSortOrder>("newest");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const all = await getUsersRequest();
            setUsers(all.filter((u) => u.role === "Learner" || u.role === "Student").map(mapUserDtoToAdminUser));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load learners.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadUsers();
    }, []);

    const departmentOptions = useMemo(() => {
        const base =
            programFilter === "all"
                ? users
                : users.filter((u) => (u.learnerDetails ?? u.studentDetails)?.currentProgram === programFilter);
        return Array.from(
            new Set(base.map((u) => (u.learnerDetails ?? u.studentDetails)?.department?.trim() ?? "").filter(Boolean))
        ).sort((a, b) => a.localeCompare(b));
    }, [users, programFilter]);

    const semesterSessionOptions = useMemo(() => {
        const base =
            programFilter === "all"
                ? users
                : users.filter((u) => (u.learnerDetails ?? u.studentDetails)?.currentProgram === programFilter);
        return Array.from(
            new Set(base.map((u) => (u.learnerDetails ?? u.studentDetails)?.semesterSession?.trim() ?? "").filter(Boolean))
        ).sort((a, b) => sessionRank(b) - sessionRank(a));
    }, [users, programFilter]);

    useEffect(() => {
        if (departmentFilter !== "all" && !departmentOptions.includes(departmentFilter)) {
            setDepartmentFilter("all");
        }
    }, [departmentOptions, departmentFilter]);

    useEffect(() => {
        if (semesterSessionFilter !== "all" && !semesterSessionOptions.includes(semesterSessionFilter)) {
            setSemesterSessionFilter("all");
        }
    }, [semesterSessionOptions, semesterSessionFilter]);

    const filtered = useMemo(() => {
        return users.filter((u) => {
            const d = u.learnerDetails ?? u.studentDetails;
            const idVal = d?.learnerId ?? d?.studentId ?? "";
            const matchSearch =
                u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase()) ||
                idVal.toLowerCase().includes(search.toLowerCase());
            const matchStatus =
                statusFilter === "all" ||
                (statusFilter === "active" ? u.isActive : !u.isActive);
            const matchProgram = programFilter === "all" || d?.currentProgram === programFilter;
            const matchDept =
                departmentFilter === "all" || (d?.department?.trim() ?? "") === departmentFilter;
            const matchSemesterSession =
                semesterSessionFilter === "all" || (d?.semesterSession?.trim() ?? "") === semesterSessionFilter;

            return (
                matchSearch && matchStatus && matchProgram && matchDept && matchSemesterSession
            );
        });
    }, [users, search, statusFilter, programFilter, departmentFilter, semesterSessionFilter]);

    const activeFilterCount = [
        programFilter,
        departmentFilter,
        semesterSessionFilter,
        statusFilter,
    ].filter((f) => f !== "all").length;

    const clearFilters = () => {
        setProgramFilter("all");
        setDepartmentFilter("all");
        setSemesterSessionFilter("all");
        setStatusFilter("all");
    };

    const programGroups = useMemo<ProgramGroup[]>(() => {
        const map = new Map<string, Map<string, Map<string, Map<string, AdminUser[]>>>>();

        for (const u of filtered) {
            if (!hasFullDetails(u)) continue;
            const d = (u.learnerDetails ?? u.studentDetails)!;
            const dept = (d.department ?? "").trim() || "General";
            const ssKey = (d.semesterSession ?? "").trim() || "Self-Paced";
            const prog = d.currentProgram ?? "General Track";

            if (!map.has(prog)) map.set(prog, new Map());
            const deptMap = map.get(prog)!;
            if (!deptMap.has(dept)) deptMap.set(dept, new Map());
            const ssMap = deptMap.get(dept)!;
            if (!ssMap.has(ssKey)) ssMap.set(ssKey, new Map());
            const courseMap = ssMap.get(ssKey)!;
            if (!courseMap.has(u.name)) courseMap.set(u.name, []);
            courseMap.get(u.name)!.push(u);
        }

        const programs = Array.from(map.keys()).sort((a, b) => {
            const ia = PROGRAM_ORDER[a] ?? 99;
            const ib = PROGRAM_ORDER[b] ?? 99;
            return ia - ib || a.localeCompare(b);
        });

        return programs.map((program) => {
            const deptMap = map.get(program)!;
            const depts: DeptGroup[] = Array.from(deptMap.keys())
                .sort((a, b) => a.localeCompare(b))
                .map((deptName) => {
                    const ssMap = deptMap.get(deptName)!;
                    const groups: SemesterSessionGroup[] = Array.from(ssMap.entries())
                        .map(([key, learnersMap]) => {
                            const learners = Array.from(learnersMap.values()).flat();
                            return {
                                key,
                                learners: learners.sort((a, b) => a.name.localeCompare(b.name)),
                            };
                        })
                        .sort((a, b) =>
                            sessionSort === "newest"
                                ? sessionRank(b.key) - sessionRank(a.key)
                                : sessionRank(a.key) - sessionRank(b.key)
                        );

                    return {
                        name: deptName,
                        groups,
                        count: groups.reduce((s, g) => s + g.learners.length, 0),
                    };
                });

            return {
                name: program,
                depts,
                count: depts.reduce((s, d) => s + d.count, 0),
            };
        });
    }, [filtered, sessionSort]);

    const uncategorized = useMemo(
        () =>
            filtered
                .filter((u) => !hasFullDetails(u))
                .sort((a, b) => a.name.localeCompare(b.name)),
        [filtered]
    );

    const handleSave = async (data: Omit<AdminUser, "id" | "createdAt">) => {
        try {
            const details = data.learnerDetails ?? data.studentDetails;
            const idVal = details?.learnerId ?? details?.studentId ?? "";
            const learnerDetails = details
                ? {
                    fathersName: details.fathersName,
                    mothersName: details.mothersName,
                    dateOfBirth: details.dateOfBirth,
                    mobile: details.mobile,
                    nationality: details.nationality,
                    learnerId: idVal,
                    studentId: idVal,
                    regNo: details.regNo,
                    department: details.department,
                    currentProgram: details.currentProgram,
                    session: details.session,
                    semesterSession: details.semesterSession,
                    address: {
                        street: details.address?.street ?? "",
                        city: details.address?.city ?? "",
                        state: details.address?.state ?? "",
                        zip: details.address?.zip ?? "",
                        country: details.address?.country ?? "",
                    },
                }
                : undefined;

            if (editingUser) {
                await updateUserRequest(editingUser.id, {
                    name: data.name,
                    email: data.email,
                    role: "Learner",
                    isActive: data.isActive,
                    learnerDetails,
                    studentDetails: learnerDetails,
                });
            } else {
                const password = "Learner@123";
                await createUserRequest({
                    name: data.name,
                    email: data.email,
                    password,
                    role: "Learner",
                    learnerDetails,
                    studentDetails: learnerDetails,
                });
                setSuccessMessage(
                    `Learner "${data.name}" created successfully. Credentials: ${data.email} / ${password}`
                );
                window.setTimeout(() => setSuccessMessage(null), 6000);
            }

            setModalOpen(false);
            setEditingUser(null);
            await loadUsers();
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to save learner.";
            setError(msg);
            throw err;
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteUserRequest(deleteTarget.id);
            setDeleteTarget(null);
            await loadUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete learner.");
            setDeleteTarget(null);
        }
    };

    const columns = [
        {
            key: "name",
            header: "Name",
            width: "22%",
            truncate: true,
        },
        {
            key: "email",
            header: "Email",
            width: "24%",
            truncate: true,
        },
        {
            key: "learnerId",
            header: "Learner ID",
            width: "13%",
            truncate: true,
            render: (u: AdminUser) => {
                const idVal = u.learnerDetails?.learnerId ?? u.studentDetails?.studentId;
                return idVal ? (
                    <span className="text-sm text-gray-900" title={idVal}>
                        {idVal}
                    </span>
                ) : (
                    <span className="text-gray-400">—</span>
                );
            },
        },
        {
            key: "department",
            header: "Category / Track",
            width: "15%",
            truncate: true,
            render: (u: AdminUser) => {
                const d = u.learnerDetails ?? u.studentDetails;
                return d?.department || d?.currentProgram ? (
                    <span className="text-sm text-gray-900">
                        {d.department || d.currentProgram}
                    </span>
                ) : (
                    <span className="text-gray-400">—</span>
                );
            },
        },
        {
            key: "isActive",
            header: "Status",
            width: "11%",
            render: (u: AdminUser) => <StatusBadge status={u.isActive ? "Active" : "Inactive"} />,
        },
        {
            key: "actions",
            header: "Actions",
            width: "15%",
            className: "text-right",
            render: (u: AdminUser) => (
                <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                    <button
                        type="button"
                        title="Edit"
                        onClick={() => { setEditingUser(u); setModalOpen(true); }}
                        className="cursor-pointer rounded p-2 text-gray-600 hover:bg-gray-100"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        title="Delete"
                        onClick={() => setDeleteTarget(u)}
                        className="cursor-pointer rounded p-2 text-[#c5221f] hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
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
            {/* Success Banner */}
            {successMessage && (
                <div className="fixed inset-x-0 top-20 z-50 flex justify-center px-4">
                    <div className="flex items-center gap-3 rounded-lg bg-[#e6f4ea] px-5 py-3.5 shadow-lg border border-[#ceead6]">
                        <Mail className="h-5 w-5 shrink-0 text-[#137333]" />
                        <span className="text-sm font-medium text-[#137333]">{successMessage}</span>
                        <button
                            type="button"
                            onClick={() => setSuccessMessage(null)}
                            className="ml-2 cursor-pointer rounded p-1 text-[#137333] hover:bg-[#ceead6]"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Error Banner */}
            {error && (
                <div className="mb-4 rounded-lg bg-[#fce8e6] px-5 py-3.5 text-sm text-[#c5221f]">
                    {error}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">Manage Learners</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        {users.length} learners total • {filtered.length} shown
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => { setEditingUser(null); setModalOpen(true); }}
                    className="flex cursor-pointer items-center gap-2 self-start rounded-full bg-[#1a63d8] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1554b5] sm:self-auto"
                >
                    <Plus className="h-4 w-4" />
                    Add Learner
                </button>
            </div>

            {/* Search and Filters */}
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative w-full sm:max-w-sm sm:flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, email, or learner ID..."
                        className="w-full rounded-md border border-gray-400/80 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2">
                        <span className="whitespace-nowrap text-sm font-medium text-gray-700">
                            Cohort order
                        </span>
                        <select
                            value={sessionSort}
                            onChange={(e) => setSessionSort(e.target.value as SessionSortOrder)}
                            className="cursor-pointer rounded-md border border-gray-400/80 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                        >
                            <option value="newest">Newest first</option>
                            <option value="oldest">Oldest first</option>
                        </select>
                    </label>
                    <button
                        type="button"
                        onClick={() => setFiltersOpen((v) => !v)}
                        className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${filtersOpen || activeFilterCount > 0
                            ? "border-[#1a63d8] bg-[#e8f0fe] text-[#174ea6]"
                            : "border-gray-400 text-gray-700 hover:bg-gray-50"
                            }`}
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        Advanced filters
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

            {/* Advanced Filters Panel */}
            {filtersOpen && (
                <div className="mt-4 grid gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="block">
                        <span className="mb-1.5 block text-xs font-medium text-gray-600">Program</span>
                        <select
                            value={programFilter}
                            onChange={(e) => setProgramFilter(e.target.value)}
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
                        <span className="mb-1.5 block text-xs font-medium text-gray-600">Semester</span>
                        <select
                            value={semesterSessionFilter}
                            onChange={(e) => setSemesterSessionFilter(e.target.value)}
                            className="w-full rounded-md border border-gray-400/80 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                        >
                            <option value="all">All Semesters</option>
                            {semesterSessionOptions.map((s) => (
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
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </label>
                </div>
            )}

            {/* Learner Groups */}
            <div className="mt-8 space-y-12">
                {filtered.length === 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white py-16 text-center">
                        <p className="text-sm text-gray-600">No learners match your filters.</p>
                    </div>
                )}

                {/* Program Groups */}
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
                                {pg.count} learner{pg.count === 1 ? "" : "s"}
                            </span>
                        </div>

                        {/* Departments */}
                        {pg.depts.map((dept) => (
                            <div key={dept.name} className="mt-6">
                                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                                    <h3 className="min-w-0 truncate text-lg text-gray-800 sm:text-xl">{dept.name}</h3>
                                    <span className="shrink-0 text-xs font-medium text-gray-500">
                                        {dept.count} learner{dept.count === 1 ? "" : "s"}
                                    </span>
                                </div>

                                {/* Sessions */}
                                <div className="mt-4 space-y-6">
                                    {dept.groups.map((g) => (
                                        <div key={g.key}>
                                            <div className="mb-2 flex flex-wrap items-center gap-2 px-1">
                                                <span className="rounded-full bg-[#e8f0fe] px-3 py-1 text-xs font-medium text-[#174ea6]">
                                                    {g.key}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {g.learners.length} learner{g.learners.length === 1 ? "" : "s"}
                                                </span>
                                            </div>
                                            <DataTable
                                                columns={columns}
                                                data={g.learners}
                                                keyExtractor={(u) => u.id}
                                                emptyMessage="No learners in this group."
                                                tableLayout="fixed"
                                                minWidthClassName="min-w-[760px]"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </section>
                ))}

                {/* Uncategorized */}
                {uncategorized.length > 0 && (
                    <section>
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-gray-300 pb-3">
                            <h2 className="text-xl text-gray-900 sm:text-2xl">Uncategorized</h2>
                            <span className="shrink-0 text-sm font-medium text-gray-600">
                                {uncategorized.length} learner{uncategorized.length === 1 ? "" : "s"}
                            </span>
                        </div>
                        <p className="mt-2 px-1 text-xs text-gray-500">
                            Learners missing program, department, or semester details.
                        </p>
                        <div className="mt-4">
                            <DataTable
                                columns={columns}
                                data={uncategorized}
                                keyExtractor={(u) => u.id}
                                emptyMessage="No learners in this group."
                                tableLayout="fixed"
                                minWidthClassName="min-w-[760px]"
                            />
                        </div>
                    </section>
                )}
            </div>

            {/* Modals */}
            <LearnerFormModal
                open={modalOpen}
                user={editingUser}
                onSave={handleSave}
                onClose={() => { setModalOpen(false); setEditingUser(null); }}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                title="Delete Learner"
                message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}

export const AdminStudentsView = AdminLearnersView;
