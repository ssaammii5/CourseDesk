"use client";

import { useEffect, useRef, useState } from "react";
import {
    ClipboardList,
    EllipsisVertical,
    FileArchive,
    FileText,
    Image as ImageIcon,
    Link2,
    MessageSquare,
    Paperclip,
    Plus,
    UserRound,
    UsersRound,
    X,
} from "lucide-react";
import { IconButton } from "@/components/ui";
import {
    deleteSubmissionAttachmentRequest,
    getOrCreateDraftSubmissionRequest,
    submitAssignmentRequest,
    unsubmitSubmissionRequest,
    uploadSubmissionAttachmentRequest,
} from "@/lib/api/submissions";
import { API_URL } from "@/lib/api/client";
import type { AssignmentDetail } from "@/types";
import { AssignmentComments } from "../components/AssignmentComments";

interface AssignmentDetailViewProps {
    detail: AssignmentDetail;
    readOnly?: boolean;
    onRefresh?: () => void;
}

interface AssignmentAttachment {
    id: number; title: string; fileType: string; thumbClass: string; url?: string; kind?: "file" | "link"; file?: File;
}

type WorkStatus = "Assigned" | "Turned in";

const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "avif"];
const TEXT_EXTS = ["txt", "md", "csv", "json", "log", "js", "ts", "jsx", "tsx", "html", "css", "xml", "yml", "yaml"];

