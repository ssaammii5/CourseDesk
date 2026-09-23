"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
    Loader2,
    MessageSquare,
    Send,
    Trash2,
    User,
    UserRound,
    UsersRound,
} from "lucide-react";
import {
    createAssignmentCommentRequest,
    deleteCommentRequest,
    getAssignmentCommentsRequest,
    type CommentDto,
} from "@/lib/api/comments";
import { useAuth } from "@/hooks";
import { initialOf } from "@/lib/utils/format";

export interface AssignmentCommentsProps {
    assignmentId: number;
    isPrivate?: boolean;
    learnerId?: number | null;
    privateCommentTarget?: string;
    compact?: boolean;
    showTitle?: boolean;
}

function formatCommentDate(iso: string): string {
    try {
        const d = new Date(iso);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHours = Math.floor(diffMin / 60);

        if (diffSec < 60) return "Just now";
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffHours < 24 && now.getDate() === d.getDate()) {
            return `Today at ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
        }
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    } catch {
        return iso;
    }
}

function getAvatarColor(name: string): string {
    const colors = [
        "bg-blue-600 text-white",
        "bg-emerald-600 text-white",
        "bg-indigo-600 text-white",
        "bg-purple-600 text-white",
        "bg-rose-600 text-white",
        "bg-amber-600 text-white",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

export function AssignmentComments({
    assignmentId,
    isPrivate = false,
    learnerId,
    privateCommentTarget = "Instructor",
    compact = false,
    showTitle = true,
}: AssignmentCommentsProps) {
    const { user } = useAuth();
    const [comments, setComments] = useState<CommentDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [text, setText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const commentsContainerRef = useRef<HTMLDivElement>(null);
    const uniqueInputId = useId();

    const loadComments = useCallback(async () => {
        try {
            setError(null);
            const data = await getAssignmentCommentsRequest(
                assignmentId,
                isPrivate,
                learnerId
            );
            setComments(data);
        } catch {
            setError("Unable to load comments.");
        } finally {
            setLoading(false);
        }
    }, [assignmentId, isPrivate, learnerId]);

    useEffect(() => {
        void loadComments();
    }, [loadComments]);

    // Auto-scroll to the bottom of the conversation when new comments load or are posted
    useEffect(() => {
        if (comments.length > 0 && commentsContainerRef.current) {
            commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
        }
    }, [comments.length]);

    const handleSubmit = async () => {
        const trimmed = text.trim();
        if (!trimmed || submitting) return;

        try {
            setSubmitting(true);
            setError(null);
            const newComment = await createAssignmentCommentRequest(assignmentId, {
                content: trimmed,
                isPrivate,
                learnerId: isPrivate ? learnerId : undefined,
            });
            setComments((prev) => [...prev, newComment]);
            setText("");
            setIsExpanded(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to post comment.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (commentId: number) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;
        try {
            setDeletingId(commentId);
            await deleteCommentRequest(commentId);
            setComments((prev) => prev.filter((c) => c.id !== commentId));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete comment.");
        } finally {
            setDeletingId(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            void handleSubmit();
        }
    };

    const canDeleteComment = (c: CommentDto) => {
        if (!user) return false;
        if (c.userId === user.id) return true;
        if (user.role === "Admin" || user.role === "Instructor") return true;
        return false;
    };

    const targetLabel = isPrivate ? privateCommentTarget : "Class";

    return (
        <div className={`flex flex-col ${compact ? "gap-2.5 text-xs" : "gap-4 text-sm"}`}>
            {/* Header */}
            {showTitle && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-gray-800">
                        {isPrivate ? (
                            <UserRound className={compact ? "h-4 w-4 text-gray-600" : "h-5 w-5 text-gray-700"} />
                        ) : (
                            <UsersRound className={compact ? "h-4 w-4 text-gray-600" : "h-5 w-5 text-gray-700"} />
                        )}
                        <span className={`font-medium ${compact ? "text-xs" : "text-sm text-gray-900"}`}>
                            {isPrivate ? "Private comments" : "Class comments"}
                        </span>
                        {comments.length > 0 && (
                            <span className="rounded-full bg-gray-200/80 px-2 py-0.5 text-xs font-semibold text-gray-700">
                                {comments.length}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {error && (
                <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700">
                    {error}
                </div>
            )}

            {/* Comments List */}
            {loading ? (
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
            ) : comments.length === 0 ? (
                <div className={`rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-3 text-center text-gray-500 ${compact ? "py-2 text-[11px]" : "py-4 text-xs"}`}>
                    {isPrivate
                        ? "No private comments yet. Only you and your instructor see these."
                        : "No class comments yet. Start a discussion with your class."}
                </div>
            ) : (
                <div
                    ref={commentsContainerRef}
                    className={`space-y-2.5 ${
                        isPrivate
                            ? "max-h-64 sm:max-h-80 overflow-y-auto overscroll-contain pr-1.5 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]"
                            : compact
                            ? "max-h-60 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]"
                            : ""
                    }`}
                >
                    {comments.map((c) => {
                        const isAuthor = user?.id === c.userId;
                        const isInstructor = c.userRole === "Instructor" || c.userRole === "Teacher";
                        const isAdmin = c.userRole === "Admin";
                        const authorInitial = initialOf(c.userName || "U");

                        return (
                            <div
                                key={c.id}
                                className={`group flex gap-3 rounded-lg transition-colors ${
                                    isPrivate
                                        ? "bg-white/85 p-2.5 border border-gray-200/70 shadow-2xs hover:bg-white"
                                        : compact
                                        ? "p-2 hover:bg-gray-100/60"
                                        : "p-2.5 hover:bg-gray-50/80"
                                }`}
                            >
                                <div
                                    className={`flex shrink-0 items-center justify-center rounded-full font-medium ${compact ? "h-7 w-7 text-xs" : "h-8 w-8 text-xs"} ${getAvatarColor(c.userName || "User")}`}
                                    aria-hidden="true"
                                >
                                    {authorInitial}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="font-semibold text-gray-900">
                                                {c.userName || "User"}
                                            </span>
                                            {isInstructor && (
                                                <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                                                    Instructor
                                                </span>
                                            )}
                                            {isAdmin && (
                                                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                                                    Admin
                                                </span>
                                            )}
                                            <span className="text-[11px] text-gray-400">
                                                • {formatCommentDate(c.createdAtUtc)}
                                            </span>
                                        </div>

                                        {canDeleteComment(c) && (
                                            <button
                                                type="button"
                                                title="Delete comment"
                                                disabled={deletingId === c.id}
                                                onClick={() => handleDelete(c.id)}
                                                className="cursor-pointer text-gray-400 opacity-0 transition-opacity hover:text-red-600 focus:opacity-100 group-hover:opacity-100 disabled:cursor-not-allowed"
                                            >
                                                {deletingId === c.id ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    <p className="mt-1 whitespace-pre-wrap break-words text-gray-700 leading-relaxed">
                                        {c.content}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Comment Input Form */}
            <div className="mt-1">
                {!isExpanded ? (
                    <button
                        type="button"
                        onClick={() => {
                            setIsExpanded(true);
                            setTimeout(() => textareaRef.current?.focus(), 50);
                        }}
                        className={`flex w-full cursor-pointer items-center gap-2.5 rounded-full border border-gray-300 bg-white text-gray-500 transition-all hover:border-gray-400 hover:bg-gray-50/70 hover:shadow-xs focus:border-[#1a73e8] focus:outline-none ${compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"}`}
                    >
                        <div
                            className={`flex shrink-0 items-center justify-center rounded-full ${compact ? "h-5 w-5 text-[10px]" : "h-6 w-6 text-xs"} ${getAvatarColor(user?.name || "Me")}`}
                        >
                            {initialOf(user?.name || "M")}
                        </div>
                        <span className="truncate text-left text-gray-500">
                            {isPrivate
                                ? `Add private comment to ${targetLabel}…`
                                : "Add class comment…"}
                        </span>
                    </button>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-xs focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8]/20 transition-all">
                        <textarea
                            id={uniqueInputId}
                            ref={textareaRef}
                            rows={compact ? 2 : 3}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                isPrivate
                                    ? `Add private comment to ${targetLabel}…`
                                    : "Add class comment…"
                            }
                            className={`w-full resize-none border-0 bg-transparent p-3 text-gray-900 placeholder:text-gray-400 focus:outline-none ${compact ? "text-xs" : "text-sm"}`}
                        />
                        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/60 px-3 py-2">
                            <span className="text-[10px] text-gray-400">
                                Ctrl+Enter to send
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsExpanded(false);
                                        setText("");
                                    }}
                                    disabled={submitting}
                                    className="cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200/60 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleSubmit()}
                                    disabled={!text.trim() || submitting}
                                    className="flex cursor-pointer items-center gap-1.5 rounded-md bg-[#1a73e8] px-3 py-1 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#1557b0] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Send className="h-3.5 w-3.5" />
                                    )}
                                    <span>Post</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
