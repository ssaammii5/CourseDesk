"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    Award,
    Calendar,
    Check,
    CheckCircle2,
    ChevronRight,
    Clock,
    Download,
    ExternalLink,
    Eye,
    FileArchive,
    FileCode,
    FileSpreadsheet,
    FileText,
    Globe,
    Image as ImageIcon,
    Info,
    Link2,
    Lock,
    MessageSquare,
    Paperclip,
    Plus,
    RotateCcw,
    Send,
    Sparkles,
    Trash2,
    UploadCloud,
    User,
    X,
} from "lucide-react";
import { RichTextContent } from "@/components/ui";
import {
    deleteSubmissionAttachmentRequest,
    getOrCreateDraftSubmissionRequest,
    submitAssignmentRequest,
    unsubmitSubmissionRequest,
    uploadSubmissionAttachmentRequest,
} from "@/lib/api/submissions";
import { API_URL } from "@/lib/api/client";
import { initialOf } from "@/lib/utils/format";
import type { AssignmentDetail } from "@/types";
import { AssignmentComments } from "../components/AssignmentComments";

export interface AssignmentDetailViewProps {
    detail: AssignmentDetail;
    readOnly?: boolean;
    onRefresh?: () => void;
}

export interface AssignmentAttachment {
    id: number;
    title: string;
    fileType: string;
    thumbClass: string;
    url?: string;
    kind?: "file" | "link";
    file?: File;
}

type WorkStatus = "Assigned" | "Draft" | "Submitted" | "Turned in" | "Graded" | "Missed";

const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "avif"];
const TEXT_EXTS = ["txt", "md", "csv", "json", "log", "js", "ts", "jsx", "tsx", "html", "css", "xml", "yml", "yaml", "py", "sql", "sh"];
const DOC_EXTS = ["doc", "docx", "odt", "rtf"];
const SHEET_EXTS = ["xls", "xlsx", "ods"];
const ARCHIVE_EXTS = ["zip", "rar", "7z", "tar", "gz"];

