"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { ClassPageClient } from "@/components/class/ClassPageClient";
import { getCourseRequest, getCoursePeopleRequest } from "@/lib/api/courses";
import { getCourseAssignmentsRequest, type AssignmentDto } from "@/lib/api/assignments";
import { emojiFor, headerColorFor, avatarClassFor } from "@/lib/courseTheme";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { ClassDetails, ClassPerson, ClassworkEntry } from "@/lib/schemas";

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDue(iso: string): string {
    const d = new Date(iso);
    const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `${date}, ${time}`;
}

function mapAssignmentToClasswork(dto: AssignmentDto, isStudent: boolean): ClassworkEntry {
    const status: ClassworkEntry["status"] = isStudent
        ? ((dto.mySubmissionStatus as ClassworkEntry["status"]) ?? "Assigned")
        : dto.status === "Draft"
            ? "Draft"
            : "Assigned";

    return {
        id: dto.id,
        title: dto.title,
        topic: dto.topic || dto.courseName || "No topic",
        dueLabel: `Due ${formatDue(dto.deadlineUtc)}`,
        postedLabel: `Posted ${formatDate(dto.createdAtUtc)}`,
        status,
        description: dto.description,
        kind: (dto.kind ?? "assignment").toLowerCase() as ClassworkEntry["kind"],
    };
}

interface ClassDataClientProps {
    courseId: number;
}

export function ClassDataClient({ courseId }: ClassDataClientProps) {
    const { user } = useAuth();
    const isStudent = user?.role === "Student";

    const [title, setTitle] = useState("");
    const [details, setDetails] = useState<ClassDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFoundFlag, setNotFoundFlag] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const [course, assignments, people] = await Promise.all([
                    getCourseRequest(courseId),
                    getCourseAssignmentsRequest(courseId),
                    getCoursePeopleRequest(courseId),
                ]);

                if (cancelled) return;

                const classwork: ClassworkEntry[] = assignments.map((a) =>
                    mapAssignmentToClasswork(a, isStudent),
                );

                const peopleList: ClassPerson[] = [
                    ...people.teachers.map((t) => ({
                        id: t.id,
                        name: t.name,
                        role: "Teacher" as const,
                        avatarClass: avatarClassFor(t.id),
                    })),
                    ...people.students.map((s) => ({
                        id: s.id,
                        name: s.name,
                        role: "Student" as const,
                        avatarClass: avatarClassFor(s.id),
                    })),
                ];

                setTitle(course.name);
                setDetails({
                    courseId,
                    session: course.session || course.subject || undefined,
                    bannerColor: headerColorFor(courseId),
                    bannerEmoji: emojiFor(courseId),
                    // Announcements are not modeled in the backend yet (deferred).
                    announcements: [],
                    classwork,
                    people: peopleList,
                });
            } catch {
                if (!cancelled) setNotFoundFlag(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, [courseId, isStudent]);

    if (notFoundFlag) {
        notFound();
    }

    if (loading || !details) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
            </div>
        );
    }

    return <ClassPageClient title={title} details={details} />;
}