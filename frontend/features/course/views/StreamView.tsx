"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    AlertCircle,
    ArrowDown,
    Loader2,
    Megaphone,
    Pin,
    Plus,
    Search,
    Sparkles,
    X,
} from "lucide-react";
import { StreamHero } from "../components/StreamHero";
import { StreamComposer } from "../components/StreamComposer";
import { StreamFeedCard } from "../components/StreamFeedCard";
import { StreamSidebar } from "../components/StreamSidebar";
import { AnnouncementFormModal } from "../components/AnnouncementFormModal";
import type { CourseDto } from "@/lib/api/courses";
import type { ClassDetails } from "@/types";
import type { SessionDto, AnnouncementDto } from "@/types/session";
import type { CourseTab } from "../components/CourseTabs";

interface StreamViewProps {
    title: string;
    details: ClassDetails;
    course?: CourseDto | null;
    nextSession: SessionDto | null;
    apiAnnouncements: AnnouncementDto[];
    isInstructor?: boolean;
    isTeacher?: boolean;
    onTabChange?: (tab: CourseTab) => void;
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

const PAGE_SIZE = 5;

export function StreamView({
    title,
    details,
    course,
    nextSession,
    apiAnnouncements,
    isInstructor,
    isTeacher = false,
    onTabChange,
    onPostAnnouncement,
    onUpdateAnnouncement,
    onDeleteAnnouncement,
    onTogglePin,
}: StreamViewProps) {
    const canManage = isInstructor ?? isTeacher;
    const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementDto | null>(null);
    const [deletingAnnouncement, setDeletingAnnouncement] = useState<AnnouncementDto | null>(null);

    // Stream search state
    const [searchQuery, setSearchQuery] = useState("");

    // Lazy loading pagination state
    const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    // Reset pagination when search query changes
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [searchQuery]);

    // Combined announcements
    const allAnnouncements = useMemo(() => {
        if (apiAnnouncements.length > 0) {
            return apiAnnouncements;
        }
        return details.announcements || [];
    }, [apiAnnouncements, details.announcements]);

    // Helper to safely check if announcement is pinned
    const checkIsPinned = (a: AnnouncementDto | (ClassDetails["announcements"][number] & { isPinned?: boolean })) => {
        return "isPinned" in a ? Boolean(a.isPinned) : false;
    };

