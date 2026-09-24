"use client";

import { useState } from "react";
import {
    Bookmark,
    Check,
    Copy,
    EllipsisVertical,
    ExternalLink,
    FileText,
    MessageSquare,
    Pencil,
    Pin,
    PinOff,
    Share2,
    Trash2,
} from "lucide-react";
import { initialOf } from "@/lib/utils/format";
import { avatarClassFor } from "@/lib/utils/theme";
import type { AnnouncementDto } from "@/types/session";
import type { Announcement } from "@/types";

interface StreamFeedCardProps {
    announcement: AnnouncementDto | (Announcement & { isPinned?: boolean });
    canManage?: boolean;
    onTogglePin?: (id: number, currentPinned: boolean) => void;
    onEdit?: (announcement: AnnouncementDto) => void;
    onDelete?: (announcement: AnnouncementDto) => void;
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

// Simple safe markdown renderer for paragraphs, bold, italic, bullet lists, code blocks, and links
function FormattedPostContent({ text }: { text: string }) {
    if (!text) return null;

    const lines = text.split("\n");
    return (
        <div className="space-y-2 text-[14.5px] leading-relaxed text-slate-700 dark:text-slate-300">
            {lines.map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) {
                    return <div key={idx} className="h-2" />;
                }

                // Bullet point
                if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
                    const bulletText = trimmed.replace(/^[-*•]\s+/, "");
                    return (
                        <div key={idx} className="flex items-start gap-2.5 pl-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                            <span>{renderInlineMarkdown(bulletText)}</span>
                        </div>
                    );
                }

                // Blockquote
                if (trimmed.startsWith("> ")) {
                    return (
                        <blockquote
                            key={idx}
                            className="border-l-3 border-indigo-400 dark:border-indigo-500 pl-3 py-0.5 italic text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/40 rounded-r-md"
                        >
                            {renderInlineMarkdown(trimmed.replace(/^>\s+/, ""))}
                        </blockquote>
                    );
                }

                // Regular line
                return <p key={idx}>{renderInlineMarkdown(trimmed)}</p>;
            })}
        </div>
    );
}

function renderInlineMarkdown(text: string) {
    // Basic regex replacer for bold, italic, inline code, and URLs
    const parts = text.split(/(https?:\/\/[^\s]+|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

    return parts.map((part, index) => {
        if (!part) return null;

        // Bold: **text**
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
            return (
                <strong key={index} className="font-semibold text-slate-900 dark:text-white">
                    {part.slice(2, -2)}
                </strong>
            );
        }

        // Italic: *text*
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
            return <em key={index}>{part.slice(1, -1)}</em>;
        }

        // Inline Code: `code`
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
            return (
                <code
                    key={index}
                    className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-indigo-600 dark:bg-slate-800 dark:text-indigo-300"
                >
                    {part.slice(1, -1)}
                </code>
            );
        }

        // Safe URL: http:// or https://
        if (part.startsWith("http://") || part.startsWith("https://")) {
            return (
                <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 underline font-medium"
                >
                    <span>{part.length > 40 ? part.slice(0, 38) + "..." : part}</span>
                    <ExternalLink className="h-3 w-3 inline-block" />
                </a>
            );
        }

        return <span key={index}>{part}</span>;
    });
}

