"use client";

import React, { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
    Bold,
    Check,
    Code,
    Eraser,
    ExternalLink,
    FileText,
    Globe,
    Heading1,
    Heading2,
    Heading3,
    Highlighter,
    Image as ImageIcon,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Loader2,
    Minus,
    Paperclip,
    Pin,
    Quote,
    Redo,
    Sparkles,
    Strikethrough,
    Trash2,
    Underline,
    Undo,
    UploadCloud,
    X,
} from "lucide-react";
import type { AnnouncementAttachmentDto, AnnouncementDto } from "@/types/session";

export interface DraftAttachment {
    id: string;
    title: string;
    kind: "file" | "link";
    fileType: string;
    fileSize: string;
    url?: string;
    file?: File;
    existingId?: number;
}

export interface AnnouncementFormData {
    title: string;
    body: string;
    isPinned: boolean;
    attachments: DraftAttachment[];
    removedAttachmentIds?: number[];
}

interface AnnouncementFormModalProps {
    open: boolean;
    initialData?: AnnouncementDto | {
        id?: number;
        title: string;
        body: string;
        isPinned: boolean;
        attachments?: AnnouncementAttachmentDto[];
    } | null;
    onClose: () => void;
    onSubmit: (data: AnnouncementFormData) => Promise<void> | void;
    onDelete?: () => void;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileExtension(name: string): string {
    const ext = name.split(".").pop();
    return ext ? ext.toUpperCase() : "FILE";
}

/**
 * Converts initial plain text or markdown to simple HTML for the contentEditable area if needed
 */
function normalizeContentToHtml(content: string): string {
    if (!content) return "";
    // If it already contains HTML tags, return as-is
    if (/<[a-z][\s\S]*>/i.test(content)) {
        return content;
    }
    // Otherwise convert basic markdown or line breaks to HTML
    const lines = content.split("\n");
    return lines
        .map((line) => {
            const trimmed = line.trim();
            if (!trimmed) return "<p><br></p>";
            if (trimmed.startsWith("# ")) return `<h1>${trimmed.slice(2)}</h1>`;
            if (trimmed.startsWith("## ")) return `<h2>${trimmed.slice(3)}</h2>`;
            if (trimmed.startsWith("### ")) return `<h3>${trimmed.slice(4)}</h3>`;
            if (trimmed.startsWith("> ")) return `<blockquote>${trimmed.slice(2)}</blockquote>`;
            if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) return `<ul><li>${trimmed.slice(2)}</li></ul>`;
            
            let formatted = line
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\*(.*?)\*/g, "<em>$1</em>")
                .replace(/`(.*?)`/g, "<code>$1</code>")
                .replace(/\[(.*?)\]\((https?:\/\/.*?)\)/g, '<a href="$2">$1</a>');
            return `<p>${formatted}</p>`;
        })
        .join("");
}

