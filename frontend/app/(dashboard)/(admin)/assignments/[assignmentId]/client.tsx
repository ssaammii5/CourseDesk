"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { AssignmentDetailView } from "@/features/class";
import { getAssignmentRequest, type AssignmentDto } from "@/lib/api/assignments";
import type { AssignmentDetail } from "@/lib/assignmentDetails";

function mapDtoToAssignmentDetail(dto: AssignmentDto): AssignmentDetail {
    return {
        id: dto.id,
        title: dto.title,
        teacherName: dto.createdByName ?? "Unknown",
        postedDate: dto.createdAtUtc.split("T")[0],
        points: dto.maxMarks,
        dueLabel: `Due ${dto.deadlineUtc.split("T")[0]}`,
        description: dto.description,
        attachments: [],
        submission: {
            status: "Assigned",
            attachments: [],
        },
        privateCommentTarget: dto.createdByName ?? "Unknown",
    };
}

interface AdminAssignmentDetailClientProps {
    assignmentId: number;
}

export function AdminAssignmentDetailClient({ assignmentId }: AdminAssignmentDetailClientProps) {
    const [detail, setDetail] = useState<AssignmentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFoundFlag, setNotFoundFlag] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const dto = await getAssignmentRequest(assignmentId);
                if (!cancelled) {
                    setDetail(mapDtoToAssignmentDetail(dto));
                }
            } catch {
                if (!cancelled) {
                    setNotFoundFlag(true);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void load();
        return () => { cancelled = true; };
    }, [assignmentId]);

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

    return <AssignmentDetailView detail={detail} readOnly />;
}