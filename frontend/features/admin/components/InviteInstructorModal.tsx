"use client";

import { useState } from "react";
import { Mail, Check, Copy, X, Loader2, Send } from "lucide-react";
import { inviteInstructorRequest, type PendingInvitation } from "@/lib/api/users";

interface InviteInstructorModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (invitation: PendingInvitation, inviteLink: string) => void;
}

export function InviteInstructorModal({ open, onClose, onSuccess }: InviteInstructorModalProps) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdInvite, setCreatedInvite] = useState<{ invitation: PendingInvitation; link: string } | null>(null);
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
            const invitation = await inviteInstructorRequest(trimmed);
            const token = invitation.inviteToken || "";
            const link = `${window.location.origin}/set-password?token=${token}`;
            setCreatedInvite({ invitation, link });
            onSuccess(invitation, link);
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
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100 dark:border-slate-800 dark:bg-slate-900">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                            <Mail className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                                Invite Instructor
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                Send an invite link for an instructor to onboard themselves
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleModalClose}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {createdInvite ? (
                        <div className="space-y-5 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                                <Check className="h-7 w-7" />
                            </div>

                            <div>
                                <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">
                                    Invitation Generated!
                                </h3>
                                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
                                    Invitation for <strong className="text-gray-900 dark:text-slate-200">{createdInvite.invitation.email}</strong> is ready. You can share the link below with them directly.
                                </p>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-left dark:border-slate-800 dark:bg-slate-800/60">
                                <label className="text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                    Invitation Link (Valid for 7 days)
                                </label>
                                <div className="mt-1 flex items-center gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={createdInvite.link}
                                        className="w-full bg-transparent text-xs text-gray-700 dark:text-slate-200 font-mono focus:outline-none select-all truncate"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        className="shrink-0 flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 shadow-sm border border-gray-200 hover:bg-blue-50 dark:bg-slate-900 dark:border-slate-700 dark:text-blue-400 dark:hover:bg-slate-800 transition"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                <span>Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-3.5 w-3.5" />
                                                <span>Copy</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleModalClose}
                                    className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                                    Instructor Email <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setError(null);
                                        }}
                                        placeholder="e.g. instructor@university.edu"
                                        className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                                        autoFocus
                                    />
                                </div>
                                {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
                            </div>

                            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-xs text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
                                <p className="font-semibold mb-1">What happens next?</p>
                                <p className="text-blue-700/90 dark:text-blue-400">
                                    The instructor will receive or use the invitation link to choose their password and complete their profile (Name, Headline, Timezone, and Links). You can manage or revoke pending invitations anytime.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleModalClose}
                                    className="rounded-xl border border-gray-300 dark:border-slate-700 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 shadow-md shadow-blue-600/20 transition active:scale-95"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Creating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4" />
                                            <span>Create Invitation</span>
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
