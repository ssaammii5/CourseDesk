import { redirect } from "next/navigation";

interface LecturesPageProps {
    params: Promise<{ courseId: string }>;
}

export default async function LecturesPage({ params }: LecturesPageProps) {
    const { courseId } = await params;
    redirect(`/course/${courseId}?tab=curriculum`);
}
