"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CourseTabs, type CourseTab, type ClassTab } from "../components/CourseTabs";
import { CourseworkView } from "./CourseworkView";
import { CurriculumView } from "./CurriculumView";
import { GradesView } from "./GradesView";
import { PeopleView } from "./PeopleView";
import { StreamView } from "./StreamView";
import { InstructorCourseworkView } from "./InstructorCourseworkView";
import { AssignmentCreateView } from "./AssignmentCreateView";
import { useAuth } from "@/hooks/useAuth";
import type { CourseDto } from "@/lib/api/courses";
import type { CourseDetails, CourseworkEntry, ClassDetails, ClassworkEntry } from "@/types";
import type { SessionDto, AnnouncementDto } from "@/types/session";
import type { SubmissionDto } from "@/lib/api/submissions";
import { loadInstructorCoursework, saveInstructorCoursework } from "@/lib/instructorCoursework";
import {
    createAssignmentRequest,
    uploadAssignmentAttachmentRequest,
} from "@/lib/api/assignments";
import { getCourseSessionsRequest } from "@/lib/api/sessions";
import {
    getCourseAnnouncementsRequest,
    createAnnouncementRequest,
    updateAnnouncementRequest,
    deleteAnnouncementRequest,
} from "@/lib/api/announcements";
import { getSubmissionsRequest } from "@/lib/api/submissions";

export interface CoursePageClientProps {
    title: string;
    details: ClassDetails;
    course?: CourseDto | null;
    initialTab?: CourseTab;
}
export type ClassPageClientProps = CoursePageClientProps;

function sortAnnouncements(list: AnnouncementDto[]): AnnouncementDto[] {
    return [...list].sort((a, b) => {
        if (a.isPinned !== b.isPinned) {
            return a.isPinned ? -1 : 1;
        }
        return new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime();
    });
}

const VALID_TABS: CourseTab[] = ["stream", "curriculum", "coursework", "classwork", "people", "grades"];

