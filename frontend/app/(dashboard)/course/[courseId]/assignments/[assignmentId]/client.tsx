"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { AssignmentDetailView, InstructorAssignmentView } from "@/features/course";
import { getAssignmentRequest, type AssignmentDto } from "@/lib/api/assignments";
import { getMySubmissionsRequest } from "@/lib/api/submissions";
import { useAuth } from "@/hooks";
import type { AssignmentDetail } from "@/types";

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDue(iso: string): string {
    const d = new Date(iso);
    const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `Due ${date}, ${time}`;
}

async function buildDetail(dto: AssignmentDto, isLearner: boolean): Promise<AssignmentDetail> {
    let submissionStatus: AssignmentDetail["submission"]["status"] = "Assigned";
    let submissionId: number | undefined = undefined;
    let submissionAttachments: AssignmentDetail["submission"]["attachments"] = [];
    let submissionMarks: number | null | undefined = undefined;
    let submissionFeedback: string | null | undefined = undefined;
    let gradedByName: string | null | undefined = undefined;
    let gradedAtUtc: string | null | undefined = undefined;

    if (isLearner) {
        try {
            const mySubs = await getMySubmissionsRequest();
            const mine = mySubs.find((s) => s.assignmentId === dto.id);
            if (mine) {
                submissionId = mine.id;
                submissionMarks = mine.marks;
                submissionFeedback = mine.feedback;
                gradedByName = mine.gradedByName;
                gradedAtUtc = mine.gradedAtUtc;
                const hasWork = (mine.attachments && mine.attachments.length > 0) || Boolean(mine.answer?.trim() && mine.answer !== "Submitted via file attachment") || Boolean(mine.externalUrl?.trim());
                if (mine.status === "Graded") {
                    submissionStatus = "Graded";
                } else if (mine.status === "Submitted" || mine.status === "Turned in") {
                    submissionStatus = "Turned in";
                } else if (hasWork) {
                    submissionStatus = "Draft";
                } else if (mine.status === "Missed") {
                    submissionStatus = "Missed";
                } else {
                    const isPast = dto.deadlineUtc ? new Date(dto.deadlineUtc).getTime() < Date.now() : false;
                    const isClosed = isPast && dto.allowLateSubmissions === false;
                    submissionStatus = isClosed ? "Missed" : "Assigned";
                }
                submissionAttachments = (mine.attachments ?? []).map((att) => ({
                    id: att.id,
                    title: att.fileName,
                    fileType: att.fileType,
                    thumbClass: "bg-gray-100",
                    url: att.url ?? undefined,
                    kind: (att.kind === "link" ? "link" : "file") as "file" | "link",
                }));
            } else {
                const isPast = dto.deadlineUtc ? new Date(dto.deadlineUtc).getTime() < Date.now() : false;
                const isClosed = isPast && dto.allowLateSubmissions === false;
                submissionStatus = isClosed ? "Missed" : "Assigned";
            }
        } catch {
            const isPast = dto.deadlineUtc ? new Date(dto.deadlineUtc).getTime() < Date.now() : false;
            const isClosed = isPast && dto.allowLateSubmissions === false;
            submissionStatus = isClosed ? "Missed" : "Assigned";
        }
    }

    const creatorName = dto.createdByName ?? "Instructor";

    return {
        id: dto.id,
        title: dto.title,
        instructorName: creatorName,
        teacherName: creatorName,
        postedDate: formatDate(dto.createdAtUtc),
        points: dto.maxMarks,
        dueLabel: formatDue(dto.deadlineUtc),
        description: dto.description,
        attachments: (dto.attachments ?? []).map((att) => ({
            id: att.id,
            title: att.fileName,
            fileType: att.fileType,
            thumbClass: "bg-blue-600",
            url: att.url ?? undefined,
            kind: "file",
        })),
        submission: {
            id: submissionId,
            status: submissionStatus,
            attachments: submissionAttachments,
            marks: submissionMarks,
            feedback: submissionFeedback,
            gradedByName,
            gradedAtUtc,
        },
        privateCommentTarget: creatorName,
        courseId: dto.courseId,
        deadlineUtc: dto.deadlineUtc,
        createdAtUtc: dto.createdAtUtc,
        kind: dto.kind,
        topic: dto.topic,
        courseName: dto.courseName,
        allowLateSubmissions: dto.allowLateSubmissions ?? true,
    };
}

interface AssignmentDetailClientProps {
    courseId: number;
    assignmentId: number;
}

export function LearnerAssignmentDetailClient({ courseId, assignmentId }: AssignmentDetailClientProps) {
    const { user } = useAuth();
    const isLearner = user?.role === "Learner" || (user?.role as string) === "Student";

    const [assignmentDto, setAssignmentDto] = useState<AssignmentDto | null>(null);
    const [detail, setDetail] = useState<AssignmentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFoundFlag, setNotFoundFlag] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const dto = await getAssignmentRequest(assignmentId);
            setAssignmentDto(dto);
            if (isLearner) {
                const mapped = await buildDetail(dto, true);
                setDetail(mapped);
            }
        } catch {
            setNotFoundFlag(true);
        } finally {
            setLoading(false);
        }
    }, [assignmentId, isLearner]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    if (notFoundFlag) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6 bg-slate-50/60 dark:bg-slate-950">
                <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4 dark:bg-amber-950/60 dark:text-amber-400">
                        <FileQuestion className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2 dark:text-slate-100">
                        Assignment Not Found
                    </h2>
                    <p className="text-sm text-slate-600 mb-6 leading-relaxed dark:text-slate-400">
                        This assignment may have been removed, or you might not have access to view it.
                    </p>
                    <Link
                        href={`/course/${courseId}?tab=coursework`}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Coursework
                    </Link>
                </div>
            </div>
        );
    }

    if (loading || (!isLearner && !assignmentDto) || (isLearner && !detail)) {
        return (
            <div className="min-h-[calc(100vh-4rem)] bg-slate-50/60 dark:bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl animate-pulse space-y-6">
                    <div className="h-5 w-40 rounded-lg bg-slate-200 dark:bg-slate-800" />
                    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                        <div className="space-y-6 lg:col-span-8">
                            <div className="rounded-2xl border border-slate-200/80 bg-white p-8 dark:border-slate-800 dark:bg-slate-900 space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="h-6 w-24 rounded-md bg-slate-200 dark:bg-slate-800" />
                                    <div className="h-6 w-28 rounded-full bg-slate-200 dark:bg-slate-800" />
                                </div>
                                <div className="h-8 w-3/4 rounded-lg bg-slate-200 dark:bg-slate-800" />
                                <div className="flex gap-4 pt-2">
                                    <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-800" />
                                    <div className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                                    <div className="h-5 w-28 rounded bg-slate-200 dark:bg-slate-800" />
                                </div>
                                <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />
                                <div className="space-y-2.5">
                                    <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800" />
                                    <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
                                    <div className="h-4 w-4/6 rounded bg-slate-200 dark:bg-slate-800" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6 lg:col-span-4">
                            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                                    <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
                                </div>
                                <div className="h-24 w-full rounded-xl bg-slate-100 dark:bg-slate-800" />
                                <div className="h-10 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isLearner && assignmentDto) {
        return (
            <InstructorAssignmentView
                assignment={assignmentDto}
                courseId={courseId}
                onRefresh={loadData}
            />
        );
    }

    return detail ? <AssignmentDetailView detail={detail} onRefresh={loadData} /> : null;
}

export const StudentAssignmentDetailClient = LearnerAssignmentDetailClient;