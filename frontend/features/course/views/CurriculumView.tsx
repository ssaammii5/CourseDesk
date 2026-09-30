"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
    AlertCircle,
    BookOpen,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock,
    Download,
    Edit3,
    ExternalLink,
    FileSpreadsheet,
    FileText,
    Filter,
    MoreVertical,
    Paperclip,
    Play,
    Plus,
    Search,
    Share2,
    Trash2,
    UploadCloud,
    Video,
    X,
} from "lucide-react";
import type { SessionDto, SessionMaterial } from "@/types/session";
import type { ClassworkEntry } from "@/types";
import { parseVideoUrl, extractYouTubeId, formatTimestamp } from "@/lib/utils/video";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { VideoFormModal } from "../components/VideoFormModal";
import { UploadHandoutModal } from "../components/UploadHandoutModal";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import {
    deleteSessionMaterialRequest,
    deleteSessionRequest,
    updateVideoSessionRequest,
} from "@/lib/api/sessions";


export interface CurriculumViewProps {
    sessions?: SessionDto[];
    isInstructor?: boolean;
    isTeacher?: boolean;
    assignmentStatusMap?: Record<number, string>;
    courseTitle?: string;
    courseId?: number;
    classwork?: ClassworkEntry[];
    onSessionsChange?: () => void;
}

type TabType = "overview" | "file" | "notes";

interface LectureTopicGroup {
    id: string;
    title: string;
    sessions: SessionDto[];
}

