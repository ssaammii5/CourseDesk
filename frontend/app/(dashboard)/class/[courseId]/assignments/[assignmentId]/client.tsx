"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { AssignmentDetailView } from "@/components/class/AssignmentDetailView";
import { getAssignmentRequest, type AssignmentDto } from "@/lib/api/assignments";
import { getMySubmissionsRequest } from "@/lib/api/submissions";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { AssignmentDetail } from "@/lib/assignmentDetails";

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDue(iso: string): string {
    const d = new Date(iso);
    const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `Due ${date}, ${time}`;
}

async function buildDetail(dto: AssignmentDto, isStudent: boolean): Promise<AssignmentDetail> {
    let submissionStatus: AssignmentDetail["submission"]["status"] = "Assigned";

    if (isStudent) {
        try {
            const mySubs = await getMySubmissionsRequest();
            const mine = mySubs.find((s) => s.assignmentId === dto.id);
            if (mine) {
                submissionStatus =
                    mine.status === "Graded" ? "Graded" : mine.status === "Submitted" ? "Turned in" : "Assigned";
            }
        } catch {
            // Fall back to "Assigned" if submissions can't be loaded.
        }
    }

    return {
        id: dto.id,
        title: dto.title,
        teacherName: dto.createdByName ?? "Teacher",
        postedDate: formatDate(dto.createdAtUtc),
        points: dto.maxMarks,
        dueLabel: formatDue(dto.deadlineUtc),
        description: dto.description,
        attachments: [],
        submission: {
            status: submissionStatus,
            attachments: [],
        },
        privateCommentTarget: dto.createdByName ?? "Teacher",
    };
}

interface StudentAssignmentDetailClientProps {
    assignmentId: number;
}

export function StudentAssignmentDetailClient({ assignmentId }: StudentAssignmentDetailClientProps) {
    const { user } = useAuth();
    const isStudent = user?.role === "Student";

    const [detail, setDetail] = useState<AssignmentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFoundFlag, setNotFoundFlag] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const dto = await getAssignmentRequest(assignmentId);
                const mapped = await buildDetail(dto, isStudent);
                if (!cancelled) setDetail(mapped);
            } catch {
                if (!cancelled) setNotFoundFlag(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, [assignmentId, isStudent]);

    if (notFoundFlag) {
        notFound();
    }

    if (loading || !detail) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
            </div>
        );
    }

    return <AssignmentDetailView detail={detail} />;
}