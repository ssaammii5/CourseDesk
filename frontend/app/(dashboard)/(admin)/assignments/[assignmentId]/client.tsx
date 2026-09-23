"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { AssignmentDetailView } from "@/features/course";
import { getAssignmentRequest, type AssignmentDto } from "@/lib/api/assignments";
import type { AssignmentDetail } from "@/lib/assignmentDetails";

function mapDtoToAssignmentDetail(dto: AssignmentDto): AssignmentDetail {
    return {
        id: dto.id,
        title: dto.title,
        instructorName: dto.createdByName ?? "Unknown",
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
        courseId: dto.courseId,
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
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6 bg-gray-50/50">
                <div className="max-w-md w-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600 mb-4">
                        <FileQuestion className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Assignment not found
                    </h2>
                    <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                        This assignment may have been removed or deleted, or you may not have permission to view it.
                    </p>
                    <Link
                        href="/assignments"
                        className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#1557b0] transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Assignments
                    </Link>
                </div>
            </div>
        );
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