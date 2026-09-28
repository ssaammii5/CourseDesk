import { redirect } from "next/navigation";

interface LearnerWorkPageProps {
    params: Promise<{ courseId: string }>;
}

export default async function LearnerWorkPage({ params }: LearnerWorkPageProps) {
    const { courseId } = await params;
    redirect(`/course/${courseId}?tab=coursework`);
}