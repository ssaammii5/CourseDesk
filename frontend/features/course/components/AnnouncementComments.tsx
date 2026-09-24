"use client";

import { useCallback, useRef, useState } from "react";
import {
    ChevronDown,
    ChevronUp,
    CornerDownRight,
    Loader2,
    MessageSquare,
    Send,
    Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { initialOf } from "@/lib/utils/format";
import { avatarClassFor } from "@/lib/utils/theme";
import {
    createAnnouncementCommentRequest,
    deleteAnnouncementCommentRequest,
    getAnnouncementCommentsRequest,
} from "@/lib/api/announcements";
import type { AnnouncementCommentDto } from "@/types/session";

interface AnnouncementCommentsProps {
    announcementId: number;
    initialComments?: AnnouncementCommentDto[];
    isApi?: boolean;
    canManage?: boolean;
}

function formatRelativeTime(isoString?: string | null): { relative: string; exact: string } {
    if (!isoString) return { relative: "Recently", exact: "" };
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return { relative: "Recently", exact: "" };

    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    const exact =
        date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        }) +
        " at " +
        date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
        });

    if (diffSec < 60) return { relative: "Just now", exact };
    if (diffMin < 60) return { relative: `${diffMin}m ago`, exact };
    if (diffHours < 24) return { relative: `${diffHours}h ago`, exact };
    if (diffDays === 1) return { relative: "Yesterday", exact };
    if (diffDays < 7) return { relative: `${diffDays}d ago`, exact };

    return {
        relative: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        exact,
    };
}

export function AnnouncementComments({
    announcementId,
    initialComments = [],
    isApi = true,
    canManage = false,
}: AnnouncementCommentsProps) {
    const { user } = useAuth();
    const [comments, setComments] = useState<AnnouncementCommentDto[]>(initialComments);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [commentText, setCommentText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const refreshComments = useCallback(async () => {
        if (!isApi) return;
        try {
            const data = await getAnnouncementCommentsRequest(announcementId);
            setComments(data);
        } catch {
            // Silently retain current comments if refresh fails
        }
    }, [announcementId, isApi]);

    const toggleExpanded = () => {
        setIsExpanded((prev) => {
            const next = !prev;
            if (next) {
                setTimeout(() => textareaRef.current?.focus(), 60);
            }
            return next;
        });
    };

    const handleAddComment = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = commentText.trim();
        if (!trimmed || isSubmitting) return;

        setIsSubmitting(true);
        setError(null);

        try {
            if (isApi) {
                const newComment = await createAnnouncementCommentRequest(announcementId, trimmed);
                setComments((prev) => [...prev, newComment]);
            } else {
                const mockComment: AnnouncementCommentDto = {
                    id: Date.now(),
                    announcementId,
                    userId: user?.id ?? 1,
                    userName: user?.name ?? "Current User",
                    userRole: user?.role ?? "Learner",
                    content: trimmed,
                    createdAtUtc: new Date().toISOString(),
                };
                setComments((prev) => [...prev, mockComment]);
            }
            setCommentText("");
            setIsExpanded(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to post comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (deletingId) return;
        setDeletingId(commentId);
        setError(null);

        try {
            if (isApi) {
                await deleteAnnouncementCommentRequest(commentId);
            }
            setComments((prev) => prev.filter((c) => c.id !== commentId));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete comment");
        } finally {
            setDeletingId(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void handleAddComment();
        }
    };

    const hasComments = comments.length > 0;

    return (
        <div className="border-t border-slate-100 bg-slate-50/40 dark:border-slate-800/80 dark:bg-slate-900/40">
            {/* Header / Toggle button */}
            <div className="flex items-center justify-between px-4 py-2.5 sm:px-5">
                <button
                    type="button"
                    onClick={toggleExpanded}
                    className="group inline-flex cursor-pointer items-center gap-2 rounded-lg py-1 text-xs font-semibold text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                >
                    <MessageSquare className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-indigo-500 dark:text-slate-500" />
                    <span>
                        {hasComments
                            ? `${comments.length} comment${comments.length === 1 ? "" : "s"}`
                            : (isExpanded ? "Hide comment box" : "Add a comment")}
                    </span>
                    {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                    ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    )}
                </button>
            </div>

            {/* Error banner if any */}
            {error && (
                <div className="mx-4 mb-2.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 sm:mx-5">
                    {error}
                </div>
            )}


            {/* Collapsible Comment Thread */}
            {isExpanded && (
                <div className="space-y-3 px-4 pb-4 sm:px-5 sm:pb-5">
                    {/* Comments List */}
                    {hasComments && (
                        <div className="space-y-2.5 pt-1">
                            {comments.map((comment) => {
                                const authorId = comment.userId || 1;
                                const authorName = comment.userName || "Participant";
                                const isInstructor =
                                    comment.userRole === "Instructor" || comment.userRole === "Admin";
                                const canDelete =
                                    canManage ||
                                    user?.role === "Admin" ||
                                    (user?.id && user.id === comment.userId);
                                const { relative, exact } = formatRelativeTime(comment.createdAtUtc);

                                return (
                                    <div
                                        key={comment.id}
                                        className="group/comment relative flex items-start gap-2.5 rounded-xl bg-white p-2.5 shadow-2xs ring-1 ring-slate-200/60 dark:bg-slate-800/60 dark:ring-slate-700/50"
                                    >
                                        <span
                                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white shadow-2xs ${avatarClassFor(
                                                authorId
                                            )}`}
                                        >
                                            {initialOf(authorName)}
                                        </span>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                                    {authorName}
                                                </span>
                                                {isInstructor && (
                                                    <span className="rounded bg-indigo-50 px-1.5 py-0.2 text-[10px] font-medium text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                                                        Instructor
                                                    </span>
                                                )}
                                                <span
                                                    title={exact}
                                                    className="cursor-help text-[11px] text-slate-400 hover:underline dark:text-slate-500"
                                                >
                                                    {relative}
                                                </span>
                                            </div>

                                            <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                                                {comment.content}
                                            </p>
                                        </div>

                                        {canDelete && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteComment(comment.id)}
                                                disabled={deletingId === comment.id}
                                                title="Delete comment"
                                                className="opacity-0 transition-opacity group-hover/comment:opacity-100 flex h-6 w-6 cursor-pointer items-center justify-center rounded text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 disabled:opacity-50"
                                            >
                                                {deletingId === comment.id ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-3 w-3" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Composer Input */}
                    <form onSubmit={handleAddComment} className="flex items-start gap-2.5 pt-1">
                        <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white shadow-2xs ${avatarClassFor(
                                user?.id ?? 1
                            )}`}
                        >
                            {initialOf(user?.name ?? "Me")}
                        </span>

                        <div className="relative flex-1">
                            <textarea
                                ref={textareaRef}
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={1}
                                placeholder="Add a comment..."
                                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 pr-9 text-xs leading-relaxed text-slate-800 placeholder-slate-400 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-indigo-500/30"
                            />
                            <button
                                type="submit"
                                disabled={!commentText.trim() || isSubmitting}
                                title="Post comment"
                                className="absolute right-1.5 top-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg bg-indigo-600 text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-700 dark:disabled:text-slate-500"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Send className="h-3 w-3" />
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
