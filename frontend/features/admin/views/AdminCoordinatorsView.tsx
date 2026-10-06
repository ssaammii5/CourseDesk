"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Check,
    Clock,
    Copy,
    Mail,
    Pencil,
    Plus,
    Search,
    ShieldAlert,
    Trash2,
    UserCheck,
    Users,
} from "lucide-react";
import type { AdminUser } from "@/types";
import {
    deleteUserRequest,
    getPendingCoordinatorInvitationsRequest,
    getUsersRequest,
    revokeCoordinatorInvitationRequest,
    updateUserRequest,
    type PendingInvitation,
    type UserDto,
} from "@/lib/api/users";
import { DataTable, StatusBadge, ConfirmDialog, ModernDropdown } from "@/components/ui";
import { initialOf } from "@/lib/utils/format";
import { CoordinatorFormModal } from "../components/CoordinatorFormModal";
import { InviteCoordinatorModal } from "../components/InviteCoordinatorModal";

function mapUserDtoToAdminUser(dto: UserDto): AdminUser {
    const details = dto.coordinatorDetails;
    return {
        id: dto.id,
        name: dto.name || "Unnamed Co-ordinator",
        email: dto.email,
        role: "Coordinator",
        isActive: dto.isActive,
        createdAt: dto.createdAtUtc.split("T")[0],
        coordinatorDetails: details,
    };
}

