"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    BookOpen,
    Calendar,
    CalendarRange,
    CheckCircle2,
    Clock,
    Download,
    ExternalLink,
    Eye,
    FileText,
    Layers,
    MessageSquare,
    Paperclip,
    Search,
    Tag,
    User,
    Users,
} from "lucide-react";
import type { AssignmentDto } from "@/lib/api/assignments";
import type { SubmissionDto } from "@/lib/api/submissions";
import { DataTable, FileViewerModal, StatusBadge, type PreviewableAttachment } from "@/components/ui";
import { API_URL } from "@/lib/api/client";
import { initialOf } from "@/lib/utils/format";

export interface AdminAssignmentDetailViewProps {
    assignment: AssignmentDto;
    submissions: SubmissionDto[];
    onRefresh?: () => void;
}

function formatDateTime(iso?: string | null): string {
    if (!iso) return "No deadline set";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function formatDate(iso?: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function AdminAssignmentDetailView({
    assignment,
    submissions,
}: AdminAssignmentDetailViewProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"overview" | "submissions">("overview");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [viewerAttachment, setViewerAttachment] = useState<PreviewableAttachment | null>(null);

    // Submission statistics
    const totalSubmissions = submissions.length;
    const turnedInCount = useMemo(
        () => submissions.filter((s) => s.submittedAtUtc && s.status !== "Graded").length,
        [submissions]
    );
    const gradedCount = useMemo(
        () => submissions.filter((s) => s.status === "Graded").length,
        [submissions]
    );
    const pendingCount = useMemo(
        () => submissions.filter((s) => !s.submittedAtUtc).length,
        [submissions]
    );

    // Filtered submissions list
    const filteredSubmissions = useMemo(() => {
        return submissions.filter((s) => {
            const learnerName = (s.learnerName ?? s.studentName ?? "").toLowerCase();
            const learnerEmail = (s.learnerEmail ?? s.studentEmail ?? "").toLowerCase();
            const learnerId = (s.learnerAcademicId ?? s.studentAcademicId ?? "").toLowerCase();
            const q = search.toLowerCase();

            const matchSearch =
                !q ||
                learnerName.includes(q) ||
                learnerEmail.includes(q) ||
                learnerId.includes(q);

            let matchStatus = true;
            if (statusFilter === "Submitted") {
                matchStatus = Boolean(s.submittedAtUtc && s.status !== "Graded");
            } else if (statusFilter === "Graded") {
                matchStatus = s.status === "Graded";
            } else if (statusFilter === "Pending") {
                matchStatus = !s.submittedAtUtc;
            }

            return matchSearch && matchStatus;
        });
    }, [submissions, search, statusFilter]);

    const submissionColumns = [
        {
            key: "learnerAcademicId",
            header: "Learner ID",
            width: "140px",
            render: (s: SubmissionDto) => {
                const idVal = s.learnerAcademicId ?? s.studentAcademicId;
                return idVal ? (
                    <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                        {idVal}
                    </span>
                ) : (
                    <span className="text-slate-400">—</span>
                );
            },
        },
        {
            key: "learnerName",
            header: "Learner",
            truncate: true,
            render: (s: SubmissionDto) => {
                const name = s.learnerName ?? s.studentName ?? "Unknown Learner";
                const email = s.learnerEmail ?? s.studentEmail ?? "";
                return (
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1a73e8] text-xs font-semibold text-white">
                            {initialOf(name)}
                        </span>
                        <div className="min-w-0">
                            <button
                                type="button"
                                onClick={() => router.push(`/submissions/${s.code || s.id}`)}
                                className="cursor-pointer text-left text-sm font-medium text-slate-900 dark:text-slate-100 hover:text-[#1a73e8] dark:hover:text-blue-400 hover:underline truncate block"
                            >
                                {name}
                            </button>
                            {email && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                    {email}
                                </p>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            key: "status",
            header: "Status",
            width: "120px",
            render: (s: SubmissionDto) => {
                const isSubmitted = Boolean(s.submittedAtUtc);
                const displayStatus = !isSubmitted ? "Pending" : s.status;
                return <StatusBadge status={displayStatus} />;
            },
        },
        {
            key: "marks",
            header: "Marks",
            width: "100px",
            className: "text-center",
            render: (s: SubmissionDto) =>
                s.marks !== null && s.marks !== undefined ? (
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {s.marks}
                        <span className="text-xs font-normal text-slate-500">
                            {" "}/ {assignment.maxMarks}
                        </span>
                    </span>
                ) : (
                    <span className="text-slate-400">—</span>
                ),
        },
        {
            key: "submittedAtUtc",
            header: "Submitted At",
            width: "160px",
            render: (s: SubmissionDto) =>
                s.submittedAtUtc ? (
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                        {formatDate(s.submittedAtUtc)}
                    </span>
                ) : (
                    <span className="text-xs italic text-slate-400">Not submitted</span>
                ),
        },
        {
            key: "actions",
            header: "",
            width: "100px",
            className: "text-right",
            render: (s: SubmissionDto) => (
                <button
                    type="button"
                    onClick={() => router.push(`/submissions/${s.code || s.id}`)}
                    className="cursor-pointer text-xs font-medium text-[#1a73e8] dark:text-blue-400 hover:underline"
                >
                    View Details
                </button>
            ),
        },
    ];

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 dark:bg-slate-950 pb-16">
            <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-8 space-y-6">
                {/* Back button */}
                <button
                    type="button"
                    onClick={() => router.push("/assignments")}
                    className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[#1a73e8] dark:text-blue-400 hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to All Assignments</span>
                </button>

                {/* Assignment Header Card */}
                <header className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 max-w-3xl">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                                    {assignment.kind || "Assignment"}
                                </span>
                                {assignment.courseName && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                                        <BookOpen className="h-3 w-3 text-slate-500" />
                                        {assignment.courseName}
                                    </span>
                                )}
                                {assignment.topic && (
                                    <span className="inline-flex items-center rounded-md bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400">
                                        {assignment.topic}
                                    </span>
                                )}
                            </div>

                            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                                {assignment.title}
                            </h1>

                            <div className="mt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 text-slate-400" />
                                    <span>
                                        Created by{" "}
                                        <strong className="font-semibold text-slate-800 dark:text-slate-200">
                                            {assignment.createdByName ?? "Instructor"}
                                        </strong>
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                    <span>Created {formatDateTime(assignment.createdAtUtc)}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                                    <span>Deadline: {formatDateTime(assignment.deadlineUtc)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Status & Max Marks Badges */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                            <StatusBadge status={assignment.status} />
                            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-3.5 py-1.5 text-center">
                                <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                    Max Marks
                                </span>
                                <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                                    {assignment.maxMarks > 0 ? assignment.maxMarks : "Ungraded"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats strip */}
                    <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800 pt-6 sm:grid-cols-4">
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-3 text-center">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Total Enrolled</p>
                            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
                                {totalSubmissions}
                            </p>
                        </div>
                        <div className="rounded-xl bg-blue-50/60 dark:bg-blue-950/30 p-3 text-center">
                            <p className="text-xs text-blue-700 dark:text-blue-300">Turned In</p>
                            <p className="mt-1 text-xl font-bold text-blue-700 dark:text-blue-300">
                                {turnedInCount}
                            </p>
                        </div>
                        <div className="rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 p-3 text-center">
                            <p className="text-xs text-emerald-700 dark:text-emerald-300">Graded</p>
                            <p className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-300">
                                {gradedCount}
                            </p>
                        </div>
                        <div className="rounded-xl bg-amber-50/60 dark:bg-amber-950/30 p-3 text-center">
                            <p className="text-xs text-amber-700 dark:text-amber-300">Pending</p>
                            <p className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-300">
                                {pendingCount}
                            </p>
                        </div>
                    </div>
                </header>

                {/* Tab Navigation */}
                <nav className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={() => setActiveTab("overview")}
                        className={`cursor-pointer pb-3 text-sm font-medium transition-colors ${
                            activeTab === "overview"
                                ? "border-b-2 border-[#1a73e8] text-[#1a73e8] dark:border-blue-500 dark:text-blue-400 font-semibold"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                        }`}
                    >
                        Assignment Details &amp; Materials
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("submissions")}
                        className={`cursor-pointer pb-3 text-sm font-medium transition-colors flex items-center gap-2 ${
                            activeTab === "submissions"
                                ? "border-b-2 border-[#1a73e8] text-[#1a73e8] dark:border-blue-500 dark:text-blue-400 font-semibold"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                        }`}
                    >
                        <span>Learner Submissions</span>
                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-700 dark:text-slate-300">
                            {submissions.length}
                        </span>
                    </button>
                </nav>

                {/* Tab 1: Overview */}
                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Description & Reference Materials (Left: 2 cols) */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Instructions */}
                            <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-8">
                                <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    <FileText className="h-4 w-4 text-blue-500" />
                                    <span>Instructions &amp; Description</span>
                                </div>
                                {assignment.description ? (
                                    <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line">
                                        {assignment.description}
                                    </div>
                                ) : (
                                    <p className="text-sm italic text-slate-500 dark:text-slate-400">
                                        No instructions or description provided for this assignment.
                                    </p>
                                )}
                            </section>

                            {/* Reference Attachments from Instructor */}
                            {assignment.attachments && assignment.attachments.length > 0 && (
                                <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                    <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        <Paperclip className="h-4 w-4 text-blue-500" />
                                        <span>Reference Attachments ({assignment.attachments.length})</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {assignment.attachments.map((att) => {
                                            const fileUrl = att.url?.startsWith("http")
                                                ? att.url
                                                : `${API_URL}${att.url}`;
                                            return (
                                                <div
                                                    key={att.id}
                                                    className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setViewerAttachment({
                                                                id: att.id,
                                                                title: att.fileName,
                                                                fileType: att.fileType,
                                                                fileSize: att.fileSize,
                                                                url: att.url,
                                                                kind: att.kind as "file" | "link",
                                                            })
                                                        }
                                                        className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer hover:opacity-80 transition-opacity"
                                                    >
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                                            <FileText className="h-5 w-5" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-xs font-medium text-slate-900 dark:text-slate-100">
                                                                {att.fileName}
                                                            </p>
                                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                {att.fileSize}
                                                            </p>
                                                        </div>
                                                    </button>
                                                    <div className="flex items-center gap-1 shrink-0 ml-2">
                                                        <button
                                                            type="button"
                                                            title="Preview file"
                                                            onClick={() =>
                                                                setViewerAttachment({
                                                                    id: att.id,
                                                                    title: att.fileName,
                                                                    fileType: att.fileType,
                                                                    fileSize: att.fileSize,
                                                                    url: att.url,
                                                                    kind: att.kind as "file" | "link",
                                                                })
                                                            }
                                                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-blue-600 dark:hover:bg-slate-700 dark:hover:text-blue-400 cursor-pointer"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        <a
                                                            href={fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            download={att.fileName}
                                                            title="Download file"
                                                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-blue-600 dark:hover:bg-slate-700 dark:hover:text-blue-400"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </a>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Metadata Sidebar (Right: 1 col) */}
                        <aside className="space-y-6">
                            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
                                    Course Details
                                </h3>
                                <dl className="space-y-3.5 text-xs">
                                    <div className="flex items-start gap-3">
                                        <BookOpen className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                        <div>
                                            <dt className="text-slate-500">Course</dt>
                                            <dd className="font-medium text-slate-900 dark:text-slate-100">
                                                {assignment.courseName ?? "—"}
                                            </dd>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Tag className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                        <div>
                                            <dt className="text-slate-500">Category</dt>
                                            <dd className="font-medium text-slate-900 dark:text-slate-100">
                                                {assignment.department ?? "—"}
                                            </dd>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Clock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                        <div>
                                            <dt className="text-slate-500">Late Submissions</dt>
                                            <dd className="font-medium text-slate-900 dark:text-slate-100">
                                                {assignment.allowLateSubmissions !== false
                                                    ? "Allowed"
                                                    : "Closed after deadline"}
                                            </dd>
                                        </div>
                                    </div>
                                </dl>
                            </div>
                        </aside>
                    </div>
                )}

                {/* Tab 2: Submissions Table */}
                {activeTab === "submissions" && (
                    <section className="space-y-4">
                        {/* Search and Filters */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="relative flex-1 min-w-[240px] max-w-md">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by learner name, email, or ID…"
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:border-[#1a73e8] focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                {["all", "Submitted", "Graded", "Pending"].map((status) => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => setStatusFilter(status)}
                                        className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                            statusFilter === status
                                                ? "bg-[#1a73e8] text-white"
                                                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        }`}
                                    >
                                        {status === "all" ? "All Submissions" : status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="rounded-2xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs overflow-hidden">
                            <DataTable
                                columns={submissionColumns}
                                data={filteredSubmissions}
                                keyExtractor={(s) => s.id}
                                emptyMessage="No learner submissions matching your criteria."
                            />
                        </div>
                    </section>
                )}
            </div>

            {/* File Viewer Modal */}
            {viewerAttachment && (
                <FileViewerModal
                    attachment={viewerAttachment}
                    onClose={() => setViewerAttachment(null)}
                />
            )}
        </div>
    );
}
