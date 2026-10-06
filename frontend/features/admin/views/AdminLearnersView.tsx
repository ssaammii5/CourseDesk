"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Pencil,
    Plus,
    Search,
    Trash2,
    Mail,
    Users,
    Copy,
    Check,
    Eye,
    ShieldAlert,
    Clock,
} from "lucide-react";
import type { AdminUser, LearnerDetails } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import {
    deleteUserRequest,
    getUsersRequest,
    updateUserRequest,
    getPendingLearnerInvitationsRequest,
    revokeLearnerInvitationRequest,
    type UserDto,
    type PendingInvitation,
} from "@/lib/api/users";
import { DataTable, StatusBadge, ConfirmDialog, ModernDropdown } from "@/components/ui";
import { LearnerFormModal } from "../components/LearnerFormModal";
import { InviteLearnerModal } from "../components/InviteLearnerModal";
import { initialOf } from "@/lib/utils/format";

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
                firstName: details.firstName ?? "",
                lastName: details.lastName ?? "",
                email: details.email ?? dto.email,
                avatar: details.avatar ?? "",
                shortBio: details.shortBio ?? details.bio ?? "",
                timezone: details.timezone ?? "UTC",
                links: details.links ?? [],
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
                firstName: details.firstName ?? "",
                lastName: details.lastName ?? "",
                email: details.email ?? dto.email,
                avatar: details.avatar ?? "",
                shortBio: details.shortBio ?? details.bio ?? "",
                timezone: details.timezone ?? "UTC",
                links: details.links ?? [],
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

function formatDateTime(isoString: string): string {
    if (!isoString) return "—";
    try {
        const d = new Date(isoString);
        return d.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    } catch {
        return isoString;
    }
}

