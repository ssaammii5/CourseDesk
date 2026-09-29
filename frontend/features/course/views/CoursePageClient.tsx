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
    deleteAssignmentAttachmentRequest,
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
import { getCourseSubmissionsRequest, getSubmissionsRequest } from "@/lib/api/submissions";

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

function normalizeCourseTab(raw: string | null | undefined): CourseTab | null {
    if (!raw) return null;
    if (raw === "curriculum" || raw === "lectures" || raw === "videos") return "video";
    return raw as CourseTab;
}

const VALID_TABS: CourseTab[] = ["stream", "video", "curriculum", "coursework", "classwork", "people", "grades"];

export function CoursePageClient({ title, details, course, initialTab }: CoursePageClientProps) {
    const { user } = useAuth();
    const isInstructor = user?.role === "Instructor" || (user?.role as string) === "Teacher" || user?.role === "Admin";
    const isTeacher = isInstructor;
    const searchParams = useSearchParams();
    const rawTab = searchParams ? searchParams.get("tab") : null;
    const queryTab = normalizeCourseTab(rawTab);

    const [tab, setTab] = useState<CourseTab>(() => {
        const startRaw = normalizeCourseTab(queryTab || initialTab);
        if (startRaw && VALID_TABS.includes(startRaw)) {
            if (startRaw === "grades" && !isInstructor) return "coursework";
            return startRaw;
        }
        return "stream";
    });

    const [prevQueryTab, setPrevQueryTab] = useState(queryTab);
    if (queryTab !== prevQueryTab) {
        setPrevQueryTab(queryTab);
        if (queryTab && VALID_TABS.includes(queryTab)) {
            setTab(queryTab === "grades" && !isInstructor ? "coursework" : queryTab);
        } else {
            setTab("stream");
        }
    }

    useEffect(() => {
        if (typeof window !== "undefined" && rawTab && (rawTab === "curriculum" || rawTab === "lectures" || rawTab === "videos")) {
            const url = new URL(window.location.href);
            url.searchParams.set("tab", "video");
            window.history.replaceState(null, "", url.toString());
        }
    }, [rawTab]);
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

    const refreshSubmissions = useCallback(async () => {
        try {
            const data = await getCourseSubmissionsRequest(details.courseId);
            setSubmissions(data);
        } catch {
            try {
                const data = await getSubmissionsRequest();
                setSubmissions(data);
            } catch { }
        }
    }, [details.courseId]);

    useEffect(() => {
        void refreshSubmissions();
    }, [refreshSubmissions]);

    useEffect(() => {
        if (tab === "grades") {
            void refreshSubmissions();
        }
    }, [tab, refreshSubmissions]);

    const refreshCoursework = useCallback(async () => {
        try {
            const assignments = await getCourseAssignmentsRequest(details.courseId);
            const mapped = assignments.map((a) => mapAssignmentToCoursework(a, !isInstructor));
            setClasswork(mapped);
        } catch (err) {
            console.error("Failed to refresh coursework from database", err);
        }
    }, [details.courseId, isInstructor]);

    useEffect(() => {
        setClasswork(details.classwork);
    }, [details.classwork]);

    useEffect(() => {
        void refreshCoursework();
    }, [refreshCoursework]);

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
                    sessionId: entry.sessionId ?? null,
                    assignMode: entry.assignMode ?? "all",
                    targetLearnerIds: entry.targetLearnerIds ?? [],
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
                    sessionId: entry.sessionId ?? null,
                    assignMode: entry.assignMode ?? "all",
                    targetLearnerIds: entry.targetLearnerIds ?? [],
                });
                assignmentId = res.id;
            }

            // Clean up removed attachments if editing
            if (isEditing && editing?.attachments) {
                const currentIds = new Set(attachments.map((a) => a.id).filter(Boolean));
                for (const oldAtt of editing.attachments) {
                    if (!currentIds.has(oldAtt.id)) {
                        try {
                            await deleteAssignmentAttachmentRequest(assignmentId, oldAtt.id);
                        } catch (delErr) {
                            console.error(`Failed to delete removed attachment ${oldAtt.id}`, delErr);
                        }
                    }
                }
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

            if (entry.status === "Assigned" && (!isEditing || editing?.status === "Draft")) {
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

    const handleTopicRenamed = (oldName: string, newName: string) => {
        setClasswork((prev) =>
            prev.map((cw) => (cw.topic === oldName ? { ...cw, topic: newName } : cw))
        );
        void refreshCoursework();
    };

    const handleTopicDeleted = (deletedName: string, fallbackName: string) => {
        setClasswork((prev) =>
            prev.map((cw) => (cw.topic === deletedName ? { ...cw, topic: fallbackName } : cw))
        );
        void refreshCoursework();
    };

    if (editorOpen)
        return (
            <AssignmentCreateView
                key={editing?.id ?? "new"}
                courseName={title}
                initial={editing}
                onClose={closeEditor}
                onSubmit={handleSubmit}
                courseId={details.courseId}
                sessions={sessions}
                existingTopics={Array.from(new Set(classwork.map((c) => c.topic).filter(Boolean)))}
                onTopicRenamed={handleTopicRenamed}
                onTopicDeleted={handleTopicDeleted}
            />
        );

    const handleTabChange = (nextTab: ClassTab) => {
        const resolvedTab = (nextTab === "curriculum" || (nextTab as string) === "lectures" || (nextTab as string) === "videos") ? "video" : nextTab;
        setTab(resolvedTab);
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            if (resolvedTab === "stream") {
                url.searchParams.delete("tab");
            } else {
                url.searchParams.set("tab", resolvedTab);
            }
            window.history.replaceState(null, "", url.toString());
            window.dispatchEvent(new CustomEvent("coursedesk:tab-changed", { detail: { tab: resolvedTab } }));
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

            {(tab === "video" || tab === "curriculum") && (
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

            {tab === "people" && (
                <PeopleView
                    people={details.people}
                    courseName={title}
                    courseId={details.courseId}
                    isInstructor={isInstructor}
                    currentUserId={user?.id}
                />
            )}

            {tab === "grades" && isInstructor && (
                <GradesView
                    people={details.people}
                    items={classwork}
                    submissions={submissions}
                    courseId={details.courseId}
                    courseTitle={title}
                    onRefreshSubmissions={refreshSubmissions}
                    onUpdateSubmission={(updated: SubmissionDto) => {
                        setSubmissions((prev) => {
                            const exists = prev.some((s) => s.id === updated.id);
                            if (exists) {
                                return prev.map((s) => (s.id === updated.id ? updated : s));
                            }
                            return [...prev, updated];
                        });
                    }}
                />
            )}
        </div>
    );
}

export const ClassPageClient = CoursePageClient;