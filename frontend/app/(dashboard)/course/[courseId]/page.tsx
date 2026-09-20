import { Suspense } from "react";
import { CourseDataClient } from "./client";
import type { CourseTab } from "@/features/course";

interface CoursePageProps {
    params: Promise<{ courseId: string }>;
    searchParams?: Promise<{ tab?: string }>;
}

export default async function CoursePage({ params, searchParams }: CoursePageProps) {
    const { courseId } = await params;
    const sp = searchParams ? await searchParams : undefined;
    const initialTab = sp?.tab as CourseTab | undefined;
    return (
        <Suspense>
            <CourseDataClient courseId={Number(courseId)} initialTab={initialTab} />
        </Suspense>
    );
}