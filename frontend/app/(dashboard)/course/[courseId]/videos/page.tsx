import { redirect } from "next/navigation";

interface VideosPageProps {
    params: Promise<{ courseId: string }>;
}

export default async function VideosPage({ params }: VideosPageProps) {
    const { courseId } = await params;
    redirect(`/course/${courseId}?tab=video`);
}
