"use client";

import { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
    Bold,
    ChevronDown,
    ClipboardList,
    Italic,
    Link2,
    List,
    Paperclip,
    RemoveFormatting,
    Underline,
    Upload,
    UsersRound,
    X,
} from "lucide-react";
import type { ClassworkEntry } from "@/types";

interface DraftAttachment {
    id: number;
    title: string;
    kind: "file" | "link";
    fileType: string;
    url?: string;
    file?: File;
}

interface AssignmentCreateViewProps {
    courseName: string;
    initial: ClassworkEntry | null;
    onClose: () => void;
    onSubmit: (entry: ClassworkEntry, attachments: DraftAttachment[]) => void;
}

const POINT_OPTIONS = [100, 50, 25, 10, 0];
type DueOption = "none" | "tomorrow" | "nextweek" | "custom";

function formatShort(d: Date): string {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
}: AssignmentCreateViewProps) {
    const [title, setTitle] = useState(initial?.title ?? "");
    const [titleTouched, setTitleTouched] = useState(false);
    const [instructions, setInstructions] = useState(initial?.description ?? "");
    const [attachments, setAttachments] = useState<DraftAttachment[]>([]);
    const [points, setPoints] = useState(100);
    const [due, setDue] = useState<DueOption>("none");
    const [customDate, setCustomDate] = useState("");
    const [assignMenuOpen, setAssignMenuOpen] = useState(false);
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkValue, setLinkValue] = useState("");
    const [linkTouched, setLinkTouched] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const instructionsRef = useRef<HTMLTextAreaElement>(null);

    const titleValid = title.trim().length > 0;
    const showTitleError = titleTouched && !titleValid;
    const linkValid = isValidLink(linkValue);
    const linkError = linkTouched && !linkValid;

    const dueDate = useMemo<Date | null>(() => {
        if (due === "tomorrow") {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            return d;
        }
        if (due === "nextweek") {
            const d = new Date();
            d.setDate(d.getDate() + 7);
            return d;
        }
        if (due === "custom" && customDate) {
            const d = new Date(`${customDate}T12:00:00`);
            return Number.isNaN(d.getTime()) ? null : d;
        }
        return null;
    }, [due, customDate]);

    /* ---------- instructions formatting ---------- */
    const wrapSelection = (before: string, after: string = before) => {
        const el = instructionsRef.current;
        if (!el) return;
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? 0;
        const selected = instructions.slice(start, end);
        const next =
            instructions.slice(0, start) + before + selected + after + instructions.slice(end);
        setInstructions(next);
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(start + before.length, end + before.length);
        });
    };

    const bulletLines = () => {
        const el = instructionsRef.current;
        if (!el) return;
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? 0;
        const seg = instructions.slice(start, end) || "List item";
        const bulleted = seg
            .split("\n")
            .map((l) => (l.startsWith("• ") ? l : `• ${l}`))
            .join("\n");
        setInstructions(instructions.slice(0, start) + bulleted + instructions.slice(end));
        requestAnimationFrame(() => el.focus());
    };

    const clearFormatting = () => {
        setInstructions((prev) =>
            prev
                .replace(/\*\*|__/g, "")
                .replace(/<\/?u>/g, "")
                .replace(/_/g, "")
                .replace(/^• /gm, ""),
        );
    };

    /* ---------- attachments ---------- */
    const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return;
        setAttachments((prev) => [
            ...prev,
            ...files.map((f, i) => ({
                id: Date.now() + i,
                title: f.name,
                kind: "file" as const,
                fileType: (extOf(f.name) || "file").toUpperCase(),
                url: URL.createObjectURL(f),
                file: f, // <-- Store the file
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
            { id: Date.now(), title: typed, kind: "link", fileType: "Link", url: normalized },
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

    /* ---------- submit ---------- */
    const buildEntry = (status: "Assigned" | "Draft"): ClassworkEntry => ({
        id: initial?.id ?? Date.now(),
        title: title.trim() || "Untitled assignment",
        topic: initial?.topic ?? "No topic",
        dueLabel: dueDate ? `Due ${formatShort(dueDate)}` : "No due date",
        postedLabel: initial?.postedLabel ?? `Posted ${formatShort(new Date())}`,
        status,
        description: instructions,
        kind: initial?.kind ?? "assignment",
    });

    const submit = (status: "Assigned" | "Draft") => {
        setAssignMenuOpen(false);
        if (!titleValid) {
            setTitleTouched(true);
            if (status === "Assigned") return;
        }
        onSubmit(buildEntry(status), attachments); // <-- Pass attachments to parent
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#f6f8fa]">
            {/* Header */}
            <div className="sticky top-16 z-30 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between px-4 py-3 sm:px-6">
                    <div className="flex min-w-0 items-center gap-4">
                        <button
                            type="button"
                            aria-label="Close"
                            onClick={onClose}
                            className="cursor-pointer rounded-full p-2 text-gray-700 hover:bg-gray-900/5"
                        >
                            <X className="h-6 w-6" />
                        </button>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-700">
                            <ClipboardList className="h-5 w-5" />
                        </span>
                        <h1 className="truncate text-2xl text-gray-900">Assignment</h1>
                    </div>
                    <div className="relative flex shrink-0 items-center">
                        <button
                            type="button"
                            onClick={() => submit("Assigned")}
                            className={`rounded-l-full py-2.5 pl-6 pr-5 text-sm font-medium transition-colors ${titleValid
                                ? "cursor-pointer bg-[#1a63d8] text-white hover:bg-[#1554b5]"
                                : "cursor-default bg-[#e0e3e7] text-gray-500"
                                }`}
                        >
                            Assign
                        </button>
                        <button
                            type="button"
                            aria-label="More assign options"
                            onClick={() => setAssignMenuOpen((v) => !v)}
                            className="cursor-pointer rounded-r-full bg-[#1a63d8] py-2.5 pl-2 pr-2 text-white hover:bg-[#1554b5]"
                        >
                            <ChevronDown className="h-4 w-4" />
                        </button>
                        {assignMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setAssignMenuOpen(false)} />
                                <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                                    <button
                                        type="button"
                                        onClick={() => submit("Assigned")}
                                        className="w-full cursor-pointer px-4 py-2.5 text-left text-sm text-gray-900 hover:bg-gray-50"
                                    >
                                        Assign
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => submit("Draft")}
                                        className="w-full cursor-pointer px-4 py-2.5 text-left text-sm text-gray-900 hover:bg-gray-50"
                                    >
                                        Save draft
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-col lg:flex-row">
                {/* Main column */}
                <div className="min-w-0 flex-1 space-y-6 px-4 py-6 sm:px-8">
                    {/* Title + instructions */}
                    <div className="rounded-lg border border-gray-200 bg-white p-5 sm:p-6">
                        <div
                            className={`border-b-2 bg-[#e4e9ee] px-4 py-3 ${showTitleError ? "border-[#c5221f]" : "border-transparent"
                                }`}
                        >
                            <input
                                type="text"
                                value={title}
                                autoFocus
                                placeholder={showTitleError ? "Title*" : "Title"}
                                onChange={(e) => setTitle(e.target.value)}
                                className={`w-full bg-transparent text-[15px] focus:outline-none ${showTitleError
                                    ? "text-[#c5221f] placeholder:text-[#c5221f]"
                                    : "text-gray-900 placeholder:text-gray-700"
                                    }`}
                            />
                        </div>
                        {showTitleError && <p className="mt-1.5 text-xs text-[#c5221f]">*Required</p>}

                        <div className="mt-5 bg-[#f1f3f4]">
                            <textarea
                                ref={instructionsRef}
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                placeholder="Instructions (optional)"
                                rows={7}
                                className="w-full resize-y bg-transparent px-4 pb-2 pt-4 text-sm leading-6 text-gray-900 placeholder:text-gray-600 focus:outline-none"
                            />
                            <div className="flex items-center gap-1 px-3 pb-2">
                                <button
                                    type="button"
                                    title="Bold"
                                    onClick={() => wrapSelection("**")}
                                    className="cursor-pointer rounded p-2 text-gray-700 hover:bg-gray-900/5"
                                >
                                    <Bold className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    title="Italic"
                                    onClick={() => wrapSelection("_")}
                                    className="cursor-pointer rounded p-2 text-gray-700 hover:bg-gray-900/5"
                                >
                                    <Italic className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    title="Underline"
                                    onClick={() => wrapSelection("<u>", "</u>")}
                                    className="cursor-pointer rounded p-2 text-gray-700 hover:bg-gray-900/5"
                                >
                                    <Underline className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    title="Bulleted list"
                                    onClick={bulletLines}
                                    className="cursor-pointer rounded p-2 text-gray-700 hover:bg-gray-900/5"
                                >
                                    <List className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    title="Clear formatting"
                                    onClick={clearFormatting}
                                    className="cursor-pointer rounded p-2 text-gray-700 hover:bg-gray-900/5"
                                >
                                    <RemoveFormatting className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Attach */}
                    <div className="rounded-lg border border-gray-200 bg-white p-5 sm:p-6">
                        <h2 className="text-sm font-medium text-gray-900">Attach</h2>
                        <div className="mt-5 flex items-start justify-center gap-10">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="group flex cursor-pointer flex-col items-center gap-2"
                            >
                                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-400 text-gray-700 transition-colors group-hover:bg-gray-50">
                                    <Upload className="h-5 w-5" />
                                </span>
                                <span className="text-xs font-medium text-gray-800">Upload</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setLinkValue("");
                                    setLinkTouched(false);
                                    setLinkDialogOpen(true);
                                }}
                                className="group flex cursor-pointer flex-col items-center gap-2"
                            >
                                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-400 text-gray-700 transition-colors group-hover:bg-gray-50">
                                    <Link2 className="h-5 w-5" />
                                </span>
                                <span className="text-xs font-medium text-gray-800">Link</span>
                            </button>
                        </div>
                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFiles} />

                        {attachments.length > 0 && (
                            <div className="mt-6 space-y-2">
                                {attachments.map((att) => (
                                    <div
                                        key={att.id}
                                        className="flex items-center gap-3 rounded-md border border-gray-200 px-4 py-2.5"
                                    >
                                        {att.kind === "link" ? (
                                            <Link2 className="h-4 w-4 shrink-0 text-[#1a73e8]" />
                                        ) : (
                                            <Paperclip className="h-4 w-4 shrink-0 text-gray-600" />
                                        )}
                                        <span className="min-w-0 flex-1 truncate text-sm text-gray-900">{att.title}</span>
                                        <span className="shrink-0 text-xs text-gray-500">{att.fileType}</span>
                                        <button
                                            type="button"
                                            aria-label={`Remove ${att.title}`}
                                            onClick={() => removeAttachment(att.id)}
                                            className="cursor-pointer rounded-full p-1 text-gray-600 hover:bg-gray-900/5"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right sidebar */}
                <aside className="w-full shrink-0 space-y-7 border-t border-gray-200 bg-white px-6 py-6 lg:w-[340px] lg:border-l lg:border-t-0">
                    <div>
                        <p className="text-sm text-gray-800">For</p>
                        <div className="mt-2 flex items-center justify-between gap-3 rounded-md bg-[#f1f3f4] px-4 py-3">
                            <span className="truncate text-sm text-gray-900">{courseName}</span>
                            <ChevronDown className="h-4 w-4 shrink-0 text-gray-700" />
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-gray-800">Assign to</p>
                        <button
                            type="button"
                            className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-gray-400 py-2.5 text-sm font-medium text-[#1a73e8] hover:bg-blue-50"
                        >
                            <UsersRound className="h-4 w-4" />
                            All learners
                        </button>
                    </div>

                    <div>
                        <p className="text-sm text-gray-800">Points</p>
                        <div className="relative mt-2">
                            <select
                                value={points}
                                onChange={(e) => setPoints(Number(e.target.value))}
                                className="w-full appearance-none rounded-md bg-[#dfe3e7] px-4 py-3 pr-10 text-sm text-gray-900 focus:outline-none"
                            >
                                {POINT_OPTIONS.map((p) => (
                                    <option key={p} value={p}>
                                        {p === 0 ? "No points" : p}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-700" />
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-gray-800">Due</p>
                        <div className="relative mt-2">
                            <select
                                value={due}
                                onChange={(e) => setDue(e.target.value as DueOption)}
                                className="w-full appearance-none rounded-md bg-[#f1f3f4] px-4 py-3 pr-10 text-sm text-gray-900 focus:outline-none"
                            >
                                <option value="none">No due date</option>
                                <option value="tomorrow">Tomorrow</option>
                                <option value="nextweek">Next week</option>
                                <option value="custom">Pick a date…</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-700" />
                        </div>
                        {due === "custom" && (
                            <input
                                type="date"
                                value={customDate}
                                onChange={(e) => setCustomDate(e.target.value)}
                                className="mt-2 w-full rounded-md border border-gray-400/80 px-4 py-2.5 text-sm text-gray-900 focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                            />
                        )}
                    </div>
                </aside>
            </div>

            {/* Link dialog */}
            {linkDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <h2 className="text-xl text-gray-900">Add link</h2>
                        <div className="mt-6">
                            <div
                                className={`relative rounded-t border-b-2 bg-[#dfe3ea] ${linkError ? "border-[#d93025]" : "border-gray-500"
                                    }`}
                            >
                                <input
                                    autoFocus
                                    value={linkValue}
                                    placeholder=" "
                                    onChange={(e) => setLinkValue(e.target.value)}
                                    onBlur={() => setLinkTouched(true)}
                                    className="peer w-full bg-transparent px-4 pb-2 pt-6 text-base text-gray-900 focus:outline-none"
                                />
                                <span
                                    className={`pointer-events-none absolute left-4 top-1.5 text-xs transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base ${linkError ? "text-[#d93025]" : "text-gray-700"
                                        }`}
                                >
                                    Link*
                                </span>
                            </div>
                            {linkError && <p className="mt-2 px-1 text-sm text-[#d93025]">Please enter a valid link</p>}
                        </div>
                        <div className="mt-8 flex justify-end gap-8">
                            <button
                                type="button"
                                onClick={() => setLinkDialogOpen(false)}
                                className="cursor-pointer text-sm font-medium text-[#1a73e8] hover:underline"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={!linkValid}
                                onClick={confirmAddLink}
                                className={`text-sm font-medium ${linkValid
                                    ? "cursor-pointer text-[#1a73e8] hover:underline"
                                    : "cursor-default text-gray-400"
                                    }`}
                            >
                                Add link
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}