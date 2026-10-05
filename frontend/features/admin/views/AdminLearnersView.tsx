"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { AdminUser } from "@/types";
import {
    createUserRequest,
    deleteUserRequest,
    getUsersRequest,
    updateUserRequest,
    type UserDto,
} from "@/lib/api/users";
import { DataTable, StatusBadge, ConfirmDialog, ModernDropdown } from "@/components/ui";
import { LearnerFormModal } from "../components/LearnerFormModal";

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
                headline: details.headline ?? "",
                organization: details.organization ?? "",
                bio: details.bio ?? "",
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
                headline: details.headline ?? "",
                organization: details.organization ?? "",
                bio: details.bio ?? "",
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

export function AdminLearnersView() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
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

            return matchSearch && matchStatus;
        });
    }, [users, search, statusFilter]);

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
                    headline: details.headline,
                    organization: details.organization,
                    bio: details.bio,
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
            width: "30%",
            truncate: true,
        },
        {
            key: "email",
            header: "Email",
            width: "30%",
            truncate: true,
        },
        {
            key: "learnerId",
            header: "Learner ID",
            width: "20%",
            truncate: true,
            render: (u: AdminUser) => {
                const idVal = u.learnerDetails?.learnerId ?? u.studentDetails?.studentId;
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
            key: "isActive",
            header: "Status",
            width: "10%",
            render: (u: AdminUser) => <StatusBadge status={u.isActive ? "Active" : "Inactive"} />,
        },
        {
            key: "actions",
            header: "Actions",
            width: "10%",
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
            {/* Success Message Banner */}
            {successMessage && (
                <div className="mb-4 rounded-lg bg-[#e6f4ea] dark:bg-emerald-950/60 px-5 py-3.5 text-sm text-[#137333] dark:text-emerald-300 border border-[#ceead6] dark:border-emerald-800">
                    {successMessage}
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
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 sm:text-3xl">Manage Learners</h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
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
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, email, or learner ID..."
                        className="w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <ModernDropdown
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={[
                            { value: "all", label: "All Status" },
                            { value: "active", label: "Active" },
                            { value: "inactive", label: "Inactive" },
                        ]}
                        showStatusDot
                        size="md"
                        buttonClassName="w-40 sm:w-44"
                    />
                </div>
            </div>

            {/* Learners Table */}
            <div className="mt-6">
                <DataTable
                    columns={columns}
                    data={filtered}
                    keyExtractor={(u) => u.id}
                    emptyMessage={search || statusFilter !== "all" ? "No learners match your search or filter." : "No learners found."}
                    tableLayout="fixed"
                    minWidthClassName="min-w-[760px]"
                />
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
