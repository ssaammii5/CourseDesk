"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { CoursePageClient, type CourseTab } from "@/features/course";
import { getCourseRequest, getCoursePeopleRequest, type CourseDto } from "@/lib/api/courses";
import {
    getCourseAssignmentsRequest,
    type AssignmentDto,
} from "@/lib/api/assignments";
import { emojiFor, headerColorFor, avatarClassFor } from "@/lib/utils";
import { useAuth } from "@/hooks";
import type { CourseDetails, CoursePerson, CourseworkEntry } from "@/types";

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatDue(iso: string): string {
    const d = new Date(iso);
    const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const time = d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    });
    return `${date}, ${time}`;
}

function mapAssignmentToCoursework(
    dto: AssignmentDto,
    isLearner: boolean,
): CourseworkEntry {
    const status: CourseworkEntry["status"] = isLearner
        ? ((dto.mySubmissionStatus as CourseworkEntry["status"]) ?? "Assigned")
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
        kind: (dto.kind ?? "assignment").toLowerCase() as CourseworkEntry["kind"],
        deadlineUtc: dto.deadlineUtc,
        maxMarks: dto.maxMarks,
        submissionCount: dto.submissionCount,
        turnedInCount: dto.turnedInCount,
        gradedCount: dto.gradedCount,
        assignedCount: dto.assignedCount,
    };
}

interface CourseDataClientProps {
    courseId: number;
    initialTab?: CourseTab;
}

export function CourseDataClient({ courseId, initialTab }: CourseDataClientProps) {
    const { user } = useAuth();
    const isLearner = user?.role === "Learner" || (user?.role as string) === "Student";
    const [title, setTitle] = useState("");
    const [course, setCourse] = useState<CourseDto | null>(null);
    const [details, setDetails] = useState<CourseDetails | null>(null);
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

                const coursework: CourseworkEntry[] = assignments.map((a) =>
                    mapAssignmentToCoursework(a, isLearner),
                );
                const instructorsList = (people.instructors || people.teachers || []).map((t) => ({
                    id: t.id,
                    name: t.name,
                    role: "Instructor" as const,
                    avatarClass: avatarClassFor(t.id),
                }));
                const learnersList = (people.learners || people.students || []).map((s) => ({
                    id: s.id,
                    name: s.name,
                    role: "Learner" as const,
                    avatarClass: avatarClassFor(s.id),
                }));
                const peopleList: CoursePerson[] = [...instructorsList, ...learnersList];

                setTitle(course.name);
                setCourse(course);
                setDetails({
                    courseId,
                    session: course.session || course.subject || undefined,
                    bannerColor: headerColorFor(courseId),
                    bannerEmoji: emojiFor(courseId),
                    announcements: [],
                    classwork: coursework,
                    coursework,
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
    }, [courseId, isLearner]);

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

    return <CoursePageClient title={title} details={details} course={course} initialTab={initialTab} />;
}

export const ClassDataClient = CourseDataClient;