function extOf(name: string): string {
    const i = name.lastIndexOf(".");
    return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

function isValidLink(value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed) return false;
    return /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}([/?#]\S*)?$/i.test(trimmed);
}

function getFileVisual(fileName: string, kind?: "file" | "link") {
    if (kind === "link") {
        return {
            icon: Globe,
            bgClass: "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400",
            borderClass: "border-sky-200 dark:border-sky-800/40",
            badgeClass: "bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300",
            label: "LINK",
        };
    }
    const ext = extOf(fileName);
    if (ext === "pdf") {
        return {
            icon: FileText,
            bgClass: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400",
            borderClass: "border-rose-200 dark:border-rose-800/40",
            badgeClass: "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300",
            label: "PDF",
        };
    }
    if (DOC_EXTS.includes(ext)) {
        return {
            icon: FileText,
            bgClass: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400",
            borderClass: "border-blue-200 dark:border-blue-800/40",
            badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300",
            label: ext.toUpperCase(),
        };
    }
    if (SHEET_EXTS.includes(ext)) {
        return {
            icon: FileSpreadsheet,
            bgClass: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400",
            borderClass: "border-emerald-200 dark:border-emerald-800/40",
            badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
            label: ext.toUpperCase(),
        };
    }
    if (ARCHIVE_EXTS.includes(ext)) {
        return {
            icon: FileArchive,
            bgClass: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400",
            borderClass: "border-amber-200 dark:border-amber-800/40",
            badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
            label: ext.toUpperCase(),
        };
    }
    if (IMAGE_EXTS.includes(ext)) {
        return {
            icon: ImageIcon,
            bgClass: "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400",
            borderClass: "border-purple-200 dark:border-purple-800/40",
            badgeClass: "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300",
            label: ext.toUpperCase(),
        };
    }
    if (["js", "ts", "jsx", "tsx", "py", "json", "html", "css", "sql", "sh"].includes(ext)) {
        return {
            icon: FileCode,
            bgClass: "bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400",
            borderClass: "border-violet-200 dark:border-violet-800/40",
            badgeClass: "bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300",
            label: ext.toUpperCase(),
        };
    }
    return {
        icon: FileText,
        bgClass: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
        borderClass: "border-slate-200 dark:border-slate-700",
        badgeClass: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        label: (ext || "FILE").toUpperCase(),
    };
}

export function AssignmentDetailView({ detail, readOnly = false, onRefresh }: AssignmentDetailViewProps) {
    const initialStatus = (detail.submission.status as WorkStatus) || "Assigned";
    const [status, setStatus] = useState<WorkStatus>(initialStatus);
    const [submissionId, setSubmissionId] = useState<number | undefined>(detail.submission.id);
    const [attachments, setAttachments] = useState<AssignmentAttachment[]>(
        detail.submission.attachments ?? []
    );
    const [uploading, setUploading] = useState(false);
    const [submittingWork, setSubmittingWork] = useState(false);
    const [addMenuOpen, setAddMenuOpen] = useState(false);
    const [turnInOpen, setTurnInOpen] = useState(false);
    const [unsubmitOpen, setUnsubmitOpen] = useState(false);
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkValue, setLinkValue] = useState("");
    const [linkTouched, setLinkTouched] = useState(false);
    const [viewerAttachment, setViewerAttachment] = useState<AssignmentAttachment | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const turnedIn = status === "Turned in" || status === "Submitted";
    const isMissed = status === "Missed";
    const isGraded = status === "Graded";
    const isDraft = (status === "Draft" || attachments.length > 0) && !turnedIn && !isGraded && !isMissed;
    const linkValid = isValidLink(linkValue);
    const linkError = linkTouched && !linkValid;

    const [submissionMarks, setSubmissionMarks] = useState<number | null | undefined>(detail.submission.marks);
    const [submissionFeedback, setSubmissionFeedback] = useState<string | null | undefined>(detail.submission.feedback);
    const [gradedByName, setGradedByName] = useState<string | null | undefined>(detail.submission.gradedByName);
    const [gradedAtUtc, setGradedAtUtc] = useState<string | null | undefined>(detail.submission.gradedAtUtc);

    useEffect(() => {
        const nextStatus = (detail.submission.status as WorkStatus) || "Assigned";
        setStatus(nextStatus);
        setSubmissionId(detail.submission.id);
        setAttachments(detail.submission.attachments ?? []);
        setSubmissionMarks(detail.submission.marks);
        setSubmissionFeedback(detail.submission.feedback);
        setGradedByName(detail.submission.gradedByName);
        setGradedAtUtc(detail.submission.gradedAtUtc);
    }, [detail.submission]);

    const getEnsuredSubmissionId = async (): Promise<number> => {
        if (submissionId) return submissionId;
        const draft = await getOrCreateDraftSubmissionRequest({ assignmentId: detail.id });
        setSubmissionId(draft.id);
        return draft.id;
    };

    const openFilePicker = () => {
        setAddMenuOpen(false);
        fileInputRef.current?.click();
    };

    const uploadFiles = async (files: File[]) => {
        if (files.length === 0) return;
        setUploading(true);

        try {
            const subId = await getEnsuredSubmissionId();
            for (const f of files) {
                const fd = new FormData();
                fd.append("file", f);
                const created = await uploadSubmissionAttachmentRequest(subId, fd);
                setAttachments((prev) => [
                    ...prev,
                    {
                        id: created.id,
                        title: created.fileName,
                        fileType: created.fileType || (extOf(created.fileName) || "file").toUpperCase(),
                        thumbClass: "bg-gray-100",
                        url: created.url ?? undefined,
                        kind: "file",
                    },
                ]);
            }
            setStatus("Draft");
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error("Failed to upload draft file", err);
        } finally {
            setUploading(false);
        }
    };

    const handleFilesInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        e.target.value = "";
        await uploadFiles(files);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!turnedIn && !isMissed && !isGraded && !readOnly) {
            setIsDraggingOver(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        if (turnedIn || isMissed || isGraded || readOnly) return;
        const files = Array.from(e.dataTransfer.files ?? []);
        if (files.length > 0) {
            await uploadFiles(files);
        }
    };

    const openLinkDialog = () => {
        setAddMenuOpen(false);
        setLinkValue("");
        setLinkTouched(false);
        setLinkDialogOpen(true);
    };

    const closeLinkDialog = () => setLinkDialogOpen(false);

    const confirmAddLink = async () => {
        if (!linkValid) return;
        const typed = linkValue.trim();
        const normalized = /^https?:\/\//.test(typed) ? typed : `https://${typed}`;
        setLinkDialogOpen(false);
        setUploading(true);

        try {
            const subId = await getEnsuredSubmissionId();
            const fd = new FormData();
            fd.append("linkUrl", normalized);
            fd.append("linkTitle", typed);
            const created = await uploadSubmissionAttachmentRequest(subId, fd);
            setAttachments((prev) => [
                ...prev,
                {
                    id: created.id,
                    title: created.fileName,
                    fileType: "Link",
                    thumbClass: "bg-gray-100",
                    url: created.url ?? normalized,
                    kind: "link",
                },
            ]);
            setStatus("Draft");
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error("Failed to add draft link", err);
        } finally {
            setUploading(false);
        }
    };

    const removeAttachment = async (id: number) => {
        const next = attachments.filter((a) => a.id !== id);
        setAttachments(next);
        if (next.length === 0) {
            setStatus("Assigned");
        }
        if (submissionId) {
            try {
                await deleteSubmissionAttachmentRequest(submissionId, id);
                if (onRefresh) onRefresh();
            } catch (err) {
                console.error("Failed to delete attachment from server", err);
            }
        }
    };

    const handlePrimary = () => {
        if (attachments.length > 0) {
            setTurnInOpen(true);
        } else {
            void confirmTurnIn();
        }
    };

    const confirmTurnIn = async () => {
        setTurnInOpen(false);
        setSubmittingWork(true);
        setStatus("Turned in");
        try {
            await submitAssignmentRequest({
                assignmentId: detail.id,
                answer: attachments.length > 0 ? "Submitted via file attachment" : "Marked as done",
            });
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error("Submission failed", err);
            setStatus(attachments.length > 0 ? "Draft" : "Assigned");
        } finally {
            setSubmittingWork(false);
        }
    };

    const confirmUnsubmit = async () => {
        setUnsubmitOpen(false);
        setSubmittingWork(true);
        setStatus("Assigned");
        try {
            const subId = await getEnsuredSubmissionId();
            const res = await unsubmitSubmissionRequest(subId);
            if (res.attachments) {
                setAttachments(
                    res.attachments.map((att) => ({
                        id: att.id,
                        title: att.fileName,
                        fileType: att.fileType,
                        thumbClass: "bg-gray-100",
                        url: att.url ?? undefined,
                        kind: (att.kind === "link" ? "link" : "file") as "file" | "link",
                    }))
                );
            }
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error("Unsubmit failed", err);
            setStatus("Turned in");
        } finally {
            setSubmittingWork(false);
        }
    };

    const instructorLabel = detail.instructorName || detail.teacherName || "Instructor";

    // Format deadline badge and overdue detection
    const isPastDue = detail.deadlineUtc ? new Date(detail.deadlineUtc).getTime() < Date.now() : false;

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/60 dark:bg-slate-950">
            {/* Hidden file input */}
            {!readOnly && (
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFilesInput}
                />
            )}

            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Top navigation row */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href={detail.courseId ? `/course/${detail.courseId}?tab=coursework` : "/courses"}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium text-slate-600 transition-all hover:bg-white hover:text-blue-600 hover:shadow-2xs dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to Coursework</span>
                    </Link>

                    {detail.topic && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            {detail.topic}
                        </span>
                    )}
                </div>

                {/* Main 2-column layout */}
                <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                    {/* Left Column: Assignment Details, Instructions, Materials, Comments */}
                    <div className="space-y-6 lg:col-span-8">
                        {/* Assignment Header Card */}
                        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-shadow dark:border-slate-800 dark:bg-slate-900 sm:p-8">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
                                        <Sparkles className="h-3 w-3" />
                                        {detail.kind || "Assignment"}
                                    </span>
                                    {detail.courseName && (
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {detail.courseName}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {isGraded ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/60 dark:border-emerald-800/50 dark:text-emerald-300">
                                            <Award className="h-3.5 w-3.5" />
                                            Graded: {submissionMarks ?? 0} / {detail.points}
                                        </span>
                                    ) : turnedIn ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200/80 dark:bg-indigo-950/60 dark:border-indigo-800/50 dark:text-indigo-300">
                                            <Check className="h-3.5 w-3.5" />
                                            Turned In
                                        </span>
                                    ) : isMissed ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200/80 dark:bg-rose-950/60 dark:border-rose-800/50 dark:text-rose-300">
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            Missed
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                            Assigned
                                        </span>
                                    )}
                                </div>
                            </div>

                            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
                                {detail.title}
                            </h1>

                            {/* Author & Metas */}
                            <div className="mt-5 flex flex-wrap items-center gap-y-3 gap-x-6 border-b border-slate-100 pb-6 text-sm text-slate-600 dark:border-slate-800/80 dark:text-slate-400">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-semibold text-white shadow-2xs">
                                        {initialOf(instructorLabel)}
                                    </div>
                                    <span className="font-medium text-slate-800 dark:text-slate-200">
                                        {instructorLabel}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                    <span>Posted {detail.postedDate}</span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <Award className="h-4 w-4 text-amber-500" />
                                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                                        {detail.points > 0 ? `${detail.points} Marks` : "Ungraded"}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <Clock
                                        className={`h-4 w-4 ${isPastDue && !turnedIn && !isGraded
                                                ? "text-rose-500"
                                                : "text-blue-500"
                                            }`}
                                    />
                                    <span
                                        className={
                                            isPastDue && !turnedIn && !isGraded
                                                ? "font-semibold text-rose-600 dark:text-rose-400"
                                                : "font-medium text-slate-700 dark:text-slate-300"
                                        }
                                    >
                                        {detail.dueLabel}
                                    </span>
                                </div>
                            </div>

                            {/* Instructions Section */}
                            <div className="mt-6">
                                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    <FileText className="h-4 w-4 text-blue-500" />
                                    <span>Instructions</span>
                                </div>
                                <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                    <RichTextContent text={detail.description} fallback="No instructions provided for this assignment." />
                                </div>
                            </div>

                            {/* Reference Materials / Attachments from Instructor */}
                            {detail.attachments && detail.attachments.length > 0 && (
                                <div className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-800/80">
                                    <div className="mb-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                            <Paperclip className="h-4 w-4 text-blue-500" />
                                            <span>Reference Materials ({detail.attachments.length})</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {detail.attachments.map((att) => (
                                            <ReferenceMaterialCard
                                                key={att.id}
                                                attachment={att}
                                                onPreview={() => setViewerAttachment(att)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Graded Feedback Card (if Graded) */}
                        {isGraded && (
                            <div className="overflow-hidden rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-white p-6 shadow-xs dark:border-emerald-900/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 sm:p-7">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3.5">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-2xs dark:bg-emerald-900/60 dark:text-emerald-300">
                                            <Award className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                                                Assessment Completed
                                            </span>
                                            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                                {detail.points > 0 ? "Assignment Grade & Feedback" : "Assignment Reviewed"}
                                            </h2>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                                {gradedByName ? `Evaluated by ${gradedByName}` : "Evaluated by your instructor"}
                                                {gradedAtUtc && ` • ${new Date(gradedAtUtc).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-emerald-200 bg-white/90 px-4 py-2.5 text-center shadow-2xs dark:border-emerald-900/60 dark:bg-slate-900/90">
                                        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 block">
                                            Score Obtained
                                        </span>
                                        <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
                                            {detail.points > 0
                                                ? `${submissionMarks ?? 0} / ${detail.points}`
                                                : "Reviewed"}
                                        </span>
                                    </div>
                                </div>

                                {submissionFeedback && (
                                    <div className="mt-5 rounded-xl border border-emerald-200/70 bg-white/90 p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900/90">
                                        <div className="mb-2 flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                Instructor Feedback
                                            </span>
                                        </div>
                                        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                            {submissionFeedback}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Discussion Card */}
                        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-8">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                                    <MessageSquare className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                        Discussion
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Ask questions or share ideas with your teacher and fellow learners.
                                    </p>
                                </div>
                            </div>

                            <AssignmentComments assignmentId={detail.id} isPrivate={false} showTitle={false} />
                        </div>
                    </div>

                    {/* Right Column: "Your Work" Hub & Private Comments */}
                    <div className="space-y-6 lg:col-span-4 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-y-auto lg:pr-1.5 custom-scrollbar overscroll-y-contain">
                        {/* "Your Work" Card */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`relative rounded-2xl border transition-all duration-200 bg-white p-5 sm:p-6 shadow-xs dark:bg-slate-900 ${isDraggingOver
                                    ? "border-blue-500 bg-blue-50/40 ring-4 ring-blue-500/10 dark:border-blue-500 dark:bg-blue-950/30"
                                    : "border-slate-200/90 dark:border-slate-800"
                                }`}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                    Your Work
                                </h2>

                                {isMissed ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-300">
                                        <AlertCircle className="h-3 w-3" />
                                        Missed
                                    </span>
                                ) : isGraded ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-300">
                                        <Award className="h-3 w-3" />
                                        Graded
                                    </span>
                                ) : turnedIn ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/60 dark:text-indigo-300">
                                        <Check className="h-3 w-3" />
                                        Turned in
                                    </span>
                                ) : isDraft ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/60 dark:text-amber-300">
                                        <Clock className="h-3 w-3" />
                                        Draft
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-300">
                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                                        Assigned
                                    </span>
                                )}
                            </div>

                            {/* Missed Warning */}
                            {isMissed && (
                                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200/80 bg-rose-50/80 p-3.5 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-rose-900 dark:text-rose-200">Deadline Passed</p>
                                        <p className="mt-0.5 leading-relaxed text-rose-700/90 dark:text-rose-300/90">
                                            The due date for this assignment has expired. Submissions are no longer accepted.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Graded Mini Badge in Sidebar */}
                            {isGraded && (
                                <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/40">
                                    <div className="flex items-center gap-2">
                                        <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                                            Final Grade
                                        </span>
                                    </div>
                                    <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                                        {detail.points > 0 ? `${submissionMarks ?? 0} / ${detail.points}` : "Reviewed"}
                                    </span>
                                </div>
                            )}

                            {/* Attachments List */}
                            {attachments.length > 0 ? (
                                <div className="mt-4 space-y-2.5 max-h-56 sm:max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                                    {attachments.map((att) => (
                                        <WorkAttachmentItem
                                            key={att.id}
                                            attachment={att}
                                            readOnly={readOnly || turnedIn || isMissed || isGraded}
                                            onPreview={() => setViewerAttachment(att)}
                                            onRemove={() => removeAttachment(att.id)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                !readOnly && !turnedIn && !isMissed && !isGraded && (
                                    <div
                                        onClick={openFilePicker}
                                        className="mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-5 text-center cursor-pointer transition-colors hover:border-blue-400 hover:bg-blue-50/40 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-blue-500 dark:hover:bg-blue-950/30"
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-2xs dark:bg-slate-800 text-blue-600 dark:text-blue-400 mb-2">
                                            <UploadCloud className="h-5 w-5" />
                                        </div>
                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                            Drag & drop files here, or <span className="text-blue-600 dark:text-blue-400 underline">browse</span>
                                        </p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                            PDF, Word, Code, Images, ZIP
                                        </p>
                                    </div>
                                )
                            )}

                            {/* Uploading Status Indicator */}
                            {uploading && (
                                <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-blue-200/80 bg-blue-50/80 px-3.5 py-2.5 text-xs font-medium text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-300">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent dark:border-blue-400" />
                                    <span>Uploading attachment to draft…</span>
                                </div>
                            )}

                            {/* "Add or Create" Dropdown (if editable) */}
                            {!readOnly && !turnedIn && !isMissed && !isGraded && (
                                <div className="relative mt-4">
                                    <button
                                        type="button"
                                        disabled={uploading || submittingWork}
                                        onClick={() => setAddMenuOpen((v) => !v)}
                                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-800 shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700"
                                    >
                                        <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <span>Add or Create</span>
                                    </button>

                                    {addMenuOpen && (
                                        <>
                                            <div className="fixed inset-0 z-20" onClick={() => setAddMenuOpen(false)} />
                                            <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                                                <button
                                                    type="button"
                                                    onClick={openFilePicker}
                                                    className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-800 hover:bg-slate-100/80 transition-colors dark:text-slate-200 dark:hover:bg-slate-700"
                                                >
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                                                        <Paperclip className="h-3.5 w-3.5" />
                                                    </div>
                                                    <div className="text-left">
                                                        <span className="block font-semibold">File from computer</span>
                                                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Upload PDF, Word, Code, Image</span>
                                                    </div>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={openLinkDialog}
                                                    className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-800 hover:bg-slate-100/80 transition-colors dark:text-slate-200 dark:hover:bg-slate-700"
                                                >
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
                                                        <Link2 className="h-3.5 w-3.5" />
                                                    </div>
                                                    <div className="text-left">
                                                        <span className="block font-semibold">Link URL</span>
                                                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Google Docs, GitHub, Figma, etc.</span>
                                                    </div>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Action Button: Turn In / Unsubmit */}
                            {!readOnly && (
                                <div className="mt-3">
                                    {isMissed ? (
                                        <button
                                            type="button"
                                            disabled
                                            className="w-full cursor-not-allowed rounded-xl border border-rose-200 bg-rose-50/80 py-2.5 text-xs font-semibold text-rose-600 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400"
                                        >
                                            Submissions Closed (Missed)
                                        </button>
                                    ) : isGraded ? (
                                        <button
                                            type="button"
                                            disabled
                                            className="w-full cursor-not-allowed rounded-xl border border-emerald-200 bg-emerald-50/80 py-2.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400"
                                        >
                                            Assignment Graded
                                        </button>
                                    ) : turnedIn ? (
                                        <button
                                            type="button"
                                            disabled={submittingWork}
                                            onClick={() => setUnsubmitOpen(true)}
                                            className="w-full cursor-pointer rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                        >
                                            {submittingWork ? "Updating…" : "Unsubmit"}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            disabled={uploading || submittingWork}
                                            onClick={handlePrimary}
                                            className="w-full cursor-pointer rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
                                        >
                                            {submittingWork
                                                ? "Submitting…"
                                                : attachments.length > 0
                                                    ? "Turn In"
                                                    : "Mark as Done"}
                                        </button>
                                    )}
                                </div>
                            )}

                            {!turnedIn && !isMissed && !isGraded && (
                                <p className="mt-3 text-center text-[11px] text-slate-500 dark:text-slate-400">
                                    {isPastDue
                                        ? "This assignment is past its due date."
                                        : "You can unsubmit and make changes any time before the deadline."}
                                </p>
                            )}
                        </div>

                        {/* Private Comments Card */}
                        {!readOnly && (
                            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                <div className="mb-3 sm:mb-4 flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5 sm:pb-3 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <Lock className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                                        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                            Private Comments
                                        </h2>
                                    </div>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate max-w-[180px] sm:max-w-none">
                                        Only visible to {instructorLabel}
                                    </span>
                                </div>

                                <AssignmentComments
                                    assignmentId={detail.id}
                                    isPrivate={true}
                                    privateCommentTarget={detail.privateCommentTarget}
                                    showTitle={false}
                                    compact={true}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Turn in confirmation modal */}
            {!readOnly && turnInOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
                    <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="p-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 mb-4">
                                <UploadCloud className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                Turn in your work?
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                {attachments.length > 0 ? (
                                    <>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                                            {attachments.length} attachment{attachments.length === 1 ? "" : "s"}
                                        </span>{" "}
                                        will be submitted for &quot;{detail.title}&quot;.
                                    </>
                                ) : (
                                    <>No files attached. Do you want to mark &quot;{detail.title}&quot; as done?</>
                                )}
                            </p>

                            {attachments.length > 0 && (
                                <div className="mt-4 max-h-48 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-2 dark:border-slate-800 dark:bg-slate-800/60 custom-scrollbar">
                                    {attachments.map((att) => {
                                        const visual = getFileVisual(att.title, att.kind);
                                        const Icon = visual.icon;
                                        return (
                                            <div key={att.id} className="flex items-center gap-3">
                                                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${visual.bgClass}`}>
                                                    <Icon className="h-3.5 w-3.5" />
                                                </div>
                                                <span className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                                                    {att.title}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40">
                            <button
                                type="button"
                                onClick={() => setTurnInOpen(false)}
                                className="cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmTurnIn}
                                className="cursor-pointer rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
                            >
                                Turn In
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Unsubmit confirmation modal */}
            {!readOnly && unsubmitOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
                    <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="p-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 mb-4">
                                <RotateCcw className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                Unsubmit your work?
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                Unsubmitting will allow you to add, edit, or remove your attachments. Remember to resubmit your assignment once you are done before the deadline.
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40">
                            <button
                                type="button"
                                onClick={() => setUnsubmitOpen(false)}
                                className="cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmUnsubmit}
                                className="cursor-pointer rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
                            >
                                Unsubmit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Link dialog modal */}
            {!readOnly && linkDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="p-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400 mb-4">
                                <Link2 className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                Add link
                            </h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Enter a web link (e.g. Google Docs, Figma, GitHub, YouTube)
                            </p>

                            <div className="mt-4">
                                <input
                                    autoFocus
                                    type="url"
                                    value={linkValue}
                                    placeholder="https://..."
                                    onChange={(e) => setLinkValue(e.target.value)}
                                    onBlur={() => setLinkTouched(true)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && linkValid) {
                                            void confirmAddLink();
                                        }
                                    }}
                                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 dark:text-slate-100 dark:bg-slate-800 ${linkError
                                            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
                                            : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-slate-700"
                                        }`}
                                />
                                {linkError && (
                                    <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
                                        Please enter a valid URL.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40">
                            <button
                                type="button"
                                onClick={closeLinkDialog}
                                className="cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={!linkValid}
                                onClick={confirmAddLink}
                                className="cursor-pointer rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Add link
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* File viewer modal */}
            {viewerAttachment && (
                <FileViewerModal
                    attachment={viewerAttachment}
                    onClose={() => setViewerAttachment(null)}
                />
            )}
        </div>
    );
}

// -------------------------------------------------------------
// Component: Reference Material Card (Instructor's attachments)
// -------------------------------------------------------------
function ReferenceMaterialCard({
    attachment,
    onPreview,
}: {
    attachment: AssignmentAttachment;
    onPreview: () => void;
}) {
    const visual = getFileVisual(attachment.title, attachment.kind);
    const Icon = visual.icon;
    const rawUrl = attachment.url;
    const fileUrl = rawUrl?.startsWith("http") ? rawUrl : rawUrl ? `${API_URL}${rawUrl}` : undefined;

    return (
        <div className="group flex items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50/60 p-3 transition-all hover:border-blue-300 hover:bg-white hover:shadow-2xs dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-blue-500/50 dark:hover:bg-slate-800/80">
            <button
                type="button"
                onClick={onPreview}
                className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer"
            >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${visual.bgClass} transition-transform group-hover:scale-105`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-800 transition-colors group-hover:text-blue-600 dark:text-slate-200 dark:group-hover:text-blue-400">
                        {attachment.title}
                    </p>
                    <span className="mt-0.5 inline-block text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        {visual.label}
                    </span>
                </div>
            </button>

            <div className="flex shrink-0 items-center gap-1 ml-2">
                <button
                    type="button"
                    title="Preview file"
                    onClick={onPreview}
                    className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-blue-400"
                >
                    <Eye className="h-4 w-4" />
                </button>
                {fileUrl && (
                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open in new tab"
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-blue-400"
                    >
                        <ExternalLink className="h-4 w-4" />
                    </a>
                )}
            </div>
        </div>
    );
}

// -------------------------------------------------------------
// Component: Work Attachment Item (Learner's submissions)
// -------------------------------------------------------------
function WorkAttachmentItem({
    attachment,
    readOnly,
    onPreview,
    onRemove,
}: {
    attachment: AssignmentAttachment;
    readOnly: boolean;
    onPreview: () => void;
    onRemove: () => void;
}) {
    const visual = getFileVisual(attachment.title, attachment.kind);
    const Icon = visual.icon;
    const isLink = attachment.kind === "link";
    const rawUrl = attachment.url;
    const url = rawUrl?.startsWith("http") ? rawUrl : rawUrl ? `${API_URL}${rawUrl}` : undefined;

    return (
        <div className="group flex items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50/70 p-2.5 transition-all hover:border-slate-300 hover:bg-white hover:shadow-2xs dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700 dark:hover:bg-slate-800/80">
            {isLink && url ? (
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${visual.bgClass}`}>
                        <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p title={attachment.title} className="truncate text-xs font-semibold text-slate-800 transition-colors group-hover:text-blue-600 dark:text-slate-200 dark:group-hover:text-blue-400">
                            {attachment.title}
                        </p>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">External link</span>
                    </div>
                </a>
            ) : (
                <button
                    type="button"
                    onClick={onPreview}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer"
                >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${visual.bgClass}`}>
                        <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p title={attachment.title} className="truncate text-xs font-semibold text-slate-800 transition-colors group-hover:text-blue-600 dark:text-slate-200 dark:group-hover:text-blue-400">
                            {attachment.title}
                        </p>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {visual.label}
                        </span>
                    </div>
                </button>
            )}

            <div className="flex shrink-0 items-center gap-1 ml-2">
                {!isLink && (
                    <button
                        type="button"
                        title="Preview"
                        onClick={onPreview}
                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 opacity-80 hover:bg-slate-200/60 hover:text-blue-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-blue-400 transition-colors"
                    >
                        <Eye className="h-3.5 w-3.5" />
                    </button>
                )}
                {!readOnly && (
                    <button
                        type="button"
                        title={`Remove ${attachment.title}`}
                        onClick={onRemove}
                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-950/60 dark:hover:text-rose-400"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}

// -------------------------------------------------------------
// Component: Modern File Viewer Modal
// -------------------------------------------------------------
function FileViewerModal({
    attachment,
    onClose,
}: {
    attachment: AssignmentAttachment;
    onClose: () => void;
}) {
    const ext = extOf(attachment.title);
    const rawUrl = attachment.url;
    const url = rawUrl?.startsWith("http") ? rawUrl : rawUrl ? `${API_URL}${rawUrl}` : undefined;
    const visual = getFileVisual(attachment.title, attachment.kind);
    const HeaderIcon = visual.icon;

    const isImage = IMAGE_EXTS.includes(ext);
    const isPdf = ext === "pdf";
    const isText = TEXT_EXTS.includes(ext);
    const isDocx = ext === "docx";
    const isZip = ext === "zip";

    const [text, setText] = useState<string | null>(null);
    const [zipEntries, setZipEntries] = useState<string[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const docxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;
        setText(null);
        setZipEntries(null);
        setError(null);
        if (!url) return;

        if (isText) {
            fetch(url)
                .then((r) => r.text())
                .then((t) => !cancelled && setText(t))
                .catch(() => !cancelled && setError("Could not read this file."));
        } else if (isDocx) {
            (async () => {
                try {
                    const buf = await (await fetch(url)).arrayBuffer();
                    const { renderAsync } = await import("docx-preview");
                    if (cancelled || !docxRef.current) return;
                    docxRef.current.innerHTML = "";
                    await renderAsync(buf, docxRef.current);
                } catch {
                    if (!cancelled) setError("Could not render this Word document.");
                }
            })();
        } else if (isZip) {
            (async () => {
                try {
                    const JSZip = (await import("jszip")).default;
                    const buf = await (await fetch(url)).arrayBuffer();
                    const zip = await JSZip.loadAsync(buf);
                    const names = Object.values(zip.files)
                        .filter((f) => !f.dir)
                        .map((f) => f.name);
                    if (!cancelled) setZipEntries(names);
                } catch {
                    if (!cancelled) setError("Could not read this ZIP archive.");
                }
            })();
        }
        return () => {
            cancelled = true;
        };
    }, [url, isText, isDocx, isZip]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 sm:p-6">
            <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${visual.bgClass}`}>
                            <HeaderIcon className="h-4 w-4" />
                        </div>
                        <span className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                            {attachment.title}
                        </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                        {url && (
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-colors dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span>Open in new tab</span>
                            </a>
                        )}
                        {url && (
                            <a
                                href={url}
                                download={attachment.title}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
                            >
                                <Download className="h-3.5 w-3.5" />
                                <span>Download</span>
                            </a>
                        )}
                        <button
                            type="button"
                            aria-label="Close preview"
                            onClick={onClose}
                            className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="min-h-0 flex-1 overflow-auto bg-slate-100/70 dark:bg-slate-950/70">
                    {!url ? (
                        <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-500 dark:text-slate-400">
                            <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No download or preview URL is available for this item.</p>
                        </div>
                    ) : isImage ? (
                        <div className="flex min-h-full items-center justify-center p-6">
                            <img
                                src={url}
                                alt={attachment.title}
                                className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-md"
                            />
                        </div>
                    ) : isPdf ? (
                        <iframe src={url} title={attachment.title} className="h-full w-full border-0" />
                    ) : isText ? (
                        error ? (
                            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-500 dark:text-slate-400">
                                <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
                            </div>
                        ) : text === null ? (
                            <div className="flex h-full items-center justify-center p-8 text-slate-500 dark:text-slate-400 text-sm">
                                Loading preview…
                            </div>
                        ) : (
                            <pre className="font-mono text-xs leading-relaxed text-slate-800 p-6 whitespace-pre-wrap dark:text-slate-200">
                                {text}
                            </pre>
                        )
                    ) : isDocx ? (
                        error ? (
                            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-500 dark:text-slate-400">
                                <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
                            </div>
                        ) : (
                            <div ref={docxRef} className="mx-auto min-h-full max-w-3xl bg-white p-8 shadow-sm dark:bg-slate-900 dark:text-slate-100" />
                        )
                    ) : isZip ? (
                        error ? (
                            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-500 dark:text-slate-400">
                                <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
                            </div>
                        ) : zipEntries === null ? (
                            <div className="flex h-full items-center justify-center p-8 text-slate-500 dark:text-slate-400 text-sm">
                                Loading archive contents…
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-200 bg-white p-4 dark:divide-slate-800 dark:bg-slate-900">
                                {zipEntries.length === 0 && (
                                    <li className="p-4 text-xs text-slate-500 dark:text-slate-400">This archive is empty.</li>
                                )}
                                {zipEntries.map((name) => (
                                    <li key={name} className="flex items-center gap-3 p-3 text-xs text-slate-800 dark:text-slate-200">
                                        <Paperclip className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                                        <span className="truncate">{name}</span>
                                    </li>
                                ))}
                            </ul>
                        )
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                            <FileText className="h-12 w-12 text-slate-400 dark:text-slate-600" />
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                In-browser preview is not available for this file type.
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                                Click &quot;Download&quot; or &quot;Open in new tab&quot; above to view or edit this file with your desktop application.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}