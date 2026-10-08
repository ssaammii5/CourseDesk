"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    ExternalLink,
    Eye,
    FileText,
    FolderCheck,
    MessageSquare,
    Paperclip,
    Search,
    Send,
    RotateCcw,
    User,
    Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateAssignmentRequest, type AssignmentDto } from "@/lib/api/assignments";
import {
    getSubmissionsByAssignmentRequest,
    gradeSubmissionRequest,
    ungradeSubmissionRequest,
    type SubmissionDto,
} from "@/lib/api/submissions";
import { initialOf } from "@/lib/utils/format";
import { API_URL } from "@/lib/api/client";
import { FileViewerModal, RichTextContent, type PreviewableAttachment } from "@/components/ui";
import { AssignmentComments } from "../components/AssignmentComments";

export interface InstructorAssignmentViewProps {
    assignment: AssignmentDto;
    courseId: number | string;
    onRefresh?: () => void;
    backHref?: string;
}

type TabType = "learner-work" | "private-comments" | "instructions";
type StatusFilter = "All" | "Submitted" | "Assigned" | "Graded";

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
    backHref,
}: InstructorAssignmentViewProps) {
    const router = useRouter();
    const [tab, setTab] = useState<TabType>("learner-work");
    const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
    const [search, setSearch] = useState("");
    const [selectedLearnerId, setSelectedLearnerId] = useState<number | null>(null);
    const [commentLearnerSearch, setCommentLearnerSearch] = useState("");
    const [mobileCommentPane, setMobileCommentPane] = useState<"roster" | "chat">("roster");

    // Grading state per submission id
    const [gradeInputs, setGradeInputs] = useState<Record<number, { marks: string; feedback: string }>>({});
    const [savingGradeId, setSavingGradeId] = useState<number | null>(null);
    const [savedSuccessId, setSavedSuccessId] = useState<number | null>(null);
    const [viewerAttachment, setViewerAttachment] = useState<PreviewableAttachment | null>(null);

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
    const submittedCount = useMemo(
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

    // Active learner for private comments tab
    const activeLearnerId = selectedLearnerId ?? (submissions[0]?.learnerId ?? submissions[0]?.studentId ?? null);
    const activeLearner = useMemo(() => {
        return (
            submissions.find((s) => (s.learnerId ?? s.studentId) === activeLearnerId) ??
            submissions[0] ??
            null
        );
    }, [submissions, activeLearnerId]);

    const filteredCommentLearners = useMemo(() => {
        if (!commentLearnerSearch.trim()) return submissions;
        const q = commentLearnerSearch.toLowerCase();
        return submissions.filter((sub) => {
            const name = (sub.learnerName ?? sub.studentName ?? "").toLowerCase();
            const email = (sub.learnerEmail ?? sub.studentEmail ?? "").toLowerCase();
            const id = (sub.learnerAcademicId ?? sub.studentAcademicId ?? "").toLowerCase();
            return name.includes(q) || email.includes(q) || id.includes(q);
        });
    }, [submissions, commentLearnerSearch]);

    // Filtered list
    const filteredSubmissions = useMemo(() => {
        return submissions.filter((s) => {
            const learnerName = (s.learnerName ?? s.studentName ?? "").toLowerCase();
            const learnerEmail = (s.learnerEmail ?? s.studentEmail ?? "").toLowerCase();
            const learnerId = (s.learnerAcademicId ?? s.studentAcademicId ?? "").toLowerCase();
            const q = search.toLowerCase();

            const matchSearch = !q || learnerName.includes(q) || learnerEmail.includes(q) || learnerId.includes(q);

            let matchStatus = true;
            if (statusFilter === "Submitted") {
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

        let marksNum = 0;
        if (assignment.maxMarks > 0) {
            marksNum = Number(input.marks);
            if (Number.isNaN(marksNum) || marksNum < 0 || marksNum > assignment.maxMarks) {
                alert(`Please enter a valid grade between 0 and ${assignment.maxMarks}`);
                return;
            }
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

    const handleUngrade = async (submissionId: number) => {
        try {
            setSavingGradeId(submissionId);
            const updated = await ungradeSubmissionRequest(submissionId);
            setSubmissions((prev) =>
                prev.map((s) => (s.id === submissionId ? updated : s)),
            );
            setGradeInputs((prev) => ({
                ...prev,
                [submissionId]: {
                    marks: "",
                    feedback: prev[submissionId]?.feedback ?? "",
                },
            }));
            onRefresh?.();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to ungrade submission.");
        } finally {
            setSavingGradeId(null);
        }
    };

    const [togglingUngraded, setTogglingUngraded] = useState(false);
    const handleToggleAssignmentUngraded = async () => {
        try {
            setTogglingUngraded(true);
            const nextMarks = assignment.maxMarks > 0 ? 0 : 100;
            await updateAssignmentRequest(assignment.id, {
                title: assignment.title,
                description: assignment.description,
                topic: assignment.topic || "General",
                kind: assignment.kind || "Assignment",
                deadlineUtc: assignment.deadlineUtc,
                maxMarks: nextMarks,
            });
            assignment.maxMarks = nextMarks;
            onRefresh?.();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to update assignment.");
        } finally {
            setTogglingUngraded(false);
        }
    };

    const [togglingLateSubmissions, setTogglingLateSubmissions] = useState(false);
    const handleToggleLateSubmissions = async () => {
        try {
            setTogglingLateSubmissions(true);
            const currentAllow = assignment.allowLateSubmissions ?? true;
            const nextAllow = !currentAllow;
            await updateAssignmentRequest(assignment.id, {
                title: assignment.title,
                description: assignment.description,
                topic: assignment.topic || "General",
                kind: assignment.kind || "Assignment",
                deadlineUtc: assignment.deadlineUtc,
                maxMarks: assignment.maxMarks,
                sessionId: assignment.sessionId ?? null,
                assignMode: assignment.assignMode ?? "all",
                targetLearnerIds: assignment.targetLearnerIds ?? [],
                allowLateSubmissions: nextAllow,
            });
            assignment.allowLateSubmissions = nextAllow;
            onRefresh?.();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to update late submission setting.");
        } finally {
            setTogglingLateSubmissions(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-white dark:bg-slate-950 pb-16">
            {/* Top Bar with Navigation & Tabs */}
            <header className="sticky top-16 z-30 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="mx-auto flex max-w-[1200px] flex-col px-4 pt-2.5 sm:px-8">
                    {/* Compact Header Row */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <button
                                type="button"
                                onClick={() => {
                                    if (backHref) {
                                        router.push(backHref);
                                    } else if (typeof window !== "undefined" && window.history.length > 1) {
                                        router.back();
                                    } else {
                                        router.push(`/course/${courseId}?tab=coursework`);
                                    }
                                }}
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100 transition-colors shrink-0"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                <span>Back</span>
                            </button>

                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-slate-100 truncate">
                                        {assignment.title}
                                    </h1>
                                    <span className="hidden sm:inline-flex rounded-md bg-gray-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:text-slate-300">
                                        <Link
                                            href={`/course/${courseId}?tab=coursework`}
                                            className="hover:text-[#1a73e8] dark:hover:text-blue-400 transition-colors truncate max-w-[180px]"
                                        >
                                            {assignment.courseName}
                                        </Link>
                                    </span>
                                </div>
                                <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                                    Posted {formatDateTime(assignment.createdAtUtc)} • Due {formatDateTime(assignment.deadlineUtc)} • {assignment.maxMarks > 0 ? `Marks: ${assignment.maxMarks}` : "Ungraded"}
                                    {assignment.topic && ` • ${assignment.topic}`}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                                type="button"
                                onClick={handleToggleLateSubmissions}
                                disabled={togglingLateSubmissions}
                                className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-60 flex items-center gap-1.5 ${
                                    (assignment.allowLateSubmissions ?? true)
                                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                        : "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                }`}
                                title={(assignment.allowLateSubmissions ?? true) ? "Submissions are currently accepted after due date. Click to close after due date." : "Submissions are currently closed after due date. Click to accept late submissions."}
                            >
                                <Clock className="h-3 w-3 shrink-0" />
                                <span>
                                    {togglingLateSubmissions
                                        ? "Updating…"
                                        : (assignment.allowLateSubmissions ?? true)
                                        ? "Accepting Late Submissions"
                                        : "Closed After Due Date"}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={handleToggleAssignmentUngraded}
                                disabled={togglingUngraded}
                                className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-60 ${
                                    assignment.maxMarks === 0
                                        ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                }`}
                                title={assignment.maxMarks > 0 ? "Mark this assignment as Ungraded" : "Set assignment marks to 100"}
                            >
                                {togglingUngraded
                                    ? "Updating…"
                                    : assignment.maxMarks > 0
                                    ? "Mark as Ungraded"
                                    : "Set Marks: 100"}
                            </button>
                        </div>
                    </div>

                    {/* Compact Tabs */}
                    <nav className="flex gap-4 sm:gap-6 border-t border-gray-100 dark:border-slate-800 overflow-x-auto no-scrollbar">
                        <button
                            type="button"
                            onClick={() => setTab("learner-work")}
                            className={`relative flex cursor-pointer items-center gap-1.5 py-2 text-xs sm:text-sm font-medium transition-colors ${tab === "learner-work"
                                ? "text-[#1a73e8] dark:text-blue-400 font-semibold"
                                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
                                }`}
                        >
                            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span>Learner work</span>
                            <span className="rounded-full bg-[#e8f0fe] dark:bg-blue-950/60 px-1.5 py-0.2 text-[11px] font-semibold text-[#174ea6] dark:text-blue-300">
                                {submissions.length}
                            </span>
                            {tab === "learner-work" && (
                                <span className="absolute inset-x-0 -bottom-px h-[2.5px] rounded-t-full bg-[#1a73e8] dark:bg-blue-500" />
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setTab("private-comments")}
                            className={`relative flex cursor-pointer items-center gap-1.5 py-2 text-xs sm:text-sm font-medium transition-colors ${tab === "private-comments"
                                ? "text-[#1a73e8] dark:text-blue-400 font-semibold"
                                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
                                }`}
                        >
                            <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span>Private comments</span>
                            {tab === "private-comments" && (
                                <span className="absolute inset-x-0 -bottom-px h-[2.5px] rounded-t-full bg-[#1a73e8] dark:bg-blue-500" />
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setTab("instructions")}
                            className={`relative flex cursor-pointer items-center gap-1.5 py-2 text-xs sm:text-sm font-medium transition-colors ${tab === "instructions"
                                ? "text-[#1a73e8] dark:text-blue-400 font-semibold"
                                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
                                }`}
                        >
                            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span>Instructions</span>
                            {tab === "instructions" && (
                                <span className="absolute inset-x-0 -bottom-px h-[2.5px] rounded-t-full bg-[#1a73e8] dark:bg-blue-500" />
                            )}
                        </button>
                    </nav>
                </div>
            </header>

            {/* TAB 1: Learner Work */}
            {tab === "learner-work" && (
                <div className="mx-auto max-w-[1200px] px-4 py-4 sm:px-8 sm:py-5">
                    {/* Summary Counters Banner - Streamlined */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-[#f9fafc] dark:bg-slate-900 p-1.5 text-center shadow-2xs">
                        <button
                            type="button"
                            onClick={() => setStatusFilter(statusFilter === "Submitted" ? "All" : "Submitted")}
                            className={`group flex items-center justify-center gap-2 rounded-lg py-2 px-2.5 transition-all cursor-pointer text-center ${
                                statusFilter === "Submitted"
                                    ? "bg-blue-50/90 dark:bg-blue-950/60 ring-2 ring-[#1a73e8] dark:ring-blue-500 shadow-2xs text-[#1a73e8] dark:text-blue-400"
                                    : "hover:bg-white dark:hover:bg-slate-800/80 text-gray-700 dark:text-slate-300"
                            }`}
                        >
                            <span className="text-xl sm:text-2xl font-bold text-[#1a73e8] dark:text-blue-400 group-hover:scale-105 transition-transform">
                                {submittedCount}
                            </span>
                            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide">
                                Submitted
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setStatusFilter(statusFilter === "Assigned" ? "All" : "Assigned")}
                            className={`group flex items-center justify-center gap-2 rounded-lg py-2 px-2.5 transition-all cursor-pointer text-center ${
                                statusFilter === "Assigned"
                                    ? "bg-slate-200/80 dark:bg-slate-800 ring-2 ring-slate-400 dark:ring-slate-500 shadow-2xs text-gray-800 dark:text-slate-100"
                                    : "hover:bg-white dark:hover:bg-slate-800/80 text-gray-700 dark:text-slate-300"
                            }`}
                        >
                            <span className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-slate-200 group-hover:scale-105 transition-transform">
                                {assignedCount}
                            </span>
                            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide">
                                Assigned
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setStatusFilter(statusFilter === "Graded" ? "All" : "Graded")}
                            className={`group flex items-center justify-center gap-2 rounded-lg py-2 px-2.5 transition-all cursor-pointer text-center ${
                                statusFilter === "Graded"
                                    ? "bg-emerald-50/90 dark:bg-emerald-950/60 ring-2 ring-[#137333] dark:ring-emerald-500 shadow-2xs text-[#137333] dark:text-emerald-400"
                                    : "hover:bg-white dark:hover:bg-slate-800/80 text-gray-700 dark:text-slate-300"
                            }`}
                        >
                            <span className="text-xl sm:text-2xl font-bold text-[#137333] dark:text-emerald-400 group-hover:scale-105 transition-transform">
                                {gradedCount}
                            </span>
                            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide">
                                Graded
                            </span>
                        </button>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="mt-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search learner name or ID…"
                                className="w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 pl-9 pr-3 text-xs sm:text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-[#1a73e8] dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-[#1a73e8] dark:focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-slate-400">Filter status:</span>
                            {(["All", "Submitted", "Assigned", "Graded"] as StatusFilter[]).map((st) => (
                                <button
                                    key={st}
                                    type="button"
                                    onClick={() => setStatusFilter(st)}
                                    className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusFilter === st
                                        ? "bg-[#1a73e8] text-white"
                                        : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
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
                        <div className="mt-10 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 py-16 text-center">
                            <FolderCheck className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500" />
                            <h3 className="mt-2 text-base font-semibold text-gray-800 dark:text-slate-200">
                                No submissions found
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400">
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
                                        className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-shadow hover:shadow-sm"
                                    >
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            {/* Left: Learner Info & Submitted Content */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a73e8] text-sm font-semibold text-white">
                                                        {initialOf(lName)}
                                                    </span>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                                                            {lName}
                                                        </h3>
                                                        <p className="text-xs text-gray-500 dark:text-slate-400">
                                                            {lEmail}
                                                            {lAcadId && ` • ID: ${lAcadId}`}
                                                        </p>
                                                    </div>

                                                    {/* Status Badge & Actions */}
                                                    <div className="ml-auto flex items-center gap-2 sm:ml-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedLearnerId(sub.learnerId ?? sub.studentId ?? null);
                                                                setMobileCommentPane("chat");
                                                                setTab("private-comments");
                                                            }}
                                                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-[#1a73e8] transition-colors"
                                                            title="Open private comments with this learner"
                                                        >
                                                            <MessageSquare className="h-3.5 w-3.5 text-[#1a73e8] dark:text-blue-400" />
                                                            <span className="hidden sm:inline">Comments</span>
                                                        </button>
                                                        {isGraded ? (
                                                            <span className="rounded-full bg-green-100 dark:bg-emerald-950/60 px-3 py-1 text-xs font-semibold text-[#137333] dark:text-emerald-400">
                                                                {assignment.maxMarks > 0 ? `Graded: ${sub.marks}/${assignment.maxMarks}` : "Reviewed"}
                                                            </span>
                                                        ) : isSubmitted ? (
                                                            <span
                                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${isLate
                                                                    ? "bg-amber-100 dark:bg-amber-950/60 text-[#b06000] dark:text-amber-400"
                                                                    : "bg-blue-100 dark:bg-blue-950/60 text-[#174ea6] dark:text-blue-300"
                                                                    }`}
                                                            >
                                                                {isLate ? "Submitted late" : "Submitted"}
                                                            </span>
                                                        ) : (
                                                            <span className="rounded-full bg-gray-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-gray-600 dark:text-slate-300">
                                                                Assigned
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Submitted details */}
                                                {isSubmitted ? (
                                                    <div className="mt-4 space-y-2 rounded-lg bg-gray-50 dark:bg-slate-800/60 p-3.5">
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            Submitted {formatDateTime(sub.submittedAtUtc)}
                                                        </div>

                                                        {sub.answer && (
                                                            <div className="text-sm text-gray-800 dark:text-slate-200">
                                                                <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
                                                                    Text Answer / Notes:
                                                                </p>
                                                                <p className="mt-0.5 whitespace-pre-wrap">{sub.answer}</p>
                                                            </div>
                                                        )}

                                                        {sub.privateNote && (
                                                            <div className="text-xs text-gray-700 dark:text-slate-300">
                                                                <span className="font-semibold text-gray-600 dark:text-slate-400">
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
                                                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1a73e8] dark:text-blue-400 hover:underline"
                                                                >
                                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                                    {sub.externalUrl}
                                                                </a>
                                                            </div>
                                                        )}

                                                        {/* Attachments */}
                                                        {sub.attachments.length > 0 && (
                                                            <div className="mt-2 space-y-1.5 pt-1">
                                                                <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
                                                                    Attached Deliverables ({sub.attachments.length}):
                                                                </p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {sub.attachments.map((att) => {
                                                                        const downloadUrl = att.url?.startsWith("http")
                                                                            ? att.url
                                                                            : `${API_URL}${att.url}`;
                                                                        return (
                                                                            <div
                                                                                key={att.id}
                                                                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1 pl-3 pr-1.5 text-xs font-medium text-gray-800 dark:text-slate-200 shadow-2xs hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
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
                                                                                            kind: "file",
                                                                                        })
                                                                                    }
                                                                                    className="inline-flex cursor-pointer items-center gap-1.5 hover:text-[#1a73e8] dark:hover:text-blue-400"
                                                                                    title="Click to preview file"
                                                                                >
                                                                                    <Paperclip className="h-3.5 w-3.5 text-gray-500 dark:text-slate-400" />
                                                                                    <span className="max-w-[180px] truncate">
                                                                                        {att.fileName}
                                                                                    </span>
                                                                                    <Eye className="h-3.5 w-3.5 text-gray-400 hover:text-[#1a73e8] dark:text-slate-400" />
                                                                                </button>
                                                                                <a
                                                                                    href={downloadUrl}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    download={att.fileName}
                                                                                    className="rounded p-1 text-gray-400 hover:bg-gray-200/60 hover:text-gray-700 dark:hover:bg-slate-600 dark:hover:text-slate-200 transition-colors"
                                                                                    title="Download file"
                                                                                >
                                                                                    <Download className="h-3 w-3" />
                                                                                </a>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="mt-3 text-xs italic text-gray-500 dark:text-slate-400">
                                                        No submission yet.
                                                    </p>
                                                )}
                                            </div>

                                            {/* Right: Inline Grading Form */}
                                            <div className="w-full shrink-0 rounded-lg border border-gray-200 dark:border-slate-800 bg-[#f9fafc] dark:bg-slate-800/50 p-4 lg:w-[320px]">
                                                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-slate-300">
                                                    Grade &amp; Feedback
                                                </h4>

                                                <div className="mt-3 space-y-3">
                                                    {assignment.maxMarks > 0 ? (
                                                        <div>
                                                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-400">
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
                                                                    className="w-24 rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm font-semibold text-gray-900 dark:text-slate-100 focus:border-[#1a73e8] focus:outline-none"
                                                                />
                                                                <span className="text-sm font-medium text-gray-500 dark:text-slate-400">
                                                                    / {assignment.maxMarks}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 p-2.5 text-xs text-amber-800 dark:text-amber-200">
                                                            This assignment is <span className="font-semibold">Ungraded</span>. You can leave private feedback and mark as reviewed.
                                                        </div>
                                                    )}

                                                    <div>
                                                        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-400">
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
                                                            className="w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-gray-800 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-[#1a73e8] dark:focus:border-blue-500 focus:outline-none"
                                                        />
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            disabled={savingGradeId === sub.id}
                                                            onClick={() => handleSaveGrade(sub.id)}
                                                            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold text-white transition-colors ${savedSuccessId === sub.id
                                                                ? "bg-[#137333] dark:bg-emerald-600"
                                                                : "bg-[#1a73e8] hover:bg-[#1554b5] dark:bg-blue-600 dark:hover:bg-blue-500"
                                                                }`}
                                                        >
                                                            {savedSuccessId === sub.id ? (
                                                                <>
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                    {assignment.maxMarks > 0 ? "Grade Saved!" : "Feedback Saved!"}
                                                                </>
                                                            ) : savingGradeId === sub.id ? (
                                                                <span>Saving…</span>
                                                            ) : (
                                                                <>
                                                                    <Send className="h-3.5 w-3.5" />
                                                                    {isGraded
                                                                        ? (assignment.maxMarks > 0 ? "Update Grade" : "Update Feedback")
                                                                        : (assignment.maxMarks > 0 ? "Save Grade" : "Mark as Reviewed")}
                                                                </>
                                                            )}
                                                        </button>
                                                        {isGraded && (
                                                            <button
                                                                type="button"
                                                                disabled={savingGradeId === sub.id}
                                                                onClick={() => handleUngrade(sub.id)}
                                                                className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-3 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                                                title="Remove grade and mark submission as ungraded"
                                                            >
                                                                <RotateCcw className="h-3.5 w-3.5" />
                                                                Mark as ungraded
                                                            </button>
                                                        )}
                                                    </div>
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

            {/* TAB 2: Private comments */}
            {tab === "private-comments" && (
                <div className="mx-auto max-w-[1200px] px-3 py-3 sm:px-8 sm:py-5">
                    <div className="overflow-hidden rounded-xl sm:rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                        {/* Header banner */}
                        <div className="border-b border-gray-100 dark:border-slate-800 px-4 py-3 sm:px-5 bg-gray-50/60 dark:bg-slate-900/60">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-[#1a73e8] dark:text-blue-400 shrink-0" />
                                        Private Learner Comments
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                        Direct 1-on-1 private comments and individual feedback with learners for this assignment.
                                    </p>
                                </div>
                                {activeLearner && (
                                    <button
                                        type="button"
                                        onClick={() => setTab("learner-work")}
                                        className="self-start sm:self-auto hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-[#1a73e8] dark:text-blue-400 hover:underline cursor-pointer"
                                    >
                                        <FolderCheck className="h-3.5 w-3.5" />
                                        <span>View in Learner Work</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {loadingSubmissions ? (
                            <div className="flex h-64 items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
                            </div>
                        ) : submissions.length === 0 ? (
                            <div className="py-16 text-center">
                                <Users className="mx-auto h-12 w-12 text-gray-300 dark:text-slate-700" />
                                <p className="mt-3 text-sm font-medium text-gray-700 dark:text-slate-300">
                                    No learners enrolled yet
                                </p>
                                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                    Once learners join the course, you can message each of them privately here.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[480px] sm:min-h-[560px]">
                                {/* Left roster: Learner list */}
                                <div
                                    className={`md:col-span-4 border-r border-gray-200 dark:border-slate-800 flex flex-col bg-gray-50/40 dark:bg-slate-900/40 ${
                                        mobileCommentPane === "chat" ? "hidden md:flex" : "flex"
                                    }`}
                                >
                                    {/* Search input */}
                                    <div className="p-3 border-b border-gray-200 dark:border-slate-800">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-slate-500" />
                                            <input
                                                type="text"
                                                placeholder="Search learner..."
                                                value={commentLearnerSearch}
                                                onChange={(e) => setCommentLearnerSearch(e.target.value)}
                                                className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-8 pr-3 py-1.5 text-xs text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-[#1a73e8] dark:focus:border-blue-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Learner items list */}
                                    <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800 max-h-[520px] sm:max-h-[560px]">
                                        {filteredCommentLearners.length === 0 ? (
                                            <p className="p-6 text-center text-xs text-gray-500 dark:text-slate-400">
                                                No learner matches &quot;{commentLearnerSearch}&quot;
                                            </p>
                                        ) : (
                                            filteredCommentLearners.map((sub) => {
                                                const lId = sub.learnerId ?? sub.studentId;
                                                const lName = sub.learnerName ?? sub.studentName ?? "Learner";
                                                const lEmail = sub.learnerEmail ?? sub.studentEmail ?? "";
                                                const lAcadId = sub.learnerAcademicId ?? sub.studentAcademicId ?? "";
                                                const isSelected = activeLearner && (activeLearner.learnerId ?? activeLearner.studentId) === lId;

                                                return (
                                                    <button
                                                        key={sub.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedLearnerId(lId ?? null);
                                                            setMobileCommentPane("chat");
                                                        }}
                                                        className={`w-full text-left p-3 sm:p-3.5 flex items-center gap-3 transition-colors cursor-pointer ${
                                                            isSelected
                                                                ? "bg-blue-50/90 dark:bg-blue-950/60 border-l-4 border-l-[#1a73e8] dark:border-l-blue-500"
                                                                : "hover:bg-gray-100/70 dark:hover:bg-slate-800/60 border-l-4 border-l-transparent"
                                                        }`}
                                                    >
                                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1a73e8] text-xs font-semibold text-white">
                                                            {initialOf(lName)}
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between gap-1">
                                                                <p className={`truncate text-xs font-semibold ${
                                                                    isSelected
                                                                        ? "text-[#1a73e8] dark:text-blue-300"
                                                                        : "text-gray-900 dark:text-slate-100"
                                                                }`}>
                                                                    {lName}
                                                                </p>
                                                                {sub.status === "Graded" ? (
                                                                    <span className="shrink-0 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                                        {assignment.maxMarks > 0 ? `${sub.marks}/${assignment.maxMarks}` : "Reviewed"}
                                                                    </span>
                                                                ) : sub.submittedAtUtc ? (
                                                                    <span className="shrink-0 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                                                                        Submitted
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                            <p className="truncate text-[11px] text-gray-500 dark:text-slate-400">
                                                                {lAcadId ? `ID: ${lAcadId} • ` : ""}{lEmail}
                                                            </p>
                                                        </div>
                                                        <ChevronRight className="h-4 w-4 text-gray-400 dark:text-slate-600 shrink-0 md:hidden" />
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                {/* Right chat panel */}
                                <div
                                    className={`md:col-span-8 flex flex-col p-3.5 sm:p-5 md:p-6 ${
                                        mobileCommentPane === "roster" ? "hidden md:flex" : "flex"
                                    }`}
                                >
                                    {/* Mobile back navigation bar */}
                                    <div className="md:hidden flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-slate-800">
                                        <button
                                            type="button"
                                            onClick={() => setMobileCommentPane("roster")}
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1a73e8] dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            <span>All Learners ({submissions.length})</span>
                                        </button>
                                        {activeLearner && (
                                            <button
                                                type="button"
                                                onClick={() => setTab("learner-work")}
                                                className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-[#1a73e8] dark:text-slate-400 dark:hover:text-blue-400 cursor-pointer"
                                            >
                                                <FolderCheck className="h-3.5 w-3.5" />
                                                <span>View Work</span>
                                            </button>
                                        )}
                                    </div>

                                    {activeLearner ? (
                                        <div className="flex flex-col h-full">
                                            {/* Active learner banner */}
                                            <div className="mb-3.5 pb-3 sm:mb-4 sm:pb-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                                    <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-[#1a73e8] text-xs sm:text-sm font-semibold text-white">
                                                        {initialOf(activeLearner.learnerName ?? activeLearner.studentName ?? "Learner")}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-slate-100 truncate">
                                                            {activeLearner.learnerName ?? activeLearner.studentName ?? "Learner"}
                                                        </h3>
                                                        <p className="text-[11px] sm:text-xs text-gray-500 dark:text-slate-400 truncate">
                                                            {activeLearner.learnerAcademicId ?? activeLearner.studentAcademicId
                                                                ? `ID: ${activeLearner.learnerAcademicId ?? activeLearner.studentAcademicId} • `
                                                                : ""}
                                                            {activeLearner.learnerEmail ?? activeLearner.studentEmail}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    {activeLearner.status === "Graded" ? (
                                                        <span className="rounded-full bg-green-100 dark:bg-emerald-950/60 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-[#137333] dark:text-emerald-400 whitespace-nowrap">
                                                            {assignment.maxMarks > 0 ? `Graded: ${activeLearner.marks}/${assignment.maxMarks}` : "Reviewed"}
                                                        </span>
                                                    ) : activeLearner.submittedAtUtc ? (
                                                        <span className="rounded-full bg-blue-100 dark:bg-blue-950/60 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-[#174ea6] dark:text-blue-300 whitespace-nowrap">
                                                            Submitted
                                                        </span>
                                                    ) : (
                                                        <span className="rounded-full bg-gray-100 dark:bg-slate-800 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-medium text-gray-600 dark:text-slate-300 whitespace-nowrap">
                                                            Assigned
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Comments thread */}
                                            <div className="flex-1">
                                                <AssignmentComments
                                                    key={activeLearner.learnerId ?? activeLearner.studentId ?? activeLearner.id}
                                                    assignmentId={assignment.id}
                                                    isPrivate={true}
                                                    learnerId={activeLearner.learnerId ?? activeLearner.studentId}
                                                    privateCommentTarget={activeLearner.learnerName ?? activeLearner.studentName ?? "Learner"}
                                                    compact={false}
                                                    showTitle={false}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-1 flex-col items-center justify-center text-center p-6 sm:p-8">
                                            <MessageSquare className="h-10 w-10 text-gray-300 dark:text-slate-600 mb-2" />
                                            <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                                                Select a learner
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mt-1">
                                                Choose a learner from the list to review or reply to their private comment thread.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: Instructions */}
            {tab === "instructions" && (
                <div className="mx-auto max-w-[900px] px-4 py-4 sm:px-8 sm:py-5">
                    <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-slate-800 pb-4">
                            <div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-[#1a73e8] dark:text-blue-400">
                                    {assignment.kind}
                                </span>
                                <h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-slate-100">
                                    {assignment.title}
                                </h2>
                                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                    Posted by {assignment.createdByName ?? "Instructor"} •{" "}
                                    {formatDateTime(assignment.createdAtUtc)}
                                </p>
                            </div>

                            <div className="text-right">
                                <span className="text-lg font-bold text-gray-900 dark:text-slate-100">
                                    {assignment.maxMarks > 0 ? `Marks: ${assignment.maxMarks}` : "Ungraded"}
                                </span>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    Due {formatDateTime(assignment.deadlineUtc)}
                                </p>
                            </div>
                        </div>

                        {/* Late submissions policy banner */}
                        <div className="mt-3 flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                (assignment.allowLateSubmissions ?? true)
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                    : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                            }`}>
                                <Clock className="h-3 w-3 shrink-0" />
                                {(assignment.allowLateSubmissions ?? true) ? "Late Submissions Allowed" : "Submissions Closed After Due Date"}
                            </span>
                        </div>

                        {/* Description */}
                        <div className="mt-6">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2">Instructions:</h3>
                            <div className="mt-2 text-sm leading-relaxed text-gray-700 dark:text-slate-300">
                                <RichTextContent text={assignment.description} fallback="No description provided." />
                            </div>
                        </div>

                        {/* Attachments */}
                        {assignment.attachments && assignment.attachments.length > 0 && (
                            <div className="mt-8 border-t border-gray-100 dark:border-slate-800 pt-6">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                                    Assignment Materials ({assignment.attachments.length}):
                                </h3>
                                <div className="mt-3 flex flex-wrap gap-3">
                                    {assignment.attachments.map((att) => {
                                        const fileUrl = att.url?.startsWith("http")
                                            ? att.url
                                            : `${API_URL}${att.url}`;
                                        return (
                                            <div
                                                key={att.id}
                                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 py-1 pl-3.5 pr-1.5 text-xs font-medium text-gray-800 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
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
                                                    className="inline-flex cursor-pointer items-center gap-2 hover:text-[#1a73e8] dark:hover:text-blue-400"
                                                    title="Click to preview file"
                                                >
                                                    <Paperclip className="h-4 w-4 text-[#1a73e8] dark:text-blue-400" />
                                                    <span className="truncate max-w-[200px]">{att.fileName}</span>
                                                    <Eye className="h-3.5 w-3.5 text-gray-400 hover:text-[#1a73e8] dark:text-slate-400" />
                                                </button>
                                                <a
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="rounded p-1 text-gray-400 hover:bg-gray-200/60 hover:text-gray-700 dark:hover:bg-slate-600 dark:hover:text-slate-200 transition-colors"
                                                    title="Open in new tab / download"
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                </a>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Comments / Discussion */}
                        <div className="mt-8 border-t border-gray-100 dark:border-slate-800 pt-6">
                            <AssignmentComments
                                assignmentId={assignment.id}
                                isPrivate={false}
                            />
                        </div>
                    </div>
                </div>
            )}

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
