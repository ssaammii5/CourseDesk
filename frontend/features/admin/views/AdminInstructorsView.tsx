"use client";

import { useEffect, useMemo, useState } from "react";
import {
    BookOpen,
    Check,
    Copy,
    Mail,
    Pencil,
    Plus,
    Search,
    SlidersHorizontal,
    Trash2,
    X,
} from "lucide-react";
import type { AdminUser, InstructorDesignation } from "@/types";
import {
    createUserRequest,
    deleteUserRequest,
    getUsersRequest,
    updateUserRequest,
    type UserDto,
} from "@/lib/api/users";
import { DataTable, StatusBadge, ConfirmDialog } from "@/components/ui";
import { InstructorFormModal } from "../components/InstructorFormModal";

const DESIGNATION_ORDER: InstructorDesignation[] = [
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
    const details = dto.instructorDetails ?? dto.teacherDetails;
    return {
        id: dto.id,
        name: dto.name,
        email: dto.email,
        role: (dto.role === "Teacher" ? "Instructor" : dto.role) as AdminUser["role"],
        isActive: dto.isActive,
        createdAt: dto.createdAtUtc.split("T")[0],
        instructorDetails: details
            ? {
                instructorId: details.instructorId ?? details.teacherId ?? "",
                teacherId: details.instructorId ?? details.teacherId ?? "",
                designation: (details.designation ?? "Assistant Professor") as InstructorDesignation,
                department: details.department ?? "",
            }
            : undefined,
        teacherDetails: details
            ? {
                instructorId: details.instructorId ?? details.teacherId ?? "",
                teacherId: details.instructorId ?? details.teacherId ?? "",
                designation: (details.designation ?? "Assistant Professor") as InstructorDesignation,
                department: details.department ?? "",
            }
            : undefined,
        learnerDetails: undefined,
        studentDetails: undefined,
    };
}

function hasFullDetails(u: AdminUser): boolean {
    const d = u.instructorDetails ?? u.teacherDetails;
    return !!d && !!d.designation && !!d.department?.trim();
}

interface DesignationGroup {
    name: string;
    instructors: AdminUser[];
    count: number;
}

interface DeptGroup {
    name: string;
    designations: DesignationGroup[];
    count: number;
}

