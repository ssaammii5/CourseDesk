"use client";

import { useCallback, useEffect, useState } from "react";
import { ClassTabs, type ClassTab } from "../components/ClassTabs";
import { ClassworkView } from "./ClassworkView";
import { CurriculumView } from "./CurriculumView";
import { GradesView } from "./GradesView";
import { PeopleView } from "./PeopleView";
import { StreamView } from "./StreamView";
import { TeacherClassworkView } from "./TeacherClassworkView";
import { AssignmentCreateView } from "./AssignmentCreateView";
import { useAuth } from "@/hooks/useAuth";
import type { ClassDetails, ClassworkEntry } from "@/types";
import type { SessionDto, AnnouncementDto } from "@/types/session";
import type { SubmissionDto } from "@/lib/api/submissions";
import { loadTeacherClasswork, saveTeacherClasswork } from "@/lib/teacherClasswork";
import {
    createAssignmentRequest,
    uploadAssignmentAttachmentRequest,
} from "@/lib/api/assignments";
import { getCourseSessionsRequest } from "@/lib/api/sessions";
import {
    getCourseAnnouncementsRequest,
    createAnnouncementRequest,
} from "@/lib/api/announcements";
import { getSubmissionsRequest } from "@/lib/api/submissions";

interface ClassPageClientProps {
    title: string;
    details: ClassDetails;
}

export function ClassPageClient({ title, details }: ClassPageClientProps) {
    const { user } = useAuth();
    const isTeacher = user?.role === "Teacher" || user?.role === "Admin";

    const [tab, setTab] = useState<ClassTab>("stream");
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
                if (!cancelled) setApiAnnouncements(data);
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
        if (isTeacher)
            setClasswork(loadTeacherClasswork(details.courseId, details.classwork));
    }, [isTeacher, details.courseId, details.classwork]);

    const mutateClasswork = (next: ClassworkEntry[]) => {
        setClasswork(next);
        if (isTeacher) saveTeacherClasswork(details.courseId, next);
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
                setApiAnnouncements((prev) => [created, ...prev]);
            } catch (err) {
                console.error("Failed to post announcement", err);
            }
        },
        [details.courseId],
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

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-white pb-10">
            <ClassTabs tab={tab} onTabChange={setTab} isTeacher={isTeacher} />

            {tab === "stream" && (
                <StreamView
                    title={title}
                    details={details}
                    nextSession={nextSession}
                    apiAnnouncements={apiAnnouncements}
                    isTeacher={isTeacher}
                    onPostAnnouncement={isTeacher ? handlePostAnnouncement : undefined}
                />
            )}

            {tab === "curriculum" && (
                <CurriculumView
                    sessions={sessions}
                    isTeacher={isTeacher}
                    assignmentStatusMap={assignmentStatusMap}
                />
            )}

            {tab === "classwork" &&
                (isTeacher ? (
                    <TeacherClassworkView
                        items={classwork}
                        onCreate={openCreate}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                    />
                ) : (
                    <ClassworkView items={classwork} courseId={details.courseId} />
                ))}

            {tab === "people" && <PeopleView people={details.people} />}

            {tab === "grades" && isTeacher && (
                <GradesView
                    people={details.people}
                    items={classwork}
                    submissions={submissions}
                />
            )}
        </div>
    );
}