export function AdminLearnersView() {
    const { user: currentUser } = useAuth();
    const isCoordinator = currentUser?.role === "Coordinator";

    const [tab, setTab] = useState<"learners" | "invitations">("learners");
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingInvitations, setLoadingInvitations] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [modalOpen, setModalOpen] = useState(false);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
    const [revokeTarget, setRevokeTarget] = useState<PendingInvitation | null>(null);
    const [copiedId, setCopiedId] = useState<number | null>(null);
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

    const loadInvitations = async () => {
        if (isCoordinator) return;
        try {
            setLoadingInvitations(true);
            const invites = await getPendingLearnerInvitationsRequest();
            setPendingInvitations(invites);
        } catch (err) {
            console.error("Failed to load pending learner invitations", err);
        } finally {
            setLoadingInvitations(false);
        }
    };

    useEffect(() => {
        void loadUsers();
        if (!isCoordinator) {
            void loadInvitations();
        }
    }, [isCoordinator]);

    const filteredUsers = useMemo(() => {
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

    const filteredInvitations = useMemo(() => {
        if (!search.trim()) return pendingInvitations;
        const q = search.toLowerCase();
        return pendingInvitations.filter((i) => i.email.toLowerCase().includes(q));
    }, [pendingInvitations, search]);

    const handleSaveEdit = async (data: Omit<AdminUser, "id" | "createdAt">) => {
        if (!editingUser) return;
        try {
            const details = data.learnerDetails ?? data.studentDetails;
            const idVal = details?.learnerId ?? details?.studentId ?? "";
            const learnerDetails = details
                ? {
                    ...details,
                    learnerId: idVal,
                    studentId: idVal,
                }
                : undefined;

            await updateUserRequest(editingUser.id, {
                name: data.name,
                email: data.email,
                role: "Learner",
                isActive: data.isActive,
                learnerDetails,
                studentDetails: learnerDetails,
            });

            setSuccessMessage(`Learner "${data.name}" updated successfully.`);
            window.setTimeout(() => setSuccessMessage(null), 5000);
            setEditingUser(null);
            setModalOpen(false);
            await loadUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update learner.");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteUserRequest(deleteTarget.id);
            setDeleteTarget(null);
            setSuccessMessage(`Learner "${deleteTarget.name}" deleted.`);
            window.setTimeout(() => setSuccessMessage(null), 5000);
            await loadUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete learner.");
            setDeleteTarget(null);
        }
    };

    const handleRevoke = async () => {
        if (!revokeTarget) return;
        try {
            await revokeLearnerInvitationRequest(revokeTarget.id);
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

    const learnerColumns = [
        {
            key: "name",
            header: "Learner",
            width: "32%",
            truncate: true,
            render: (u: AdminUser) => {
                const details = u.learnerDetails ?? u.studentDetails;
                const avatar = details?.avatar;
                const bio = details?.shortBio || details?.bio;
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
                                {u.name || "Pending Onboarding"}
                            </p>
                            {bio && (
                                <p className="text-xs text-gray-500 dark:text-slate-400 truncate" title={bio}>
                                    {bio}
                                </p>
                            )}
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
            key: "learnerId",
            header: "Learner ID",
            width: "18%",
            truncate: true,
            render: (u: AdminUser) => {
                const idVal = u.learnerDetails?.learnerId ?? u.studentDetails?.studentId;
                return idVal ? (
                    <span className="font-mono text-xs text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded" title={idVal}>
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
                        title={isCoordinator ? "View learner details" : "Edit learner"}
                        onClick={() => {
                            setEditingUser(u);
                            setModalOpen(true);
                        }}
                        className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400 transition"
                    >
                        {isCoordinator ? <Eye className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                    </button>
                    {!isCoordinator && (
                        <button
                            type="button"
                            title="Delete learner"
                            onClick={() => setDeleteTarget(u)}
                            className="cursor-pointer rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
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
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 shrink-0">
                        <Mail className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{inv.email}</p>
                        <span className="text-[11px] text-gray-400 dark:text-slate-500">Learner Invite</span>
                    </div>
                </div>
            ),
        },
        {
            key: "invitedAt",
            header: "Invited Date & Time",
            width: "25%",
            render: (inv: PendingInvitation) => {
                const formatted = formatDateTime(inv.createdAtUtc);
                return (
                    <div className="text-xs text-gray-600 dark:text-slate-300">
                        <p className="font-medium">{formatted}</p>
                    </div>
                );
            },
        },
        {
            key: "expires",
            header: "Expires Date & Time",
            width: "25%",
            render: (inv: PendingInvitation) => {
                const expDate = new Date(inv.expiresAtUtc);
                const isExpired = expDate.getTime() < Date.now();
                const formattedExpiry = formatDateTime(inv.expiresAtUtc);
                return (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span className={isExpired ? "text-red-500 font-medium" : ""}>
                            {isExpired
                                ? `Expired ${formattedExpiry}`
                                : `Expires ${formattedExpiry}`}
                        </span>
                    </div>
                );
            },
        },
        {
            key: "status",
            header: "Status",
            width: "15%",
            render: (inv: PendingInvitation) => {
                const isExpired = new Date(inv.expiresAtUtc).getTime() < Date.now();
                return (
                    <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isExpired
                                ? "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                        }`}
                    >
                        {isExpired ? "Expired" : "Pending"}
                    </span>
                );
            },
        },
        {
            key: "actions",
            header: "Actions",
            width: "20%",
            className: "text-right",
            render: (inv: PendingInvitation) => (
                <div className="flex items-center justify-end gap-2">
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
                        Learners
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                        Manage enrolled students and send onboarding invitations
                    </p>
                </div>

                {!isCoordinator && (
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setInviteModalOpen(true)}
                            className="flex cursor-pointer items-center gap-2 self-start rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition active:scale-95 sm:self-auto"
                        >
                            <Plus className="h-4 w-4" />
                            Invite Learner
                        </button>
                    </div>
                )}
            </div>

            {/* Tabs Bar */}
            {!isCoordinator && (
                <div className="mt-6 flex border-b border-gray-200 dark:border-slate-800 gap-8">
                    <button
                        type="button"
                        onClick={() => setTab("learners")}
                        className={`relative flex items-center gap-2 py-3 text-sm font-semibold transition ${
                            tab === "learners"
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
                        }`}
                    >
                        <Users className="h-4 w-4" />
                        <span>All Learners</span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                            {users.length}
                        </span>
                        {tab === "learners" && (
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
            )}

            {/* Search and Filters */}
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={
                            tab === "learners"
                                ? "Search by name, email, or learner ID..."
                                : "Search pending invitations by email..."
                        }
                        className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>

                {tab === "learners" && (
                    <div className="w-full sm:w-48">
                        <ModernDropdown
                            value={statusFilter}
                            onChange={(val) => setStatusFilter(val)}
                            options={[
                                { value: "all", label: "All Status" },
                                { value: "active", label: "Active" },
                                { value: "inactive", label: "Inactive" },
                            ]}
                            size="md"
                            placeholder="Filter status"
                            buttonClassName="w-full justify-between"
                        />
                    </div>
                )}
            </div>

            {/* Tab 1: Learners Table */}
            {tab === "learners" && (
                <div className="mt-6">
                    <DataTable<AdminUser>
                        data={filteredUsers}
                        columns={learnerColumns}
                        keyExtractor={(u) => u.id}
                        emptyMessage={
                            search || statusFilter !== "all"
                                ? "No learners match your search criteria."
                                : "No learners enrolled yet. Click \"Invite Learner\" to onboard students."
                        }
                    />
                </div>
            )}

            {/* Tab 2: Pending Invitations Table */}
            {tab === "invitations" && (
                <div className="mt-6">
                    {loadingInvitations ? (
                        <div className="flex h-40 items-center justify-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                        </div>
                    ) : (
                        <DataTable<PendingInvitation>
                            data={filteredInvitations}
                            columns={invitationColumns}
                            keyExtractor={(i) => i.id}
                            emptyMessage={
                                search
                                    ? "No pending invitations match your search."
                                    : "No pending invitations. Click \"Invite Learner\" above to invite a new student."
                            }
                        />
                    )}
                </div>
            )}

            {/* Invite Modal */}
            <InviteLearnerModal
                open={inviteModalOpen}
                onClose={() => setInviteModalOpen(false)}
                onSuccess={async () => {
                    await loadInvitations();
                    setSuccessMessage("Invitation link generated successfully.");
                    window.setTimeout(() => setSuccessMessage(null), 5000);
                }}
            />

            {/* Edit Learner Modal */}
            <LearnerFormModal
                open={modalOpen}
                user={editingUser}
                readOnly={isCoordinator}
                onSave={handleSaveEdit}
                onClose={() => {
                    setModalOpen(false);
                    setEditingUser(null);
                }}
            />

            {/* Revoke Invitation Confirmation */}
            <ConfirmDialog
                open={!!revokeTarget}
                title="Revoke Learner Invitation"
                message={`Are you sure you want to revoke the invitation for "${revokeTarget?.email}"? The invitation link will immediately become invalid.`}
                confirmLabel="Revoke Invitation"
                variant="danger"
                onConfirm={handleRevoke}
                onCancel={() => setRevokeTarget(null)}
            />

            {/* Delete Learner Confirmation */}
            <ConfirmDialog
                open={!!deleteTarget}
                title="Delete Learner"
                message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