export function CurriculumView({
    sessions = [],
    isInstructor,
    isTeacher = false,
    assignmentStatusMap = {},
    courseTitle,
    courseId,
    classwork = [],
    onSessionsChange,
}: CurriculumViewProps) {
    const canManage = Boolean(isInstructor || isTeacher);

    // Group real sessions strictly by topic - NO DUMMY DATA
    const topicGroups: LectureTopicGroup[] = useMemo(() => {
        if (!sessions || sessions.length === 0) {
            return [];
        }

        const groupMap: Record<string, SessionDto[]> = {};
        for (const s of sessions) {
            const topicKey = s.topic?.trim() || "General Videos";
            if (!groupMap[topicKey]) {
                groupMap[topicKey] = [];
            }
            groupMap[topicKey].push(s);
        }

        return Object.entries(groupMap).map(([title, sList], index) => ({
            id: `topic-${index}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
            title,
            sessions: sList,
        }));
    }, [sessions]);

    // Active topic & session selection
    const [selectedTopicId, setSelectedTopicId] = useState<string>("");
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

    // Synchronize selection when sessions update
    useEffect(() => {
        if (topicGroups.length > 0) {
            const existsTopic = topicGroups.find((g) => g.id === selectedTopicId);
            const existsSession = existsTopic?.sessions.some((s) => s.id === selectedSessionId);

            if (!existsTopic || !existsSession) {
                setSelectedTopicId(topicGroups[0].id);
                setSelectedSessionId(topicGroups[0].sessions[0]?.id ?? null);
            }
        } else {
            setSelectedTopicId("");
            setSelectedSessionId(null);
        }
    }, [topicGroups]);

    const [activeTab, setActiveTab] = useState<TabType>("overview");
    const [isOverviewExpanded, setIsOverviewExpanded] = useState<boolean>(false);
    const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>("all");
    const [sidebarSearch, setSidebarSearch] = useState("");

    // Modals
    const [videoModalOpen, setVideoModalOpen] = useState(false);
    const [editingSession, setEditingSession] = useState<SessionDto | null>(null);
    const [uploadHandoutOpen, setUploadHandoutOpen] = useState(false);

    // Delete confirmation
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<SessionDto | null>(null);
    const [materialToDelete, setMaterialToDelete] = useState<SessionMaterial | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Watched videos records (persisted to localStorage)
    const [watchRecords, setWatchRecords] = useState<
        Record<number, { isFullyWatched: boolean; watchedSeconds: number }>
    >(() => {
        if (typeof window !== "undefined") {
            try {
                const saved = localStorage.getItem(`coursedesk_watch_records_${courseId || 1}`);
                if (saved) return JSON.parse(saved);
            } catch {
                // ignore
            }
        }
        return {};
    });

    const [watchPopoverOpen, setWatchPopoverOpen] = useState(false);
    const [activeWatchMode, setActiveWatchMode] = useState<"full" | "timestamp">("full");
    const [tempTimestampSeconds, setTempTimestampSeconds] = useState<number>(0);

    // Personal notes state per lecture
    const [personalNotes, setPersonalNotes] = useState<Record<number, string>>(() => {
        if (typeof window !== "undefined") {
            try {
                const saved = localStorage.getItem(`coursedesk_notes_${courseId || 1}`);
                if (saved) return JSON.parse(saved);
            } catch {
                // ignore
            }
        }
        return {};
    });

    // Active topic & session resolution
    const currentTopic =
        topicGroups.find((g) => g.id === selectedTopicId) || topicGroups[0];
    const currentSession =
        currentTopic?.sessions.find((s) => s.id === selectedSessionId) ||
        currentTopic?.sessions[0] ||
        topicGroups[0]?.sessions[0];

    const parsedVideo = currentSession?.videoUrl
        ? parseVideoUrl(currentSession.videoUrl)
        : null;

    const currentWatchRecord = currentSession
        ? watchRecords[currentSession.id]
        : undefined;
    const currentTotalSeconds = (currentSession?.durationMinutes || 45) * 60;

    const handleSetFullyWatched = () => {
        if (!currentSession) return;
        const totalSecs = (currentSession.durationMinutes || 45) * 60;
        const updated = {
            ...watchRecords,
            [currentSession.id]: {
                isFullyWatched: true,
                watchedSeconds: totalSecs,
            },
        };
        setWatchRecords(updated);
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem(
                    `coursedesk_watch_records_${courseId || 1}`,
                    JSON.stringify(updated)
                );
            } catch {
                // ignore
            }
        }
    };

    const handleSetWatchedTill = (seconds: number) => {
        if (!currentSession) return;
        const totalSecs = (currentSession.durationMinutes || 45) * 60;
        const clamped = Math.max(0, Math.min(seconds, totalSecs));
        const updated = {
            ...watchRecords,
            [currentSession.id]: {
                isFullyWatched: clamped >= totalSecs,
                watchedSeconds: clamped,
            },
        };
        setWatchRecords(updated);
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem(
                    `coursedesk_watch_records_${courseId || 1}`,
                    JSON.stringify(updated)
                );
            } catch {
                // ignore
            }
        }
    };

    const toggleWatchPopover = () => {
        if (!watchPopoverOpen && currentSession) {
            setTempTimestampSeconds(
                currentWatchRecord?.watchedSeconds || Math.round(currentTotalSeconds / 2)
            );
            setActiveWatchMode(currentWatchRecord?.isFullyWatched ? "full" : "timestamp");
        }
        setWatchPopoverOpen(!watchPopoverOpen);
    };

    const handleNoteChange = (content: string) => {
        if (!currentSession) return;
        const updated = {
            ...personalNotes,
            [currentSession.id]: content,
        };
        setPersonalNotes(updated);
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem(
                    `coursedesk_notes_${courseId || 1}`,
                    JSON.stringify(updated)
                );
            } catch {
                // ignore
            }
        }
    };

    // Filtered sidebar topics
    const filteredTopics = useMemo(() => {
        let list = topicGroups;
        if (selectedTopicFilter !== "all") {
            list = list.filter((t) => t.id === selectedTopicFilter);
        }
        if (sidebarSearch.trim()) {
            const q = sidebarSearch.toLowerCase();
            list = list.filter(
                (t) =>
                    t.title.toLowerCase().includes(q) ||
                    t.sessions.some(
                        (s) =>
                            s.title.toLowerCase().includes(q) ||
                            (s.description && s.description.toLowerCase().includes(q))
                    )
            );
        }
        return list;
    }, [topicGroups, selectedTopicFilter, sidebarSearch]);

    // Progress calculation based on real sessions
    const overallProgress = useMemo(() => {
        if (sessions.length === 0) {
            return { percent: 0, completedCount: 0, totalCount: 0 };
        }
        let completed = 0;
        sessions.forEach((s) => {
            if (watchRecords[s.id]?.isFullyWatched) {
                completed++;
            }
        });
        const percent = Math.round((completed / sessions.length) * 100);
        return {
            percent,
            completedCount: completed,
            totalCount: sessions.length,
        };
    }, [sessions, watchRecords]);

    const totalVideoCount = sessions.length;

    const handleSelectVideo = (topic: LectureTopicGroup, session: SessionDto) => {
        setSelectedTopicId(topic.id);
        setSelectedSessionId(session.id);
    };

    const getSessionThumbnail = (session?: SessionDto) => {
        if (session?.videoUrl) {
            const ytId = extractYouTubeId(session.videoUrl);
            if (ytId) {
                return `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
            }
        }
        return null;
    };

    const formatVideoDuration = (durationMinutes?: number | null) => {
        const mins = durationMinutes || 45;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h > 0) {
            return `${h}:${String(m).padStart(2, "0")}:00`;
        }
        return `${m}:00`;
    };

    // Video modal handlers
    const openAddVideoModal = () => {
        setEditingSession(null);
        setVideoModalOpen(true);
    };

    const openEditVideoModal = (session: SessionDto) => {
        setEditingSession(session);
        setVideoModalOpen(true);
    };

    const handleVideoModalSuccess = (saved: SessionDto) => {
        if (onSessionsChange) {
            onSessionsChange();
        }
        setSelectedSessionId(saved.id);
    };

    // Delete session handler
    const confirmDeleteSession = (session: SessionDto) => {
        setSessionToDelete(session);
        setMaterialToDelete(null);
        setDeleteModalOpen(true);
    };

    const confirmDeleteMaterial = (mat: SessionMaterial) => {
        setMaterialToDelete(mat);
        setSessionToDelete(null);
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        try {
            setIsDeleting(true);
            if (sessionToDelete) {
                await deleteSessionRequest(sessionToDelete.id);
                setSessionToDelete(null);
                setDeleteModalOpen(false);
                if (onSessionsChange) {
                    onSessionsChange();
                }
            } else if (materialToDelete && currentSession) {
                if (materialToDelete.id >= 9999000) {
                    const formData = new FormData();
                    formData.append("remove_file", "true");
                    await updateVideoSessionRequest(currentSession.id, formData);
                } else {
                    await deleteSessionMaterialRequest(currentSession.id, materialToDelete.id);
                }
                setMaterialToDelete(null);
                setDeleteModalOpen(false);
                if (onSessionsChange) {
                    onSessionsChange();
                }
            }
        } catch (err) {
            console.error("Failed to delete", err);
        } finally {
            setIsDeleting(false);
        }
    };

    // Materials list for current session
    const currentMaterials: SessionMaterial[] = useMemo(() => {
        if (!currentSession) return [];
        const mats = [...(currentSession.materials || [])];
        if (currentSession.fileUrl && !mats.some((m) => m.url === currentSession.fileUrl)) {
            mats.unshift({
                id: 9999000 + currentSession.id,
                sessionId: currentSession.id,
                title: currentSession.fileName || "Lecture File",
                kind: "file",
                url: currentSession.fileUrl,
                fileName: currentSession.fileName || "lecture_material",
                fileType: currentSession.fileType || "FILE",
                fileSize: currentSession.fileSize || "—",
                description: "Lecture handout attached during setup",
                sortOrder: 0,
                createdAtUtc: currentSession.createdAtUtc,
            });
        }
        return mats;
    }, [currentSession]);

    // All available topics for topic selection
    const allTopicTitles = useMemo(() => {
        const set = new Set<string>();
        sessions.forEach((s) => {
            if (s.topic?.trim()) set.add(s.topic.trim());
        });
        return Array.from(set);
    }, [sessions]);

    // ── EMPTY STATE ─────────────────────────────────────────────────────────
    if (!sessions || sessions.length === 0) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#f8fafc] dark:bg-slate-950">
                <div className="w-full max-w-lg rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-8 sm:p-10 text-center shadow-xl shadow-slate-200/40 dark:shadow-none">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-[#1a73e8] dark:text-blue-400 mb-5">
                        <Video className="h-8 w-8 text-[#1a73e8] dark:text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                        No Lecture Videos Yet
                    </h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                        {canManage
                            ? "Setup recorded lectures and video lessons for your students. You can add video URLs, lecture titles, descriptions, and attach PDF slides or handouts."
                            : "There are currently no recorded videos or lecture replays published for this course. Please check back later."}
                    </p>

                    {canManage && (
                        <div className="mt-6 flex justify-center">
                            <button
                                type="button"
                                onClick={openAddVideoModal}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#1a73e8] hover:bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Add First Video</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Video Setup Modal */}
                {courseId && (
                    <VideoFormModal
                        open={videoModalOpen}
                        courseId={courseId}
                        initialData={editingSession}
                        existingTopics={allTopicTitles}
                        onClose={() => setVideoModalOpen(false)}
                        onSuccess={handleVideoModalSuccess}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 pb-16 transition-colors">
            {/* Top Toolbar / Action Bar for Instructors */}
            <div className="border-b border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-3">
                <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1a73e8] dark:text-blue-400">
                            <Video className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                {currentSession?.title || "Course Lectures"}
                            </h2>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {currentTopic?.title || "Video Curriculum"} • {totalVideoCount} {totalVideoCount === 1 ? "Video" : "Videos"}
                            </p>
                        </div>
                    </div>

                    {canManage && (
                        <div className="flex items-center gap-2">
                            {currentSession && (
                                <button
                                    type="button"
                                    onClick={() => openEditVideoModal(currentSession)}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                                >
                                    <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                                    <span>Edit Video</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={openAddVideoModal}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1a73e8] hover:bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Add Video</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
                    {/* Left Column: Video Player, Title, Tabs */}
                    <div className="lg:col-span-8 flex flex-col space-y-4">
                        {/* Video Player Box */}
                        <div className="relative overflow-hidden rounded-2xl bg-black border border-slate-200/80 dark:border-slate-800 shadow-sm w-full aspect-video">
                            {parsedVideo && (parsedVideo.provider === "youtube" || parsedVideo.provider === "vimeo") ? (
                                <iframe
                                    src={parsedVideo.embedUrl}
                                    title={currentSession?.title || "Lecture Video"}
                                    className="h-full w-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                    allowFullScreen
                                />
                            ) : currentSession?.videoUrl ? (
                                <video
                                    src={currentSession.videoUrl}
                                    controls
                                    className="h-full w-full"
                                    style={{ objectFit: "contain" }}
                                />
                            ) : (
                                <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                                    <Video className="h-10 w-10 text-slate-500 mb-2" />
                                    <p className="text-sm font-medium">No video source provided for this lecture</p>
                                    {canManage && currentSession && (
                                        <button
                                            type="button"
                                            onClick={() => openEditVideoModal(currentSession)}
                                            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
                                        >
                                            <Edit3 className="h-3.5 w-3.5" />
                                            <span>Add Video URL</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Title Below Video & Interactive Watch Status Popover */}
                        <div className="pt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative">
                            <div>
                                <span className="inline-block rounded-md bg-blue-50 dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-900/60 px-2 py-0.5 text-[10px] font-semibold text-[#1a73e8] dark:text-blue-300 uppercase tracking-wider mb-1">
                                    {currentTopic?.title || "General"}
                                </span>
                                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                                    {currentSession?.title}
                                </h1>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {/* Watch Status Popover Button */}
                                {currentSession && (
                                    <div className="relative shrink-0">
                                        <button
                                            type="button"
                                            onClick={toggleWatchPopover}
                                            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs ${
                                                currentWatchRecord?.isFullyWatched
                                                    ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
                                                    : currentWatchRecord && currentWatchRecord.watchedSeconds > 0
                                                    ? "bg-blue-50 dark:bg-blue-950/70 text-[#1a73e8] dark:text-blue-300 border border-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60"
                                                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750"
                                            }`}
                                        >
                                            {currentWatchRecord?.isFullyWatched ? (
                                                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                            ) : currentWatchRecord && currentWatchRecord.watchedSeconds > 0 ? (
                                                <Clock className="h-4 w-4 text-[#1a73e8] dark:text-blue-400" />
                                            ) : (
                                                <CheckCircle2 className="h-4 w-4 text-slate-400" />
                                            )}
                                            <span>
                                                {currentWatchRecord?.isFullyWatched
                                                    ? "Completed"
                                                    : currentWatchRecord && currentWatchRecord.watchedSeconds > 0
                                                    ? `Watched till ${formatTimestamp(currentWatchRecord.watchedSeconds)}`
                                                    : "Mark Complete"}
                                            </span>
                                            <ChevronDown
                                                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                                                    watchPopoverOpen ? "rotate-180" : ""
                                                }`}
                                            />
                                        </button>

                                        {/* Watch Status Popover */}
                                        {watchPopoverOpen && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-40"
                                                    onClick={() => setWatchPopoverOpen(false)}
                                                />
                                                <div className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-xl backdrop-blur-sm animate-in fade-in zoom-in-95 duration-150">
                                                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                            <Clock className="h-4 w-4 text-[#1a73e8] dark:text-blue-400" />
                                                            Update Watch Progress
                                                        </h4>
                                                        <button
                                                            type="button"
                                                            onClick={() => setWatchPopoverOpen(false)}
                                                            className="rounded-full p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 mt-3 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setActiveWatchMode("full");
                                                                handleSetFullyWatched();
                                                            }}
                                                            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                                                activeWatchMode === "full" && currentWatchRecord?.isFullyWatched
                                                                    ? "bg-emerald-600 text-white shadow-xs"
                                                                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                                            }`}
                                                        >
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            <span>Fully Watched</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setActiveWatchMode("timestamp");
                                                                if (tempTimestampSeconds === 0) {
                                                                    setTempTimestampSeconds(Math.round(currentTotalSeconds / 2));
                                                                }
                                                            }}
                                                            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                                                activeWatchMode === "timestamp" ||
                                                                (currentWatchRecord && !currentWatchRecord.isFullyWatched)
                                                                    ? "bg-[#1a73e8] text-white shadow-xs"
                                                                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                                            }`}
                                                        >
                                                            <Clock className="h-3.5 w-3.5" />
                                                            <span>Till Timestamp</span>
                                                        </button>
                                                    </div>

                                                    {(activeWatchMode === "timestamp" ||
                                                        (currentWatchRecord && !currentWatchRecord.isFullyWatched)) && (
                                                        <div className="mt-4 space-y-3.5">
                                                            <div className="flex items-baseline justify-between">
                                                                <div>
                                                                    <span className="text-xl font-bold font-mono text-[#1a73e8] dark:text-blue-400">
                                                                        {formatTimestamp(tempTimestampSeconds)}
                                                                    </span>
                                                                    <span className="text-xs text-slate-400 font-medium ml-1.5">
                                                                        / {formatTimestamp(currentTotalSeconds)}
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                                                    {Math.round((tempTimestampSeconds / currentTotalSeconds) * 100)}%
                                                                </span>
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <input
                                                                    type="range"
                                                                    min={0}
                                                                    max={currentTotalSeconds}
                                                                    step={1}
                                                                    value={tempTimestampSeconds}
                                                                    onChange={(e) => setTempTimestampSeconds(Number(e.target.value))}
                                                                    className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#1a73e8]"
                                                                />
                                                            </div>

                                                            <div className="flex items-center gap-1.5">
                                                                {[
                                                                    { label: "25%", sec: Math.round(currentTotalSeconds * 0.25) },
                                                                    { label: "50%", sec: Math.round(currentTotalSeconds * 0.5) },
                                                                    { label: "75%", sec: Math.round(currentTotalSeconds * 0.75) },
                                                                    { label: "100%", sec: currentTotalSeconds },
                                                                ].map((preset) => (
                                                                    <button
                                                                        key={preset.label}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setTempTimestampSeconds(preset.sec);
                                                                            handleSetWatchedTill(preset.sec);
                                                                        }}
                                                                        className="flex-1 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-[#1a73e8] dark:hover:bg-blue-950/60 dark:hover:text-blue-300 transition-colors cursor-pointer"
                                                                    >
                                                                        {preset.label}
                                                                    </button>
                                                                ))}
                                                            </div>

                                                            <div className="pt-2 flex justify-end">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleSetWatchedTill(tempTimestampSeconds);
                                                                        setWatchPopoverOpen(false);
                                                                    }}
                                                                    className="rounded-xl bg-[#1a73e8] text-white px-4 py-1.5 text-xs font-semibold hover:bg-blue-600 shadow-xs transition-colors cursor-pointer"
                                                                >
                                                                    Save Progress
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Admin / Instructor Delete button */}
                                {canManage && currentSession && (
                                    <button
                                        type="button"
                                        onClick={() => confirmDeleteSession(currentSession)}
                                        title="Delete this lecture video"
                                        className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-600 hover:border-rose-300 dark:hover:text-rose-400 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Navigation Tabs (Overview, File, Notes) */}
                        <div className="pt-2">
                            <div className="flex items-center gap-1 border-b border-slate-200/80 dark:border-slate-800">
                                {[
                                    { id: "overview" as TabType, label: "Overview", icon: BookOpen },
                                    {
                                        id: "file" as TabType,
                                        label: `File (${currentMaterials.length})`,
                                        icon: Paperclip,
                                    },
                                    { id: "notes" as TabType, label: "Notes", icon: FileText },
                                ].map((t) => {
                                    const Icon = t.icon;
                                    const isActive = activeTab === t.id;
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setActiveTab(t.id)}
                                            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                                                isActive
                                                    ? "border-[#1a73e8] text-[#1a73e8] dark:text-blue-400"
                                                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                                            }`}
                                        >
                                            <Icon className="h-3.5 w-3.5" />
                                            <span>{t.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* TAB CONTENT PANELS */}
                        <div className="pt-2">
                            {/* OVERVIEW TAB */}
                            {activeTab === "overview" && (
                                <div className="space-y-4">
                                    {/* Description Card */}
                                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
                                            About This Lecture
                                        </h3>
                                        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                            {currentSession?.description?.trim() ? (
                                                <div
                                                    className={`transition-all ${
                                                        !isOverviewExpanded && currentSession.description.length > 250
                                                            ? "line-clamp-3"
                                                            : ""
                                                    }`}
                                                >
                                                    {currentSession.description}
                                                </div>
                                            ) : (
                                                <p className="italic text-slate-400">
                                                    No written description provided for this lecture.
                                                </p>
                                            )}
                                        </div>

                                        {currentSession?.description && currentSession.description.length > 250 && (
                                            <button
                                                type="button"
                                                onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                                                className="mt-2 text-xs font-semibold text-[#1a73e8] dark:text-blue-400 hover:underline cursor-pointer"
                                            >
                                                {isOverviewExpanded ? "Show less" : "...more"}
                                            </button>
                                        )}

                                        {/* Key Metadata Pill badges */}
                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                                <Clock className="h-3 w-3 text-slate-400" />
                                                Duration: {currentSession?.durationMinutes || 45} mins
                                            </span>
                                            {currentSession?.videoUrl && (
                                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 text-[11px] font-medium text-blue-700 dark:text-blue-400">
                                                    <Video className="h-3 w-3" />
                                                    Video Lecture
                                                </span>
                                            )}
                                            {currentSession?.createdAtUtc && (
                                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                                    Added {new Date(currentSession.createdAtUtc).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Video Chapters / Markers (if present) */}
                                    {currentSession?.videoMarkers && currentSession.videoMarkers.length > 0 && (
                                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-[#1a73e8]" />
                                                Lecture Timestamps &amp; Chapters
                                            </h3>
                                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {currentSession.videoMarkers.map((marker) => (
                                                    <button
                                                        key={marker.id}
                                                        type="button"
                                                        onClick={() => handleSetWatchedTill(marker.timestampSeconds)}
                                                        className="w-full flex items-center justify-between py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg px-2 transition-colors cursor-pointer"
                                                    >
                                                        <span className="text-xs text-slate-700 dark:text-slate-300">
                                                            {marker.label}
                                                        </span>
                                                        <span className="font-mono text-xs font-semibold text-[#1a73e8] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                                                            {formatTimestamp(marker.timestampSeconds)}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Linked Coursework */}
                                    {classwork.length > 0 && (
                                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                                                <BookOpen className="h-4 w-4 text-[#1a73e8]" />
                                                Related Assignments &amp; Tests
                                            </h3>
                                            <div className="space-y-2">
                                                {classwork.slice(0, 3).map((item) => (
                                                    <Link
                                                        key={item.id}
                                                        href={`/course/${courseId}?tab=coursework`}
                                                        className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 p-3 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/70 text-[#1a73e8]">
                                                                <BookOpen className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                                                    {item.title}
                                                                </h4>
                                                                <span className="text-[11px] text-slate-400">
                                                                    {item.dueLabel || "No deadline"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs font-semibold text-[#1a73e8] dark:text-blue-400">
                                                            View &rarr;
                                                        </span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* FILE TAB */}
                            {activeTab === "file" && (
                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                                    Lecture Files &amp; PDF Handouts
                                                </h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                    Download or view class slides, notes, and handouts attached to this video
                                                </p>
                                            </div>

                                            {canManage && currentSession && (
                                                <button
                                                    type="button"
                                                    onClick={() => setUploadHandoutOpen(true)}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#1a73e8] hover:bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                    <span>Upload Handout</span>
                                                </button>
                                            )}
                                        </div>

                                        {currentMaterials.length === 0 ? (
                                            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
                                                <FileText className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                    No handouts or files attached to this lecture
                                                </p>
                                                {canManage && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setUploadHandoutOpen(true)}
                                                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 text-xs font-semibold text-[#1a73e8] dark:text-blue-300 hover:bg-blue-100 transition-colors"
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                        <span>Upload First Handout</span>
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {currentMaterials.map((mat) => (
                                                    <div
                                                        key={mat.id}
                                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                                                    >
                                                        <div className="flex items-start gap-3.5 min-w-0">
                                                            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/70 text-[#1a73e8] dark:text-blue-400">
                                                                <FileText className="h-5 w-5" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                                    {mat.title}
                                                                </h4>
                                                                {mat.description && (
                                                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                                                                        {mat.description}
                                                                    </p>
                                                                )}
                                                                <span className="mt-1 inline-block text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                                                    {mat.fileSize || "—"} • {mat.fileType || "FILE"}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                                            {mat.url && (
                                                                <>
                                                                    <a
                                                                        href={mat.url}
                                                                        download={mat.fileName || "handout"}
                                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-2xs transition-colors"
                                                                    >
                                                                        <Download className="h-3.5 w-3.5" />
                                                                        <span>Download</span>
                                                                    </a>
                                                                    <a
                                                                        href={mat.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a73e8] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 shadow-2xs transition-colors"
                                                                    >
                                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                                        <span>View</span>
                                                                    </a>
                                                                </>
                                                            )}

                                                            {canManage && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => confirmDeleteMaterial(mat)}
                                                                    title="Delete handout"
                                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* NOTES TAB */}
                            {activeTab === "notes" && (
                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                                    My Personal Notes
                                                </h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    Notes are automatically saved locally for your revision
                                                </p>
                                            </div>
                                            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                <Check className="h-3.5 w-3.5" /> Auto-saved
                                            </span>
                                        </div>

                                        <RichTextEditor
                                            value={
                                                currentSession ? personalNotes[currentSession.id] || "" : ""
                                            }
                                            onChange={handleNoteChange}
                                            placeholder="Jot down important points, formulas, and questions for this lecture..."
                                            minHeight="220px"
                                        />

                                        {currentSession && Boolean(personalNotes[currentSession.id]?.length) && (
                                            <div className="flex justify-end pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleNoteChange("")}
                                                    className="inline-flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:underline cursor-pointer"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    <span>Clear note</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Video Playlist / Modules */}
                    <div className="lg:col-span-4 sticky top-20">
                        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg shadow-slate-200/40 dark:shadow-none overflow-hidden flex flex-col max-h-[calc(100vh-6.5rem)]">
                            {/* Card Header with Progress & Add Button */}
                            <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800/90 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 shrink-0">
                                        <Video className="h-3.5 w-3.5 text-[#1a73e8] dark:text-blue-400" />
                                        <span>
                                            <strong className="font-semibold text-slate-900 dark:text-slate-100">
                                                {totalVideoCount}
                                            </strong>{" "}
                                            {totalVideoCount === 1 ? "Video" : "Videos"}
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Progress:{" "}
                                        <strong className="font-semibold text-slate-700 dark:text-slate-300">
                                            {overallProgress.percent}% ({overallProgress.completedCount}/
                                            {overallProgress.totalCount})
                                        </strong>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-2 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 transition-all duration-500"
                                        style={{ width: `${Math.max(overallProgress.percent, 3)}%` }}
                                    />
                                </div>

                                {/* Topic Filter Dropdown & Search Controls */}
                                <div className="mt-3.5 space-y-2">
                                    <div className="relative flex items-center">
                                        <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#1a73e8] dark:text-blue-400" />
                                        <select
                                            value={selectedTopicFilter}
                                            onChange={(e) => setSelectedTopicFilter(e.target.value)}
                                            className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 py-1.5 pl-8.5 pr-8 text-xs font-medium text-slate-800 dark:text-slate-100 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none transition-all cursor-pointer shadow-2xs hover:border-slate-300 dark:hover:border-slate-600"
                                        >
                                            <option value="all">All Topics ({sessions.length})</option>
                                            {topicGroups.map((group) => (
                                                <option key={group.id} value={group.id}>
                                                    {group.title} ({group.sessions.length})
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                                    </div>

                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                        <input
                                            type="text"
                                            value={sidebarSearch}
                                            onChange={(e) => setSidebarSearch(e.target.value)}
                                            placeholder="Search lecture videos..."
                                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/70 py-1.5 pl-9 pr-8 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none transition-all"
                                        />
                                        {sidebarSearch && (
                                            <button
                                                type="button"
                                                onClick={() => setSidebarSearch("")}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable Topics & Lectures List */}
                            <div className="flex-1 overflow-y-auto p-2.5 space-y-3 [scrollbar-width:thin] scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                                {filteredTopics.length === 0 ? (
                                    <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
                                        <p>No videos found matching your search filter.</p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedTopicFilter("all");
                                                setSidebarSearch("");
                                            }}
                                            className="font-medium text-[#1a73e8] dark:text-blue-400 hover:underline cursor-pointer"
                                        >
                                            Reset filters
                                        </button>
                                    </div>
                                ) : (
                                    filteredTopics.map((topic) => (
                                        <div key={topic.id} className="space-y-1.5">
                                            {/* Topic Section Header */}
                                            <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                <span>{topic.title}</span>
                                                <span className="text-[10px] font-normal text-slate-400">
                                                    {topic.sessions.length}{" "}
                                                    {topic.sessions.length === 1 ? "video" : "videos"}
                                                </span>
                                            </div>

                                            {/* Sessions inside this Topic */}
                                            <div className="space-y-1">
                                                {topic.sessions.map((session, index) => {
                                                    const isCurrent = currentSession?.id === session.id;
                                                    const record = watchRecords[session.id];
                                                    const isFullyWatched = Boolean(record?.isFullyWatched);
                                                    const watchedSecs = record?.watchedSeconds || 0;
                                                    const totalSecs = (session.durationMinutes || 45) * 60;
                                                    const progressPercent = isFullyWatched
                                                        ? 100
                                                        : watchedSecs > 0
                                                        ? Math.min(100, Math.round((watchedSecs / totalSecs) * 100))
                                                        : 0;
                                                    const thumbnailUrl = getSessionThumbnail(session);
                                                    const durationText = formatVideoDuration(session.durationMinutes);

                                                    return (
                                                        <div
                                                            key={session.id}
                                                            onClick={() => handleSelectVideo(topic, session)}
                                                            className={`group relative flex items-center gap-2.5 rounded-xl p-2 cursor-pointer transition-all ${
                                                                isCurrent
                                                                    ? "bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 shadow-2xs"
                                                                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent"
                                                            }`}
                                                        >
                                                            {/* Play / Watched indicator */}
                                                            <div className="w-4 shrink-0 text-center">
                                                                {isCurrent ? (
                                                                    <Play className="h-3 w-3 text-[#1a73e8] dark:text-blue-400 fill-current mx-auto" />
                                                                ) : isFullyWatched ? (
                                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 mx-auto" />
                                                                ) : watchedSecs > 0 ? (
                                                                    <Clock className="h-3 w-3 text-[#1a73e8] dark:text-blue-400 mx-auto" />
                                                                ) : (
                                                                    <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                                                                        {index + 1}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Thumbnail */}
                                                            <div className="relative shrink-0 w-24 sm:w-28 aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                                                                {thumbnailUrl ? (
                                                                    <img
                                                                        src={thumbnailUrl}
                                                                        alt={session.title}
                                                                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                        loading="lazy"
                                                                    />
                                                                ) : (
                                                                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                                                                        <Video className="h-5 w-5 opacity-70" />
                                                                    </div>
                                                                )}

                                                                {/* Fully Watched badge */}
                                                                {isFullyWatched && (
                                                                    <span className="absolute top-1 left-1 flex items-center gap-0.5 rounded bg-emerald-600/90 backdrop-blur-2xs px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-2xs">
                                                                        <CheckCircle2 className="h-2.5 w-2.5" />
                                                                        Watched
                                                                    </span>
                                                                )}

                                                                {/* Duration pill */}
                                                                <span className="absolute bottom-1 right-1 rounded bg-black/85 backdrop-blur-2xs px-1.5 py-0.5 text-[9px] font-semibold text-white tracking-tight leading-none shadow-2xs">
                                                                    {durationText}
                                                                </span>

                                                                {/* Progress Bar */}
                                                                {progressPercent > 0 && (
                                                                    <div className="absolute bottom-0 inset-x-0 h-1 bg-black/60">
                                                                        <div
                                                                            className={`h-full transition-all duration-300 ${
                                                                                isFullyWatched ? "bg-emerald-500" : "bg-red-500"
                                                                            }`}
                                                                            style={{ width: `${progressPercent}%` }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Title & File indicator */}
                                                            <div className="min-w-0 flex-1 flex flex-col justify-center">
                                                                <h4
                                                                    className={`line-clamp-2 text-xs font-semibold leading-snug transition-colors ${
                                                                        isCurrent
                                                                            ? "text-[#1a73e8] dark:text-blue-400 font-bold"
                                                                            : "text-slate-900 dark:text-slate-100 group-hover:text-[#1a73e8] dark:group-hover:text-blue-400"
                                                                    }`}
                                                                    title={session.title}
                                                                >
                                                                    {session.title}
                                                                </h4>
                                                                <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                                    {session.fileUrl || (session.materials && session.materials.length > 0) ? (
                                                                        <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                                                                            <Paperclip className="h-2.5 w-2.5" />
                                                                            Handout
                                                                        </span>
                                                                    ) : null}
                                                                    <span>{durationText}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Setup Modal (Add & Edit) */}
            {courseId && (
                <VideoFormModal
                    open={videoModalOpen}
                    courseId={courseId}
                    initialData={editingSession}
                    existingTopics={allTopicTitles}
                    onClose={() => setVideoModalOpen(false)}
                    onSuccess={handleVideoModalSuccess}
                />
            )}

            {/* Upload Handout Modal */}
            {currentSession && (
                <UploadHandoutModal
                    open={uploadHandoutOpen}
                    sessionId={currentSession.id}
                    onClose={() => setUploadHandoutOpen(false)}
                    onSuccess={() => {
                        if (onSessionsChange) onSessionsChange();
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                open={deleteModalOpen}
                title={sessionToDelete ? "Delete Lecture Video" : "Delete Lecture Handout"}
                description={
                    sessionToDelete
                        ? `Are you sure you want to permanently delete "${sessionToDelete.title}"? Any attached files and bookmarks will be removed.`
                        : `Are you sure you want to delete "${materialToDelete?.title}"?`
                }
                isDeleting={isDeleting}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={executeDelete}
            />
        </div>
    );
}

export const LecturesView = CurriculumView;
export const VideoView = CurriculumView;
export const VideosView = CurriculumView;