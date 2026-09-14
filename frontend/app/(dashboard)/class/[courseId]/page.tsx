import { Suspense } from "react";
import { ClassDataClient } from "./client";
import type { ClassTab } from "@/features/class/components/ClassTabs";

interface ClassPageProps {
    params: Promise<{ courseId: string }>;
    searchParams?: Promise<{ tab?: string }>;
}

export default async function ClassPage({ params, searchParams }: ClassPageProps) {
    const { courseId } = await params;
    const sp = searchParams ? await searchParams : undefined;
    const initialTab = sp?.tab as ClassTab | undefined;
    return (
        <Suspense>
            <ClassDataClient courseId={Number(courseId)} initialTab={initialTab} />
        </Suspense>
    );
}