export function StreamFeedCard({
    announcement,
    canManage = false,
    onTogglePin,
    onEdit,
    onDelete,
}: StreamFeedCardProps) {
    const isApi = "createdAtUtc" in announcement;
    const authorName = isApi ? (announcement.authorName ?? "Instructor") : announcement.author;
    const authorId = isApi ? announcement.authorId : (announcement.id || 1);
    const title = isApi ? announcement.title : "";
    const body = isApi ? announcement.body : announcement.text;
    const isPinned = Boolean(announcement.isPinned);
    const dateString = isApi ? announcement.createdAtUtc : announcement.date;
    const updatedAtUtc = isApi ? announcement.updatedAtUtc : null;
    const attachments = !isApi && announcement.attachments ? announcement.attachments : [];

    const { relative, exact } = formatRelativeTime(dateString);
    const updatedRelative = updatedAtUtc ? formatRelativeTime(updatedAtUtc).relative : null;

    const [menuOpen, setMenuOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopyText = () => {
        const textToCopy = `${title ? `${title}\n\n` : ""}${body}`;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <article
            className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                isPinned
                    ? "border-amber-400/60 bg-gradient-to-b from-amber-50/40 via-white to-white shadow-sm dark:border-amber-500/30 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900"
                    : "border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/90 dark:hover:border-slate-700/80"
            }`}
        >
            {/* Top Pin accent banner */}
            {isPinned && (
                <div className="flex items-center justify-between border-b border-amber-200/60 bg-amber-100/50 px-5 py-2 text-xs font-semibold text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
                    <div className="flex items-center gap-1.5">
                        <Pin className="h-3.5 w-3.5 fill-amber-600 text-amber-600 dark:fill-amber-400 dark:text-amber-400" />
                        <span className="uppercase tracking-wider text-[11px] font-bold">
                            Pinned Broadcast
                        </span>
                    </div>
                    <span className="text-[11px] font-normal text-amber-700/80 dark:text-amber-300/70">
                        Highlighted for everyone
                    </span>
                </div>
            )}

            <div className="p-5 sm:p-6">
                {/* Author & Header Row */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                        <div className="relative">
                            <span
                                className={`flex h-11 w-11 items-center justify-center rounded-full text-base font-semibold text-white shadow-xs ${avatarClassFor(
                                    authorId
                                )}`}
                            >
                                {initialOf(authorName)}
                            </span>
                            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900">
                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                            </span>
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-[15px]">
                                    {authorName}
                                </h3>
                                <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-950/60 dark:text-indigo-300">
                                    Instructor
                                </span>
                            </div>

                            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                <span title={exact} className="cursor-help hover:underline">
                                    {relative}
                                </span>
                                {updatedRelative && (
                                    <span className="text-slate-400 dark:text-slate-500 italic">
                                        • edited {updatedRelative}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={handleCopyText}
                            title="Copy announcement content"
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                            {copied ? (
                                <Check className="h-4 w-4 text-emerald-500" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                        </button>

                        {canManage && isApi && (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setMenuOpen(!menuOpen)}
                                    title="More options"
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                >
                                    <EllipsisVertical className="h-4 w-4" />
                                </button>

                                {menuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-30"
                                            onClick={() => setMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 top-9 z-40 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/95 animate-in fade-in zoom-in-95 duration-100">
                                            {onTogglePin && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onTogglePin(announcement.id, isPinned);
                                                        setMenuOpen(false);
                                                    }}
                                                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/60"
                                                >
                                                    {isPinned ? (
                                                        <>
                                                            <PinOff className="h-4 w-4 text-slate-500" />
                                                            <span>Unpin from top</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Pin className="h-4 w-4 text-amber-500" />
                                                            <span>Pin to top</span>
                                                        </>
                                                    )}
                                                </button>
                                            )}

                                            {onEdit && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onEdit(announcement as AnnouncementDto);
                                                        setMenuOpen(false);
                                                    }}
                                                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/60"
                                                >
                                                    <Pencil className="h-4 w-4 text-slate-500" />
                                                    <span>Edit announcement</span>
                                                </button>
                                            )}

                                            {onDelete && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onDelete(announcement as AnnouncementDto);
                                                        setMenuOpen(false);
                                                    }}
                                                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
                                                >
                                                    <Trash2 className="h-4 w-4 text-rose-500" />
                                                    <span>Delete</span>
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="mt-4">
                    {title && (
                        <h4 className="mb-2.5 text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                            {title}
                        </h4>
                    )}
                    <FormattedPostContent text={body} />
                </div>

                {/* Attachments (if any) */}
                {attachments.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {attachments.map((att) => (
                            <div
                                key={att.id}
                                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition-colors hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-800"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                                        {att.title}
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {att.fileType}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer Bar */}
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400 dark:border-slate-800/80 dark:text-slate-500">
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        {isPinned ? "📌 Pinned Announcement" : "Class Update"}
                    </span>
                    <button
                        type="button"
                        onClick={handleCopyText}
                        className="inline-flex cursor-pointer items-center gap-1.5 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    >
                        <Share2 className="h-3.5 w-3.5" />
                        <span>{copied ? "Copied!" : "Share"}</span>
                    </button>
                </div>
            </div>
        </article>
    );
}
