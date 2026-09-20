"use client";

import { useCallback, useEffect, useState } from "react";
import { notFound } from "next/navigation";
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

    if (isLearner) {
        try {
            const mySubs = await getMySubmissionsRequest();
            const mine = mySubs.find((s) => s.assignmentId === dto.id);
            if (mine) {
                submissionId = mine.id;
                submissionStatus =
                    mine.status === "Graded" ? "Graded" : mine.status === "Submitted" ? "Turned in" : "Assigned";
                submissionAttachments = (mine.attachments ?? []).map((att) => ({
                    id: att.id,
                    title: att.fileName,
                    fileType: att.fileType,
                    thumbClass: "bg-gray-100",
                    url: att.url ?? undefined,
                    kind: (att.kind === "link" ? "link" : "file") as "file" | "link",
                }));
            }
        } catch {
            // Fall back to "Assigned" if submissions can't be loaded.
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
        },
        privateCommentTarget: creatorName,
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
        notFound();
    }

    if (loading || (!isLearner && !assignmentDto) || (isLearner && !detail)) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
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