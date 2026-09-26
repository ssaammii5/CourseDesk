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
import type { SessionDto, AnnouncementDto, AnnouncementAttachmentDto } from "@/types/session";
import type { SubmissionDto } from "@/lib/api/submissions";
import {
    createAssignmentRequest,
    deleteAssignmentRequest,
    getCourseAssignmentsRequest,
    publishAssignmentRequest,
    updateAssignmentRequest,
    uploadAssignmentAttachmentRequest,
} from "@/lib/api/assignments";
import { mapAssignmentToCoursework } from "@/app/(dashboard)/course/[courseId]/client";
import { getCourseSessionsRequest } from "@/lib/api/sessions";
import {
    getCourseAnnouncementsRequest,
    createAnnouncementRequest,
    updateAnnouncementRequest,
    deleteAnnouncementRequest,
    uploadAnnouncementAttachmentRequest,
    deleteAnnouncementAttachmentRequest,
} from "@/lib/api/announcements";
import type { DraftAttachment } from "../components/AnnouncementFormModal";
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
        setClasswork(details.classwork);
    }, [details.classwork]);

    const refreshCoursework = useCallback(async () => {
        try {
            const assignments = await getCourseAssignmentsRequest(details.courseId);
            const mapped = assignments.map((a) => mapAssignmentToCoursework(a, !isInstructor));
            setClasswork(mapped);
        } catch (err) {
            console.error("Failed to refresh coursework from database", err);
        }
    }, [details.courseId, isInstructor]);

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

    const handleDelete = async (entry: ClassworkEntry) => {
        try {
            await deleteAssignmentRequest(entry.id);
            await refreshCoursework();
        } catch (err) {
            console.error("Failed to delete assignment", err);
        }
    };

    const handlePublish = async (entry: ClassworkEntry) => {
        try {
            await publishAssignmentRequest(entry.id);
            await refreshCoursework();
        } catch (err) {
            console.error("Failed to publish assignment", err);
        }
    };

    const handlePostAnnouncement = useCallback(
        async (
            data: { title: string; body: string; isPinned: boolean },
            attachments?: DraftAttachment[],
        ) => {
            try {
                const created = await createAnnouncementRequest({
                    courseId: details.courseId,
                    title: data.title,
                    body: data.body,
                    isPinned: data.isPinned,
                });

                const uploadedAttachments: AnnouncementAttachmentDto[] = [];
                if (attachments && attachments.length > 0) {
                    for (const att of attachments) {
                        const fd = new FormData();
                        if (att.kind === "file" && att.file) {
                            fd.append("file", att.file);
                        } else if (att.kind === "link" && att.url) {
                            fd.append("linkUrl", att.url);
                            fd.append("linkTitle", att.title || att.url);
                        } else {
                            continue;
                        }
                        const attRes = await uploadAnnouncementAttachmentRequest(created.id, fd);
                        uploadedAttachments.push(attRes);
                    }
                }

                const hydrated: AnnouncementDto = {
                    ...created,
                    attachments: uploadedAttachments,
                };
                setApiAnnouncements((prev) => sortAnnouncements([hydrated, ...prev]));
            } catch (err) {
                console.error("Failed to post announcement", err);
            }
        },
        [details.courseId],
    );

    const handleUpdateAnnouncement = useCallback(
        async (
            id: number,
            data: { title: string; body: string; isPinned: boolean },
            newAttachments?: DraftAttachment[],
            removedAttachmentIds?: number[],
        ) => {
            try {
                const updated = await updateAnnouncementRequest(id, {
                    title: data.title,
                    body: data.body,
                    isPinned: data.isPinned,
                });

                if (removedAttachmentIds && removedAttachmentIds.length > 0) {
                    for (const attId of removedAttachmentIds) {
                        await deleteAnnouncementAttachmentRequest(id, attId);
                    }
                }

                const newlyUploaded: AnnouncementAttachmentDto[] = [];
                if (newAttachments && newAttachments.length > 0) {
                    for (const att of newAttachments) {
                        const fd = new FormData();
                        if (att.kind === "file" && att.file) {
                            fd.append("file", att.file);
                        } else if (att.kind === "link" && att.url) {
                            fd.append("linkUrl", att.url);
                            fd.append("linkTitle", att.title || att.url);
                        } else {
                            continue;
                        }
                        const attRes = await uploadAnnouncementAttachmentRequest(id, fd);
                        newlyUploaded.push(attRes);
                    }
                }

                setApiAnnouncements((prev) =>
                    sortAnnouncements(
                        prev.map((a) => {
                            if (a.id === id) {
                                const currentRemaining = (a.attachments || []).filter(
                                    (att) => !removedAttachmentIds?.includes(att.id),
                                );
                                return {
                                    ...updated,
                                    attachments: [...currentRemaining, ...newlyUploaded],
                                };
                            }
                            return a;
                        }),
                    ),
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
        attachments: { id?: number; kind: string; file?: File; url?: string; title?: string }[],
    ) => {
        try {
            const isEditing = classwork.some((i) => i.id === entry.id && i.id > 0);
            const deadlineUtc = entry.deadlineUtc || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            const maxMarks = entry.maxMarks ?? 100;
            const topic = entry.topic && entry.topic.trim() ? entry.topic.trim() : "General";

            let assignmentId = entry.id;

            if (isEditing) {
                await updateAssignmentRequest(entry.id, {
                    title: entry.title,
                    description: entry.description,
                    topic,
                    kind: "Assignment",
                    deadlineUtc,
                    maxMarks,
                });
            } else {
                const res = await createAssignmentRequest({
                    courseId: details.courseId,
                    title: entry.title,
                    description: entry.description,
                    topic,
                    kind: "Assignment",
                    deadlineUtc,
                    maxMarks,
                });
                assignmentId = res.id;
            }

            for (const att of attachments) {
                // If attachment already has a database id and no new file was provided, skip
                if (att.id && att.id > 0 && !att.file) {
                    continue;
                }
                const fd = new FormData();
                if (att.kind === "file" && att.file) {
                    fd.append("file", att.file);
                } else if (att.kind === "link" && att.url) {
                    fd.append("linkUrl", att.url);
                    fd.append("linkTitle", att.title ?? att.url);
                } else {
                    continue;
                }
                await uploadAssignmentAttachmentRequest(assignmentId, fd);
            }

            if (entry.status === "Assigned") {
                await publishAssignmentRequest(assignmentId);
            }

            await refreshCoursework();
            closeEditor();
        } catch (err) {
            console.error("Failed to save assignment to database", err);
        }
    };

    const assignmentStatusMap: Record<number, string> = {};
    for (const sub of submissions) {
        if (sub.status === "Graded") {
            assignmentStatusMap[sub.assignmentId] = "Graded";
        } else if (sub.submittedAtUtc || sub.status === "Submitted" || sub.status === "Turned in") {
            assignmentStatusMap[sub.assignmentId] = "Submitted";
        } else if (sub.status === "Draft") {
            assignmentStatusMap[sub.assignmentId] = "Draft";
        } else if (sub.status === "Missed") {
            assignmentStatusMap[sub.assignmentId] = "Missed";
        }
    }
    for (const cw of classwork) {
        if (!assignmentStatusMap[cw.id]) {
            if (cw.status === "Graded" || cw.status === "Submitted" || cw.status === "Draft" || cw.status === "Missed") {
                assignmentStatusMap[cw.id] = cw.status;
            } else {
                const isPast = cw.deadlineUtc ? new Date(cw.deadlineUtc).getTime() < Date.now() : false;
                assignmentStatusMap[cw.id] = isPast ? "Missed" : "Assigned";
            }
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
                        onPublish={handlePublish}
                        courseId={details.courseId}
                        submissions={submissions}
                    />
                ) : (
                    <CourseworkView
                        items={classwork}
                        courseId={details.courseId}
                        assignmentStatusMap={assignmentStatusMap}
                    />
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