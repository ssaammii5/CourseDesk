// components/admin/AdminUsersView.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, ShieldCheck, ShieldX } from "lucide-react";
import type { AdminUser } from "@/lib/adminData";
import {
    createUserRequest,
    deleteUserRequest,
    getUsersRequest,
    updateUserRequest,
    type UserDto,
} from "@/lib/api/users";
import { DataTable } from "./DataTable";
import { StatusBadge } from "./StatusBadge";
import { UserFormModal } from "./UserFormModal";
import { ConfirmDialog } from "./ConfirmDialog";

const ROLE_STYLES: Record<string, string> = {
    Admin: "bg-[#fce8e6] text-[#c5221f]",
    Teacher: "bg-[#fef7e0] text-[#b06000]",
    Student: "bg-[#e6f4ea] text-[#137333]",
};

function mapUserDtoToAdminUser(dto: UserDto): AdminUser {
    return {
        id: dto.id,
        name: dto.name,
        email: dto.email,
        role: dto.role as AdminUser["role"],
        isActive: dto.isActive,
        createdAt: dto.createdAtUtc.split("T")[0],
    };
}

export function AdminUsersView() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const all = await getUsersRequest();
            setUsers(all.map(mapUserDtoToAdminUser));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load users.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadUsers();
    }, []);

    const filtered = useMemo(() => {
        return users.filter((u) => {
            const matchSearch =
                u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase());
            const matchRole = roleFilter === "all" || u.role === roleFilter;
            const matchStatus =
                statusFilter === "all" ||
                (statusFilter === "active" ? u.isActive : !u.isActive);

            return matchSearch && matchRole && matchStatus;
        });
    }, [users, search, roleFilter, statusFilter]);

    const handleSave = async (data: Omit<AdminUser, "id" | "createdAt">) => {
        try {
            if (editingUser) {
                await updateUserRequest(editingUser.id, {
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    isActive: data.isActive,
                });
            } else {
                const password = `User@${Date.now().toString(36)}`;
                await createUserRequest({
                    name: data.name,
                    email: data.email,
                    password,
                    role: data.role,
                });
            }

            setModalOpen(false);
            setEditingUser(null);
            await loadUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save user.");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteUserRequest(deleteTarget.id);
            setDeleteTarget(null);
            await loadUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete user.");
            setDeleteTarget(null);
        }
    };

    const toggleActive = async (user: AdminUser) => {
        try {
            await updateUserRequest(user.id, {
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: !user.isActive,
            });
            await loadUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update user status.");
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
                <div className="mb-4 rounded-lg bg-[#fce8e6] px-5 py-3.5 text-sm text-[#c5221f]">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold text-gray-900">Manage Users</h1>
                    <p className="mt-1 text-sm text-gray-600">{users.length} total users</p>
                </div>
                <button
                    type="button"
                    onClick={() => { setEditingUser(null); setModalOpen(true); }}
                    className="flex cursor-pointer items-center gap-2 rounded-full bg-[#1a63d8] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1554b5]"
                >
                    <Plus className="h-4 w-4" />
                    Add User
                </button>
            </div>

            {/* Filters */}
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full rounded-md border border-gray-400/80 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="rounded-md border border-gray-400/80 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                >
                    <option value="all">All Roles</option>
                    <option value="Admin">Admin</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Student">Student</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-md border border-gray-400/80 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            {/* Table */}
            <div className="mt-6">
                <DataTable
                    columns={[
                        { key: "name", header: "Name" },
                        { key: "email", header: "Email" },
                        {
                            key: "role",
                            header: "Role",
                            render: (u: AdminUser) => (
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLES[u.role]}`}>
                                    {u.role}
                                </span>
                            ),
                        },
                        {
                            key: "isActive",
                            header: "Status",
                            render: (u: AdminUser) => <StatusBadge status={u.isActive ? "Active" : "Inactive"} />,
                        },
                        { key: "createdAt", header: "Created" },
                        {
                            key: "actions",
                            header: "Actions",
                            className: "text-right",
                            render: (u: AdminUser) => (
                                <div className="flex items-center justify-end gap-1">
                                    <button
                                        type="button"
                                        title={u.isActive ? "Deactivate" : "Activate"}
                                        onClick={() => toggleActive(u)}
                                        className="cursor-pointer rounded p-2 text-gray-600 hover:bg-gray-100"
                                    >
                                        {u.isActive ? <ShieldX className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4 text-[#188038]" />}
                                    </button>
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
                    ]}
                    data={filtered}
                    keyExtractor={(u) => u.id}
                    emptyMessage="No users match your filters."
                />
            </div>

            <UserFormModal
                open={modalOpen}
                user={editingUser}
                onSave={handleSave}
                onClose={() => { setModalOpen(false); setEditingUser(null); }}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                title="Delete User"
                message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}