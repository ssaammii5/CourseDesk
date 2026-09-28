"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    Check,
    ChevronDown,
    ClipboardList,
    Clock,
    Edit2,
    FileText,
    FolderKanban,
    Globe,
    Link2,
    Loader2,
    Paperclip,
    Plus,
    Save,
    Search,
    Sparkles,
    Tag,
    Trash2,
    Upload,
    UserCheck,
    Users,
    UsersRound,
    UserX,
    Video,
    X,
} from "lucide-react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { renameCourseTopicRequest, deleteCourseTopicRequest } from "@/lib/api/assignments";
import { getCoursePeopleRequest } from "@/lib/api/courses";
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
    onTopicRenamed?: (oldName: string, newName: string) => void;
    onTopicDeleted?: (deletedName: string, fallbackName: string) => void;
    enrolledLearners?: { id: number; name: string; email: string }[];
}

const DEFAULT_FALLBACK_TOPICS = ["General"];
const LEGACY_SAMPLE_TOPICS = new Set([
    "Research & Paper",
    "Cryptography Labs",
    "Cryptography Theory",
    "Software Security",
    "Examinations",
]);

const POINT_PRESETS = [100, 50, 30, 25, 10, 0];
type DueOption = "none" | "tomorrow" | "nextweek" | "custom";

