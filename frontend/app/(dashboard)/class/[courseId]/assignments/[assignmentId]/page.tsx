import { StudentAssignmentDetailClient } from "./client";

interface AssignmentPageProps {
    params: Promise<{ courseId: string; assignmentId: string }>;
}

export default async function AssignmentPage({ params }: AssignmentPageProps) {
    const { assignmentId } = await params;
    return <StudentAssignmentDetailClient assignmentId={Number(assignmentId)} />;
}