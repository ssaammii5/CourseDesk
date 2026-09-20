import { redirect } from "next/navigation";

interface CourseworkPageProps {
    params: Promise<{ courseId: string }>;
}

export default async function CourseworkPage({ params }: CourseworkPageProps) {
    const { courseId } = await params;
    redirect(`/course/${courseId}?tab=coursework`);
}