function formatShort(d: Date): string {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function toLocalDatetimeInputValue(utcIsoString?: string): string {
    if (!utcIsoString) return "";
    try {
        const d = new Date(utcIsoString);
        if (isNaN(d.getTime())) return "";
        const pad = (n: number) => String(n).padStart(2, "0");
        const year = d.getFullYear();
        const month = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        const hours = pad(d.getHours());
        const minutes = pad(d.getMinutes());
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
        return "";
    }
}

function defaultCustomDate(): string {
    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    d.setHours(23, 59, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
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
    courseId,
    sessions = [],
    existingTopics = DEFAULT_FALLBACK_TOPICS,
    onTopicRenamed,
    onTopicDeleted,
    enrolledLearners,
}: AssignmentCreateViewProps) {
    const isEditing = Boolean(initial && initial.id > 0);

    const [title, setTitle] = useState(initial?.title ?? "");
    const [titleTouched, setTitleTouched] = useState(false);
    const [instructions, setInstructions] = useState(initial?.description ?? "");
    const [topic, setTopic] = useState(initial?.topic ?? "General");

    // Audience / Assignment Scope (all, selective, exclude)
    const [assignMode, setAssignMode] = useState<"all" | "selective" | "exclude">(
        initial?.assignMode ?? "all"
    );
    const [targetLearnerIds, setTargetLearnerIds] = useState<number[]>(
        initial?.targetLearnerIds ?? []
    );
    const [enrolledStudents, setEnrolledStudents] = useState<{ id: number; name: string; email: string }[]>(
        enrolledLearners ?? []
    );
    const [loadingLearners, setLoadingLearners] = useState(false);
    const [isLearnerPickerOpen, setIsLearnerPickerOpen] = useState(false);
    const [learnerSearch, setLearnerSearch] = useState("");

    useEffect(() => {
        if (!courseId) return;
        let cancelled = false;
        setLoadingLearners(true);
        getCoursePeopleRequest(courseId)
            .then((data) => {
                if (cancelled) return;
                const list = (data.learners || data.students || []).map((p) => ({
                    id: p.id,
                    name: p.name,
                    email: p.email,
                }));
                setEnrolledStudents(list);
            })
            .catch((err) => {
                console.error("Failed to load course learners", err);
            })
            .finally(() => {
                if (!cancelled) setLoadingLearners(false);
            });
        return () => {
            cancelled = true;
        };
    }, [courseId]);

    const toggleLearner = (id: number) => {
        setTargetLearnerIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const selectAllLearners = () => {
        setTargetLearnerIds(enrolledStudents.map((s) => s.id));
    };

    const clearAllLearners = () => {
        setTargetLearnerIds([]);
    };

    const filteredLearners = useMemo(() => {
        if (!learnerSearch.trim()) return enrolledStudents;
        const q = learnerSearch.toLowerCase();
        return enrolledStudents.filter(
            (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
        );
    }, [enrolledStudents, learnerSearch]);

    const effectiveAssignedCount = useMemo(() => {
        if (assignMode === "all") return enrolledStudents.length;
        if (assignMode === "selective") return targetLearnerIds.length;
        if (assignMode === "exclude") return Math.max(0, enrolledStudents.length - targetLearnerIds.length);
        return enrolledStudents.length;
    }, [assignMode, enrolledStudents.length, targetLearnerIds.length]);

    // Dynamic Topic Management
    const [topicList, setTopicList] = useState<string[]>(() => {
        let saved: string[] | null = null;
        let deleted: string[] = [];
        if (typeof window !== "undefined" && courseId) {
            try {
                const raw = localStorage.getItem(`coursedesk_topics_${courseId}`);
                if (raw) saved = JSON.parse(raw);
                const rawDel = localStorage.getItem(`coursedesk_deleted_topics_${courseId}`);
                if (rawDel) deleted = JSON.parse(rawDel);
            } catch {
                // ignore
            }
        }
        const deletedSet = new Set(deleted);
        const existingSet = new Set((existingTopics || []).filter(Boolean));

        // Base topics from saved custom list or currently existing topics in course
        const sourceList = saved ?? Array.from(new Set(["General", ...(existingTopics || [])]));

        // Filter out deleted topics and legacy demo topics that are not used by any assignment
        const combined = Array.from(
            new Set([...sourceList, initial?.topic || "General"])
        ).filter((t) => {
            if (!t) return false;
            if (deletedSet.has(t)) return false;
            if (LEGACY_SAMPLE_TOPICS.has(t) && !existingSet.has(t) && initial?.topic !== t) {
                return false;
            }
            return true;
        });

        if (!combined.includes("General")) {
            combined.unshift("General");
        }
        return combined;
    });

    const [newTopicInput, setNewTopicInput] = useState("");
    const [editingTopic, setEditingTopic] = useState<string | null>(null);
    const [editingTopicValue, setEditingTopicValue] = useState("");
    const [deletingTopic, setDeletingTopic] = useState<string | null>(null);
    const [topicActionLoading, setTopicActionLoading] = useState(false);
    const [topicFeedback, setTopicFeedback] = useState<string | null>(null);

    const showTopicFeedback = (msg: string) => {
        setTopicFeedback(msg);
        setTimeout(() => setTopicFeedback(null), 3500);
    };

    const handleAddTopic = () => {
        const trimmed = newTopicInput.trim();
        if (!trimmed) return;
        if (!topicList.includes(trimmed)) {
            const nextList = [...topicList, trimmed];
            setTopicList(nextList);
            if (typeof window !== "undefined" && courseId) {
                try {
                    localStorage.setItem(`coursedesk_topics_${courseId}`, JSON.stringify(nextList));
                    const rawDel = localStorage.getItem(`coursedesk_deleted_topics_${courseId}`);
                    if (rawDel) {
                        const delList: string[] = JSON.parse(rawDel);
                        const nextDel = delList.filter((d) => d !== trimmed);
                        localStorage.setItem(`coursedesk_deleted_topics_${courseId}`, JSON.stringify(nextDel));
                    }
                } catch {
                    // ignore
                }
            }
        }
        setTopic(trimmed);
        setNewTopicInput("");
        showTopicFeedback(`Topic "${trimmed}" added and selected.`);
    };

    const handleStartRename = (t: string) => {
        setEditingTopic(t);
        setEditingTopicValue(t);
        setDeletingTopic(null);
    };

    const handleSaveRename = async (oldName: string) => {
        const trimmed = editingTopicValue.trim();
        if (!trimmed || trimmed === oldName) {
            setEditingTopic(null);
            return;
        }

        try {
            setTopicActionLoading(true);
            if (courseId) {
                await renameCourseTopicRequest(courseId, oldName, trimmed);
            }

            const nextList = topicList.map((t) => (t === oldName ? trimmed : t));
            setTopicList(nextList);
            if (topic === oldName) {
                setTopic(trimmed);
            }
            if (typeof window !== "undefined" && courseId) {
                try {
                    localStorage.setItem(`coursedesk_topics_${courseId}`, JSON.stringify(nextList));
                    const rawDel = localStorage.getItem(`coursedesk_deleted_topics_${courseId}`);
                    const delList: string[] = rawDel ? JSON.parse(rawDel) : [];
                    if (!delList.includes(oldName)) {
                        delList.push(oldName);
                        localStorage.setItem(`coursedesk_deleted_topics_${courseId}`, JSON.stringify(delList));
                    }
                } catch {
                    // ignore
                }
            }
            onTopicRenamed?.(oldName, trimmed);
            showTopicFeedback(`Renamed "${oldName}" to "${trimmed}" across all assignments.`);
            setEditingTopic(null);
        } catch (err: any) {
            alert(err?.message || "Failed to rename topic");
        } finally {
            setTopicActionLoading(false);
        }
    };

    const handleConfirmDelete = async (topicToDelete: string) => {
        if (topicToDelete === "General") {
            alert("The 'General' topic cannot be deleted as it serves as the default fallback.");
            setDeletingTopic(null);
            return;
        }

        try {
            setTopicActionLoading(true);
            if (courseId) {
                await deleteCourseTopicRequest(courseId, topicToDelete, "General");
            }

            const nextList = topicList.filter((t) => t !== topicToDelete);
            setTopicList(nextList);
            if (topic === topicToDelete) {
                setTopic("General");
            }
            if (typeof window !== "undefined" && courseId) {
                try {
                    localStorage.setItem(`coursedesk_topics_${courseId}`, JSON.stringify(nextList));
                    const rawDel = localStorage.getItem(`coursedesk_deleted_topics_${courseId}`);
                    const delList: string[] = rawDel ? JSON.parse(rawDel) : [];
                    if (!delList.includes(topicToDelete)) {
                        delList.push(topicToDelete);
                        localStorage.setItem(`coursedesk_deleted_topics_${courseId}`, JSON.stringify(delList));
                    }
                } catch {
                    // ignore
                }
            }
            onTopicDeleted?.(topicToDelete, "General");
            showTopicFeedback(`Deleted "${topicToDelete}". Assignments moved to "General".`);
            setDeletingTopic(null);
        } catch (err: any) {
            alert(err?.message || "Failed to delete topic");
        } finally {
            setTopicActionLoading(false);
        }
    };

    const [attachments, setAttachments] = useState<AssignmentDraftAttachment[]>(() => {
        if (!initial?.attachments) return [];
        return initial.attachments.map((att) => ({
            id: att.id,
            title: att.fileName || (att as any).title || "Attachment",
            kind: (att.kind === "link" ? "link" : "file") as "file" | "link",
            fileType: att.fileType,
            url: att.url ?? undefined,
        }));
    });

    const [points, setPoints] = useState(initial?.maxMarks ?? 100);
    const [due, setDue] = useState<DueOption>(initial?.deadlineUtc ? "custom" : "nextweek");
    const [customDate, setCustomDate] = useState(() => {
        if (!initial?.deadlineUtc) {
            return defaultCustomDate();
        }
        return toLocalDatetimeInputValue(initial.deadlineUtc) || defaultCustomDate();
    });

    const [datePart, timePart] = useMemo(() => {
        if (!customDate) {
            const def = defaultCustomDate();
            return [def.split("T")[0], "23:59"];
        }
        const [d, t] = customDate.split("T");
        return [d || defaultCustomDate().split("T")[0], t || "23:59"];
    }, [customDate]);

    const handleDateChange = (newDate: string) => {
        if (!newDate) {
            setCustomDate("");
            return;
        }
        // Initial time is 11:59 PM (23:59) by default on any date
        const time = timePart && timePart !== "00:00" ? timePart : "23:59";
        setCustomDate(`${newDate}T${time}`);
    };

    const handleTimeChange = (newTime: string) => {
        const time = newTime || "23:59";
        const date = datePart || defaultCustomDate().split("T")[0];
        setCustomDate(`${date}T${time}`);
    };

    // Associated session
    const [selectedSessionId, setSelectedSessionId] = useState<number | "none">(
        initial?.sessionId ?? "none"
    );

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
        sessionId: selectedSessionId === "none" ? null : selectedSessionId,
        assignMode,
        targetLearnerIds,
    });

    const submit = (status: "Assigned" | "Draft") => {
        setAssignMenuOpen(false);
        if (!titleValid) {
            setTitleTouched(true);
            return;
        }
        onSubmit(buildEntry(status), attachments);
    };

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
                                className={`inline-flex items-center gap-2 rounded-l-xl px-5 py-2.5 text-xs font-bold text-white transition-all ${titleValid
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
                                className={`inline-flex items-center rounded-r-xl border-l border-white/20 px-2 py-2.5 text-white transition-colors ${titleValid
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
                                className={`w-full rounded-2xl border px-4 py-3.5 text-base sm:text-lg font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${showTitleError
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

                            {/* Assign To (Who receives this assignment) */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Assign To
                                    </label>
                                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                        {loadingLearners ? "Loading..." : `${enrolledStudents.length} enrolled`}
                                    </span>
                                </div>

                                {/* Mode Selector Buttons */}
                                <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAssignMode("all");
                                            setIsLearnerPickerOpen(false);
                                        }}
                                        className={`cursor-pointer rounded-xl py-2 px-1 text-center font-medium transition-all ${assignMode === "all"
                                                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs"
                                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                                            }`}
                                    >
                                        All learners
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAssignMode("selective");
                                            setIsLearnerPickerOpen(true);
                                        }}
                                        className={`cursor-pointer rounded-xl py-2 px-1 text-center font-medium transition-all ${assignMode === "selective"
                                                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs"
                                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                                            }`}
                                    >
                                        Selective
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAssignMode("exclude");
                                            setIsLearnerPickerOpen(true);
                                        }}
                                        className={`cursor-pointer rounded-xl py-2 px-1 text-center font-medium transition-all ${assignMode === "exclude"
                                                ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 font-semibold shadow-xs"
                                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                                            }`}
                                    >
                                        All except
                                    </button>
                                </div>

                                {/* Audience Status Pill & Trigger */}
                                <div className="mt-2.5">
                                    {assignMode === "all" ? (
                                        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/40 bg-emerald-50/60 dark:bg-emerald-950/30 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                                            <UsersRound className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            <span>All {enrolledStudents.length} enrolled learners assigned</span>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setIsLearnerPickerOpen((prev) => !prev)}
                                            className={`w-full flex items-center justify-between gap-2.5 rounded-2xl border px-3.5 py-2.5 text-xs font-semibold transition-all cursor-pointer ${assignMode === "selective"
                                                    ? "border-indigo-200/80 dark:border-indigo-800/50 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                                                    : "border-amber-200/80 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                {assignMode === "selective" ? (
                                                    <UserCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                                ) : (
                                                    <UserX className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                                )}
                                                <span className="truncate">
                                                    {assignMode === "selective"
                                                        ? `${targetLearnerIds.length} of ${enrolledStudents.length} learners selected`
                                                        : `All except ${targetLearnerIds.length} learners (${effectiveAssignedCount} assigned)`}
                                                </span>
                                            </div>
                                            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">
                                                {isLearnerPickerOpen ? "Hide list" : "Select learners"}
                                            </span>
                                        </button>
                                    )}
                                </div>

                                {/* Expandable Learner Picker */}
                                {assignMode !== "all" && isLearnerPickerOpen && (
                                    <div className="mt-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/80 p-3 space-y-3 animate-in fade-in duration-150">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                {assignMode === "selective"
                                                    ? "Select learners to include"
                                                    : "Select learners to exclude"}
                                            </span>
                                            <div className="flex items-center gap-2 text-[11px]">
                                                <button
                                                    type="button"
                                                    onClick={selectAllLearners}
                                                    className="cursor-pointer font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                                                >
                                                    Select all
                                                </button>
                                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                                <button
                                                    type="button"
                                                    onClick={clearAllLearners}
                                                    className="cursor-pointer font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:underline"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        </div>

                                        {/* Search Filter */}
                                        <div className="relative">
                                            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                            <input
                                                type="text"
                                                value={learnerSearch}
                                                onChange={(e) => setLearnerSearch(e.target.value)}
                                                placeholder="Search student by name or email..."
                                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 pl-8 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                                            />
                                        </div>

                                        {/* Students Checklist List */}
                                        <div className="max-h-52 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                                            {filteredLearners.length === 0 ? (
                                                <p className="py-3 text-center text-xs text-slate-400 italic">
                                                    {enrolledStudents.length === 0
                                                        ? "No learners enrolled in this course yet."
                                                        : "No matching learners found."}
                                                </p>
                                            ) : (
                                                filteredLearners.map((student) => {
                                                    const isChecked = targetLearnerIds.includes(student.id);
                                                    return (
                                                        <label
                                                            key={student.id}
                                                            className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-colors text-left select-none ${isChecked
                                                                    ? assignMode === "selective"
                                                                        ? "bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200"
                                                                        : "bg-amber-50/80 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200"
                                                                    : "hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                                                                }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => toggleLearner(student.id)}
                                                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs font-semibold truncate leading-tight">
                                                                    {student.name}
                                                                </p>
                                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                                                    {student.email}
                                                                </p>
                                                            </div>
                                                        </label>
                                                    );
                                                })
                                            )}
                                        </div>

                                        {/* Done button */}
                                        <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-700/80">
                                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                {assignMode === "selective"
                                                    ? `${targetLearnerIds.length} of ${enrolledStudents.length} selected`
                                                    : `${targetLearnerIds.length} excluded (${effectiveAssignedCount} assigned)`}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setIsLearnerPickerOpen(false)}
                                                className="cursor-pointer rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 text-xs font-semibold transition-colors"
                                            >
                                                Done
                                            </button>
                                        </div>
                                    </div>
                                )}
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

                        {/* Grading & Marks */}
                        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Grading & Marks
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setPoints(points > 0 ? 0 : 100)}
                                    className={`cursor-pointer rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${points === 0
                                            ? "border border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                            : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400"
                                        }`}
                                >
                                    {points === 0 ? "✓ Ungraded" : "Mark as Ungraded"}
                                </button>
                            </div>

                            {/* Preset Buttons */}
                            <div className="grid grid-cols-3 gap-2">
                                {POINT_PRESETS.map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPoints(p)}
                                        className={`rounded-xl py-2 text-xs font-semibold border transition-all cursor-pointer ${points === p
                                                ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700 shadow-2xs"
                                                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                            }`}
                                    >
                                        {p === 0 ? "Ungraded" : `Marks: ${p}`}
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
                                    disabled={points === 0}
                                    value={points === 0 ? "" : points}
                                    placeholder={points === 0 ? "Ungraded assignment" : "Enter max marks"}
                                    onChange={(e) => setPoints(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
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
                                        onClick={() => {
                                            setDue(opt.id);
                                            if (opt.id === "custom") {
                                                if (!customDate) {
                                                    setCustomDate(defaultCustomDate());
                                                } else {
                                                    const [d] = customDate.split("T");
                                                    const date = d || defaultCustomDate().split("T")[0];
                                                    // Ensure initial time is 11:59 PM on any date
                                                    const time = timePart && timePart !== "00:00" ? timePart : "23:59";
                                                    setCustomDate(`${date}T${time}`);
                                                }
                                            }
                                        }}
                                        className={`rounded-xl py-2 px-2.5 text-xs font-semibold border transition-all text-center cursor-pointer ${due === opt.id
                                                ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700 shadow-2xs"
                                                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {due === "custom" && (
                                <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                                                <Calendar className="h-3 w-3 text-indigo-500" />
                                                <span>Due Date</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={datePart}
                                                onChange={(e) => handleDateChange(e.target.value)}
                                                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                                                <Clock className="h-3 w-3 text-indigo-500" />
                                                <span>Due Time (11:59 PM default)</span>
                                            </label>
                                            <input
                                                type="time"
                                                value={timePart || "23:59"}
                                                onChange={(e) => handleTimeChange(e.target.value)}
                                                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
                                        <span>Initial time is 11:59 PM for any chosen date</span>
                                        <button
                                            type="button"
                                            onClick={() => handleTimeChange("23:59")}
                                            className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                                        >
                                            Reset to 11:59 PM
                                        </button>
                                    </div>
                                </div>
                            )}

                            {dueDate && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
                                    <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                    <span>Due on {formatShort(dueDate)}</span>
                                </p>
                            )}
                        </div>

                        {/* Topic Category Management */}
                        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                        Topic Category
                                    </h3>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                        Select, modify, or delete topics across course assignments.
                                    </p>
                                </div>
                                <Tag className="h-4 w-4 text-indigo-500 shrink-0" />
                            </div>

                            {/* Status Feedback Notification */}
                            {topicFeedback && (
                                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-2.5 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-2 animate-in fade-in duration-200">
                                    <span className="font-medium">{topicFeedback}</span>
                                    <button
                                        type="button"
                                        onClick={() => setTopicFeedback(null)}
                                        className="text-emerald-500 hover:text-emerald-700 cursor-pointer"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )}

                            {/* Topic Badges with Inline Rename and Delete */}
                            <div className="flex flex-wrap gap-2">
                                {topicList.map((t) => {
                                    const isSelected = topic === t;
                                    const isEditingThis = editingTopic === t;
                                    const isDeletingThis = deletingTopic === t;

                                    if (isEditingThis) {
                                        return (
                                            <div
                                                key={t}
                                                className="flex items-center gap-1.5 rounded-xl border border-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60 px-2 py-1 shadow-2xs"
                                            >
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    value={editingTopicValue}
                                                    onChange={(e) => setEditingTopicValue(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            handleSaveRename(t);
                                                        } else if (e.key === "Escape") {
                                                            setEditingTopic(null);
                                                        }
                                                    }}
                                                    className="w-36 text-xs font-semibold bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg px-2 py-0.5 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                                <button
                                                    type="button"
                                                    disabled={topicActionLoading}
                                                    onClick={() => handleSaveRename(t)}
                                                    title="Save new topic name everywhere"
                                                    className="p-1 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 cursor-pointer disabled:opacity-50"
                                                >
                                                    {topicActionLoading ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Check className="h-3.5 w-3.5" />
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={topicActionLoading}
                                                    onClick={() => setEditingTopic(null)}
                                                    title="Cancel"
                                                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        );
                                    }

                                    if (isDeletingThis) {
                                        return (
                                            <div
                                                key={t}
                                                className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 text-xs text-rose-700 dark:text-rose-300 shadow-2xs animate-in fade-in duration-150"
                                            >
                                                <span className="font-medium text-[11px]">Delete "{t}"?</span>
                                                <button
                                                    type="button"
                                                    disabled={topicActionLoading}
                                                    onClick={() => handleConfirmDelete(t)}
                                                    className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700 cursor-pointer disabled:opacity-50"
                                                >
                                                    {topicActionLoading ? (
                                                        <Loader2 className="h-3 w-3 animate-spin inline" />
                                                    ) : (
                                                        "Confirm"
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={topicActionLoading}
                                                    onClick={() => setDeletingTopic(null)}
                                                    className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={t}
                                            className={`group inline-flex items-center gap-1 rounded-xl border transition-all ${isSelected
                                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700 shadow-2xs font-semibold"
                                                    : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40"
                                                }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setTopic(t)}
                                                className="px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer"
                                            >
                                                {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />}
                                                <span>{t}</span>
                                            </button>

                                            <div className="flex items-center pr-1.5 gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStartRename(t);
                                                    }}
                                                    title={`Rename topic "${t}" everywhere across course`}
                                                    className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 cursor-pointer"
                                                >
                                                    <Edit2 className="h-3 w-3" />
                                                </button>
                                                {t !== "General" && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeletingTopic(t);
                                                            setEditingTopic(null);
                                                        }}
                                                        title={`Delete topic "${t}"`}
                                                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 cursor-pointer"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Create / Custom Topic Input */}
                            <div className="pt-1">
                                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                                    Or type a custom topic name
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={newTopicInput}
                                        placeholder="Write down custom topic name..."
                                        onChange={(e) => setNewTopicInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAddTopic();
                                            }
                                        }}
                                        className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddTopic}
                                        disabled={!newTopicInput.trim()}
                                        className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3.5 py-2 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        <span>Add</span>
                                    </button>
                                </div>
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