"use client";

import React, { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
    Check,
    FileText,
    Globe,
    Image as ImageIcon,
    Loader2,
    Paperclip,
    Pin,
    Sparkles,
    Trash2,
    UploadCloud,
    X,
} from "lucide-react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
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

export function AnnouncementFormModal({
    open,
    initialData,
    onClose,
    onSubmit,
    onDelete,
}: AnnouncementFormModalProps) {
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [isPinned, setIsPinned] = useState(false);
    const [attachments, setAttachments] = useState<DraftAttachment[]>([]);
    const [removedAttachmentIds, setRemovedAttachmentIds] = useState<number[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // External resource link attachment dialog state
    const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
    const [resourceUrl, setResourceUrl] = useState("");
    const [resourceTitle, setResourceTitle] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setTitle(initialData?.title ?? "");
            setBody(initialData?.body ?? "");
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
        }
    }, [open, initialData]);

    if (!open) return null;

    /* ---------- Attachments & Files ---------- */

    const addFiles = (files: File[]) => {
        if (!files.length) return;
        const newItems: DraftAttachment[] = files.map((f, i) => ({
            id: `new-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
            title: f.name,
            kind: "file" as const,
            fileType: getFileExtension(f.name),
            fileSize: formatBytes(f.size),
            file: f,
            url: URL.createObjectURL(f),
        }));
        setAttachments((prev) => [...prev, ...newItems]);
    };

    const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        addFiles(files);
        e.target.value = "";
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files ?? []);
        addFiles(files);
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
        const urlToUse = /^https?:\/\//i.test(resourceUrl.trim())
            ? resourceUrl.trim()
            : `https://${resourceUrl.trim()}`;

        const newResource: DraftAttachment = {
            id: `link-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title: resourceTitle.trim() || urlToUse,
            kind: "link",
            fileType: "LINK",
            fileSize: "Web link",
            url: urlToUse,
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
        const htmlContent = body.trim();
        const textContent = body.replace(/<[^>]*>/g, "").trim();

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

    const hasContent = Boolean(title.trim() || body.replace(/<[^>]*>/g, "").trim());

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
                                Direct visual editor with rich formatting, code blocks, and lists
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
                            placeholder="Write down your announcement headline..."
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500 transition-all"
                        />
                    </div>

                    {/* Standalone Reusable RichTextEditor */}
                    <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Announcement Content
                        </label>
                        <RichTextEditor
                            value={body}
                            onChange={setBody}
                            placeholder="Write down your announcement content..."
                            minHeight="240px"
                            maxHeight="440px"
                        />
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
                            disabled={isSubmitting || !hasContent}
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
                                    placeholder="Write down resource title..."
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
                                    placeholder="Write down or paste link URL..."
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