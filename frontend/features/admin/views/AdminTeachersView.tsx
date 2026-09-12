"use client";

import { useEffect, useMemo, useState } from "react";
import {
    BookOpen,
    Mail,
    Pencil,
    Plus,
    Search,
    SlidersHorizontal,
    Trash2,
    X,
} from "lucide-react";
import type { AdminUser, TeacherDesignation } from "@/types";
import {
    createUserRequest,
    deleteUserRequest,
    getUsersRequest,
    updateUserRequest,
    type UserDto,
} from "@/lib/api/users";
import { DataTable, StatusBadge, ConfirmDialog } from "@/components/ui";
import { TeacherFormModal } from "../components/TeacherFormModal";

const DESIGNATION_ORDER: TeacherDesignation[] = [
    "Professor",
    "Associate Professor",
    "Assistant Professor",
    "Senior Lecturer",
    "Lecturer",
];

const DESIGNATION_RANK: Record<string, number> = Object.fromEntries(
    DESIGNATION_ORDER.map((d, i) => [d, i])
);

function mapUserDtoToAdminUser(dto: UserDto): AdminUser {
    return {
        id: dto.id,
        name: dto.name,
        email: dto.email,
        role: dto.role as AdminUser["role"],
        isActive: dto.isActive,
        createdAt: dto.createdAtUtc.split("T")[0],
        teacherDetails: dto.teacherDetails
            ? {
                teacherId: dto.teacherDetails.teacherId ?? "",
                designation: (dto.teacherDetails.designation ?? "Assistant Professor") as TeacherDesignation,
                department: dto.teacherDetails.department ?? "",
            }
            : undefined,
        studentDetails: undefined,
    };
}

function hasFullDetails(u: AdminUser): boolean {
    const d = u.teacherDetails;
    return !!d && !!d.designation && !!d.department?.trim();
}

interface DesignationGroup {
    name: string;
    teachers: AdminUser[];
    count: number;
}

interface DeptGroup {
    name: string;
    designations: DesignationGroup[];
    count: number;
}

