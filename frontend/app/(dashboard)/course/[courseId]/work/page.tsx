import { notFound } from "next/navigation";
import { LearnerWorkView } from "@/features/course";
import { getLearnerWork } from "@/lib/learnerWork";

interface LearnerWorkPageProps {
    params: Promise<{ courseId: string }>;
}

export default async function LearnerWorkPage({ params }: LearnerWorkPageProps) {
    const { courseId } = await params;
    const id = Number(courseId);
    if (!Number.isFinite(id) || id <= 0) notFound();

    const work = getLearnerWork();

    return <LearnerWorkView work={work} courseId={id} />;
}