import { AdminAssignmentDetailClient } from "./client";

interface AdminAssignmentDetailPageProps {
    params: Promise<{ assignmentId: string }>;
}

export default async function AdminAssignmentDetailPage({ params }: AdminAssignmentDetailPageProps) {
    const { assignmentId } = await params;
    return <AdminAssignmentDetailClient assignmentId={Number(assignmentId)} />;
}