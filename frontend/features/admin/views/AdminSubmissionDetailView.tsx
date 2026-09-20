"use client";

import type { ReactNode } from "react";
import {
    ArrowLeft,
    BookOpen,
    Building2,
    CalendarRange,
    ClipboardList,
    Clock,
    Download,
    FileText,
    GraduationCap,
    Link2,
    Mail,
    Paperclip,
    UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { initialOf } from "@/lib/utils/format";
import type { SubmissionDto } from "@/lib/api/submissions";
import { StatusBadge } from "@/components/ui";

interface AttachmentItem {
    id: number;
    fileName: string;
    fileType: string;
    fileSize: string;
    uploadedAt: string;
    kind: "file" | "link";
    url?: string;
}

interface ActivityItem {
    id: number;
    action: string;
    actor: string;
    timestamp: string;
}

function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatTimestamp(iso: string): string {
    const d = new Date(iso);
    const date = d.toLocaleDateString("en-CA"); // YYYY-MM-DD
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `${date} ${time}`;
}

function attachmentEmoji(att: AttachmentItem): string {
    if (att.kind === "link") return "🔗";
    const ext = att.fileName.split(".").pop()?.toLowerCase() ?? "";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "🖼️";
    if (ext === "zip" || ext === "rar" || ext === "7z") return "🗜️";
    if (ext === "pdf") return "📕";
    if (["py", "js", "ts", "jsx", "tsx", "java", "c", "cpp", "cs", "ipynb"].includes(ext)) return "💻";
    if (["doc", "docx"].includes(ext)) return "📝";
    if (["ppt", "pptx"].includes(ext)) return "📊";
    if (["xls", "xlsx", "csv"].includes(ext)) return "📈";
    if (ext === "md") return "📄";
    if (ext === "bib") return "📚";
    return "📄";
}

interface AdminSubmissionDetailViewProps {
    submission: SubmissionDto;
}

export function AdminSubmissionDetailView({ submission }: AdminSubmissionDetailViewProps) {
    const router = useRouter();

    const notSubmitted = !submission.submittedAtUtc;
    const displayStatus = notSubmitted ? "Pending" : submission.status;
    const maxMarks = submission.maxMarks;

    const learnerEmail = submission.learnerEmail ?? submission.studentEmail ?? "—";
    const learnerAcademicId = submission.learnerAcademicId ?? submission.studentAcademicId ?? "—";
    const learnerDepartment = submission.learnerDepartment ?? submission.studentDepartment ?? "—";
    const learnerProgram = submission.learnerProgram ?? submission.studentProgram ?? "—";
    const learnerName = submission.learnerName ?? submission.studentName ?? "Unknown Learner";
    const courseSession = submission.session ?? "—";

    const answer = submission.answer;
    const isLate = submission.isLate;
    const isGraded = !notSubmitted && submission.status === "Graded" && submission.marks !== null;

    const submittedDate = submission.submittedAtUtc ? submission.submittedAtUtc.split("T")[0] : "";
    const submittedAtTime = submission.submittedAtUtc ? formatTime(submission.submittedAtUtc) : "";
    const gradedBy = submission.gradedByName ?? null;
    const gradedAt = submission.gradedAtUtc ? submission.gradedAtUtc.split("T")[0] : null;

    const attachments: AttachmentItem[] = submission.attachments.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        fileType: a.fileType,
        fileSize: a.fileSize,
        uploadedAt: a.uploadedAtUtc.split("T")[0],
        kind: a.kind as "file" | "link",
        url: a.url ?? undefined,
    }));

    const activity: ActivityItem[] = submission.activities.map((x) => ({
        id: x.id,
        action: x.action,
        actor: x.actorName,
        timestamp: formatTimestamp(x.timestampUtc),
    }));

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-white">
            <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-8">
                {/* Back */}
                <button
                    type="button"
                    onClick={() => router.push("/submissions")}
                    className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#1a73e8] hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to All Submissions
                </button>

                {/* Header */}
                <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#7b1fa2] text-xl font-medium text-white">
                            {initialOf(learnerName)}
                        </span>
                        <div className="min-w-0">
                            <h1 className="truncate text-2xl font-semibold text-gray-900 sm:text-3xl">
                                {submission.assignmentTitle}
                            </h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Submitted by <span className="font-medium text-gray-900">{learnerName}</span>
                                <span className="mx-2">•</span>
                                {submission.courseName}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {isLate && !notSubmitted && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#fce8e6] px-3 py-1 text-xs font-medium text-[#c5221f]">
                                <Clock className="h-3.5 w-3.5" />
                                Late
                            </span>
                        )}
                        <StatusBadge status={displayStatus} />
                    </div>
                </div>

                {/* Content */}
                <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
                    {/* Left column */}
                    <div className="min-w-0 space-y-6">
                        {/* Learner answer */}
                        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                            <div className="flex items-center gap-2 border-b border-gray-200 bg-[#f8f9fa] px-6 py-4">
                                <FileText className="h-5 w-5 text-gray-600" />
                                <h2 className="text-lg font-medium text-gray-900">Learner Answer</h2>
                            </div>
                            <div className="px-6 py-5">
                                {notSubmitted ? (
                                    <p className="text-sm italic text-gray-500">
                                        This learner has not submitted any work yet.
                                    </p>
                                ) : answer ? (
                                    <p className="whitespace-pre-line text-sm leading-6 text-gray-800">{answer}</p>
                                ) : (
                                    <p className="text-sm italic text-gray-500">No written answer provided.</p>
                                )}
                            </div>
                        </section>

                        {/* Attachments */}
                        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                            <div className="flex items-center justify-between border-b border-gray-200 bg-[#f8f9fa] px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <Paperclip className="h-5 w-5 text-gray-600" />
                                    <h2 className="text-lg font-medium text-gray-900">Submitted Files</h2>
                                </div>
                                <span className="text-sm text-gray-600">
                                    {attachments.length} file{attachments.length === 1 ? "" : "s"}
                                </span>
                            </div>
                            {attachments.length === 0 ? (
                                <p className="px-6 py-8 text-center text-sm text-gray-500">
                                    {notSubmitted ? "Nothing has been uploaded." : "No files were attached."}
                                </p>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {attachments.map((att) => (
                                        <AttachmentRow key={att.id} attachment={att} />
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Activity */}
                        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                            <div className="flex items-center gap-2 border-b border-gray-200 bg-[#f8f9fa] px-6 py-4">
                                <Clock className="h-5 w-5 text-gray-600" />
                                <h2 className="text-lg font-medium text-gray-900">Activity</h2>
                            </div>
                            {activity.length === 0 ? (
                                <p className="px-6 py-8 text-center text-sm text-gray-500">No activity recorded.</p>
                            ) : (
                                <ul className="px-6 py-5">
                                    {activity.map((event, index) => (
                                        <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                                            {index < activity.length - 1 && (
                                                <span className="absolute left-[6px] top-5 h-full w-px bg-gray-200" />
                                            )}
                                            <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-[#1a73e8] bg-white" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900">{event.action}</p>
                                                <p className="mt-0.5 text-xs text-gray-500">
                                                    {event.actor} <span className="mx-1">•</span> {event.timestamp}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </div>

                    {/* Right column */}
                    <div className="space-y-6">
                        {/* Grading — read only */}
                        <section className="rounded-xl border border-gray-200 bg-white p-6">
                            <h2 className="text-lg font-medium text-gray-900">Grading</h2>
                            {notSubmitted ? (
                                <p className="mt-3 text-sm text-gray-600">
                                    Waiting for the learner to submit before grading.
                                </p>
                            ) : isGraded ? (
                                <>
                                    <div className="mt-4">
                                        <p className="text-xs text-gray-500">Marks</p>
                                        <p className="mt-0.5 text-2xl font-semibold text-gray-900">
                                            {submission.marks}
                                            <span className="ml-1 text-base font-normal text-gray-500">/ {maxMarks}</span>
                                        </p>
                                    </div>
                                    {submission.feedback && (
                                        <div className="mt-4 border-t border-gray-100 pt-4">
                                            <p className="text-xs text-gray-500">Feedback</p>
                                            <p className="mt-1 text-sm leading-6 text-gray-800">{submission.feedback}</p>
                                        </div>
                                    )}
                                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#e6f4ea] px-4 py-3">
                                        <GraduationCap className="h-4 w-4 text-[#137333]" />
                                        <span className="text-sm font-medium text-[#137333]">
                                            Current grade: {submission.marks} / {maxMarks}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="mt-3 text-sm text-gray-600">Not graded yet.</p>
                                    {submission.feedback && (
                                        <div className="mt-4 border-t border-gray-100 pt-4">
                                            <p className="text-xs text-gray-500">Feedback</p>
                                            <p className="mt-1 text-sm leading-6 text-gray-800">{submission.feedback}</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>

                        {/* Submission info */}
                        <section className="rounded-xl border border-gray-200 bg-white p-6">
                            <h2 className="text-lg font-medium text-gray-900">Submission Info</h2>
                            <dl className="mt-4 space-y-3 text-sm">
                                <InfoRow icon={<ClipboardList className="h-4 w-4" />} label="Assignment" value={submission.assignmentTitle ?? "—"} />
                                <InfoRow icon={<BookOpen className="h-4 w-4" />} label="Course" value={submission.courseName ?? "—"} />
                                <InfoRow icon={<CalendarRange className="h-4 w-4" />} label="Session" value={courseSession} />
                                <InfoRow
                                    icon={<Clock className="h-4 w-4" />}
                                    label="Submitted"
                                    value={notSubmitted
                                        ? "Not submitted"
                                        : `${submittedDate}${submittedAtTime ? ` at ${submittedAtTime}` : ""}`}
                                />
                                {gradedBy && (
                                    <InfoRow
                                        icon={<GraduationCap className="h-4 w-4" />}
                                        label="Graded By"
                                        value={`${gradedBy}${gradedAt ? ` (${gradedAt})` : ""}`}
                                    />
                                )}
                            </dl>
                        </section>

                        {/* Learner info */}
                        <section className="rounded-xl border border-gray-200 bg-white p-6">
                            <h2 className="text-lg font-medium text-gray-900">Learner Info</h2>
                            <dl className="mt-4 space-y-3 text-sm">
                                <InfoRow icon={<UserRound className="h-4 w-4" />} label="Name" value={learnerName} />
                                <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={learnerEmail} />
                                <InfoRow icon={<ClipboardList className="h-4 w-4" />} label="Learner ID" value={learnerAcademicId} />
                                <InfoRow icon={<Building2 className="h-4 w-4" />} label="Department" value={learnerDepartment} />
                                <InfoRow icon={<GraduationCap className="h-4 w-4" />} label="Program" value={learnerProgram} />
                            </dl>
                            {(submission.learnerEmail || submission.studentEmail) && (
                                <a
                                    href={`mailto:${submission.learnerEmail || submission.studentEmail}`}
                                    className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-full border border-gray-400 px-5 py-2.5 text-sm font-medium text-[#1a73e8] hover:bg-blue-50"
                                >
                                    <Mail className="h-4 w-4" />
                                    Contact Learner
                                </a>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <span className="mt-0.5 text-gray-500">{icon}</span>
            <div className="min-w-0">
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className="break-words font-medium text-gray-900">{value}</dd>
            </div>
        </div>
    );
}

function AttachmentRow({ attachment }: { attachment: AttachmentItem }) {
    return (
        <div className="flex items-center gap-4 px-6 py-4">
            <span className="text-3xl">{attachmentEmoji(attachment)}</span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{attachment.fileName}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                    {attachment.fileType}
                    <span className="mx-1">•</span>
                    {attachment.fileSize}
                    <span className="mx-1">•</span>
                    Uploaded {attachment.uploadedAt}
                </p>
            </div>
            {attachment.kind === "link" && attachment.url ? (
                <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-gray-400 px-4 py-2 text-xs font-medium text-[#1a73e8] hover:bg-blue-50"
                >
                    <Link2 className="h-3.5 w-3.5" />
                    Open
                </a>
            ) : (
                <button
                    type="button"
                    className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-gray-400 px-4 py-2 text-xs font-medium text-[#1a73e8] hover:bg-blue-50"
                >
                    <Download className="h-3.5 w-3.5" />
                    Download
                </button>
            )}
        </div>
    );
}