export function AdminTeachersView() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [departmentFilter, setDepartmentFilter] = useState("all");
    const [designationFilter, setDesignationFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const all = await getUsersRequest();
            setUsers(all.filter((u) => u.role === "Teacher").map(mapUserDtoToAdminUser));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load teachers.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadUsers();
    }, []);

    const departmentOptions = useMemo(() => {
        return Array.from(
            new Set(users.map((u) => u.teacherDetails?.department?.trim() ?? "").filter(Boolean))
        ).sort((a, b) => a.localeCompare(b));
    }, [users]);

    const designationOptions = useMemo<TeacherDesignation[]>(() => {
        const base =
            departmentFilter === "all"
                ? users
                : users.filter((u) => u.teacherDetails?.department?.trim() === departmentFilter);

        return Array.from(
            new Set(
                base
                    .map((u) => u.teacherDetails?.designation)
                    .filter((d): d is TeacherDesignation => Boolean(d))
            )
        ).sort((a, b) => {
            const ia = DESIGNATION_RANK[a] ?? 99;
            const ib = DESIGNATION_RANK[b] ?? 99;
            return ia - ib || a.localeCompare(b);
        });
    }, [users, departmentFilter]);

    useEffect(() => {
        if (designationFilter !== "all" && !designationOptions.includes(designationFilter as TeacherDesignation)) {
            setDesignationFilter("all");
        }
    }, [designationOptions, designationFilter]);

    const filtered = useMemo(() => {
        return users.filter((u) => {
            const d = u.teacherDetails;
            const matchSearch =
                u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase()) ||
                (d?.teacherId ?? "").toLowerCase().includes(search.toLowerCase());
            const matchStatus =
                statusFilter === "all" ||
                (statusFilter === "active" ? u.isActive : !u.isActive);
            const matchDept =
                departmentFilter === "all" || (d?.department?.trim() ?? "") === departmentFilter;
            const matchDesignation =
                designationFilter === "all" || d?.designation === designationFilter;

            return matchSearch && matchStatus && matchDept && matchDesignation;
        });
    }, [users, search, statusFilter, departmentFilter, designationFilter]);

    const activeFilterCount = [departmentFilter, designationFilter, statusFilter].filter(
        (f) => f !== "all"
    ).length;

    const clearFilters = () => {
        setDepartmentFilter("all");
        setDesignationFilter("all");
        setStatusFilter("all");
    };

    const departmentGroups = useMemo<DeptGroup[]>(() => {
        const map = new Map<string, Map<string, AdminUser[]>>();

        for (const u of filtered) {
            if (!hasFullDetails(u)) continue;
            const d = u.teacherDetails!;
            const dept = (d.department ?? "").trim() || "General";
            const desg = d.designation ?? "Instructor";

            if (!map.has(dept)) map.set(dept, new Map());
            const desgMap = map.get(dept)!;
            if (!desgMap.has(desg)) desgMap.set(desg, []);
            desgMap.get(desg)!.push(u);
        }

        const departments = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));

        return departments.map((deptName) => {
            const desgMap = map.get(deptName)!;
            const designations: DesignationGroup[] = Array.from(desgMap.keys())
                .sort((a, b) => {
                    const ia = DESIGNATION_RANK[a] ?? 99;
                    const ib = DESIGNATION_RANK[b] ?? 99;
                    return ia - ib || a.localeCompare(b);
                })
                .map((designation) => {
                    const teachers = [...desgMap.get(designation)!].sort((a, b) =>
                        a.name.localeCompare(b.name)
                    );
                    return { name: designation, teachers, count: teachers.length };
                });

            return {
                name: deptName,
                designations,
                count: designations.reduce((s, g) => s + g.count, 0),
            };
        });
    }, [filtered]);

    const uncategorized = useMemo(
        () =>
            filtered
                .filter((u) => !hasFullDetails(u))
                .sort((a, b) => a.name.localeCompare(b.name)),
        [filtered]
    );

    const handleSave = async (data: Omit<AdminUser, "id" | "createdAt">) => {
        try {
            const teacherDetails = data.teacherDetails
                ? {
                    teacherId: data.teacherDetails.teacherId,
                    designation: data.teacherDetails.designation,
                    department: data.teacherDetails.department,
                }
                : undefined;

            if (editingUser) {
                await updateUserRequest(editingUser.id, {
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    isActive: data.isActive,
                    teacherDetails,
                });
            } else {
                const password = `Teacher@${Date.now().toString(36)}`;
                await createUserRequest({
                    name: data.name,
                    email: data.email,
                    password,
                    role: data.role,
                    teacherDetails,
                });
                setSuccessMessage(
                    `Teacher "${data.name}" created successfully. A password setup link has been sent to ${data.email}.`
                );
                window.setTimeout(() => setSuccessMessage(null), 6000);
            }

            setModalOpen(false);
            setEditingUser(null);
            await loadUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save teacher.");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteUserRequest(deleteTarget.id);
            setDeleteTarget(null);
            await loadUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete teacher.");
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
            key: "teacherId",
            header: "Instructor ID",
            width: "13%",
            truncate: true,
            render: (u: AdminUser) =>
                u.teacherDetails?.teacherId ? (
                    <span className="text-sm text-gray-900" title={u.teacherDetails.teacherId}>
                        {u.teacherDetails.teacherId}
                    </span>
                ) : (
                    <span className="text-gray-400">—</span>
                ),
        },
        {
            key: "designation",
            header: "Title / Role",
            width: "15%",
            truncate: true,
            render: (u: AdminUser) =>
                u.teacherDetails?.designation ? (
                    <span className="text-sm text-gray-900" title={u.teacherDetails.designation}>
                        {u.teacherDetails.designation}
                    </span>
                ) : (
                    <span className="text-gray-400">—</span>
                ),
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
                    <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">Manage Instructors</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        {users.length} instructors total • {filtered.length} shown
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => { setEditingUser(null); setModalOpen(true); }}
                    className="flex cursor-pointer items-center gap-2 self-start rounded-full bg-[#1a63d8] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1554b5] sm:self-auto"
                >
                    <Plus className="h-4 w-4" />
                    Add Instructor
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
                        placeholder="Search by name, email, or instructor ID..."
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
                <div className="mt-4 grid gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
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
                        <span className="mb-1.5 block text-xs font-medium text-gray-600">Designation</span>
                        <select
                            value={designationFilter}
                            onChange={(e) => setDesignationFilter(e.target.value)}
                            className="w-full rounded-md border border-gray-400/80 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                        >
                            <option value="all">All Designations</option>
                            {designationOptions.map((d) => (
                                <option key={d} value={d}>{d}</option>
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

            {/* Teacher Groups */}
            <div className="mt-8 space-y-12">
                {filtered.length === 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white py-16 text-center">
                        <p className="text-sm text-gray-600">No teachers match your filters.</p>
                    </div>
                )}

                {/* Department Groups */}
                {departmentGroups.map((dept) => (
                    <section key={dept.name}>
                        {/* Department Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-gray-300 pb-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fef7e0] text-[#b06000] sm:h-10 sm:w-10">
                                    <BookOpen className="h-5 w-5" />
                                </span>
                                <h2 className="truncate text-xl text-gray-900 sm:text-2xl">{dept.name}</h2>
                            </div>
                            <span className="shrink-0 text-sm font-medium text-gray-600">
                                {dept.count} teacher{dept.count === 1 ? "" : "s"}
                            </span>
                        </div>

                        {/* Designation Groups */}
                        {dept.designations.map((desg) => (
                            <div key={desg.name} className="mt-6">
                                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                                    <h3 className="min-w-0 truncate text-lg text-gray-800 sm:text-xl">{desg.name}</h3>
                                    <span className="shrink-0 text-xs font-medium text-gray-500">
                                        {desg.count} teacher{desg.count === 1 ? "" : "s"}
                                    </span>
                                </div>
                                <div className="mt-4">
                                    <DataTable
                                        columns={columns}
                                        data={desg.teachers}
                                        keyExtractor={(u) => u.id}
                                        emptyMessage="No teachers in this group."
                                        tableLayout="fixed"
                                        minWidthClassName="min-w-[760px]"
                                    />
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
                                {uncategorized.length} teacher{uncategorized.length === 1 ? "" : "s"}
                            </span>
                        </div>
                        <p className="mt-2 px-1 text-xs text-gray-500">
                            Teachers missing department or designation details.
                        </p>
                        <div className="mt-4">
                            <DataTable
                                columns={columns}
                                data={uncategorized}
                                keyExtractor={(u) => u.id}
                                emptyMessage="No teachers in this group."
                                tableLayout="fixed"
                                minWidthClassName="min-w-[760px]"
                            />
                        </div>
                    </section>
                )}
            </div>

            {/* Modals */}
            <TeacherFormModal
                open={modalOpen}
                user={editingUser}
                onSave={handleSave}
                onClose={() => { setModalOpen(false); setEditingUser(null); }}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                title="Delete Teacher"
                message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}