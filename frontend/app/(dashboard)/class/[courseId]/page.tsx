import { ClassDataClient } from "./client";

interface ClassPageProps {
    params: Promise<{ courseId: string }>;
}

export default async function ClassPage({ params }: ClassPageProps) {
    const { courseId } = await params;
    return <ClassDataClient courseId={Number(courseId)} />;
}