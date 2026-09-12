import { notFound } from "next/navigation";
import { StudentWorkView } from "@/features/class";
import { homeClasses, sidebarClasses } from "@/lib/mock-data";
import { getStudentWork } from "@/lib/studentWork";

interface StudentWorkPageProps {
    params: Promise<{ courseId: string }>;
}

export default async function StudentWorkPage({ params }: StudentWorkPageProps) {
    const { courseId } = await params;
    const id = Number(courseId);

    const course =
        homeClasses.find((c) => c.id === id) ?? sidebarClasses.find((c) => c.id === id);

    if (!course) notFound();

    const work = getStudentWork();

    return <StudentWorkView work={work} courseId={id} />;
}