import { redirect } from "next/navigation";

interface VideoPageProps {
    params: Promise<{ courseId: string }>;
}

export default async function VideoPage({ params }: VideoPageProps) {
    const { courseId } = await params;
    redirect(`/course/${courseId}?tab=video`);
}
