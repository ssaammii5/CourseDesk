import { redirect } from "next/navigation";

interface PeoplePageProps {
    params: Promise<{ courseId: string }>;
}

export default async function PeoplePage({ params }: PeoplePageProps) {
    const { courseId } = await params;
    redirect(`/class/${courseId}?tab=people`);
}
