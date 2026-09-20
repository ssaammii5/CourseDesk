import { redirect } from "next/navigation";

interface CurriculumPageProps {
    params: Promise<{ courseId: string }>;
}

export default async function CurriculumPage({ params }: CurriculumPageProps) {
    const { courseId } = await params;
    redirect(`/course/${courseId}?tab=curriculum`);
}
