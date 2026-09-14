import { redirect } from "next/navigation";

interface CurriculumPageProps {
    params: Promise<{ courseId: string }>;
}

export default async function CurriculumPage({ params }: CurriculumPageProps) {
    const { courseId } = await params;
    redirect(`/class/${courseId}?tab=curriculum`);
}
