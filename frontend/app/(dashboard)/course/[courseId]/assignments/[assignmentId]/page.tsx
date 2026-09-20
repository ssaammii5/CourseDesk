import { LearnerAssignmentDetailClient } from "./client";

interface AssignmentPageProps {
    params: Promise<{ courseId: string; assignmentId: string }>;
}

export default async function AssignmentPage({ params }: AssignmentPageProps) {
    const { courseId, assignmentId } = await params;
    return (
        <LearnerAssignmentDetailClient
            courseId={Number(courseId)}
            assignmentId={Number(assignmentId)}
        />
    );
}