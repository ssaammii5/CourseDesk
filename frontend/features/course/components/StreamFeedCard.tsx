"use client";

import { useState } from "react";
import {
    Download,
    EllipsisVertical,
    ExternalLink,
    FileText,
    Globe,
    Image as ImageIcon,
    Pencil,
    Pin,
    PinOff,
    Trash2,
} from "lucide-react";
import { initialOf } from "@/lib/utils/format";
import { avatarClassFor } from "@/lib/utils/theme";
import type { AnnouncementDto } from "@/types/session";
import type { Announcement } from "@/types";
import { AnnouncementComments } from "./AnnouncementComments";

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

const ALLOWED_TAGS = new Set([
    "h1", "h2", "h3", "h4", "p", "strong", "b", "em", "i", "u", "s", "del", "strike",
    "mark", "blockquote", "pre", "code", "ul", "ol", "li", "hr", "a", "span", "div", "br",
]);

function isSafeUrl(url: string): boolean {
    const trimmed = url.trim().toLowerCase();
    return (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("mailto:")
    );
}

function domNodeToReact(node: Node, key: string | number): React.ReactNode {
    if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return null;
    }

    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();

    const childNodes = Array.from(element.childNodes);
    const children = childNodes.map((child, idx) => domNodeToReact(child, `${key}-${idx}`));

    if (!ALLOWED_TAGS.has(tagName)) {
        return <span key={key}>{children}</span>;
    }

    switch (tagName) {
        case "h1":
            return (
                <h3 key={key} className="mt-3 mb-1 text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {children}
                </h3>
            );
        case "h2":
            return (
                <h4 key={key} className="mt-2.5 mb-1 text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {children}
                </h4>
            );
        case "h3":
        case "h4":
            return (
                <h5 key={key} className="mt-2 mb-0.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {children}
                </h5>
            );
        case "p":
            return (
                <p key={key} className="my-1 leading-relaxed">
                    {children}
                </p>
            );
        case "strong":
        case "b":
            return (
                <strong key={key} className="font-semibold text-slate-900 dark:text-white">
                    {children}
                </strong>
            );
        case "em":
        case "i":
            return (
                <em key={key} className="italic">
                    {children}
                </em>
            );
        case "u":
            return (
                <span key={key} className="underline underline-offset-2">
                    {children}
                </span>
            );
        case "s":
        case "del":
        case "strike":
            return (
                <s key={key} className="line-through text-slate-400 dark:text-slate-500">
                    {children}
                </s>
            );
        case "mark":
            return (
                <mark key={key} className="rounded bg-amber-100 px-1 py-0.5 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
                    {children}
                </mark>
            );
        case "blockquote":
            return (
                <blockquote
                    key={key}
                    className="my-1.5 rounded-r-md border-l-3 border-indigo-400 bg-slate-50/70 py-1 pl-3 italic text-slate-600 dark:border-indigo-500 dark:bg-slate-800/40 dark:text-slate-300 text-xs sm:text-sm"
                >
                    {children}
                </blockquote>
            );
        case "pre":
            return (
                <pre
                    key={key}
                    className="my-2.5 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-3 font-mono text-xs text-slate-200"
                >
                    {children}
                </pre>
            );
        case "code":
            return (
                <code
                    key={key}
                    className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-indigo-600 dark:bg-slate-800 dark:text-indigo-300"
                >
                    {children}
                </code>
            );
        case "ul":
            return (
                <ul key={key} className="my-1.5 list-disc space-y-0.5 pl-5">
                    {children}
                </ul>
            );
        case "ol":
            return (
                <ol key={key} className="my-1.5 list-decimal space-y-0.5 pl-5">
                    {children}
                </ol>
            );
        case "li":
            return (
                <li key={key} className="leading-relaxed">
                    {children}
                </li>
            );
        case "hr":
            return <hr key={key} className="my-2.5 border-slate-200 dark:border-slate-800" />;
        case "br":
            return <br key={key} />;
        case "a": {
            const rawHref = element.getAttribute("href") || "";
            const safeHref = isSafeUrl(rawHref) ? rawHref : "#";
            return (
                <a
                    key={key}
                    href={safeHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 font-medium text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                    <span>{children}</span>
                    <ExternalLink className="inline-block h-3 w-3" />
                </a>
            );
        }
        case "div":
        case "span":
        default:
            return <span key={key}>{children}</span>;
    }
}

