"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Mail,
    Pencil,
    Plus,
    Search,
    Trash2,
} from "lucide-react";
import type { AdminUser } from "@/types";
import {
    createUserRequest,
    deleteUserRequest,
    getUsersRequest,
    updateUserRequest,
    type UserDto,
} from "@/lib/api/users";
import { DataTable, StatusBadge, ConfirmDialog, ModernDropdown } from "@/components/ui";
import { InstructorFormModal } from "../components/InstructorFormModal";

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
            }
            : undefined,
        teacherDetails: details
            ? {
                instructorId: details.instructorId ?? details.teacherId ?? "",
                teacherId: details.instructorId ?? details.teacherId ?? "",
            }
            : undefined,
        learnerDetails: undefined,
        studentDetails: undefined,
    };
}

export function AdminInstructorsView() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
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

            return matchSearch && matchStatus;
        });
    }, [users, search, statusFilter]);

    const handleSave = async (data: Omit<AdminUser, "id" | "createdAt">) => {
        try {
            const details = data.instructorDetails ?? data.teacherDetails;
            const cleanId = details?.instructorId ?? details?.teacherId ?? "";
            const instructorDetails = details
                ? {
                    instructorId: cleanId,
                    teacherId: cleanId,
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
            key: "instructorId",
            header: "Instructor ID",
            width: "20%",
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
                                        window.setTimeout(() => setCopied(false), 2000);
                                    } catch {
                                        /* clipboard unavailable */
                                    }
                                }}
                                className="shrink-0 cursor-pointer rounded bg-[#137333] px-3 py-1 text-xs font-medium text-white hover:bg-[#0d5926]"
                            >
                                {copied ? "Copied!" : "Copy Link"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

            {/* Search and Filter */}
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, email, or instructor ID..."
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

            {/* Instructors Table */}
            <div className="mt-6">
                <DataTable
                    columns={columns}
                    data={filtered}
                    keyExtractor={(u) => u.id}
                    emptyMessage={search || statusFilter !== "all" ? "No instructors match your search or filter." : "No instructors found."}
                    tableLayout="fixed"
                    minWidthClassName="min-w-[760px]"
                />
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
