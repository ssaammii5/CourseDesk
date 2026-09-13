"use client";

import { useState } from "react";
import { PenLine, Pin } from "lucide-react";
import { AnnouncementCard } from "../components/AnnouncementCard";
import { ClassHeroBanner } from "../components/ClassHeroBanner";
import { AnnouncementFormModal } from "../components/AnnouncementFormModal";
import type { CourseDto } from "@/lib/api/courses";
import type { ClassDetails } from "@/types";
import type { SessionDto, AnnouncementDto } from "@/types/session";
import { initialOf } from "@/lib/utils/format";
import { avatarClassFor } from "@/lib/utils/theme";

interface StreamViewProps {
    title: string;
    details: ClassDetails;
    course?: CourseDto | null;
    nextSession: SessionDto | null;
    apiAnnouncements: AnnouncementDto[];
    isTeacher: boolean;
    onPostAnnouncement?: (data: {
        title: string;
        body: string;
        isPinned: boolean;
    }) => void;
}

export function StreamView({
    title,
    details,
    course,
    nextSession,
    apiAnnouncements,
    isTeacher,
    onPostAnnouncement,
}: StreamViewProps) {
    const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
    const hasDueWork = details.classwork.some((c) => c.status === "Assigned");

    return (
        <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-8">
            <ClassHeroBanner
                title={title}
                details={details}
                course={course}
                nextSession={nextSession}
                isTeacher={isTeacher}
            />

            <div className="mt-6 flex flex-col gap-6 lg:flex-row">
                <div className="w-full shrink-0 lg:w-[300px]">
                    <section className="rounded-lg border border-gray-200 bg-white p-4">
                        <h3 className="text-base text-gray-800">Upcoming</h3>
                        <p className="mt-3 text-sm text-gray-600">
                            {hasDueWork
                                ? "You have work due soon."
                                : "Woohoo, no work due soon!"}
                        </p>
                        <div className="mt-3 text-right">
                            <a
                                href="#"
                                className="text-sm font-medium text-[#1a73e8] hover:underline"
                            >
                                View all
                            </a>
                        </div>
                    </section>
                </div>

                <div className="min-w-0 flex-1">
                    {isTeacher && (
                        <button
                            type="button"
                            onClick={() => setAnnouncementModalOpen(true)}
                            className="flex cursor-pointer items-center gap-3 rounded-full bg-[#cfe8fc] px-5 py-2.5 text-sm font-medium text-[#174ea6] hover:bg-[#b9dcf8]"
                        >
                            <PenLine className="h-4 w-4" />
                            New announcement
                        </button>
                    )}

                    <div className="mt-5 space-y-4">
                        {apiAnnouncements.length === 0 &&
                            details.announcements.length === 0 && (
                                <p className="py-8 text-center text-sm text-gray-600">
                                    No announcements yet.
                                </p>
                            )}

                        {apiAnnouncements.map((a) => (
                            <div key={a.id} className="overflow-hidden rounded-lg bg-[#f1f3f4]">
                                {a.isPinned && (
                                    <div className="flex items-center gap-1.5 bg-[#fef7e0] px-4 py-1.5 text-xs font-medium text-[#b06000]">
                                        <Pin className="h-3 w-3" />
                                        Pinned
                                    </div>
                                )}
                                <div className="p-4 sm:p-5">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium text-white ${avatarClassFor(a.authorId)}`}
                                        >
                                            {initialOf(a.authorName)}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {a.authorName ?? "Instructor"}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {new Date(a.createdAtUtc).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    {a.title && (
                                        <h4 className="mt-3 text-sm font-semibold text-gray-900">
                                            {a.title}
                                        </h4>
                                    )}
                                    <p className="mt-2 whitespace-pre-line text-sm text-gray-800">
                                        {a.body}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {details.announcements.map((a) => (
                            <AnnouncementCard
                                key={a.id}
                                announcement={a}
                                href={`/class/${details.courseId}/assignments/${a.id}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {onPostAnnouncement && (
                <AnnouncementFormModal
                    open={announcementModalOpen}
                    onClose={() => setAnnouncementModalOpen(false)}
                    onSubmit={(data) => {
                        onPostAnnouncement(data);
                        setAnnouncementModalOpen(false);
                    }}
                />
            )}
        </div>
    );
}