// Simple safe rich content renderer (supports both WYSIWYG HTML and markdown)
function FormattedPostContent({ text }: { text: string }) {
    if (!text) return null;

    // Check if content is HTML from the WYSIWYG editor
    if (typeof window !== "undefined" && /<[a-z][\s\S]*>/i.test(text)) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "text/html");
            const bodyChildren = Array.from(doc.body.childNodes);
            return (
                <div className="space-y-0.5 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {bodyChildren.map((node, idx) => domNodeToReact(node, `html-${idx}`))}
                </div>
            );
        } catch {
            // Fallback to text lines below if parsing fails
        }
    }

    const lines = text.split("\n");
    let inCodeBlock = false;
    let codeBlockLines: string[] = [];

    const elements: React.ReactNode[] = [];

    lines.forEach((line, idx) => {
        if (line.trim().startsWith("```")) {
            if (inCodeBlock) {
                elements.push(
                    <pre
                        key={`code-${idx}`}
                        className="my-2.5 overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-xs text-slate-200 border border-slate-800"
                    >
                        <code>{codeBlockLines.join("\n")}</code>
                    </pre>
                );
                codeBlockLines = [];
                inCodeBlock = false;
            } else {
                inCodeBlock = true;
            }
            return;
        }

        if (inCodeBlock) {
            codeBlockLines.push(line);
            return;
        }

        const trimmed = line.trim();
        if (!trimmed) {
            elements.push(<div key={`sp-${idx}`} className="h-1.5" />);
            return;
        }

        if (trimmed === "---" || trimmed === "***") {
            elements.push(<hr key={`hr-${idx}`} className="my-2.5 border-slate-200 dark:border-slate-800" />);
            return;
        }

        if (trimmed.startsWith("# ")) {
            elements.push(
                <h2 key={idx} className="mt-2 mb-0.5 text-base font-bold text-slate-900 dark:text-slate-100">
                    {renderInlineMarkdown(trimmed.slice(2))}
                </h2>
            );
            return;
        }
        if (trimmed.startsWith("## ")) {
            elements.push(
                <h3 key={idx} className="mt-2 mb-0.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {renderInlineMarkdown(trimmed.slice(3))}
                </h3>
            );
            return;
        }
        if (trimmed.startsWith("### ")) {
            elements.push(
                <h4 key={idx} className="mt-1.5 mb-0.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                    {renderInlineMarkdown(trimmed.slice(4))}
                </h4>
            );
            return;
        }

        if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
            const bulletText = trimmed.replace(/^[-*•]\s+/, "");
            return elements.push(
                <div key={idx} className="flex items-start gap-2 pl-1.5 my-0.5">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                    <span>{renderInlineMarkdown(bulletText)}</span>
                </div>
            );
        }

        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
            return elements.push(
                <div key={idx} className="flex items-start gap-2 pl-1.5 my-0.5">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">
                        {numMatch[1]}.
                    </span>
                    <span>{renderInlineMarkdown(numMatch[2])}</span>
                </div>
            );
        }

        if (trimmed.startsWith("> ")) {
            return elements.push(
                <blockquote
                    key={idx}
                    className="border-l-3 border-indigo-400 dark:border-indigo-500 pl-2.5 py-0.5 my-1 italic text-slate-600 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-800/40 rounded-r-md text-[13.5px]"
                >
                    {renderInlineMarkdown(trimmed.replace(/^>\s+/, ""))}
                </blockquote>
            );
        }

        elements.push(<p key={idx} className="my-0.5 leading-relaxed">{renderInlineMarkdown(trimmed)}</p>);
    });

    if (inCodeBlock && codeBlockLines.length > 0) {
        elements.push(
            <pre
                key="code-unclosed"
                className="my-2.5 overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-xs text-slate-200 border border-slate-800"
            >
                <code>{codeBlockLines.join("\n")}</code>
            </pre>
        );
    }

    return (
        <div className="space-y-0.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {elements}
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
    const apiAttachments = isApi ? (announcement as AnnouncementDto).attachments || [] : [];
    const mockAttachments = !isApi && announcement.attachments ? announcement.attachments : [];
    const attachments = [
        ...apiAttachments.map((a) => ({
            id: a.id,
            title: a.fileName,
            fileType: a.fileType || a.kind,
            fileSize: a.fileSize || "—",
            url: a.url,
            kind: a.kind,
        })),
        ...mockAttachments.map((a) => ({
            id: a.id,
            title: a.title,
            fileType: a.fileType,
            fileSize: "—",
            url: "url" in a ? ((a as Record<string, unknown>).url as string) : undefined,
            kind: a.fileType?.toLowerCase() === "link" ? "link" : "file",
        })),
    ];


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
                    <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {attachments.map((att) => {
                            const isLink = att.kind === "link" || att.fileType?.toLowerCase() === "link";
                            const isImage =
                                !isLink &&
                                (att.fileType?.toLowerCase().includes("png") ||
                                    att.fileType?.toLowerCase().includes("jpg") ||
                                    att.fileType?.toLowerCase().includes("jpeg") ||
                                    att.fileType?.toLowerCase().includes("webp") ||
                                    att.fileType?.toLowerCase().includes("svg"));

                            return (
                                <a
                                    key={att.id}
                                    href={att.url || "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download={!isLink && Boolean(att.url)}
                                    className="group/att flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3 transition-all hover:bg-white hover:border-indigo-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 dark:hover:border-indigo-700/60"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100/70 text-indigo-600 transition-colors group-hover/att:bg-indigo-600 group-hover/att:text-white dark:bg-indigo-950/70 dark:text-indigo-400">
                                            {isLink ? (
                                                <Globe className="h-5 w-5" />
                                            ) : isImage ? (
                                                <ImageIcon className="h-5 w-5" />
                                            ) : (
                                                <FileText className="h-5 w-5" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover/att:text-indigo-600 dark:group-hover/att:text-indigo-400 transition-colors">
                                                {att.title}
                                            </p>
                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                                <span className="font-semibold uppercase text-indigo-600 dark:text-indigo-400">
                                                    {att.fileType}
                                                </span>
                                                {att.fileSize && att.fileSize !== "—" && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{att.fileSize}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="shrink-0 text-slate-400 group-hover/att:text-indigo-600 dark:group-hover/att:text-indigo-400 transition-colors">
                                        {isLink ? (
                                            <ExternalLink className="h-4 w-4" />
                                        ) : (
                                            <Download className="h-4 w-4" />
                                        )}
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Comments below announcement card */}
            <AnnouncementComments
                announcementId={announcement.id}
                initialComments={isApi ? (announcement as AnnouncementDto).comments : []}
                isApi={isApi}
                canManage={canManage}
            />
        </article>
    );
}