export function AnnouncementFormModal({
    open,
    initialData,
    onClose,
    onSubmit,
    onDelete,
}: AnnouncementFormModalProps) {
    const [title, setTitle] = useState("");
    const [isPinned, setIsPinned] = useState(false);
    const [attachments, setAttachments] = useState<DraftAttachment[]>([]);
    const [removedAttachmentIds, setRemovedAttachmentIds] = useState<number[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Live word and char counts
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);

    // Active formatting states (for Google Docs style toolbar button highlighting)
    const [activeFormats, setActiveFormats] = useState({
        bold: false,
        italic: false,
        underline: false,
        strike: false,
        unorderedList: false,
        orderedList: false,
        h1: false,
        h2: false,
        h3: false,
        blockquote: false,
    });

    // Link insertion popover state
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [linkText, setLinkText] = useState("");

    // External resource link attachment dialog state
    const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
    const [resourceUrl, setResourceUrl] = useState("");
    const [resourceTitle, setResourceTitle] = useState("");

    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Update active toolbar format indicators
    const checkActiveFormats = () => {
        if (typeof document === "undefined") return;
        try {
            const formatBlockValue = (document.queryCommandValue("formatBlock") || "").toLowerCase();
            setActiveFormats({
                bold: document.queryCommandState("bold"),
                italic: document.queryCommandState("italic"),
                underline: document.queryCommandState("underline"),
                strike: document.queryCommandState("strikeThrough"),
                unorderedList: document.queryCommandState("insertUnorderedList"),
                orderedList: document.queryCommandState("insertOrderedList"),
                h1: formatBlockValue === "h1",
                h2: formatBlockValue === "h2",
                h3: formatBlockValue === "h3",
                blockquote: formatBlockValue === "blockquote",
            });
        } catch {
            // Ignore
        }
    };

    // Calculate word & character counts from editor
    const updateCounts = () => {
        if (!editorRef.current) return;
        const text = editorRef.current.innerText || "";
        const clean = text.trim();
        setWordCount(clean ? clean.split(/\s+/).length : 0);
        setCharCount(text.length);
        checkActiveFormats();
    };

    useEffect(() => {
        if (open) {
            setTitle(initialData?.title ?? "");
            setIsPinned(initialData?.isPinned ?? false);
            setIsSubmitting(false);
            setRemovedAttachmentIds([]);

            if (initialData?.attachments && initialData.attachments.length > 0) {
                setAttachments(
                    initialData.attachments.map((att) => ({
                        id: `existing-${att.id}`,
                        title: att.fileName,
                        kind: att.kind,
                        fileType: att.fileType || (att.kind === "link" ? "LINK" : "FILE"),
                        fileSize: att.fileSize || "—",
                        url: att.url ?? undefined,
                        existingId: att.id,
                    }))
                );
            } else {
                setAttachments([]);
            }

            // Populate WYSIWYG editor content directly
            setTimeout(() => {
                if (editorRef.current) {
                    const raw = initialData?.body ?? "";
                    editorRef.current.innerHTML = normalizeContentToHtml(raw);
                    updateCounts();
                }
            }, 0);
        }
    }, [open, initialData]);

    if (!open) return null;

    /* ---------- WYSIWYG Document Commands ---------- */

    const executeFormat = (command: string, value: string | undefined = undefined) => {
        if (!editorRef.current) return;
        editorRef.current.focus();
        document.execCommand(command, false, value);
        updateCounts();
    };

    const handleOpenLinkDialog = () => {
        const selection = window.getSelection();
        const selectedStr = selection ? selection.toString() : "";
        setLinkText(selectedStr);
        setLinkUrl("");
        setLinkDialogOpen(true);
    };

    const confirmInsertLink = () => {
        if (!linkUrl.trim() || !editorRef.current) return;
        editorRef.current.focus();
        const urlToUse = /^https?:\/\//i.test(linkUrl.trim()) ? linkUrl.trim() : `https://${linkUrl.trim()}`;
        
        if (linkText.trim()) {
            document.execCommand(
                "insertHTML",
                false,
                `<a href="${urlToUse}" target="_blank" rel="noopener noreferrer">${linkText.trim()}</a>`
            );
        } else {
            document.execCommand("createLink", false, urlToUse);
        }

        setLinkDialogOpen(false);
        setLinkUrl("");
        setLinkText("");
        updateCounts();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key.toLowerCase() === "b") {
                e.preventDefault();
                executeFormat("bold");
            } else if (e.key.toLowerCase() === "i") {
                e.preventDefault();
                executeFormat("italic");
            } else if (e.key.toLowerCase() === "u") {
                e.preventDefault();
                executeFormat("underline");
            } else if (e.key.toLowerCase() === "k") {
                e.preventDefault();
                handleOpenLinkDialog();
            }
        }
    };

    /* ---------- Attachments & Files ---------- */

    const addFiles = (files: File[]) => {
        if (!files.length) return;
        const newItems: DraftAttachment[] = files.map((f, i) => ({
            id: `file-${Date.now()}-${i}`,
            title: f.name,
            kind: "file",
            fileType: getFileExtension(f.name),
            fileSize: formatBytes(f.size),
            url: URL.createObjectURL(f),
            file: f,
        }));
        setAttachments((prev) => [...prev, ...newItems]);
    };

    const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFiles(Array.from(e.target.files));
            e.target.value = "";
        }
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            addFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const confirmAddResource = () => {
        if (!resourceUrl.trim()) return;
        const normalized = /^https?:\/\//i.test(resourceUrl.trim())
            ? resourceUrl.trim()
            : `https://${resourceUrl.trim()}`;

        const newResource: DraftAttachment = {
            id: `link-${Date.now()}`,
            title: resourceTitle.trim() || resourceUrl.trim(),
            kind: "link",
            fileType: "LINK",
            fileSize: "Web Resource",
            url: normalized,
        };

        setAttachments((prev) => [...prev, newResource]);
        setResourceDialogOpen(false);
        setResourceUrl("");
        setResourceTitle("");
    };

    const removeAttachment = (attachment: DraftAttachment) => {
        if (attachment.existingId) {
            setRemovedAttachmentIds((prev) => [...prev, attachment.existingId!]);
        }
        if (attachment.url && attachment.url.startsWith("blob:")) {
            URL.revokeObjectURL(attachment.url);
        }
        setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
    };

    /* ---------- Submit Action ---------- */

    const handleSubmit = async () => {
        const htmlContent = editorRef.current?.innerHTML.trim() || "";
        const textContent = editorRef.current?.innerText.trim() || "";

        if (!textContent && !title.trim()) return;
        setIsSubmitting(true);
        try {
            await onSubmit({
                title: title.trim(),
                body: htmlContent,
                isPinned,
                attachments,
                removedAttachmentIds,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative flex flex-col w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl border bg-white shadow-2xl transition-all dark:bg-slate-900 ${
                    isDragging
                        ? "border-indigo-500 ring-4 ring-indigo-500/20 dark:border-indigo-400"
                        : "border-slate-200/90 dark:border-slate-800"
                } animate-in fade-in zoom-in-95 duration-200`}
            >
                {/* Drag Overlay */}
                {isDragging && (
                    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-indigo-600/90 backdrop-blur-xs text-white">
                        <UploadCloud className="h-14 w-14 animate-bounce" />
                        <p className="mt-3 text-base font-bold">Drop files here to attach</p>
                        <p className="text-xs text-indigo-100">Supports documents, slides, images, and archives</p>
                    </div>
                )}

                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-800/60">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                                {initialData ? "Edit Announcement" : "Create Class Announcement"}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Direct visual editor — format live exactly like Google Docs
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Modal Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                    {/* Headline / Subject input */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                            Headline / Subject <span className="font-normal lowercase text-slate-400">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Week 4: Machine Learning Lecture Materials & Assignment Clarifications"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500 transition-all"
                        />
                    </div>

                    {/* Google Docs Style Rich WYSIWYG Document Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs dark:border-slate-800 dark:bg-slate-900 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                        {/* Google Docs Toolbar */}
                        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200/80 bg-slate-50/80 p-2 text-slate-700 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-300 select-none">
                            {/* Headings */}
                            <div className="flex items-center rounded-lg bg-white/80 p-0.5 shadow-2xs border border-slate-200/60 dark:bg-slate-800 dark:border-slate-700">
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        executeFormat("formatBlock", activeFormats.h1 ? "<p>" : "<h1>");
                                    }}
                                    title="Heading 1"
                                    className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                                        activeFormats.h1
                                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                            : "hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700"
                                    }`}
                                >
                                    <Heading1 className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        executeFormat("formatBlock", activeFormats.h2 ? "<p>" : "<h2>");
                                    }}
                                    title="Heading 2"
                                    className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                                        activeFormats.h2
                                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                            : "hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700"
                                    }`}
                                >
                                    <Heading2 className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        executeFormat("formatBlock", activeFormats.h3 ? "<p>" : "<h3>");
                                    }}
                                    title="Heading 3"
                                    className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                                        activeFormats.h3
                                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                            : "hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700"
                                    }`}
                                >
                                    <Heading3 className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

                            {/* Text Styles (B, I, U, S, Highlight) */}
                            <div className="flex items-center rounded-lg bg-white/80 p-0.5 shadow-2xs border border-slate-200/60 dark:bg-slate-800 dark:border-slate-700">
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        executeFormat("bold");
                                    }}
                                    title="Bold (Ctrl+B)"
                                    className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                                        activeFormats.bold
                                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                            : "hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700"
                                    }`}
                                >
                                    <Bold className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        executeFormat("italic");
                                    }}
                                    title="Italic (Ctrl+I)"
                                    className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                                        activeFormats.italic
                                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                            : "hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700"
                                    }`}
                                >
                                    <Italic className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        executeFormat("underline");
                                    }}
                                    title="Underline (Ctrl+U)"
                                    className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                                        activeFormats.underline
                                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                            : "hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700"
                                    }`}
                                >
                                    <Underline className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        executeFormat("strikeThrough");
                                    }}
                                    title="Strikethrough"
                                    className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                                        activeFormats.strike
                                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                            : "hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700"
                                    }`}
                                >
                                    <Strikethrough className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        executeFormat("hiliteColor", "#fef08a");
                                    }}
                                    title="Highlight text"
                                    className="rounded-md p-1.5 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700 cursor-pointer"
                                >
                                    <Highlighter className="h-4 w-4 text-amber-500" />
                                </button>
                            </div>

                            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

                            {/* Lists, Quote, Code */}
                            <div className="flex items-center rounded-lg bg-white/80 p-0.5 shadow-2xs border border-slate-200/60 dark:bg-slate-800 dark:border-slate-700">
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        executeFormat("insertUnorderedList");
                                    }}
                                    title="Bulleted List"
                                    className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                                        activeFormats.unorderedList
                                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                            : "hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700"
                                    }`}
                                >
                                    <List className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        executeFormat("insertOrderedList");
                                    }}
                                    title="Numbered List"
                                    className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                                        activeFormats.orderedList
                                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                            : "hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700"
                                    }`}
                                >
                                    <ListOrdered className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        executeFormat("formatBlock", activeFormats.blockquote ? "<p>" : "<blockquote>");
                                    }}
                                    title="Quote Block"
                                    className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                                        activeFormats.blockquote
                                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                            : "hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700"
                                    }`}
                                >
                                    <Quote className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        executeFormat("formatBlock", "<pre>");
                                    }}
                                    title="Code Block"
                                    className="rounded-md p-1.5 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700 cursor-pointer"
                                >
                                    <Code className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

                            {/* Link, Rule, Clear Format, Undo, Redo */}
                            <div className="flex items-center rounded-lg bg-white/80 p-0.5 shadow-2xs border border-slate-200/60 dark:bg-slate-800 dark:border-slate-700">
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleOpenLinkDialog();
                                    }}
                                    title="Insert Link (Ctrl+K)"
                                    className="rounded-md p-1.5 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700 cursor-pointer"
                                >
                                    <LinkIcon className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        executeFormat("insertHorizontalRule");
                                    }}
                                    title="Horizontal Divider Line"
                                    className="rounded-md p-1.5 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700 cursor-pointer"
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        executeFormat("removeFormat");
                                    }}
                                    title="Clear Formatting"
                                    className="rounded-md p-1.5 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700 cursor-pointer"
                                >
                                    <Eraser className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        executeFormat("undo");
                                    }}
                                    title="Undo (Ctrl+Z)"
                                    className="rounded-md p-1.5 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700 cursor-pointer"
                                >
                                    <Undo className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        executeFormat("redo");
                                    }}
                                    title="Redo (Ctrl+Y)"
                                    className="rounded-md p-1.5 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700 cursor-pointer"
                                >
                                    <Redo className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Direct WYSIWYG Document Canvas */}
                        <div
                            ref={editorRef}
                            contentEditable
                            suppressContentEditableWarning
                            onInput={updateCounts}
                            onKeyUp={updateCounts}
                            onMouseUp={checkActiveFormats}
                            onKeyDown={handleKeyDown}
                            data-placeholder="Share an announcement with your class (type notices, formatting, lecture summaries, or paste materials directly)..."
                            className="w-full min-h-[260px] max-h-[460px] overflow-y-auto p-5 text-sm text-slate-900 dark:text-slate-100 outline-none leading-relaxed font-sans empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 dark:empty:before:text-slate-500 empty:before:pointer-events-none [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:dark:text-white [&_h1]:mb-2.5 [&_h1]:mt-1 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:dark:text-white [&_h2]:mb-2 [&_h2]:mt-1 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:dark:text-white [&_h3]:mb-1.5 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-2.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-2.5 [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-500 [&_blockquote]:bg-indigo-50/50 [&_blockquote]:dark:bg-indigo-950/30 [&_blockquote]:pl-4 [&_blockquote]:py-1.5 [&_blockquote]:italic [&_blockquote]:rounded-r-lg [&_blockquote]:my-2 [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-3.5 [&_pre]:rounded-xl [&_pre]:font-mono [&_pre]:text-xs [&_pre]:my-2.5 [&_pre]:overflow-x-auto [&_a]:text-indigo-600 [&_a]:dark:text-indigo-400 [&_a]:underline [&_a]:font-medium [&_mark]:bg-amber-100 [&_mark]:dark:bg-amber-900/40 [&_mark]:px-1 [&_mark]:rounded"
                        />

                        {/* Document Footer Bar */}
                        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-2 text-[11px] text-slate-400 dark:border-slate-800 dark:bg-slate-850">
                            <span className="flex items-center gap-1.5">
                                <span>WYSIWYG Rich Editor</span>
                                <span>•</span>
                                <span>Drag & Drop files anywhere</span>
                            </span>
                            <div className="flex items-center gap-3 font-medium">
                                <span>{wordCount} words</span>
                                <span>{charCount} characters</span>
                            </div>
                        </div>
                    </div>

                    {/* File Attachment & Web Resources Section */}
                    <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <Paperclip className="h-3.5 w-3.5 text-indigo-500" />
                                    <span>Attachments & Resources ({attachments.length})</span>
                                </h3>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Attach PDFs, lecture notes, slides, code zip archives, or web links
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileInputChange}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <Paperclip className="h-3.5 w-3.5 text-indigo-500" />
                                    <span>Attach File</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setResourceDialogOpen(true)}
                                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <Globe className="h-3.5 w-3.5 text-indigo-500" />
                                    <span>Add Link</span>
                                </button>
                            </div>
                        </div>

                        {/* Attachments List */}
                        {attachments.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                {attachments.map((att) => (
                                    <div
                                        key={att.id}
                                        className="group relative flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs transition-all hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-indigo-800"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400">
                                                {att.kind === "link" ? (
                                                    <Globe className="h-4 w-4" />
                                                ) : att.fileType.toLowerCase().includes("png") ||
                                                  att.fileType.toLowerCase().includes("jpg") ||
                                                  att.fileType.toLowerCase().includes("jpeg") ? (
                                                    <ImageIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                ) : (
                                                    <FileText className="h-4 w-4" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                                                    {att.title}
                                                </p>
                                                <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400">
                                                    <span className="font-semibold uppercase text-indigo-600 dark:text-indigo-400">
                                                        {att.fileType}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{att.fileSize}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(att)}
                                            title="Remove attachment"
                                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300/80 bg-white/50 p-4 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/20 dark:border-slate-700/80 dark:bg-slate-800/30 transition-colors"
                            >
                                <UploadCloud className="h-6 w-6 text-slate-400" />
                                <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                                    Click to attach files, or drag and drop them directly
                                </p>
                                <p className="text-[11px] text-slate-400">PDFs, Word docs, Slides, Images, or Code files</p>
                            </div>
                        )}
                    </div>

                    {/* Pin Announcement Switch */}
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Pin className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                    Pin announcement to top of stream
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Keeps this post highlighted with a priority ribbon above regular updates
                                </p>
                            </div>
                        </div>

                        <label className="relative inline-flex cursor-pointer items-center">
                            <input
                                type="checkbox"
                                checked={isPinned}
                                onChange={(e) => setIsPinned(e.target.checked)}
                                className="peer sr-only"
                            />
                            <div className="h-5 w-9 rounded-full bg-slate-300 peer-checked:bg-amber-500 peer-focus:outline-none dark:bg-slate-700 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full" />
                        </label>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40 shrink-0">
                    <div>
                        {initialData && onDelete && (
                            <button
                                type="button"
                                onClick={onDelete}
                                disabled={isSubmitting}
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete Announcement</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting || (charCount === 0 && !title.trim())}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span>Saving…</span>
                                </>
                            ) : (
                                <>
                                    <Check className="h-3.5 w-3.5" />
                                    <span>{initialData ? "Save Changes" : "Publish Announcement"}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Link Inserter Modal */}
            {linkDialogOpen && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                            Insert Link
                        </h4>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Display Text</label>
                                <input
                                    type="text"
                                    value={linkText}
                                    onChange={(e) => setLinkText(e.target.value)}
                                    placeholder="e.g. Course Syllabus PDF"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-500 mb-1">URL (https://)</label>
                                <input
                                    type="url"
                                    autoFocus
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    placeholder="https://example.com/notes.pdf"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setLinkDialogOpen(false)}
                                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmInsertLink}
                                disabled={!linkUrl.trim()}
                                className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
                            >
                                Insert
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Web Resource Dialog */}
            {resourceDialogOpen && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-2 mb-3">
                            <Globe className="h-4 w-4 text-indigo-500" />
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                Attach Web Resource Link
                            </h4>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Resource Title</label>
                                <input
                                    type="text"
                                    value={resourceTitle}
                                    onChange={(e) => setResourceTitle(e.target.value)}
                                    placeholder="e.g. GitHub Repository, Google Drive Folder"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-500 mb-1">URL (https://)</label>
                                <input
                                    type="url"
                                    autoFocus
                                    value={resourceUrl}
                                    onChange={(e) => setResourceUrl(e.target.value)}
                                    placeholder="https://drive.google.com/..."
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setResourceDialogOpen(false)}
                                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmAddResource}
                                disabled={!resourceUrl.trim()}
                                className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
                            >
                                Attach Link
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}