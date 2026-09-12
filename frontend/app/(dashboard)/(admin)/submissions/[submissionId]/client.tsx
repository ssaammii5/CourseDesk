"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { AdminSubmissionDetailView } from "@/features/admin";
import { getSubmissionRequest, type SubmissionDto } from "@/lib/api/submissions";

interface AdminSubmissionDetailClientProps {
    submissionId: number;
}

export function AdminSubmissionDetailClient({ submissionId }: AdminSubmissionDetailClientProps) {
    const [submission, setSubmission] = useState<SubmissionDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFoundFlag, setNotFoundFlag] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const dto = await getSubmissionRequest(submissionId);
                if (!cancelled) setSubmission(dto);
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
    }, [submissionId]);

    if (notFoundFlag) {
        notFound();
    }

    if (loading || !submission) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
            </div>
        );
    }

    return <AdminSubmissionDetailView submission={submission} />;
}