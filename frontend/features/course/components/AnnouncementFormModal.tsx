"use client";

import { useEffect, useRef, useState } from "react";
import {
    Bold,
    Check,
    Code,
    Italic,
    Link as LinkIcon,
    List,
    Pin,
    Quote,
    Sparkles,
    Trash2,
    X,
} from "lucide-react";

interface AnnouncementFormModalProps {
    open: boolean;
    initialData?: {
        id?: number;
        title: string;
        body: string;
        isPinned: boolean;
    } | null;
    onClose: () => void;
    onSubmit: (data: { title: string; body: string; isPinned: boolean }) => void;
    onDelete?: () => void;
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
    const [mode, setMode] = useState<"write" | "preview">("write");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (open) {
            setTitle(initialData?.title ?? "");
            setBody(initialData?.body ?? "");
            setIsPinned(initialData?.isPinned ?? false);
            setMode("write");
        }
    }, [open, initialData]);

    if (!open) return null;

    const handleSubmit = () => {
        if (!body.trim() && !title.trim()) return;
        onSubmit({ title: title.trim(), body: body.trim(), isPinned });
    };

    // Helper to insert markdown formatting around selected text or at cursor
    const insertFormatting = (prefix: string, suffix = prefix, placeholder = "text") => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = textarea.value;
        const selectedText = currentText.substring(start, end) || placeholder;

        const nextText =
            currentText.substring(0, start) +
            prefix +
            selectedText +
            suffix +
            currentText.substring(end);

        setBody(nextText);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
                start + prefix.length,
                start + prefix.length + selectedText.length
            );
        }, 10);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800/80 dark:bg-slate-800/40">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                {initialData ? "Edit Announcement" : "Create Class Announcement"}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Post an update to the class stream for all learners
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body Form */}
                <div className="p-6 space-y-4">
                    {/* Title field */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                            Headline / Subject <span className="font-normal text-slate-400">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Week 4 Lecture Notes & Midterm Guidance"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400"
                        />
                    </div>

                    {/* Mode Toggle & Formatting Toolbar */}
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setMode("write")}
                                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                                        mode === "write"
                                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300"
                                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                                    }`}
                                >
                                    Write
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode("preview")}
                                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                                        mode === "preview"
                                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300"
                                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                                    }`}
                                >
                                    Preview
                                </button>
                            </div>

                            {mode === "write" && (
                                <div className="flex items-center gap-0.5 text-slate-500 dark:text-slate-400">
                                    <button
                                        type="button"
                                        onClick={() => insertFormatting("**", "**", "bold")}
                                        title="Bold"
                                        className="rounded-md p-1.5 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                    >
                                        <Bold className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => insertFormatting("*", "*", "italic")}
                                        title="Italic"
                                        className="rounded-md p-1.5 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                    >
                                        <Italic className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => insertFormatting("- ", "", "List item")}
                                        title="Bullet List"
                                        className="rounded-md p-1.5 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                    >
                                        <List className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => insertFormatting("`", "`", "code")}
                                        title="Inline Code"
                                        className="rounded-md p-1.5 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                    >
                                        <Code className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => insertFormatting("> ", "", "Important note")}
                                        title="Quote block"
                                        className="rounded-md p-1.5 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                    >
                                        <Quote className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {mode === "write" ? (
                            <textarea
                                ref={textareaRef}
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="Share key notices, schedule updates, or lecture materials with your students…"
                                rows={6}
                                className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400"
                            />
                        ) : (
                            <div className="mt-2 min-h-[150px] max-h-[250px] overflow-y-auto rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200">
                                {body.trim() ? (
                                    <div className="space-y-2 whitespace-pre-line leading-relaxed">
                                        {body}
                                    </div>
                                ) : (
                                    <p className="italic text-slate-400">Nothing to preview yet.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Pin to Top Toggle */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Pin className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                    Pin announcement to top
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Keeps this post prominently spotlighted at the top of the stream
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

                {/* Footer Actions */}
                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800/80 dark:bg-slate-800/40">
                    <div>
                        {initialData && onDelete && (
                            <button
                                type="button"
                                onClick={onDelete}
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete Post</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!body.trim() && !title.trim()}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <Check className="h-3.5 w-3.5" />
                            <span>{initialData ? "Save Changes" : "Publish Announcement"}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}