function formatDateTime(isoString?: string | null): string {
    if (!isoString) return "";
    try {
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return "";
        return d.toLocaleString("en-US", {
            month: "numeric",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    } catch {
        return "";
    }
}

export function AdminCoordinatorsView() {
    const [tab, setTab] = useState<"coordinators" | "invitations">("coordinators");
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingInvitations, setLoadingInvitations] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Modals & Actions
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
    const [revokeTarget, setRevokeTarget] = useState<PendingInvitation | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const all = await getUsersRequest();
            setUsers(all.filter((u) => u.role === "Coordinator").map(mapUserDtoToAdminUser));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load coordinators.");
        } finally {
            setLoading(false);
        }
    };

    const loadInvitations = async () => {
        try {
            setLoadingInvitations(true);
            const invites = await getPendingCoordinatorInvitationsRequest();
            setPendingInvitations(invites);
        } catch (err) {
            console.error("Failed to load pending invitations", err);
        } finally {
            setLoadingInvitations(false);
        }
    };

    useEffect(() => {
        void loadUsers();
        void loadInvitations();
    }, []);

    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            const d = u.coordinatorDetails;
            const coordId = d?.coordinatorId ?? "";
            const matchSearch =
                u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase()) ||
                coordId.toLowerCase().includes(search.toLowerCase());
            const matchStatus =
                statusFilter === "all" ||
                (statusFilter === "active" ? u.isActive : !u.isActive);

            return matchSearch && matchStatus;
        });
    }, [users, search, statusFilter]);

    const filteredInvitations = useMemo(() => {
        if (!search.trim()) return pendingInvitations;
        const q = search.toLowerCase();
        return pendingInvitations.filter((i) => i.email.toLowerCase().includes(q));
    }, [pendingInvitations, search]);

    const handleSaveEdit = async (data: Omit<AdminUser, "id" | "createdAt">) => {
        if (!editingUser) return;
        try {
            const details = data.coordinatorDetails;
            const cleanId = details?.coordinatorId ?? "";
            const coordinatorDetails = details
                ? {
                    coordinatorId: cleanId,
                    firstName: details.firstName,
                    lastName: details.lastName,
                    avatar: details.avatar,
                    timezone: details.timezone,
                    links: details.links,
                }
                : undefined;

            await updateUserRequest(editingUser.id, {
                name: data.name,
                email: data.email,
                role: "Coordinator",
                isActive: data.isActive,
                coordinatorDetails,
            });

            setSuccessMessage(`Co-ordinator "${data.name}" updated successfully.`);
            window.setTimeout(() => setSuccessMessage(null), 5000);
            setEditingUser(null);
            await loadUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update coordinator.");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteUserRequest(deleteTarget.id);
            setDeleteTarget(null);
            setSuccessMessage(`Co-ordinator "${deleteTarget.name}" deleted.`);
            window.setTimeout(() => setSuccessMessage(null), 5000);
            await loadUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete coordinator.");
            setDeleteTarget(null);
        }
    };

    const handleRevoke = async () => {
        if (!revokeTarget) return;
        try {
            await revokeCoordinatorInvitationRequest(revokeTarget.id);
            setSuccessMessage(`Invitation for "${revokeTarget.email}" has been revoked.`);
            window.setTimeout(() => setSuccessMessage(null), 5000);
            setRevokeTarget(null);
            await loadInvitations();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to revoke invitation.");
            setRevokeTarget(null);
        }
    };

    const handleCopyInviteLink = async (inv: PendingInvitation) => {
        const token = inv.inviteToken || "";
        const link = `${window.location.origin}/set-password?token=${token}`;
        try {
            await navigator.clipboard.writeText(link);
            setCopiedId(inv.id);
            window.setTimeout(() => setCopiedId(null), 2500);
        } catch {
            // fallback
        }
    };

    const coordinatorColumns = [
        {
            key: "name",
            header: "Co-ordinator",
            width: "35%",
            truncate: true,
            render: (u: AdminUser) => {
                const details = u.coordinatorDetails;
                const avatar = details?.avatar;
                return (
                    <div className="flex items-center gap-3 min-w-0">
                        {avatar ? (
                            <img
                                src={avatar}
                                alt={u.name}
                                className="h-9 w-9 rounded-full object-cover shrink-0 ring-1 ring-gray-200 dark:ring-slate-700 shadow-2xs"
                            />
                        ) : (
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white shadow-2xs">
                                {initialOf(u.name)}
                            </span>
                        )}
                        <div className="min-w-0 truncate">
                            <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                                {u.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                                Co-ordinator
                            </p>
                        </div>
                    </div>
                );
            },
        },
        {
            key: "email",
            header: "Email",
            width: "30%",
            truncate: true,
        },
        {
            key: "coordinatorId",
            header: "Co-ordinator ID",
            width: "20%",
            truncate: true,
            render: (u: AdminUser) => {
                const idVal = u.coordinatorDetails?.coordinatorId;
                return idVal ? (
                    <span className="text-sm text-gray-900 dark:text-slate-100 font-mono text-xs" title={idVal}>
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
                        title="Edit coordinator details"
                        onClick={() => setEditingUser(u)}
                        className="cursor-pointer rounded-lg p-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        title="Delete coordinator"
                        onClick={() => setDeleteTarget(u)}
                        className="cursor-pointer rounded-lg p-2 text-[#c5221f] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ),
        },
    ];

    const invitationColumns = [
        {
            key: "email",
            header: "Invited Email",
            width: "35%",
            render: (inv: PendingInvitation) => (
                <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-slate-100">{inv.email}</span>
                </div>
            ),
        },
        {
            key: "role",
            header: "Role",
            width: "15%",
            render: () => (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                    Co-ordinator
                </span>
            ),
        },
        {
            key: "createdAtUtc",
            header: "Invited Date",
            width: "18%",
            render: (inv: PendingInvitation) => (
                <span className="text-xs text-gray-600 dark:text-slate-400">
                    {formatDateTime(inv.createdAtUtc)}
                </span>
            ),
        },
        {
            key: "expiresAtUtc",
            header: "Expires In",
            width: "17%",
            render: (inv: PendingInvitation) => {
                if (!inv.expiresAtUtc) return <span className="text-xs text-gray-400">—</span>;
                const expires = new Date(inv.expiresAtUtc).getTime();
                const now = Date.now();
                const diffHours = Math.round((expires - now) / (1000 * 60 * 60));
                const isExpired = diffHours <= 0;

                return (
                    <span
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                            isExpired
                                ? "text-red-600 dark:text-red-400"
                                : diffHours < 12
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-gray-600 dark:text-slate-400"
                        }`}
                    >
                        <Clock className="h-3.5 w-3.5" />
                        {isExpired ? "Expired" : `${diffHours} hours`}
                    </span>
                );
            },
        },
        {
            key: "status",
            header: "Status",
            width: "15%",
            render: () => (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Pending
                </span>
            ),
        },
        {
            key: "actions",
            header: "Actions",
            width: "20%",
            className: "text-right",
            render: (inv: PendingInvitation) => (
                <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                    <button
                        type="button"
                        onClick={() => handleCopyInviteLink(inv)}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition"
                        title="Copy invitation link"
                    >
                        {copiedId === inv.id ? (
                            <>
                                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy Link</span>
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setRevokeTarget(inv)}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition"
                        title="Revoke invitation"
                    >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>Revoke</span>
                    </button>
                </div>
            ),
        },
    ];

    if (loading) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-8">
            {/* Success Message Banner */}
            {successMessage && (
                <div className="mb-5 flex items-center justify-between rounded-xl bg-emerald-50 px-5 py-3.5 text-sm font-medium text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 animate-in fade-in">
                    <span>{successMessage}</span>
                    <button
                        type="button"
                        onClick={() => setSuccessMessage(null)}
                        className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Error Banner */}
            {error && (
                <div className="mb-5 flex items-center justify-between rounded-xl bg-red-50 px-5 py-3.5 text-sm font-medium text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900 animate-in fade-in">
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={() => setError(null)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 sm:text-3xl">
                        Co-ordinators
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                        Manage course coordinators and send onboarding invitations
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setInviteModalOpen(true)}
                    className="flex cursor-pointer items-center gap-2 self-start rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition active:scale-95 sm:self-auto"
                >
                    <Plus className="h-4 w-4" />
                    Invite Co-ordinator
                </button>
            </div>

            {/* Tabs Bar */}
            <div className="mt-6 flex border-b border-gray-200 dark:border-slate-800 gap-8">
                <button
                    type="button"
                    onClick={() => setTab("coordinators")}
                    className={`relative flex items-center gap-2 py-3 text-sm font-semibold transition ${
                        tab === "coordinators"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                >
                    <Users className="h-4 w-4" />
                    <span>All Co-ordinators</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                        {users.length}
                    </span>
                    {tab === "coordinators" && (
                        <span className="absolute inset-x-0 -bottom-px h-[2px] bg-blue-600 dark:bg-blue-500" />
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => setTab("invitations")}
                    className={`relative flex items-center gap-2 py-3 text-sm font-semibold transition ${
                        tab === "invitations"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                >
                    <Mail className="h-4 w-4" />
                    <span>Pending Invitations</span>
                    {pendingInvitations.length > 0 && (
                        <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 text-xs font-bold">
                            {pendingInvitations.length}
                        </span>
                    )}
                    {tab === "invitations" && (
                        <span className="absolute inset-x-0 -bottom-px h-[2px] bg-blue-600 dark:bg-blue-500" />
                    )}
                </button>
            </div>

            {/* Search and Filters */}
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={
                            tab === "coordinators"
                                ? "Search by name, email, or coordinator ID..."
                                : "Search pending invitations by email..."
                        }
                        className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>

                {tab === "coordinators" && (
                    <ModernDropdown
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={[
                            { value: "all", label: "All Statuses" },
                            { value: "active", label: "Active" },
                            { value: "inactive", label: "Inactive" },
                        ]}
                        size="md"
                        buttonClassName="w-full sm:w-44"
                    />
                )}
            </div>

            {/* Table Area */}
            <div className="mt-6">
                {tab === "coordinators" ? (
                    <DataTable
                        columns={coordinatorColumns}
                        data={filteredUsers}
                        keyExtractor={(u) => u.id}
                        emptyMessage="No coordinators match your filters."
                    />
                ) : (
                    <DataTable
                        columns={invitationColumns}
                        data={filteredInvitations}
                        keyExtractor={(i) => i.id}
                        emptyMessage="No pending invitations right now."
                    />
                )}
            </div>

            {/* Modals */}
            <InviteCoordinatorModal
                open={inviteModalOpen}
                onClose={() => setInviteModalOpen(false)}
                onSuccess={() => {
                    void loadInvitations();
                }}
            />

            <CoordinatorFormModal
                open={!!editingUser}
                user={editingUser}
                onSave={handleSaveEdit}
                onClose={() => setEditingUser(null)}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                title="Delete Co-ordinator"
                message={`Are you sure you want to delete "${deleteTarget?.name}"? They will lose access to the coordinator workspace.`}
                confirmLabel="Delete"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />

            <ConfirmDialog
                open={!!revokeTarget}
                title="Revoke Invitation"
                message={`Are you sure you want to revoke the invitation for "${revokeTarget?.email}"? Their onboarding link will be invalidated.`}
                confirmLabel="Revoke"
                variant="danger"
                onConfirm={handleRevoke}
                onCancel={() => setRevokeTarget(null)}
            />
        </div>
    );
}
