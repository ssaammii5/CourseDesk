"use client";

import { useState } from "react";
import { EllipsisVertical, Pencil, PenLine, Pin, PinOff, Trash2 } from "lucide-react";
import { AnnouncementCard } from "../components/AnnouncementCard";
import { CourseHeroBanner } from "../components/CourseHeroBanner";
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
    isInstructor?: boolean;
    isTeacher?: boolean;
    onPostAnnouncement?: (data: {
        title: string;
        body: string;
        isPinned: boolean;
    }) => void;
    onUpdateAnnouncement?: (
        id: number,
        data: { title: string; body: string; isPinned: boolean }
    ) => void;
    onDeleteAnnouncement?: (id: number) => void;
    onTogglePin?: (id: number, isPinned: boolean) => void;
}

function formatAnnouncementTime(
    createdAtIso: string,
    updatedAtIso?: string | null
): { original: string; updated?: string } {
    const createdDate = new Date(createdAtIso);
    const original =
        createdDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        }) +
        ", " +
        createdDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
        });
    const updated = updatedAtIso
        ? new Date(updatedAtIso).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        }) +
        ", " +
        new Date(updatedAtIso).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
        })
        : undefined;
    return { original, updated };
}

export function StreamView({
    title,
    details,
    course,
    nextSession,
    apiAnnouncements,
    isInstructor,
    isTeacher = false,
    onPostAnnouncement,
    onUpdateAnnouncement,
    onDeleteAnnouncement,
    onTogglePin,
}: StreamViewProps) {
    const canManage = isInstructor ?? isTeacher;
    const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementDto | null>(null);
    const [deletingAnnouncement, setDeletingAnnouncement] = useState<AnnouncementDto | null>(null);
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const hasDueWork = details.classwork.some((c) => c.status === "Assigned");

    return (
        <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-8">
            <CourseHeroBanner
                title={title}
                details={details}
                course={course}
                nextSession={nextSession}
                isInstructor={canManage}
                isTeacher={canManage}
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
                    {canManage && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingAnnouncement(null);
                                setAnnouncementModalOpen(true);
                            }}
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

                        {apiAnnouncements.map((a) => {
                            const timeInfo = formatAnnouncementTime(a.createdAtUtc, a.updatedAtUtc);
                            return (
                                <div key={a.id} className="relative rounded-lg bg-[#f1f3f4]">
                                    {a.isPinned && (
                                        <div className="flex items-center gap-1.5 rounded-t-lg bg-[#fef7e0] px-4 py-1.5 text-xs font-semibold text-[#b06000]">
                                            <Pin className="h-3.5 w-3.5 fill-current" />
                                            <span>Pinned announcement</span>
                                        </div>
                                    )}
                                    <div className="p-4 sm:p-5">
                                        <div className="flex items-start justify-between">
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
                                                    <p className="flex flex-wrap items-center gap-1.5 text-xs text-gray-600">
                                                        <span>{timeInfo.original}</span>
                                                        {timeInfo.updated && (
                                                            <span className="font-medium text-gray-500 italic">
                                                                (updated {timeInfo.updated})
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            {canManage && (
                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        title="Announcement options"
                                                        aria-label="Announcement options"
                                                        onClick={() => setOpenMenuId(openMenuId === a.id ? null : a.id)}
                                                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900"
                                                    >
                                                        <EllipsisVertical className="h-4 w-4" />
                                                    </button>
                                                    {openMenuId === a.id && (
                                                        <>
                                                            <div
                                                                className="fixed inset-0 z-20"
                                                                onClick={() => setOpenMenuId(null)}
                                                            />
                                                            <div className="absolute right-0 top-9 z-30 w-44 rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        onTogglePin?.(a.id, a.isPinned);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                                                >
                                                                    {a.isPinned ? (
                                                                        <>
                                                                            <PinOff className="h-4 w-4 text-gray-500" />
                                                                            <span>Unpin</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Pin className="h-4 w-4 text-gray-500" />
                                                                            <span>Pin to top</span>
                                                                        </>
                                                                    )}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setEditingAnnouncement(a);
                                                                        setAnnouncementModalOpen(true);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                                                >
                                                                    <Pencil className="h-4 w-4 text-gray-500" />
                                                                    <span>Edit</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setDeletingAnnouncement(a);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                                    <span>Delete</span>
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
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
                            );
                        })}

                        {details.announcements.map((a) => (
                            <AnnouncementCard
                                key={a.id}
                                announcement={a}
                                href={`/course/${details.courseId}/assignments/${a.id}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <AnnouncementFormModal
                open={announcementModalOpen}
                initialData={editingAnnouncement}
                onClose={() => {
                    setAnnouncementModalOpen(false);
                    setEditingAnnouncement(null);
                }}
                onSubmit={(data) => {
                    if (editingAnnouncement && onUpdateAnnouncement) {
                        onUpdateAnnouncement(editingAnnouncement.id, data);
                    } else if (onPostAnnouncement) {
                        onPostAnnouncement(data);
                    }
                    setAnnouncementModalOpen(false);
                    setEditingAnnouncement(null);
                }}
                onDelete={
                    editingAnnouncement
                        ? () => {
                              const target = editingAnnouncement;
                              setAnnouncementModalOpen(false);
                              setEditingAnnouncement(null);
                              setDeletingAnnouncement(target);
                          }
                        : undefined
                }
            />

            {deletingAnnouncement && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Delete announcement?
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">
                            This announcement will be permanently deleted. This action cannot be undone.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeletingAnnouncement(null)}
                                className="cursor-pointer rounded-full border border-gray-400 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    onDeleteAnnouncement?.(deletingAnnouncement.id);
                                    setDeletingAnnouncement(null);
                                }}
                                className="cursor-pointer rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}