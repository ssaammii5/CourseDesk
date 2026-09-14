import { redirect } from "next/navigation";

interface AnnouncementsPageProps {
    params: Promise<{ courseId: string }>;
}

export default async function AnnouncementsPage({ params }: AnnouncementsPageProps) {
    const { courseId } = await params;
    redirect(`/class/${courseId}`);
}
