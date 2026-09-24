"use client";

import { useState } from "react";
import {
    EllipsisVertical,
    ExternalLink,
    FileText,
    Pencil,
    Pin,
    PinOff,
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

// Simple safe markdown renderer
function FormattedPostContent({ text }: { text: string }) {
    if (!text) return null;

    const lines = text.split("\n");
    return (
        <div className="space-y-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {lines.map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) {
                    return <div key={idx} className="h-1.5" />;
                }

                // Bullet point
                if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
                    const bulletText = trimmed.replace(/^[-*•]\s+/, "");
                    return (
                        <div key={idx} className="flex items-start gap-2 pl-1.5">
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
                            className="border-l-2 border-indigo-400 dark:border-indigo-500 pl-2.5 py-0.5 italic text-slate-600 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-800/40 rounded-r-md text-[13.5px]"
                        >
                            {renderInlineMarkdown(trimmed.replace(/^>\s+/, ""))}
                        </blockquote>
                    );
                }

                return <p key={idx}>{renderInlineMarkdown(trimmed)}</p>;
            })}
        </div>
    );
}

function renderInlineMarkdown(text: string) {
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
                    className="rounded bg-slate-100 px-1 py-0.5 text-xs font-mono text-indigo-600 dark:bg-slate-800 dark:text-indigo-300"
                >
                    {part.slice(1, -1)}
                </code>
            );
        }

        // Safe URL
        if (part.startsWith("http://") || part.startsWith("https://")) {
            return (
                <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 underline font-medium"
                >
                    <span>{part.length > 36 ? part.slice(0, 34) + "..." : part}</span>
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
    const { relative: updatedRelative, exact: updatedExact } = formatRelativeTime(updatedAtUtc);
    const isEdited = Boolean(
        updatedAtUtc &&
        (!dateString || Math.abs(new Date(updatedAtUtc).getTime() - new Date(dateString).getTime()) > 1000)
    );

    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <article
            className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 ${
                isPinned
                    ? "border-amber-300/80 bg-gradient-to-r from-amber-50/20 via-white to-white dark:border-amber-500/30 dark:from-amber-950/10 dark:via-slate-900 dark:to-slate-900 border-l-4 border-l-amber-500 shadow-2xs"
                    : "border-slate-200/90 bg-white hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900/90 dark:hover:border-slate-700/80 shadow-2xs"
            }`}
        >
            <div className="p-4 sm:p-5">
                {/* Header: Author + Meta on left, Actions on right */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span
                            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white shadow-2xs ${avatarClassFor(
                                authorId
                            )}`}
                        >
                            {initialOf(authorName)}
                        </span>

                        <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                                    {authorName}
                                </h3>
                                <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.2 text-[10.5px] font-medium text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-950/60 dark:text-indigo-300">
                                    Instructor
                                </span>
                                {isPinned && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.2 text-[10.5px] font-semibold text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/60 dark:text-amber-300">
                                        <Pin className="h-2.5 w-2.5 fill-current" />
                                        <span>Pinned</span>
                                    </span>
                                )}
                            </div>

                            <p className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-slate-500 dark:text-slate-400">
                                <span title={exact} className="cursor-help hover:underline">
                                    {relative}
                                </span>
                                {isEdited && (
                                    <>
                                        <span className="text-slate-300 dark:text-slate-600">•</span>
                                        <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500">
                                            <span>edited</span>
                                            <span
                                                title={`Edited ${updatedExact}`}
                                                className="cursor-help hover:underline text-slate-500 dark:text-slate-400"
                                            >
                                                {updatedRelative}
                                            </span>
                                        </span>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Actions Menu */}
                    {canManage && isApi && (
                        <div className="flex items-center gap-1">
                            <div className="relative">
                            <button
                                type="button"
                                onClick={() => setMenuOpen(!menuOpen)}
                                title="More options"
                                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            >
                                <EllipsisVertical className="h-3.5 w-3.5" />
                            </button>

                                {menuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-30"
                                            onClick={() => setMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 top-8 z-40 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/95 animate-in fade-in zoom-in-95 duration-100">
                                            {onTogglePin && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onTogglePin(announcement.id, isPinned);
                                                        setMenuOpen(false);
                                                    }}
                                                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/60"
                                                >
                                                    {isPinned ? (
                                                        <>
                                                            <PinOff className="h-3.5 w-3.5 text-slate-500" />
                                                            <span>Unpin</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Pin className="h-3.5 w-3.5 text-amber-500" />
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
                                                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/60"
                                                >
                                                    <Pencil className="h-3.5 w-3.5 text-slate-500" />
                                                    <span>Edit</span>
                                                </button>
                                            )}

                                            {onDelete && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onDelete(announcement as AnnouncementDto);
                                                        setMenuOpen(false);
                                                    }}
                                                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                                    <span>Delete</span>
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="mt-3">
                    {title && (
                        <h4 className="mb-1.5 text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                            {title}
                        </h4>
                    )}
                    <FormattedPostContent text={body} />
                </div>

                {/* Attachments (if any) */}
                {attachments.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {attachments.map((att) => (
                            <div
                                key={att.id}
                                className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 transition-colors hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-800"
                            >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                                        {att.title}
                                    </p>
                                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                                        {att.fileType}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </article>
    );
}
