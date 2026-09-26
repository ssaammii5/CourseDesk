"use client";

import { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    Check,
    ChevronDown,
    ClipboardList,
    Clock,
    FileText,
    FolderKanban,
    Globe,
    Link2,
    Paperclip,
    Plus,
    Save,
    Sparkles,
    Tag,
    Trash2,
    Upload,
    UsersRound,
    Video,
    X,
} from "lucide-react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import type { ClassworkEntry } from "@/types";
import type { SessionDto } from "@/types/session";
export interface AssignmentDraftAttachment {
    id: number;
    title: string;
    kind: "file" | "link";
    fileType: string;
    fileSize?: string;
    url?: string;
    file?: File;
}

export interface AssignmentCreateViewProps {
    courseName: string;
    initial: ClassworkEntry | null;
    onClose: () => void;
    onSubmit: (entry: ClassworkEntry, attachments: AssignmentDraftAttachment[]) => void | Promise<void>;
    courseId?: number;
    sessions?: SessionDto[];
    existingTopics?: string[];
}

const POINT_PRESETS = [100, 50, 30, 25, 10, 0];
type DueOption = "none" | "tomorrow" | "nextweek" | "custom";

function formatShort(d: Date): string {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function isValidLink(value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed) return false;
    return /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}([/?#]\S*)?$/i.test(trimmed);
}

function extOf(name: string): string {
    const i = name.lastIndexOf(".");
    return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

export function AssignmentCreateView({
    courseName,
    initial,
    onClose,
    onSubmit,
    sessions = [],
    existingTopics = [
        "Research & Paper",
        "Cryptography Labs",
        "Cryptography Theory",
        "Software Security",
        "Examinations",
    ],
}: AssignmentCreateViewProps) {
    const isEditing = Boolean(initial && initial.id > 0);

    const [title, setTitle] = useState(initial?.title ?? "");
    const [titleTouched, setTitleTouched] = useState(false);
    const [instructions, setInstructions] = useState(initial?.description ?? "");
    const [topic, setTopic] = useState(initial?.topic ?? "General");
    const [customTopicMode, setCustomTopicMode] = useState(false);

    const [attachments, setAttachments] = useState<AssignmentDraftAttachment[]>(() => {
        if (!initial?.attachments) return [];
        return initial.attachments.map((att) => ({
            id: att.id,
            title: att.fileName,
            kind: (att.kind === "link" ? "link" : "file") as "file" | "link",
            fileType: att.fileType,
            url: att.url ?? undefined,
        }));
    });

    const [points, setPoints] = useState(initial?.maxMarks ?? 100);
    const [due, setDue] = useState<DueOption>(initial?.deadlineUtc ? "custom" : "nextweek");
    const [customDate, setCustomDate] = useState(() => {
        if (!initial?.deadlineUtc) {
            const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            return d.toISOString().slice(0, 16);
        }
        try {
            return new Date(initial.deadlineUtc).toISOString().slice(0, 16);
        } catch {
            return "";
        }
    });

    // Associated session
    const [selectedSessionId, setSelectedSessionId] = useState<number | "none">("none");

    const [assignMenuOpen, setAssignMenuOpen] = useState(false);
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkValue, setLinkValue] = useState("");
    const [linkTouched, setLinkTouched] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const titleValid = title.trim().length > 0;
    const showTitleError = titleTouched && !titleValid;
    const linkValid = isValidLink(linkValue);
    const linkError = linkTouched && !linkValid;

    const dueDate = useMemo<Date | null>(() => {
        if (due === "tomorrow") {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            d.setHours(23, 59, 0, 0);
            return d;
        }
        if (due === "nextweek") {
            const d = new Date();
            d.setDate(d.getDate() + 7);
            d.setHours(23, 59, 0, 0);
            return d;
        }
        if (due === "custom" && customDate) {
            const d = new Date(customDate);
            return Number.isNaN(d.getTime()) ? null : d;
        }
        return null;
    }, [due, customDate]);

    /* ---------- Attachments ---------- */
    const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return;
        setAttachments((prev) => [
            ...prev,
            ...files.map((f, i) => ({
                id: Date.now() + i,
                title: f.name,
                kind: "file" as const,
                fileType: (extOf(f.name) || "FILE").toUpperCase(),
                url: URL.createObjectURL(f),
                file: f,
            })),
        ]);
        e.target.value = "";
    };

    const confirmAddLink = () => {
        if (!linkValid) return;
        const typed = linkValue.trim();
        const normalized = /^https?:\/\//i.test(typed) ? typed : `https://${typed}`;
        setAttachments((prev) => [
            ...prev,
            { id: Date.now(), title: typed, kind: "link", fileType: "LINK", url: normalized },
        ]);
        setLinkDialogOpen(false);
        setLinkValue("");
        setLinkTouched(false);
    };

    const removeAttachment = (id: number) => {
        setAttachments((prev) => {
            const target = prev.find((a) => a.id === id);
            if (target?.url?.startsWith("blob:")) URL.revokeObjectURL(target.url);
            return prev.filter((a) => a.id !== id);
        });
    };

    /* ---------- Submit Action ---------- */
    const buildEntry = (status: "Assigned" | "Draft"): ClassworkEntry => ({
        id: initial?.id ?? Date.now(),
        title: title.trim() || "Untitled assignment",
        topic: topic.trim() || "General",
        dueLabel: dueDate ? `Due ${formatShort(dueDate)}` : "No due date",
        postedLabel: initial?.postedLabel ?? `Posted ${formatShort(new Date())}`,
        status,
        description: instructions,
        kind: initial?.kind ?? "assignment",
        deadlineUtc: dueDate ? dueDate.toISOString() : undefined,
        maxMarks: points,
    });

    const submit = (status: "Assigned" | "Draft") => {
        setAssignMenuOpen(false);
        if (!titleValid) {
            setTitleTouched(true);
            return;
        }
        onSubmit(buildEntry(status), attachments);
    };

    // Combine preset topics with existing course topics
    const allTopics = useMemo(() => {
        const set = new Set<string>(existingTopics);
        if (topic.trim()) set.add(topic.trim());
        return Array.from(set).filter(Boolean);
    }, [existingTopics, topic]);

    return (
        <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 pb-16">
            {/* Top Bar Header */}
            <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-2xs">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Back to Coursework</span>
                        </button>

                        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

                        <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/20">
                                <ClipboardList className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                                    {isEditing ? "Edit Assignment" : "Create New Assignment"}
                                </h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{courseName}</span>
                                    <span>•</span>
                                    <span>Studio Editor</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2.5 shrink-0">
                        {/* Save Draft Button */}
                        <button
                            type="button"
                            onClick={() => submit("Draft")}
                            className="hidden sm:inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
                        >
                            <Save className="h-3.5 w-3.5 text-slate-500" />
                            <span>Save as Draft</span>
                        </button>

                        {/* Primary Assign Button Group */}
                        <div className="relative inline-flex rounded-xl shadow-md shadow-blue-600/20">
                            <button
                                type="button"
                                onClick={() => submit("Assigned")}
                                className={`inline-flex items-center gap-2 rounded-l-xl px-5 py-2.5 text-xs font-bold text-white transition-all ${
                                    titleValid
                                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 cursor-pointer active:scale-95"
                                        : "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                                }`}
                            >
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>{isEditing ? "Update Assignment" : "Assign & Publish"}</span>
                            </button>
                            <button
                                type="button"
                                aria-label="More assign options"
                                onClick={() => setAssignMenuOpen((v) => !v)}
                                className={`inline-flex items-center rounded-r-xl border-l border-white/20 px-2 py-2.5 text-white transition-colors ${
                                    titleValid
                                        ? "bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                                        : "bg-slate-400 dark:bg-slate-700 cursor-not-allowed"
                                }`}
                            >
                                <ChevronDown className="h-4 w-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {assignMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setAssignMenuOpen(false)} />
                                    <div className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                                        <button
                                            type="button"
                                            onClick={() => submit("Assigned")}
                                            className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left text-xs font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                                        >
                                            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                                            <span>Publish Immediately</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => submit("Draft")}
                                            className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        >
                                            <Save className="h-3.5 w-3.5 text-slate-400" />
                                            <span>Save as Unpublished Draft</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Layout */}
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Title, Rich Text Instructions, Attachments, Submission Formats (8 cols) */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Title Card */}
                        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                Assignment Title <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                autoFocus
                                placeholder="Write down your assignment title..."
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={() => setTitleTouched(true)}
                                className={`w-full rounded-2xl border px-4 py-3.5 text-base sm:text-lg font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                                    showTitleError
                                        ? "border-rose-400 bg-rose-50/50 dark:bg-rose-950/20 focus:border-rose-500 focus:ring-rose-500/20"
                                        : "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-indigo-500/20"
                                }`}
                            />
                            {showTitleError && (
                                <p className="mt-2 text-xs font-medium text-rose-600 dark:rose-400 flex items-center gap-1.5">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    <span>Please provide a title for this assignment.</span>
                                </p>
                            )}
                        </div>

                        {/* Rich Text Editor Card for Instructions */}
                        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Instructions & Requirements
                                    </label>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                        Format complete overview, problem sets, requirements, and grading criteria.
                                    </p>
                                </div>
                            </div>

                            {/* Standalone Reusable RichTextEditor */}
                            <RichTextEditor
                                value={instructions}
                                onChange={setInstructions}
                                placeholder="Write down your instructions and requirements..."
                                minHeight="280px"
                                maxHeight="560px"
                            />
                        </div>

                        {/* Attachments & Reference Materials */}
                        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Paperclip className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                        <span>Reference Materials & Attachments ({attachments.length})</span>
                                    </h3>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                        Upload starter code, PDFs, reference templates, or links for learners.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        className="hidden"
                                        onChange={handleFiles}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <Upload className="h-3.5 w-3.5 text-indigo-500" />
                                        <span>Upload File</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setLinkValue("");
                                            setLinkTouched(false);
                                            setLinkDialogOpen(true);
                                        }}
                                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <Link2 className="h-3.5 w-3.5 text-indigo-500" />
                                        <span>Add Web Link</span>
                                    </button>
                                </div>
                            </div>

                            {/* Attachments List */}
                            {attachments.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    {attachments.map((att) => (
                                        <div
                                            key={att.id}
                                            className="group relative flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3 shadow-2xs hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-indigo-700 transition-all"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                                                    {att.kind === "link" ? (
                                                        <Globe className="h-4.5 w-4.5" />
                                                    ) : (
                                                        <FileText className="h-4.5 w-4.5" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                                                        {att.title}
                                                    </p>
                                                    <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase mt-0.5">
                                                        {att.fileType || "DOCUMENT"}
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(att.id)}
                                                title="Remove attachment"
                                                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/40 p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/20 dark:hover:border-indigo-600 transition-colors"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 mb-2">
                                        <Upload className="h-5 w-5" />
                                    </div>
                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Click to browse files, or drag and drop reference documents here
                                    </p>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                        Supports PDF, Word, ZIP, Python, C++, Images, and Jupyter notebooks
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Settings Sidebar (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Target Course & Audience */}
                        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Target & Audience
                            </h3>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Target Course
                                </label>
                                <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                                    <FolderKanban className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                    <span className="truncate">{courseName}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Learners Assigned
                                </label>
                                <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                                    <UsersRound className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <span>All enrolled learners in course</span>
                                </div>
                            </div>

                            {/* Associated Session (if sessions available) */}
                            {sessions.length > 0 && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Attach to Lecture Session
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={selectedSessionId}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setSelectedSessionId(val === "none" ? "none" : Number(val));
                                            }}
                                            className="w-full appearance-none rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 px-3.5 py-2.5 pr-8 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none"
                                        >
                                            <option value="none">None (General Coursework)</option>
                                            {sessions.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.title}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Grading & Points */}
                        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Grading & Points
                                </h3>
                                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                    {points > 0 ? `${points} points` : "Ungraded"}
                                </span>
                            </div>

                            {/* Preset Buttons */}
                            <div className="grid grid-cols-3 gap-2">
                                {POINT_PRESETS.map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPoints(p)}
                                        className={`rounded-xl py-2 text-xs font-semibold border transition-all cursor-pointer ${
                                            points === p
                                                ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700 shadow-2xs"
                                                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        }`}
                                    >
                                        {p === 0 ? "Ungraded" : `${p} pts`}
                                    </button>
                                ))}
                            </div>

                            {/* Custom Input */}
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                    Custom Maximum Marks
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={1000}
                                    value={points}
                                    onChange={(e) => setPoints(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Due Date & Deadline */}
                        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Due Date & Time
                                </h3>
                                <Calendar className="h-4 w-4 text-indigo-500" />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {(
                                    [
                                        { id: "nextweek", label: "In 1 Week" },
                                        { id: "tomorrow", label: "Tomorrow" },
                                        { id: "custom", label: "Custom Date" },
                                        { id: "none", label: "No Deadline" },
                                    ] as const
                                ).map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setDue(opt.id)}
                                        className={`rounded-xl py-2 px-2.5 text-xs font-semibold border transition-all text-center cursor-pointer ${
                                            due === opt.id
                                                ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700 shadow-2xs"
                                                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {due === "custom" && (
                                <div className="space-y-1.5 pt-1">
                                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                        Select Date & Time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={customDate}
                                        onChange={(e) => setCustomDate(e.target.value)}
                                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                            )}

                            {dueDate && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
                                    <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                    <span>Due on {formatShort(dueDate)}</span>
                                </p>
                            )}
                        </div>

                        {/* Topic Organization */}
                        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Topic Category
                                </h3>
                                <Tag className="h-4 w-4 text-indigo-500" />
                            </div>

                            {/* Preset Topic Badges */}
                            <div className="flex flex-wrap gap-1.5">
                                {allTopics.map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => {
                                            setTopic(t);
                                            setCustomTopicMode(false);
                                        }}
                                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all cursor-pointer ${
                                            topic === t && !customTopicMode
                                                ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700 shadow-2xs"
                                                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>

                            {/* Custom topic toggle / input */}
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                    Or type a custom topic name
                                </label>
                                <input
                                    type="text"
                                    value={topic}
                                    placeholder="Write down custom topic name..."
                                    onChange={(e) => {
                                        setTopic(e.target.value);
                                        setCustomTopicMode(true);
                                    }}
                                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Link Inserter Modal */}
            {linkDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                    <div className="w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Link2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                <span>Attach Web Resource Link</span>
                            </h4>
                            <button
                                type="button"
                                onClick={() => setLinkDialogOpen(false)}
                                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                URL (https://) <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="url"
                                autoFocus
                                value={linkValue}
                                onChange={(e) => setLinkValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        confirmAddLink();
                                    }
                                }}
                                placeholder="Write down or paste link URL..."
                                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                            />
                            {linkError && (
                                <p className="mt-1 text-xs text-rose-500">Please enter a valid web URL.</p>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setLinkDialogOpen(false)}
                                className="rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmAddLink}
                                disabled={!linkValid}
                                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 text-xs font-semibold shadow-xs"
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