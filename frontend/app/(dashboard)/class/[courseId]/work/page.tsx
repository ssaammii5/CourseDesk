import { notFound } from "next/navigation";
import { StudentWorkView } from "@/features/class";
import { getStudentWork } from "@/lib/studentWork";

interface StudentWorkPageProps {
    params: Promise<{ courseId: string }>;
}

export default async function StudentWorkPage({ params }: StudentWorkPageProps) {
    const { courseId } = await params;
    const id = Number(courseId);
    if (!Number.isFinite(id) || id <= 0) notFound();

    const work = getStudentWork();

    return <StudentWorkView work={work} courseId={id} />;
}