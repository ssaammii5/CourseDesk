import { redirect } from "next/navigation";

interface SubmissionsPageProps {
    params: Promise<{ courseId: string }>;
}

export default async function SubmissionsPage({ params }: SubmissionsPageProps) {
    const { courseId } = await params;
    redirect(`/course/${courseId}?tab=coursework`);
}
