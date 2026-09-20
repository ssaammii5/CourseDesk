"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    Check,
    CheckCircle2,
    Clock,
    Download,
    ExternalLink,
    FileText,
    FolderCheck,
    MessageSquare,
    Paperclip,
    Search,
    Send,
    User,
    Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AssignmentDto } from "@/lib/api/assignments";
import {
    getSubmissionsByAssignmentRequest,
    gradeSubmissionRequest,
    type SubmissionDto,
} from "@/lib/api/submissions";
import { initialOf } from "@/lib/utils/format";
import { API_URL } from "@/lib/api/client";

export interface InstructorAssignmentViewProps {
    assignment: AssignmentDto;
    courseId: number;
    onRefresh?: () => void;
}

type TabType = "learner-work" | "instructions";
type StatusFilter = "All" | "Turned in" | "Assigned" | "Graded";

function formatDateTime(iso?: string | null): string {
    if (!iso) return "No due date";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

export function InstructorAssignmentView({
    assignment,
    courseId,
    onRefresh,
}: InstructorAssignmentViewProps) {
    const router = useRouter();
    const [tab, setTab] = useState<TabType>("learner-work");
    const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
    const [search, setSearch] = useState("");

    // Grading state per submission id
    const [gradeInputs, setGradeInputs] = useState<Record<number, { marks: string; feedback: string }>>({});
    const [savingGradeId, setSavingGradeId] = useState<number | null>(null);
    const [savedSuccessId, setSavedSuccessId] = useState<number | null>(null);

    const loadSubmissions = useCallback(async () => {
        try {
            setLoadingSubmissions(true);
            const data = await getSubmissionsByAssignmentRequest(assignment.id);
            setSubmissions(data);

            // Pre-fill existing grades
            const initialInputs: Record<number, { marks: string; feedback: string }> = {};
            for (const sub of data) {
                initialInputs[sub.id] = {
                    marks: sub.marks !== null && sub.marks !== undefined ? String(sub.marks) : "",
                    feedback: sub.feedback ?? "",
                };
            }
            setGradeInputs(initialInputs);
        } catch {
            setSubmissions([]);
        } finally {
            setLoadingSubmissions(false);
        }
    }, [assignment.id]);

    useEffect(() => {
        void loadSubmissions();
    }, [loadSubmissions]);

    // Counters
    const turnedInCount = useMemo(
        () => submissions.filter((s) => s.submittedAtUtc && s.status !== "Graded").length,
        [submissions],
    );
    const gradedCount = useMemo(
        () => submissions.filter((s) => s.status === "Graded").length,
        [submissions],
    );
    const assignedCount = useMemo(
        () => submissions.filter((s) => !s.submittedAtUtc).length,
        [submissions],
    );

    // Filtered list
    const filteredSubmissions = useMemo(() => {
        return submissions.filter((s) => {
            const learnerName = (s.learnerName ?? s.studentName ?? "").toLowerCase();
            const learnerEmail = (s.learnerEmail ?? s.studentEmail ?? "").toLowerCase();
            const learnerId = (s.learnerAcademicId ?? s.studentAcademicId ?? "").toLowerCase();
            const q = search.toLowerCase();

            const matchSearch = !q || learnerName.includes(q) || learnerEmail.includes(q) || learnerId.includes(q);

            let matchStatus = true;
            if (statusFilter === "Turned in") {
                matchStatus = Boolean(s.submittedAtUtc && s.status !== "Graded");
            } else if (statusFilter === "Graded") {
                matchStatus = s.status === "Graded";
            } else if (statusFilter === "Assigned") {
                matchStatus = !s.submittedAtUtc;
            }

            return matchSearch && matchStatus;
        });
    }, [submissions, search, statusFilter]);

    const handleSaveGrade = async (submissionId: number) => {
        const input = gradeInputs[submissionId];
        if (!input) return;

        const marksNum = Number(input.marks);
        if (Number.isNaN(marksNum) || marksNum < 0 || marksNum > assignment.maxMarks) {
            alert(`Please enter a valid grade between 0 and ${assignment.maxMarks}`);
            return;
        }

        try {
            setSavingGradeId(submissionId);
            const updated = await gradeSubmissionRequest(submissionId, {
                marks: marksNum,
                feedback: input.feedback.trim() || null,
            });

            setSubmissions((prev) =>
                prev.map((s) => (s.id === submissionId ? updated : s)),
            );
            setSavedSuccessId(submissionId);
            setTimeout(() => setSavedSuccessId(null), 2500);
            onRefresh?.();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to grade submission.");
        } finally {
            setSavingGradeId(null);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-white pb-16">
            {/* Top Bar with Navigation & Tabs */}
            <header className="sticky top-16 z-30 border-b border-gray-200 bg-white">
                <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 pt-4 sm:px-8">
                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </button>
                        <span className="text-xs text-gray-500">
                            Course: <span className="font-medium text-gray-800">{assignment.courseName}</span>
                        </span>
                    </div>

                    <div className="flex items-center justify-between pb-1">
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                                {assignment.title}
                            </h1>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Due {formatDateTime(assignment.deadlineUtc)} • {assignment.maxMarks} points
                                {assignment.topic && ` • ${assignment.topic}`}
                            </p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <nav className="flex gap-8 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setTab("learner-work")}
                            className={`relative flex cursor-pointer items-center gap-2 py-3 text-sm font-medium transition-colors ${tab === "learner-work"
                                ? "text-[#1a73e8]"
                                : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            <Users className="h-4 w-4" />
                            Learner work
                            <span className="rounded-full bg-[#e8f0fe] px-2 py-0.5 text-xs font-semibold text-[#174ea6]">
                                {submissions.length}
                            </span>
                            {tab === "learner-work" && (
                                <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-t-full bg-[#1a73e8]" />
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setTab("instructions")}
                            className={`relative flex cursor-pointer items-center gap-2 py-3 text-sm font-medium transition-colors ${tab === "instructions"
                                ? "text-[#1a73e8]"
                                : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            <FileText className="h-4 w-4" />
                            Instructions
                            {tab === "instructions" && (
                                <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-t-full bg-[#1a73e8]" />
                            )}
                        </button>
                    </nav>
                </div>
            </header>

            {/* TAB 1: Learner Work */}
            {tab === "learner-work" && (
                <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-8">
                    {/* Summary Counters Banner */}
                    <div className="grid grid-cols-3 gap-4 rounded-xl border border-gray-200 bg-[#f9fafc] p-4 text-center sm:p-6">
                        <div className="border-r border-gray-200">
                            <span className="block text-3xl font-bold text-[#1a73e8]">
                                {turnedInCount}
                            </span>
                            <span className="text-xs font-medium uppercase tracking-wide text-gray-500 sm:text-sm">
                                Turned in
                            </span>
                        </div>
                        <div className="border-r border-gray-200">
                            <span className="block text-3xl font-bold text-gray-700">
                                {assignedCount}
                            </span>
                            <span className="text-xs font-medium uppercase tracking-wide text-gray-500 sm:text-sm">
                                Assigned
                            </span>
                        </div>
                        <div>
                            <span className="block text-3xl font-bold text-[#137333]">
                                {gradedCount}
                            </span>
                            <span className="text-xs font-medium uppercase tracking-wide text-gray-500 sm:text-sm">
                                Graded
                            </span>
                        </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search learner name or ID…"
                                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Filter status:</span>
                            {(["All", "Turned in", "Assigned", "Graded"] as StatusFilter[]).map((st) => (
                                <button
                                    key={st}
                                    type="button"
                                    onClick={() => setStatusFilter(st)}
                                    className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusFilter === st
                                        ? "bg-[#1a73e8] text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submissions List */}
                    {loadingSubmissions ? (
                        <div className="flex h-64 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
                        </div>
                    ) : filteredSubmissions.length === 0 ? (
                        <div className="mt-10 rounded-xl border border-gray-200 bg-gray-50 py-16 text-center">
                            <FolderCheck className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-base font-semibold text-gray-800">
                                No submissions found
                            </h3>
                            <p className="text-xs text-gray-500">
                                {statusFilter !== "All"
                                    ? `No learner work matches the "${statusFilter}" filter.`
                                    : "No learners have submitted work for this assignment yet."}
                            </p>
                        </div>
                    ) : (
                        <div className="mt-6 space-y-4">
                            {filteredSubmissions.map((sub) => {
                                const isSubmitted = Boolean(sub.submittedAtUtc);
                                const isGraded = sub.status === "Graded";
                                const isLate = sub.isLate;
                                const lName = sub.learnerName ?? sub.studentName ?? "Learner";
                                const lEmail = sub.learnerEmail ?? sub.studentEmail ?? "";
                                const lAcadId = sub.learnerAcademicId ?? sub.studentAcademicId ?? "";

                                const currentInput = gradeInputs[sub.id] ?? {
                                    marks: sub.marks !== null ? String(sub.marks) : "",
                                    feedback: sub.feedback ?? "",
                                };

                                return (
                                    <div
                                        key={sub.id}
                                        className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm"
                                    >
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            {/* Left: Learner Info & Submitted Content */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a73e8] text-sm font-semibold text-white">
                                                        {initialOf(lName)}
                                                    </span>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">
                                                            {lName}
                                                        </h3>
                                                        <p className="text-xs text-gray-500">
                                                            {lEmail}
                                                            {lAcadId && ` • ID: ${lAcadId}`}
                                                        </p>
                                                    </div>

                                                    {/* Status Badge */}
                                                    <div className="ml-auto sm:ml-4">
                                                        {isGraded ? (
                                                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-[#137333]">
                                                                Graded: {sub.marks}/{assignment.maxMarks}
                                                            </span>
                                                        ) : isSubmitted ? (
                                                            <span
                                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${isLate
                                                                    ? "bg-amber-100 text-[#b06000]"
                                                                    : "bg-blue-100 text-[#174ea6]"
                                                                    }`}
                                                            >
                                                                {isLate ? "Turned in late" : "Turned in"}
                                                            </span>
                                                        ) : (
                                                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                                                Assigned
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Submitted details */}
                                                {isSubmitted ? (
                                                    <div className="mt-4 space-y-2 rounded-lg bg-gray-50 p-3.5">
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            Submitted {formatDateTime(sub.submittedAtUtc)}
                                                        </div>

                                                        {sub.answer && (
                                                            <div className="text-sm text-gray-800">
                                                                <p className="text-xs font-medium text-gray-500">
                                                                    Text Answer / Notes:
                                                                </p>
                                                                <p className="mt-0.5 whitespace-pre-wrap">{sub.answer}</p>
                                                            </div>
                                                        )}

                                                        {sub.privateNote && (
                                                            <div className="text-xs text-gray-700">
                                                                <span className="font-semibold text-gray-600">
                                                                    Private Note from Learner:
                                                                </span>{" "}
                                                                {sub.privateNote}
                                                            </div>
                                                        )}

                                                        {sub.externalUrl && (
                                                            <div className="pt-1">
                                                                <a
                                                                    href={sub.externalUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1a73e8] hover:underline"
                                                                >
                                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                                    {sub.externalUrl}
                                                                </a>
                                                            </div>
                                                        )}

                                                        {/* Attachments */}
                                                        {sub.attachments.length > 0 && (
                                                            <div className="mt-2 space-y-1.5 pt-1">
                                                                <p className="text-xs font-medium text-gray-500">
                                                                    Attached Deliverables ({sub.attachments.length}):
                                                                </p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {sub.attachments.map((att) => {
                                                                        const downloadUrl = att.url?.startsWith("http")
                                                                            ? att.url
                                                                            : `${API_URL}${att.url}`;
                                                                        return (
                                                                            <a
                                                                                key={att.id}
                                                                                href={downloadUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 shadow-2xs hover:bg-gray-50"
                                                                            >
                                                                                <Paperclip className="h-3.5 w-3.5 text-gray-500" />
                                                                                <span className="max-w-[200px] truncate">
                                                                                    {att.fileName}
                                                                                </span>
                                                                                <Download className="h-3 w-3 text-gray-400" />
                                                                            </a>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="mt-3 text-xs italic text-gray-500">
                                                        No submission turned in yet.
                                                    </p>
                                                )}
                                            </div>

                                            {/* Right: Inline Grading Form */}
                                            <div className="w-full shrink-0 rounded-lg border border-gray-200 bg-[#f9fafc] p-4 lg:w-[320px]">
                                                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                                                    Grade &amp; Feedback
                                                </h4>

                                                <div className="mt-3 space-y-3">
                                                    <div>
                                                        <label className="mb-1 block text-xs font-medium text-gray-600">
                                                            Score (out of {assignment.maxMarks})
                                                        </label>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={assignment.maxMarks}
                                                                value={currentInput.marks}
                                                                onChange={(e) =>
                                                                    setGradeInputs((prev) => ({
                                                                        ...prev,
                                                                        [sub.id]: {
                                                                            ...currentInput,
                                                                            marks: e.target.value,
                                                                        },
                                                                    }))
                                                                }
                                                                placeholder="Score"
                                                                className="w-24 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 focus:border-[#1a73e8] focus:outline-none"
                                                            />
                                                            <span className="text-sm font-medium text-gray-500">
                                                                / {assignment.maxMarks}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="mb-1 block text-xs font-medium text-gray-600">
                                                            Private Feedback
                                                        </label>
                                                        <textarea
                                                            rows={2}
                                                            value={currentInput.feedback}
                                                            onChange={(e) =>
                                                                setGradeInputs((prev) => ({
                                                                    ...prev,
                                                                    [sub.id]: {
                                                                        ...currentInput,
                                                                        feedback: e.target.value,
                                                                    },
                                                                }))
                                                            }
                                                            placeholder="Add qualitative feedback…"
                                                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-[#1a73e8] focus:outline-none"
                                                        />
                                                    </div>

                                                    <button
                                                        type="button"
                                                        disabled={savingGradeId === sub.id}
                                                        onClick={() => handleSaveGrade(sub.id)}
                                                        className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold text-white transition-colors ${savedSuccessId === sub.id
                                                            ? "bg-[#137333]"
                                                            : "bg-[#1a73e8] hover:bg-[#1554b5]"
                                                            }`}
                                                    >
                                                        {savedSuccessId === sub.id ? (
                                                            <>
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                Grade Saved!
                                                            </>
                                                        ) : savingGradeId === sub.id ? (
                                                            <span>Saving…</span>
                                                        ) : (
                                                            <>
                                                                <Send className="h-3.5 w-3.5" />
                                                                {isGraded ? "Update Grade" : "Save Grade"}
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: Instructions */}
            {tab === "instructions" && (
                <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-8">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-4">
                            <div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-[#1a73e8]">
                                    {assignment.kind}
                                </span>
                                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                                    {assignment.title}
                                </h2>
                                <p className="mt-1 text-xs text-gray-500">
                                    Posted by {assignment.createdByName ?? "Instructor"} •{" "}
                                    {new Date(assignment.createdAtUtc).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="text-right">
                                <span className="text-lg font-bold text-gray-900">
                                    {assignment.maxMarks} points
                                </span>
                                <p className="text-xs text-gray-500">
                                    Due {formatDateTime(assignment.deadlineUtc)}
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mt-6">
                            <h3 className="text-sm font-semibold text-gray-900">Instructions:</h3>
                            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700">
                                {assignment.description || "No description provided."}
                            </p>
                        </div>

                        {/* Attachments */}
                        {assignment.attachments && assignment.attachments.length > 0 && (
                            <div className="mt-8 border-t border-gray-100 pt-6">
                                <h3 className="text-sm font-semibold text-gray-900">
                                    Assignment Materials ({assignment.attachments.length}):
                                </h3>
                                <div className="mt-3 flex flex-wrap gap-3">
                                    {assignment.attachments.map((att) => {
                                        const fileUrl = att.url?.startsWith("http")
                                            ? att.url
                                            : `${API_URL}${att.url}`;
                                        return (
                                            <a
                                                key={att.id}
                                                href={fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-800 hover:bg-gray-100"
                                            >
                                                <Paperclip className="h-4 w-4 text-[#1a73e8]" />
                                                <span className="truncate">{att.fileName}</span>
                                                <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
