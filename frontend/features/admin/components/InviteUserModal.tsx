"use client";

import { useState } from "react";
import { Mail, Check, Copy, X, Loader2, Send, GraduationCap, Users, UserCheck } from "lucide-react";
import {
    inviteLearnerRequest,
    inviteInstructorRequest,
    inviteCoordinatorRequest,
    type PendingInvitation,
} from "@/lib/api/users";

interface InviteUserModalProps {
    open: boolean;
    isCoordinator?: boolean;
    onClose: () => void;
    onSuccess: (invitation: PendingInvitation, inviteLink: string, role: string) => void;
}

type UserRoleOption = "Learner" | "Instructor" | "Coordinator";

export function InviteUserModal({ open, isCoordinator, onClose, onSuccess }: InviteUserModalProps) {
    const [selectedRole, setSelectedRole] = useState<UserRoleOption>("Learner");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdInvite, setCreatedInvite] = useState<{
        invitation: PendingInvitation;
        link: string;
        role: UserRoleOption;
    } | null>(null);
    const [copied, setCopied] = useState(false);

    if (!open) return null;

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = email.trim();
        if (!trimmed) {
            setError("Email address is required.");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            setError("Please enter a valid email address.");
            return;
        }

        setError(null);
        setLoading(true);
        try {
            let invitation: PendingInvitation;
            if (selectedRole === "Instructor") {
                invitation = await inviteInstructorRequest(trimmed);
            } else if (selectedRole === "Coordinator") {
                invitation = await inviteCoordinatorRequest(trimmed);
            } else {
                invitation = await inviteLearnerRequest(trimmed);
            }

            const token = invitation.inviteToken || "";
            const link = `${window.location.origin}/set-password?token=${token}`;
            setCreatedInvite({ invitation, link, role: selectedRole });
            onSuccess(invitation, link, selectedRole);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to send invitation.");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!createdInvite) return;
        try {
            await navigator.clipboard.writeText(createdInvite.link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            // fallback
        }
    };

    const handleModalClose = () => {
        setEmail("");
        setError(null);
        setCreatedInvite(null);
        setCopied(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                            <Mail className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                Invite Platform User
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Send an onboarding invite link to join CourseDesk
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleModalClose}
                        className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {createdInvite ? (
                        <div className="space-y-5 animate-in fade-in">
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                                <div className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                                        Invitation Created for {createdInvite.invitation.email}
                                    </p>
                                </div>
                                <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                                    Role: <span className="font-semibold">{createdInvite.role}</span>. Share the link below to let them set their password.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Direct Invitation Link
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={createdInvite.link}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 active:scale-95 shrink-0"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="h-4 w-4" />
                                                <span>Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-4 w-4" />
                                                <span>Copy</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCreatedInvite(null);
                                        setEmail("");
                                    }}
                                    className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    Invite Another
                                </button>
                                <button
                                    type="button"
                                    onClick={handleModalClose}
                                    className="cursor-pointer rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleInvite} className="space-y-5">
                            {error && (
                                <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                                    {error}
                                </div>
                            )}

                            {/* Role Selector */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Select User Role
                                </label>
                                <div className={`grid gap-2.5 ${!isCoordinator ? "grid-cols-3" : "grid-cols-2"}`}>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedRole("Learner")}
                                        className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                                            selectedRole === "Learner"
                                                ? "border-emerald-500 bg-emerald-50/70 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-200 shadow-xs"
                                                : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                        }`}
                                    >
                                        <GraduationCap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                        <span className="text-xs font-semibold">Learner</span>
                                        <span className="text-[10px] text-slate-400">Student</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedRole("Instructor")}
                                        className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                                            selectedRole === "Instructor"
                                                ? "border-blue-500 bg-blue-50/70 text-blue-900 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-200 shadow-xs"
                                                : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                        }`}
                                    >
                                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        <span className="text-xs font-semibold">Instructor</span>
                                        <span className="text-[10px] text-slate-400">Faculty</span>
                                    </button>

                                    {!isCoordinator && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedRole("Coordinator")}
                                            className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                                                selectedRole === "Coordinator"
                                                    ? "border-purple-500 bg-purple-50/70 text-purple-900 dark:border-purple-500 dark:bg-purple-950/40 dark:text-purple-200 shadow-xs"
                                                    : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                            }`}
                                        >
                                            <UserCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                            <span className="text-xs font-semibold">Coordinator</span>
                                            <span className="text-[10px] text-slate-400">Academic</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Email Input */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Email Address <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter email"
                                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    />
                                </div>
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={handleModalClose}
                                    className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Sending Invite...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4" />
                                            <span>Send Invitation</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
