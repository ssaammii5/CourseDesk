import { redirect } from "next/navigation";

interface ClassworkPageProps {
    params: Promise<{ courseId: string }>;
}

export default async function ClassworkPage({ params }: ClassworkPageProps) {
    const { courseId } = await params;
    redirect(`/class/${courseId}?tab=classwork`);
}
