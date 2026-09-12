// frontend/components/class/ClassPageClient.tsx
"use client";

import { useEffect, useState } from "react";
import { ClassTabs, type ClassTab } from "../components/ClassTabs";
import { ClassworkView } from "./ClassworkView";
import { GradesView } from "./GradesView";
import { PeopleView } from "./PeopleView";
import { StreamView } from "./StreamView";
import { TeacherClassworkView } from "./TeacherClassworkView";
import { AssignmentCreateView } from "./AssignmentCreateView";
import { useAuth } from "@/hooks/useAuth";
import type { ClassDetails, ClassworkEntry } from "@/types";
import { loadTeacherClasswork, saveTeacherClasswork } from "@/lib/teacherClasswork";
import {
    createAssignmentRequest,
    uploadAssignmentAttachmentRequest,
} from "@/lib/api/assignments";

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

    useEffect(() => {
        if (isTeacher) setClasswork(loadTeacherClasswork(details.courseId, details.classwork));
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

    const handleSubmit = async (entry: ClassworkEntry, attachments: any[]) => {
        try {
            // 1. Create Assignment
            const payload = {
                courseId: details.courseId,
                title: entry.title,
                description: entry.description,
                topic: entry.topic,
                kind:
                    entry.kind === "quiz" ? "Quiz" : entry.kind === "material" ? "Material" : "Assignment",
                deadlineUtc: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default 7 days
                maxMarks: 100,
            };
            const res = await createAssignmentRequest(payload);
            const newId = res.id;

            // 2. Upload Attachments
            for (const att of attachments) {
                const fd = new FormData();
                if (att.kind === "file" && att.file) {
                    fd.append("file", att.file);
                } else if (att.kind === "link" && att.url) {
                    fd.append("linkUrl", att.url);
                    fd.append("linkTitle", att.title);
                } else {
                    continue;
                }
                await uploadAssignmentAttachmentRequest(newId, fd);
            }

            // 3. Update UI — persist with the real backend id
            const savedEntry: ClassworkEntry = { ...entry, id: newId };
            const exists = classwork.some((i) => i.id === entry.id);
            mutateClasswork(
                exists
                    ? classwork.map((i) => (i.id === entry.id ? savedEntry : i))
                    : [...classwork, savedEntry]
            );
            closeEditor();
        } catch (err) {
            console.error("Failed to create assignment", err);
        }
    };

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
            {tab === "stream" && <StreamView title={title} details={details} />}
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
            {tab === "grades" && isTeacher && <GradesView people={details.people} items={classwork} />}
        </div>
    );
}