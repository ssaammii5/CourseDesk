"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { AdminAssignmentDetailView } from "@/features/admin";
import { getAssignmentRequest, type AssignmentDto } from "@/lib/api/assignments";
import { getSubmissionsByAssignmentRequest, type SubmissionDto } from "@/lib/api/submissions";

interface AdminAssignmentDetailClientProps {
    assignmentId: number;
}

export function AdminAssignmentDetailClient({ assignmentId }: AdminAssignmentDetailClientProps) {
    const [assignment, setAssignment] = useState<AssignmentDto | null>(null);
    const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFoundFlag, setNotFoundFlag] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [assignmentData, subsData] = await Promise.all([
                getAssignmentRequest(assignmentId),
                getSubmissionsByAssignmentRequest(assignmentId).catch(() => []),
            ]);
            setAssignment(assignmentData);
            setSubmissions(subsData);
        } catch {
            setNotFoundFlag(true);
        } finally {
            setLoading(false);
        }
    }, [assignmentId]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

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

    if (loading || !assignment) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
            </div>
        );
    }

    return (
        <AdminAssignmentDetailView
            assignment={assignment}
            submissions={submissions}
            onRefresh={loadData}
        />
    );
}