function extOf(name: string): string {
    const i = name.lastIndexOf(".");
    return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

function isValidLink(value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed) return false;
    return /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}([/?#]\S*)?$/i.test(trimmed);
}

function cardEmoji(a: AssignmentAttachment): string {
    if (a.kind === "link") return "🔗";
    const ext = extOf(a.title);
    if (IMAGE_EXTS.includes(ext)) return "🖼️";
    if (ext === "zip") return "🗜️";
    return "📄";
}

export function AssignmentDetailView({ detail, readOnly = false, onRefresh }: AssignmentDetailViewProps) {
    const initiallyTurnedIn = detail.submission.status === "Turned in" || detail.submission.status === "Submitted";
    const [status, setStatus] = useState<WorkStatus>(initiallyTurnedIn ? "Turned in" : "Assigned");
    const [submissionId, setSubmissionId] = useState<number | undefined>(detail.submission.id);
    const [attachments, setAttachments] = useState<AssignmentAttachment[]>(
        detail.submission.attachments ?? []
    );
    const [uploading, setUploading] = useState(false);
    const [addMenuOpen, setAddMenuOpen] = useState(false);
    const [turnInOpen, setTurnInOpen] = useState(false);
    const [unsubmitOpen, setUnsubmitOpen] = useState(false);
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkValue, setLinkValue] = useState("");
    const [linkTouched, setLinkTouched] = useState(false);
    const [viewerAttachment, setViewerAttachment] = useState<AssignmentAttachment | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const turnedIn = status === "Turned in";
    const linkValid = isValidLink(linkValue);
    const linkError = linkTouched && !linkValid;

    useEffect(() => {
        const isTurned = detail.submission.status === "Turned in" || detail.submission.status === "Submitted";
        setStatus(isTurned ? "Turned in" : "Assigned");
        setSubmissionId(detail.submission.id);
        setAttachments(detail.submission.attachments ?? []);
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

    const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return;
        e.target.value = "";
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
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error("Failed to upload draft file", err);
        } finally {
            setUploading(false);
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
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error("Failed to add draft link", err);
        } finally {
            setUploading(false);
        }
    };

    const removeAttachment = async (id: number) => {
        setAttachments((prev) => prev.filter((a) => a.id !== id));
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
        if (attachments.length > 0) setTurnInOpen(true);
        else setStatus("Turned in");
    };

    const confirmTurnIn = async () => {
        setTurnInOpen(false);
        setStatus("Turned in");
        try {
            await submitAssignmentRequest({
                assignmentId: detail.id,
                answer: "Submitted via file attachment",
            });
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error("Submission failed", err);
            setStatus("Assigned");
        }
    };

    const confirmUnsubmit = async () => {
        setUnsubmitOpen(false);
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
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-white">
            {/* Hidden file input */}
            {!readOnly && (
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFiles}
                />
            )}

            <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-4 py-10 sm:px-8 lg:flex-row">
                {/* Main content */}
                <div className="min-w-0 flex-1">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-6">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-700 dark:bg-slate-800 dark:text-slate-200">
                                <ClipboardList className="h-6 w-6" />
                            </span>
                            <h1 className="min-w-0 text-3xl font-semibold text-gray-900 dark:text-slate-100 sm:text-[32px]">{detail.title}</h1>
                        </div>
                        <IconButton label="More options" className="h-10 w-10 shrink-0">
                            <EllipsisVertical className="h-5 w-5" />
                        </IconButton>
                    </div>

                    {/* Meta info */}
                    <p className="mt-6 text-sm text-gray-800 dark:text-slate-300">
                        {detail.instructorName || detail.teacherName}
                        <span className="mx-2 text-gray-600 dark:text-slate-500">•</span>
                        {detail.postedDate}
                    </p>
                    <p className="mt-4 text-sm font-semibold text-gray-900 dark:text-slate-100">
                        {detail.points} points
                        <span className="mx-3 font-normal text-gray-700 dark:text-slate-500">|</span>
                        {detail.dueLabel}
                    </p>
                    <div className="mt-5 border-t border-gray-300 dark:border-slate-800" />

                    {/* Description */}
                    <p className="mt-7 whitespace-pre-line text-sm leading-6 text-gray-800 dark:text-slate-300">
                        {detail.description}
                    </p>

                    {/* Attachments */}
                    {detail.attachments.length > 0 && (
                        <div className="mt-7 flex flex-wrap gap-4">
                            {detail.attachments.map((att) => (
                                <FileTile key={att.id} attachment={att} />
                            ))}
                        </div>
                    )}

                    {/* Class comments */}
                    <div className="mt-12 border-t border-gray-200/80 dark:border-slate-800 pt-8">
                        <AssignmentComments assignmentId={detail.id} isPrivate={false} />
                    </div>
                </div>

                {/* Right sidebar — hidden in readOnly mode */}
                {!readOnly && (
                    <div className="w-full shrink-0 space-y-6 lg:w-[350px]">
                        {/* Your work */}
                        <section className="rounded-lg bg-[#e9eef4] p-4 sm:p-5 dark:border dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Your work</h2>
                                <span
                                    className={`text-sm font-medium ${turnedIn ? "text-[#188038] dark:text-emerald-400" : "text-gray-900 dark:text-slate-300"}`}
                                >
                                    {turnedIn ? "Turned in" : "Assigned"}
                                </span>
                            </div>

                            {attachments.length > 0 && (
                                <div className="mt-4 space-y-4">
                                    {attachments.map((att) => (
                                        <div key={att.id} className="flex items-center gap-3">
                                            <WorkAttachmentCard attachment={att} onOpen={setViewerAttachment} />
                                            {!turnedIn && (
                                                <button
                                                    type="button"
                                                    aria-label={`Remove ${att.title}`}
                                                    onClick={() => removeAttachment(att.id)}
                                                    className="cursor-pointer rounded-full p-1.5 text-gray-700 hover:bg-gray-900/10 dark:text-slate-400 dark:hover:bg-slate-800"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {uploading && (
                                <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-[#1a73e8] dark:bg-blue-950/60 dark:text-blue-300">
                                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
                                    <span>Saving to draft...</span>
                                </div>
                            )}

                            {!turnedIn && (
                                <div className="relative mt-4">
                                    <button
                                        type="button"
                                        disabled={uploading}
                                        onClick={() => setAddMenuOpen((v) => !v)}
                                        className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-gray-400/80 py-2 text-sm font-medium text-[#1a73e8] hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add or create
                                    </button>
                                    {addMenuOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setAddMenuOpen(false)} />
                                            <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-lg bg-[#e9eef4] py-2 shadow-lg dark:border dark:border-slate-700 dark:bg-slate-800">
                                                <button
                                                    type="button"
                                                    onClick={openLinkDialog}
                                                    className="flex w-full cursor-pointer items-center gap-4 px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-900/5 dark:text-slate-100 dark:hover:bg-slate-700"
                                                >
                                                    <Link2 className="h-5 w-5" />
                                                    Link
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={openFilePicker}
                                                    className="flex w-full cursor-pointer items-center gap-4 px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-900/5 dark:text-slate-100 dark:hover:bg-slate-700"
                                                >
                                                    <Paperclip className="h-5 w-5" />
                                                    File
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            <button
                                type="button"
                                disabled={uploading}
                                onClick={turnedIn ? () => setUnsubmitOpen(true) : handlePrimary}
                                className={`mt-4 w-full cursor-pointer rounded-full py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${turnedIn
                                    ? "border border-gray-400/80 text-[#1a73e8] hover:bg-white/70 dark:border-slate-700 dark:hover:bg-slate-800"
                                    : "bg-[#1a63d8] text-white hover:bg-[#1554b5]"
                                    }`}
                            >
                                {uploading ? "Saving..." : turnedIn ? "Unsubmit" : attachments.length > 0 ? "Turn in" : "Mark as done"}
                            </button>
                            {!turnedIn && (
                                <p className="mt-4 text-center text-xs italic text-gray-700 dark:text-slate-400">
                                    Work cannot be turned in after the due date
                                </p>
                            )}
                        </section>

                        {/* Private comments */}
                        <section className="rounded-lg bg-[#e9eef4] p-4 sm:p-5 dark:border dark:border-slate-800 dark:bg-slate-900">
                            <AssignmentComments
                                assignmentId={detail.id}
                                isPrivate={true}
                                privateCommentTarget={detail.privateCommentTarget}
                            />
                        </section>
                    </div>
                )}
            </div>

            {/* Turn in confirmation */}
            {!readOnly && turnInOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4">
                    <div className="w-full max-w-xl rounded-2xl bg-[#e9eef4] p-6 shadow-xl dark:border dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Turn in your work?</h2>
                        <p className="mt-4 text-sm text-gray-800 dark:text-slate-300">
                            {attachments.length} attachment{attachments.length === 1 ? "" : "s"} will be
                            submitted for &quot;{detail.title}&quot;.
                        </p>
                        <div className="mt-4 border-t border-gray-400/60 dark:border-slate-700" />
                        <ul className="mt-4 space-y-3">
                            {attachments.map((att) => (
                                <li key={att.id} className="flex items-center gap-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#d93025] text-[7px] font-bold text-white">
                                        {att.kind === "link" ? "URL" : att.fileType.slice(0, 4)}
                                    </span>
                                    <span className="truncate text-sm text-gray-900 underline dark:text-slate-200">{att.title}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-6 flex justify-end gap-8">
                            <button
                                type="button"
                                onClick={() => setTurnInOpen(false)}
                                className="cursor-pointer text-sm font-medium text-[#1a73e8] hover:underline dark:text-blue-400"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmTurnIn}
                                className="cursor-pointer text-sm font-medium text-[#1a73e8] hover:underline dark:text-blue-400"
                            >
                                Turn in
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Unsubmit confirmation */}
            {!readOnly && unsubmitOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4">
                    <div className="w-full max-w-xl rounded-2xl bg-[#e9eef4] p-6 shadow-xl dark:border dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Unsubmit?</h2>
                        <p className="mt-4 text-sm leading-6 text-gray-800 dark:text-slate-300">
                            Unsubmit to add or change attachments. Don&apos;t forget to resubmit once
                            you&apos;re done.
                        </p>
                        <div className="mt-8 flex justify-end gap-8">
                            <button
                                type="button"
                                onClick={() => setUnsubmitOpen(false)}
                                className="cursor-pointer text-sm font-medium text-[#1a73e8] hover:underline dark:text-blue-400"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmUnsubmit}
                                className="cursor-pointer text-sm font-medium text-[#1a73e8] hover:underline dark:text-blue-400"
                            >
                                Unsubmit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Link dialog */}
            {!readOnly && linkDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:border dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Add link</h2>
                        <div className="mt-6">
                            <div
                                className={`relative rounded-t border-b-2 bg-[#dfe3ea] dark:bg-slate-800 ${linkError ? "border-[#d93025]" : "border-gray-500 dark:border-slate-600"
                                    }`}
                            >
                                <input
                                    autoFocus
                                    value={linkValue}
                                    placeholder=" "
                                    onChange={(e) => setLinkValue(e.target.value)}
                                    onBlur={() => setLinkTouched(true)}
                                    className="peer w-full bg-transparent px-4 pb-2 pt-6 text-base text-gray-900 dark:text-slate-100 focus:outline-none"
                                />
                                <span
                                    className={`pointer-events-none absolute left-4 top-1.5 text-xs transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base ${linkError ? "text-[#d93025]" : "text-gray-700 dark:text-slate-400"
                                        }`}
                                >
                                    Link*
                                </span>
                            </div>
                            {linkError && (
                                <p className="mt-2 px-1 text-sm text-[#d93025] dark:text-red-400">Please enter a valid link</p>
                            )}
                        </div>
                        <div className="mt-8 flex justify-end gap-8">
                            <button
                                type="button"
                                onClick={closeLinkDialog}
                                className="cursor-pointer text-sm font-medium text-[#1a73e8] hover:underline dark:text-blue-400"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={!linkValid}
                                onClick={confirmAddLink}
                                className={`text-sm font-medium ${linkValid
                                    ? "cursor-pointer text-[#1a73e8] hover:underline dark:text-blue-400"
                                    : "cursor-default text-gray-400 dark:text-slate-600"
                                    }`}
                            >
                                Add link
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* File viewer modal */}
            {viewerAttachment && (
                <FileViewerModal attachment={viewerAttachment} onClose={() => setViewerAttachment(null)} />
            )}
        </div>
    );
}

function WorkAttachmentCard({
    attachment,
    onOpen,
}: {
    attachment: AssignmentAttachment;
    onOpen: (a: AssignmentAttachment) => void;
}) {
    const cardClass =
        "flex min-w-0 flex-1 overflow-hidden rounded-lg border border-gray-300 bg-white text-left transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800";
    const inner = (
        <>
            <span className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3">
                <span className="truncate text-sm font-medium text-gray-900 underline dark:text-slate-100">
                    {attachment.title}
                </span>
                <span className="mt-1 text-xs text-gray-600 dark:text-slate-400">{attachment.fileType}</span>
            </span>
            <span
                className={`flex w-24 shrink-0 items-center justify-center border-l border-gray-200 dark:border-slate-700 text-3xl ${attachment.thumbClass}`}
            >
                {cardEmoji(attachment)}
            </span>
        </>
    );

    if (attachment.kind === "link" && attachment.url) {
        return (
            <a href={attachment.url} target="_blank" rel="noopener noreferrer" className={cardClass}>
                {inner}
            </a>
        );
    }
    return (
        <button type="button" onClick={() => onOpen(attachment)} className={`${cardClass} w-full cursor-pointer`}>
            {inner}
        </button>
    );
}

function FileTile({ attachment }: { attachment: AssignmentAttachment }) {
    return (
        <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="flex w-full max-w-[340px] overflow-hidden rounded-lg border border-gray-300 bg-white transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
        >
            <span className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3">
                <span className="truncate text-sm font-medium text-gray-900 underline dark:text-slate-100">
                    {attachment.title}
                </span>
                <span className="mt-1 text-xs text-gray-600 dark:text-slate-400">{attachment.fileType}</span>
            </span>
            <span
                className={`flex w-24 shrink-0 items-center justify-center border-l border-gray-200 dark:border-slate-700 text-3xl ${attachment.thumbClass}`}
            >
                📄
            </span>
        </a>
    );
}

function FileViewerModal({
    attachment,
    onClose,
}: {
    attachment: AssignmentAttachment;
    onClose: () => void;
}) {
    const ext = extOf(attachment.title);
    const rawUrl = attachment.url;
    const url = rawUrl?.startsWith("http") ? rawUrl : `${API_URL}${rawUrl}`;
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

    const headerIcon = isImage ? (
        <ImageIcon className="h-5 w-5" />
    ) : isZip ? (
        <FileArchive className="h-5 w-5" />
    ) : (
        <FileText className="h-5 w-5" />
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
                <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-3">
                    <div className="flex min-w-0 items-center gap-3 text-gray-700">
                        {headerIcon}
                        <span className="truncate text-sm font-medium text-gray-900">{attachment.title}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                        {url && (
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-[#1a73e8] hover:underline"
                            >
                                Open in new tab
                            </a>
                        )}
                        {url && (
                            <a
                                href={url}
                                download={attachment.title}
                                className="text-sm font-medium text-[#1a73e8] hover:underline"
                            >
                                Download
                            </a>
                        )}
                        <button
                            type="button"
                            aria-label="Close preview"
                            onClick={onClose}
                            className="cursor-pointer rounded-full p-2 text-gray-600 hover:bg-gray-900/10"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                <div className="min-h-0 flex-1 overflow-auto bg-gray-100">
                    {!url ? (
                        <NoPreview />
                    ) : isImage ? (
                        <div className="flex min-h-full items-center justify-center p-6">
                            <img
                                src={url}
                                alt={attachment.title}
                                className="max-h-full max-w-full rounded shadow-md"
                            />
                        </div>
                    ) : isPdf ? (
                        <iframe src={url} title={attachment.title} className="h-full w-full" />
                    ) : isText ? (
                        error ? (
                            <NoPreview message={error} />
                        ) : text === null ? (
                            <Loading />
                        ) : (
                            <pre className="whitespace-pre-wrap px-6 py-4 text-sm leading-6 text-gray-800">
                                {text}
                            </pre>
                        )
                    ) : isDocx ? (
                        error ? (
                            <NoPreview message={error} />
                        ) : (
                            <div ref={docxRef} className="mx-auto min-h-full max-w-[820px] bg-white p-4 shadow-md" />
                        )
                    ) : isZip ? (
                        error ? (
                            <NoPreview message={error} />
                        ) : zipEntries === null ? (
                            <Loading />
                        ) : (
                            <ul className="divide-y divide-gray-200 bg-white">
                                {zipEntries.length === 0 && (
                                    <li className="px-6 py-4 text-sm text-gray-600">This archive is empty.</li>
                                )}
                                {zipEntries.map((name) => (
                                    <li key={name} className="flex items-center gap-3 px-6 py-3 text-sm text-gray-800">
                                        <Paperclip className="h-4 w-4 shrink-0 text-gray-500" />
                                        <span className="truncate">{name}</span>
                                    </li>
                                ))}
                            </ul>
                        )
                    ) : (
                        <NoPreview />
                    )}
                </div>
            </div>
        </div>
    );
}

function Loading() {
    return <p className="px-6 py-8 text-sm text-gray-600">Loading preview…</p>;
}

function NoPreview({ message }: { message?: string }) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center">
            <FileText className="h-10 w-10 text-gray-400" />
            <p className="text-sm font-medium text-gray-800">
                {message ?? "No in-browser preview available for this file type."}
            </p>
            <p className="text-xs text-gray-600">
                Use "Download" or "Open in new tab" above to view it with an external app.
            </p>
        </div>
    );
}