    // Filter announcements based on searchQuery
    const filteredAnnouncements = useMemo(() => {
        let list = [...allAnnouncements];

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            list = list.filter((a) => {
                const titleText = ("title" in a ? a.title : "") || "";
                const bodyText = ("body" in a ? a.body : a.text) || "";
                const authorText = ("authorName" in a ? a.authorName : a.author) || "";
                return (
                    titleText.toLowerCase().includes(query) ||
                    bodyText.toLowerCase().includes(query) ||
                    authorText.toLowerCase().includes(query)
                );
            });
        }

        return list;
    }, [allAnnouncements, searchQuery]);

    // Pinned announcements vs normal announcements
    const pinnedAnnouncements = useMemo(() => {
        return filteredAnnouncements.filter((a) => checkIsPinned(a));
    }, [filteredAnnouncements]);

    const regularAnnouncements = useMemo(() => {
        return filteredAnnouncements.filter((a) => !checkIsPinned(a));
    }, [filteredAnnouncements]);

    // Lazy loaded slice of regular announcements
    const visibleRegularAnnouncements = useMemo(() => {
        return regularAnnouncements.slice(0, visibleCount);
    }, [regularAnnouncements, visibleCount]);

    const hasMore = visibleCount < regularAnnouncements.length;

    // IntersectionObserver for automatic lazy loading as user scrolls
    useEffect(() => {
        if (!hasMore) return;
        const target = sentinelRef.current;
        if (!target) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, regularAnnouncements.length));
                }
            },
            {
                rootMargin: "250px",
                threshold: 0.1,
            }
        );

        observer.observe(target);
        return () => observer.disconnect();
    }, [hasMore, regularAnnouncements.length]);

    const handleLoadMore = () => {
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, regularAnnouncements.length));
    };

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 space-y-4 sm:space-y-5 animate-in fade-in duration-300">
            {/* 1. Course Workspace Header with Integrated Search */}
            <StreamHero
                title={title}
                details={details}
                course={course}
                nextSession={nextSession}
                announcementsCount={allAnnouncements.length}
                isInstructor={canManage}
                onNewAnnouncement={() => {
                    setEditingAnnouncement(null);
                    setAnnouncementModalOpen(true);
                }}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />

            {/* Section Divider */}
            <div className="flex items-center gap-3 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
                    Stream
                </span>
                <div className="h-px flex-1 bg-slate-200/80 dark:bg-slate-800/80" />
            </div>

            {/* 2. Main Two-Column Stream Layout */}
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                {/* Main Activity Stream (Center / Left) */}
                <main className="min-w-0 flex-1 space-y-4">
                    {/* Instructor Modern Composer Bar */}
                    {canManage && (
                        <StreamComposer
                            authorName={course?.instructorNames?.[0]}
                            onClick={() => {
                                setEditingAnnouncement(null);
                                setAnnouncementModalOpen(true);
                            }}
                        />
                    )}

                    {/* Stream Posts Feed */}
                    <div className="space-y-4">
                        {/* 1. Pinned Spotlight Section */}
                        {pinnedAnnouncements.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                    <Pin className="h-3.5 w-3.5 fill-current" />
                                    <span>Pinned Broadcasts ({pinnedAnnouncements.length})</span>
                                </div>
                                {pinnedAnnouncements.map((a) => (
                                    <StreamFeedCard
                                        key={a.id}
                                        announcement={a}
                                        canManage={canManage}
                                        onTogglePin={onTogglePin}
                                        onEdit={(dto) => {
                                            setEditingAnnouncement(dto);
                                            setAnnouncementModalOpen(true);
                                        }}
                                        onDelete={(dto) => setDeletingAnnouncement(dto)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* 2. Lazy Loaded Regular Announcements */}
                        {visibleRegularAnnouncements.map((a) => (
                            <StreamFeedCard
                                key={a.id}
                                announcement={a}
                                canManage={canManage}
                                onTogglePin={onTogglePin}
                                onEdit={(dto) => {
                                    setEditingAnnouncement(dto);
                                    setAnnouncementModalOpen(true);
                                }}
                                onDelete={(dto) => setDeletingAnnouncement(dto)}
                            />
                        ))}

                        {/* Lazy Loading Sentinel & Load More Indicator */}
                        {hasMore && (
                            <div
                                ref={sentinelRef}
                                className="flex flex-col items-center justify-center py-4"
                            >
                                <button
                                    type="button"
                                    onClick={handleLoadMore}
                                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-all"
                                >
                                    <ArrowDown className="h-3.5 w-3.5" />
                                    <span>
                                        Load more ({regularAnnouncements.length - visibleCount} remaining)
                                    </span>
                                </button>
                                <span className="mt-1.5 text-[11px] text-slate-400">
                                    Auto-loads as you scroll
                                </span>
                            </div>
                        )}

                        {/* End of feed indicator when all items are loaded */}
                        {!hasMore && regularAnnouncements.length > PAGE_SIZE && (
                            <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                                <span>You&apos;ve reached the end of the announcements stream</span>
                            </div>
                        )}

                        {/* 3. Empty State */}
                        {filteredAnnouncements.length === 0 && (
                            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 py-16 px-6 text-center dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
                                    <Sparkles className="h-7 w-7" />
                                </div>

                                <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-slate-100">
                                    {searchQuery ? "No matching announcements found" : "No announcements yet"}
                                </h3>

                                <p className="mt-1.5 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                                    {searchQuery
                                        ? `No announcements matching "${searchQuery}". Try a different search term.`
                                        : "This stream is quiet. Announcements and key updates will appear right here."}
                                </p>
 
                                {canManage && !searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingAnnouncement(null);
                                            setAnnouncementModalOpen(true);
                                        }}
                                        className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-95"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span>Create First Announcement</span>
                                    </button>
                                )}

                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        className="mt-4 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400 cursor-pointer"
                                    >
                                        Clear Search
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </main>

                {/* Right-Hand Sidebar */}
                <StreamSidebar
                    courseId={details.courseId}
                    details={details}
                    course={course}
                    nextSession={nextSession}
                    isInstructor={canManage}
                    onTabChange={onTabChange}
                />
            </div>

            {/* Create / Edit Announcement Modal */}
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

            {/* Modern Delete Confirmation Dialog */}
            {deletingAnnouncement && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
                    <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                    Delete announcement?
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    This action cannot be undone.
                                </p>
                            </div>
                        </div>

                        <p className="mt-3.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            Are you sure you want to permanently remove this announcement from the stream? Students will no longer see this broadcast.
                        </p>

                        <div className="mt-6 flex justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setDeletingAnnouncement(null)}
                                className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    onDeleteAnnouncement?.(deletingAnnouncement.id);
                                    setDeletingAnnouncement(null);
                                }}
                                className="cursor-pointer rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-rose-600/20 hover:bg-rose-500 transition-all active:scale-95"
                            >
                                Delete Announcement
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}