import { redirect } from "next/navigation";

interface GradesPageProps {
    params: Promise<{ courseId: string }>;
}

export default async function GradesPage({ params }: GradesPageProps) {
    const { courseId } = await params;
    redirect(`/class/${courseId}?tab=grades`);
}