export function CoursePageClient({ title, details, course, initialTab }: CoursePageClientProps) {
    const { user } = useAuth();
    const isInstructor = user?.role === "Instructor" || (user?.role as string) === "Teacher" || user?.role === "Admin";
    const isTeacher = isInstructor;
    const searchParams = useSearchParams();
    const rawTab = searchParams ? searchParams.get("tab") : null;
    const queryTab = rawTab === "lectures" ? "curriculum" : (rawTab as CourseTab | null);

    const [tab, setTab] = useState<CourseTab>(() => {
        const startRaw = queryTab || initialTab;
        const startTab = startRaw === ("lectures" as unknown) ? "curriculum" : startRaw;
        if (startTab && VALID_TABS.includes(startTab)) {
            if (startTab === "grades" && !isInstructor) return "coursework";
            return startTab;
        }
        return "stream";
    });

    useEffect(() => {
        const raw = searchParams?.get("tab");
        const currentQuery = raw === "lectures" ? "curriculum" : (raw as CourseTab | null);
        const targetTab = currentQuery || initialTab;
        if (targetTab && VALID_TABS.includes(targetTab)) {
            if (targetTab === "grades" && !isInstructor) {
                setTab("coursework");
            } else {
                setTab(targetTab);
            }
        } else if (!currentQuery && !initialTab) {
            setTab("stream");
        }
    }, [searchParams, initialTab, isInstructor]);
    const [classwork, setClasswork] = useState<ClassworkEntry[]>(details.classwork);
    const [editorOpen, setEditorOpen] = useState(false);
    const [editing, setEditing] = useState<ClassworkEntry | null>(null);

    const [sessions, setSessions] = useState<SessionDto[]>([]);
    const [nextSession, setNextSession] = useState<SessionDto | null>(null);
    const [apiAnnouncements, setApiAnnouncements] = useState<AnnouncementDto[]>([]);
    const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);

    useEffect(() => {
        let cancelled = false;
        getCourseSessionsRequest(details.courseId)
            .then((data) => {
                if (cancelled) return;
                setSessions(data);
                const now = Date.now();
                const upcoming = data
                    .filter(
                        (s) =>
                            s.scheduledAtUtc &&
                            new Date(s.scheduledAtUtc).getTime() >= now - 15 * 60_000 &&
                            (s.status === "Scheduled" || s.status === "Live"),
                    )
                    .sort(
                        (a, b) =>
                            new Date(a.scheduledAtUtc!).getTime() -
                            new Date(b.scheduledAtUtc!).getTime(),
                    );
                setNextSession(upcoming[0] ?? null);
            })
            .catch(() => { });
        return () => {
            cancelled = true;
        };
    }, [details.courseId]);

    useEffect(() => {
        let cancelled = false;
        getCourseAnnouncementsRequest(details.courseId)
            .then((data) => {
                if (!cancelled) setApiAnnouncements(sortAnnouncements(data));
            })
            .catch(() => { });
        return () => {
            cancelled = true;
        };
    }, [details.courseId]);

    useEffect(() => {
        let cancelled = false;
        getSubmissionsRequest()
            .then((data) => {
                if (!cancelled) setSubmissions(data);
            })
            .catch(() => { });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (isInstructor)
            setClasswork(loadInstructorCoursework(details.courseId, details.classwork));
    }, [isInstructor, details.courseId, details.classwork]);

    const mutateClasswork = (next: ClassworkEntry[]) => {
        setClasswork(next);
        if (isInstructor) saveInstructorCoursework(details.courseId, next);
    };

    const openCreate = () => {
        setEditing(null);
        setEditorOpen(true);
    };

    const openEdit = (entry: ClassworkEntry) => {
        setEditing(entry);
        setEditorOpen(true);
    };

    const closeEditor = () => {
        setEditorOpen(false);
        setEditing(null);
    };

    const handleDelete = (entry: ClassworkEntry) =>
        mutateClasswork(classwork.filter((i) => i.id !== entry.id));

    const handlePostAnnouncement = useCallback(
        async (data: { title: string; body: string; isPinned: boolean }) => {
            try {
                const created = await createAnnouncementRequest({
                    courseId: details.courseId,
                    title: data.title,
                    body: data.body,
                    isPinned: data.isPinned,
                });
                setApiAnnouncements((prev) => sortAnnouncements([created, ...prev]));
            } catch (err) {
                console.error("Failed to post announcement", err);
            }
        },
        [details.courseId],
    );

    const handleUpdateAnnouncement = useCallback(
        async (id: number, data: { title: string; body: string; isPinned: boolean }) => {
            try {
                const updated = await updateAnnouncementRequest(id, {
                    title: data.title,
                    body: data.body,
                    isPinned: data.isPinned,
                });
                setApiAnnouncements((prev) =>
                    sortAnnouncements(prev.map((a) => (a.id === id ? updated : a)))
                );
            } catch (err) {
                console.error("Failed to update announcement", err);
            }
        },
        [],
    );

    const handleDeleteAnnouncement = useCallback(
        async (id: number) => {
            try {
                await deleteAnnouncementRequest(id);
                setApiAnnouncements((prev) => prev.filter((a) => a.id !== id));
            } catch (err) {
                console.error("Failed to delete announcement", err);
            }
        },
        [],
    );

    const handleTogglePin = useCallback(
        async (id: number, currentPinned: boolean) => {
            try {
                const updated = await updateAnnouncementRequest(id, {
                    isPinned: !currentPinned,
                });
                setApiAnnouncements((prev) =>
                    sortAnnouncements(prev.map((a) => (a.id === id ? updated : a)))
                );
            } catch (err) {
                console.error("Failed to toggle pin", err);
            }
        },
        [],
    );

    const handleSubmit = async (
        entry: ClassworkEntry,
        attachments: { kind: string; file?: File; url?: string; title?: string }[],
    ) => {
        try {
            const payload = {
                courseId: details.courseId,
                title: entry.title,
                description: entry.description,
                topic: entry.topic,
                kind:
                    entry.kind === "quiz"
                        ? "Quiz"
                        : entry.kind === "material"
                            ? "Material"
                            : "Assignment",
                deadlineUtc: new Date(
                    Date.now() + 7 * 24 * 60 * 60 * 1000,
                ).toISOString(),
                maxMarks: 100,
            };
            const res = await createAssignmentRequest(payload);
            const newId = res.id;

            for (const att of attachments) {
                const fd = new FormData();
                if (att.kind === "file" && att.file) {
                    fd.append("file", att.file);
                } else if (att.kind === "link" && att.url) {
                    fd.append("linkUrl", att.url);
                    fd.append("linkTitle", att.title ?? att.url);
                } else {
                    continue;
                }
                await uploadAssignmentAttachmentRequest(newId, fd);
            }

            const savedEntry: ClassworkEntry = { ...entry, id: newId };
            const exists = classwork.some((i) => i.id === entry.id);
            mutateClasswork(
                exists
                    ? classwork.map((i) => (i.id === entry.id ? savedEntry : i))
                    : [...classwork, savedEntry],
            );
            closeEditor();
        } catch (err) {
            console.error("Failed to create assignment", err);
        }
    };

    const assignmentStatusMap: Record<number, string> = {};
    for (const sub of submissions) {
        if (sub.submittedAtUtc) {
            assignmentStatusMap[sub.assignmentId] =
                sub.status === "Graded" ? "Graded" : "Submitted";
        }
    }
    for (const cw of classwork) {
        if (!assignmentStatusMap[cw.id] && cw.status !== "Draft") {
            assignmentStatusMap[cw.id] = cw.status;
        }
    }

    if (editorOpen)
        return (
            <AssignmentCreateView
                courseName={title}
                initial={editing}
                onClose={closeEditor}
                onSubmit={handleSubmit}
            />
        );

    const handleTabChange = (nextTab: ClassTab) => {
        setTab(nextTab);
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            if (nextTab === "stream") {
                url.searchParams.delete("tab");
            } else {
                url.searchParams.set("tab", nextTab);
            }
            window.history.replaceState(null, "", url.toString());
            window.dispatchEvent(new CustomEvent("coursedesk:tab-changed", { detail: { tab: nextTab } }));
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-10">
            <CourseTabs tab={tab} onTabChange={handleTabChange} isInstructor={isInstructor} isTeacher={isTeacher} />

            {tab === "stream" && (
                <StreamView
                    title={title}
                    details={details}
                    course={course}
                    nextSession={nextSession}
                    apiAnnouncements={apiAnnouncements}
                    isInstructor={isInstructor}
                    isTeacher={isTeacher}
                    onTabChange={handleTabChange}
                    onPostAnnouncement={isInstructor ? handlePostAnnouncement : undefined}
                    onUpdateAnnouncement={isInstructor ? handleUpdateAnnouncement : undefined}
                    onDeleteAnnouncement={isInstructor ? handleDeleteAnnouncement : undefined}
                    onTogglePin={isInstructor ? handleTogglePin : undefined}
                />
            )}

            {tab === "curriculum" && (
                <CurriculumView
                    sessions={sessions}
                    isInstructor={isInstructor}
                    isTeacher={isTeacher}
                    assignmentStatusMap={assignmentStatusMap}
                    courseTitle={title}
                    courseId={details.courseId}
                    classwork={classwork}
                />
            )}

            {(tab === "coursework" || tab === "classwork") &&
                (isInstructor ? (
                    <InstructorCourseworkView
                        items={classwork}
                        onCreate={openCreate}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                        courseId={details.courseId}
                    />
                ) : (
                    <CourseworkView items={classwork} courseId={details.courseId} />
                ))}

            {tab === "people" && <PeopleView people={details.people} />}

            {tab === "grades" && isInstructor && (
                <GradesView
                    people={details.people}
                    items={classwork}
                    submissions={submissions}
                />
            )}
        </div>
    );
}

export const ClassPageClient = CoursePageClient;