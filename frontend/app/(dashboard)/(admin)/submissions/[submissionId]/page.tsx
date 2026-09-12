import { AdminSubmissionDetailClient } from "./client";

interface AdminSubmissionDetailPageProps {
    params: Promise<{ submissionId: string }>;
}

export default async function AdminSubmissionDetailPage({ params }: AdminSubmissionDetailPageProps) {
    const { submissionId } = await params;
    return <AdminSubmissionDetailClient submissionId={Number(submissionId)} />;
}