export function AdminInstructorsView() {
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
    const [inviteNotification, setInviteNotification] = useState<{ email: string; link: string } | null>(null);
    const [copied, setCopied] = useState(false);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const all = await getUsersRequest();
            setUsers(all.filter((u) => u.role === "Instructor" || u.role === "Teacher").map(mapUserDtoToAdminUser));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load instructors.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadUsers();
    }, []);

    const departmentOptions = useMemo(() => {
        return Array.from(
            new Set(users.map((u) => (u.instructorDetails?.department ?? u.teacherDetails?.department)?.trim() ?? "").filter(Boolean))
        ).sort((a, b) => a.localeCompare(b));
    }, [users]);

    const designationOptions = useMemo<InstructorDesignation[]>(() => {
        const base =
            departmentFilter === "all"
                ? users
                : users.filter((u) => (u.instructorDetails?.department ?? u.teacherDetails?.department)?.trim() === departmentFilter);

        return Array.from(
            new Set(
                base
                    .map((u) => (u.instructorDetails?.designation ?? u.teacherDetails?.designation))
                    .filter((d): d is InstructorDesignation => Boolean(d))
            )
        ).sort((a, b) => {
            const ia = DESIGNATION_RANK[a] ?? 99;
            const ib = DESIGNATION_RANK[b] ?? 99;
            return ia - ib || a.localeCompare(b);
        });
    }, [users, departmentFilter]);

    useEffect(() => {
        if (designationFilter !== "all" && !designationOptions.includes(designationFilter as InstructorDesignation)) {
            setDesignationFilter("all");
        }
    }, [designationOptions, designationFilter]);

    const filtered = useMemo(() => {
        return users.filter((u) => {
            const d = u.instructorDetails ?? u.teacherDetails;
            const insId = d?.instructorId ?? d?.teacherId ?? "";
            const matchSearch =
                u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase()) ||
                insId.toLowerCase().includes(search.toLowerCase());
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
            const d = (u.instructorDetails ?? u.teacherDetails)!;
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
                    const instructors = [...desgMap.get(designation)!].sort((a, b) =>
                        a.name.localeCompare(b.name)
                    );
                    return { name: designation, instructors, count: instructors.length };
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
            const details = data.instructorDetails ?? data.teacherDetails;
            const cleanId = details?.instructorId ?? details?.teacherId ?? "";
            const instructorDetails = details
                ? {
                    instructorId: cleanId,
                    teacherId: cleanId,
                    designation: details.designation,
                    department: details.department,
                }
                : undefined;

            if (editingUser) {
                await updateUserRequest(editingUser.id, {
                    name: data.name,
                    email: data.email,
                    role: "Instructor",
                    isActive: data.isActive,
                    instructorDetails,
                    teacherDetails: instructorDetails,
                });
                setSuccessMessage(`Instructor "${data.name}" updated successfully.`);
                window.setTimeout(() => setSuccessMessage(null), 6000);
            } else {
                const response = await createUserRequest({
                    name: data.name,
                    email: data.email,
                    role: "Instructor",
                    instructorDetails,
                    teacherDetails: instructorDetails,
                });
                const inviteLink = `${window.location.origin}/set-password?token=${response.inviteToken}&email=${encodeURIComponent(data.email)}`;
                setInviteNotification({
                    email: data.email,
                    link: inviteLink,
                });
                setCopied(false);
                window.setTimeout(() => setInviteNotification(null), 10000);
            }

            setModalOpen(false);
            setEditingUser(null);
            await loadUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save instructor.");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteUserRequest(deleteTarget.id);
            setDeleteTarget(null);
            await loadUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete instructor.");
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
            key: "instructorId",
            header: "Instructor ID",
            width: "13%",
            truncate: true,
            render: (u: AdminUser) => {
                const idVal = u.instructorDetails?.instructorId ?? u.teacherDetails?.teacherId;
                return idVal ? (
                    <span className="text-sm text-gray-900 dark:text-slate-100" title={idVal}>
                        {idVal}
                    </span>
                ) : (
                    <span className="text-gray-400 dark:text-slate-500">—</span>
                );
            },
        },
        {
            key: "designation",
            header: "Title / Role",
            width: "15%",
            truncate: true,
            render: (u: AdminUser) => {
                const desg = u.instructorDetails?.designation ?? u.teacherDetails?.designation;
                return desg ? (
                    <span className="text-sm text-gray-900 dark:text-slate-100" title={desg}>
                        {desg}
                    </span>
                ) : (
                    <span className="text-gray-400 dark:text-slate-500">—</span>
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
                        className="cursor-pointer rounded p-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        title="Delete"
                        onClick={() => setDeleteTarget(u)}
                        className="cursor-pointer rounded p-2 text-[#c5221f] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
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
            {/* Invitation Banner */}
            {inviteNotification && (
                <div className="fixed inset-x-0 top-20 z-50 flex justify-center px-4">
                    <div className="flex max-w-3xl flex-col gap-2 rounded-lg bg-[#e6f4ea] dark:bg-emerald-950/90 p-4 shadow-lg border border-[#ceead6] dark:border-emerald-800 sm:flex-row sm:items-center sm:gap-3">
                        <div className="flex items-center gap-2 shrink-0">
                            <Mail className="h-5 w-5 shrink-0 text-[#137333] dark:text-emerald-300" />
                            <span className="text-sm font-medium text-[#137333] dark:text-emerald-300">
                                Invitation sent to {inviteNotification.email}. Share this link:
                            </span>
                        </div>
                        <div className="flex flex-1 items-center gap-1.5 min-w-0">
                            <input
                                type="text"
                                readOnly
                                value={inviteNotification.link}
                                className="w-full min-w-0 rounded border border-[#a8dab5] dark:border-emerald-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-gray-800 dark:text-slate-100 select-all focus:outline-none focus:ring-1 focus:ring-[#137333]"
                            />
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        await navigator.clipboard.writeText(inviteNotification.link);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2500);
                                    } catch {
                                        // fallback
                                    }
                                }}
                                className="flex shrink-0 cursor-pointer items-center gap-1 rounded bg-[#137333] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#0e5826] transition-colors"
                            >
                                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                <span>{copied ? "Copied" : "Copy"}</span>
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setInviteNotification(null)}
                            className="self-end sm:self-center cursor-pointer rounded p-1 text-[#137333] dark:text-emerald-300 hover:bg-[#ceead6] dark:hover:bg-emerald-900/40"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Success Banner */}
            {successMessage && (
                <div className="fixed inset-x-0 top-20 z-50 flex justify-center px-4">
                    <div className="flex items-center gap-3 rounded-lg bg-[#e6f4ea] dark:bg-emerald-950/90 px-5 py-3.5 shadow-lg border border-[#ceead6] dark:border-emerald-800">
                        <Mail className="h-5 w-5 shrink-0 text-[#137333] dark:text-emerald-300" />
                        <span className="text-sm font-medium text-[#137333] dark:text-emerald-300">{successMessage}</span>
                        <button
                            type="button"
                            onClick={() => setSuccessMessage(null)}
                            className="ml-2 cursor-pointer rounded p-1 text-[#137333] dark:text-emerald-300 hover:bg-[#ceead6] dark:hover:bg-emerald-900/40"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Error Banner */}
            {error && (
                <div className="mb-4 rounded-lg bg-[#fce8e6] dark:bg-red-950/40 px-5 py-3.5 text-sm text-[#c5221f] dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 sm:text-3xl">Manage Instructors</h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
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
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, email, or instructor ID..."
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
                            className="cursor-pointer text-sm font-medium text-[#1a73e8] dark:text-blue-400 hover:underline"
                        >
                            Clear all
                        </button>
                    )}
                </div>
            </div>

            {/* Advanced Filters Panel */}
            {filtersOpen && (
                <div className="mt-4 grid gap-4 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="block">
                        <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-slate-400">Department</span>
                        <select
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            className="w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-gray-900 dark:text-slate-100 focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                        >
                            <option value="all">All Departments</option>
                            {departmentOptions.map((d) => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </label>
                    <label className="block">
                        <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-slate-400">Designation</span>
                        <select
                            value={designationFilter}
                            onChange={(e) => setDesignationFilter(e.target.value)}
                            className="w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-gray-900 dark:text-slate-100 focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                        >
                            <option value="all">All Designations</option>
                            {designationOptions.map((d) => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </label>
                    <label className="block">
                        <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-slate-400">Status</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-gray-900 dark:text-slate-100 focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </label>
                </div>
            )}

            {/* Instructor Groups */}
            <div className="mt-8 space-y-12">
                {filtered.length === 0 && (
                    <div className="rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-16 text-center">
                        <p className="text-sm text-gray-600 dark:text-slate-400">No instructors match your filters.</p>
                    </div>
                )}

                {/* Department Groups */}
                {departmentGroups.map((dept) => (
                    <section key={dept.name}>
                        {/* Department Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-gray-200 dark:border-slate-800 pb-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fef7e0] dark:bg-amber-950/60 text-[#b06000] dark:text-amber-300 sm:h-10 sm:w-10">
                                    <BookOpen className="h-5 w-5" />
                                </span>
                                <h2 className="truncate text-xl text-gray-900 dark:text-slate-100 sm:text-2xl">{dept.name}</h2>
                            </div>
                            <span className="shrink-0 text-sm font-medium text-gray-600 dark:text-slate-400">
                                {dept.count} instructor{dept.count === 1 ? "" : "s"}
                            </span>
                        </div>

                        {/* Designation Groups */}
                        {dept.designations.map((desg) => (
                            <div key={desg.name} className="mt-6">
                                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                                    <h3 className="min-w-0 truncate text-lg text-gray-800 dark:text-slate-200 sm:text-xl">{desg.name}</h3>
                                    <span className="shrink-0 text-xs font-medium text-gray-500 dark:text-slate-400">
                                        {desg.count} instructor{desg.count === 1 ? "" : "s"}
                                    </span>
                                </div>
                                <div className="mt-4">
                                    <DataTable
                                        columns={columns}
                                        data={desg.instructors}
                                        keyExtractor={(u) => u.id}
                                        emptyMessage="No instructors in this group."
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
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-gray-200 dark:border-slate-800 pb-3">
                            <h2 className="text-xl text-gray-900 dark:text-slate-100 sm:text-2xl">Uncategorized</h2>
                            <span className="shrink-0 text-sm font-medium text-gray-600 dark:text-slate-400">
                                {uncategorized.length} instructor{uncategorized.length === 1 ? "" : "s"}
                            </span>
                        </div>
                        <p className="mt-2 px-1 text-xs text-gray-500 dark:text-slate-400">
                            Instructors missing department or designation details.
                        </p>
                        <div className="mt-4">
                            <DataTable
                                columns={columns}
                                data={uncategorized}
                                keyExtractor={(u) => u.id}
                                emptyMessage="No instructors in this group."
                                tableLayout="fixed"
                                minWidthClassName="min-w-[760px]"
                            />
                        </div>
                    </section>
                )}
            </div>

            {/* Modals */}
            <InstructorFormModal
                open={modalOpen}
                user={editingUser}
                onSave={handleSave}
                onClose={() => { setModalOpen(false); setEditingUser(null); }}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                title="Delete Instructor"
                message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}

export const AdminTeachersView = AdminInstructorsView;
