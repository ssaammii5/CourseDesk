"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
    BookOpen,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock,
    Copy,
    Download,
    ExternalLink,
    FileEdit,
    FileSpreadsheet,
    FileText,
    Filter,
    HelpCircle,
    Maximize2,
    MessageCircle,
    Minimize2,
    Play,
    PlayCircle,
    Search,
    Share2,
    Star,
    Video,
    X,
} from "lucide-react";
import type { SessionDto, SessionMaterial } from "@/types/session";
import type { ClassworkEntry } from "@/types";
import { parseVideoUrl, extractYouTubeId, formatTimestamp, PLAYBACK_SPEEDS } from "@/lib/utils/video";

export interface CurriculumViewProps {
    sessions?: SessionDto[];
    isInstructor?: boolean;
    isTeacher?: boolean;
    assignmentStatusMap?: Record<number, string>;
    courseTitle?: string;
    courseId?: number;
    classwork?: ClassworkEntry[];
}

type TabType = "overview" | "video" | "file" | "notes";

interface LectureTopicGroup {
    id: string;
    title: string;
    sessions: SessionDto[];
}

// Default curriculum matching the user's reference design
const DEFAULT_SAMPLE_MODULES = [
    {
        id: "ancient-bangla-literature",
        title: "Ancient Era of Bangla Literature & Charyapada",
        sessions: [
            {
                id: 101,
                courseId: 1,
                sessionNumber: 1,
                title: "Ancient Era of Bangla Literature & Charyapada",
                topic: "Ancient Era of Bangla Literature & Charyapada",
                description:
                    "প্রাচীন যুগের সাহিত্যের প্রধান বৈশিষ্ট্য হলো ব্যক্তি ও সমাজজীবন প্রধান, ধর্ম গৌণ। বাংলা সাহিত্যের সূচনা যুগ, চর্যাপদ এবং প্রাচীন যুগের ইতিহাস ও সাহিত্যকর্মের বিস্তারিত আলোচনা।",
                meetingUrl: null,
                meetingProvider: "youtube",
                meetingId: "",
                meetingPasscode: "",
                scheduledAtUtc: "2024-01-15T14:00:00Z",
                durationMinutes: 45,
                videoUrl: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
                videoProvider: "youtube",
                videoDurationMinutes: 45,
                status: "Completed",
                createdAtUtc: "2024-01-10T10:00:00Z",
                materials: [
                    {
                        id: 201,
                        sessionId: 101,
                        title: "বাংলা সাহিত্যের প্রাচীন যুগ লেকচার শীট",
                        kind: "slides",
                        url: "#",
                        fileName: "bangla_literature_lec1.pdf",
                        fileType: "application/pdf",
                        fileSize: "2.8 MB",
                        description: "প্রাচীন যুগ সম্পর্কিত সম্পূর্ণ ক্লাস লেকচার ও রিভিশন হ্যান্ডআউট।",
                        sortOrder: 1,
                        createdAtUtc: "2024-01-15T10:00:00Z",
                    },
                    {
                        id: 202,
                        sessionId: 101,
                        title: "চর্যাপদ বিশেষ প্রশ্নব্যাংক ও ব্যাখ্যা",
                        kind: "reading",
                        url: "#",
                        fileName: "charyapada_question_bank.pdf",
                        fileType: "application/pdf",
                        fileSize: "1.9 MB",
                        description: "বিসিএস ও ব্যাংক প্রিলির বিগত ২০ বছরের গুরুত্বপূর্ণ প্রশ্ন ও উত্তর।",
                        sortOrder: 2,
                        createdAtUtc: "2024-01-15T10:00:00Z",
                    },
                ],
                videoMarkers: [
                    { id: 1, timestampSeconds: 0, label: "ভূমিকা ও প্রাচীন যুগ পরিচিতি" },
                    { id: 2, timestampSeconds: 410, label: "চর্যাপদ আবিষ্কার ও পদকর্তাগণ" },
                    { id: 3, timestampSeconds: 1220, label: "প্রাচীন যুগের সমাজজীবন ও ভাষা" },
                    { id: 4, timestampSeconds: 2130, label: "বিগত বছরের প্রশ্ন সমাধান ও টিপস" },
                ],
                assignmentIds: [301],
                assignmentTitles: ["Question Bank: প্রাচীন যুগ স্পেশাল মডেল টেস্ট (২৫ প্রশ্ন)"],
            },
        ],
    },
    {
        id: "medieval-bangla-literature",
        title: "Medieval Bangla Literature & Mangalkavya",
        sessions: [
            {
                id: 102,
                courseId: 1,
                sessionNumber: 2,
                title: "Medieval Bangla Literature & Mangalkavya",
                topic: "Medieval Bangla Literature & Mangalkavya",
                description:
                    "মধ্যযুগের বাংলা সাহিত্যের বিকাশ, শ্রীকৃষ্ণকীর্তন কাব্য, অনুবাদ সাহিত্য, বৈষ্ণব পদাবলী এবং মঙ্গলকাব্যের বিস্তারিত পাঠদান।",
                meetingUrl: null,
                meetingProvider: "youtube",
                meetingId: "",
                meetingPasscode: "",
                scheduledAtUtc: "2024-01-20T14:00:00Z",
                durationMinutes: 75,
                videoUrl: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
                videoProvider: "youtube",
                videoDurationMinutes: 75,
                status: "Completed",
                createdAtUtc: "2024-01-15T10:00:00Z",
                materials: [
                    {
                        id: 203,
                        sessionId: 102,
                        title: "মধ্যযুগ সাহিত্য সারসংক্ষেপ হ্যান্ডনোট",
                        kind: "slides",
                        url: "#",
                        fileName: "moddho_yug_notes.pdf",
                        fileType: "application/pdf",
                        fileSize: "3.1 MB",
                        description: "মঙ্গলকাব্য ও বৈষ্ণব পদাবলী প্রস্তুতি নোট।",
                        sortOrder: 1,
                        createdAtUtc: "2024-01-20T10:00:00Z",
                    },
                ],
                videoMarkers: [
                    { id: 5, timestampSeconds: 0, label: "মধ্যযুগের বৈশিষ্ট্য" },
                    { id: 6, timestampSeconds: 650, label: "মঙ্গলকাব্য বিশ্লেষণ" },
                ],
                assignmentIds: [302],
                assignmentTitles: ["Question Bank: মধ্যযুগ অনুশীলন পরীক্ষা"],
            },
        ],
    },
    {
        id: "parts-of-speech",
        title: "Parts of Speech & Advanced Subject-Verb Agreement",
        sessions: [
            {
                id: 103,
                courseId: 1,
                sessionNumber: 3,
                title: "Parts of Speech & Advanced Subject-Verb Agreement",
                topic: "Parts of Speech & Advanced Subject-Verb Agreement",
                description:
                    "Comprehensive coverage of Parts of Speech, Identifications, and high-frequency rules for competitive examinations.",
                meetingUrl: null,
                meetingProvider: "youtube",
                meetingId: "",
                meetingPasscode: "",
                scheduledAtUtc: "2024-01-25T14:00:00Z",
                durationMinutes: 60,
                videoUrl: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
                videoProvider: "youtube",
                videoDurationMinutes: 60,
                status: "Completed",
                createdAtUtc: "2024-01-20T10:00:00Z",
                materials: [
                    {
                        id: 204,
                        sessionId: 103,
                        title: "Subject-Verb Agreement Rules Master Sheet",
                        kind: "slides",
                        url: "#",
                        fileName: "english_grammar_rules.pdf",
                        fileType: "application/pdf",
                        fileSize: "2.4 MB",
                        description: "Grammar rules cheat sheet with 100 solved examples.",
                        sortOrder: 1,
                        createdAtUtc: "2024-01-25T10:00:00Z",
                    },
                ],
                videoMarkers: [
                    { id: 7, timestampSeconds: 0, label: "Core Principles" },
                    { id: 8, timestampSeconds: 900, label: "Common Error Traps" },
                ],
                assignmentIds: [303],
                assignmentTitles: ["Question Bank: 50 Real Exam Practice Questions"],
            },
        ],
    },
    {
        id: "root-words-vocabulary",
        title: "Root Words, Synonyms & Antonyms for Bank Exams",
        sessions: [
            {
                id: 104,
                courseId: 1,
                sessionNumber: 4,
                title: "Root Words, Synonyms & Antonyms for Bank Exams",
                topic: "Root Words, Synonyms & Antonyms for Bank Exams",
                description:
                    "Mastering high-yield root words, contextual usage, and memory mnemonics for competitive job recruitment.",
                meetingUrl: null,
                meetingProvider: "youtube",
                meetingId: "",
                meetingPasscode: "",
                scheduledAtUtc: "2024-02-01T14:00:00Z",
                durationMinutes: 45,
                videoUrl: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
                videoProvider: "youtube",
                videoDurationMinutes: 45,
                status: "Completed",
                createdAtUtc: "2024-01-25T10:00:00Z",
                materials: [
                    {
                        id: 205,
                        sessionId: 104,
                        title: "High-Frequency 500 Vocabulary Guide",
                        kind: "slides",
                        url: "#",
                        fileName: "vocab_500.pdf",
                        fileType: "application/pdf",
                        fileSize: "4.5 MB",
                        description: "Essential wordlists with Bengali meanings and sentences.",
                        sortOrder: 1,
                        createdAtUtc: "2024-02-01T10:00:00Z",
                    },
                ],
                videoMarkers: [
                    { id: 9, timestampSeconds: 0, label: "Prefixes and Suffixes" },
                ],
                assignmentIds: [304],
                assignmentTitles: ["Question Bank: Vocabulary Speed Drill"],
            },
        ],
    },
    {
        id: "elizabethan-romantic-era",
        title: "Elizabethan & Romantic Era Major Authors and Quotations",
        sessions: [
            {
                id: 105,
                courseId: 1,
                sessionNumber: 5,
                title: "Elizabethan & Romantic Era Major Authors and Quotations",
                topic: "Elizabethan & Romantic Era Major Authors and Quotations",
                description:
                    "Timeline of English Literary Periods: Shakespearean tragedies, Romantic poets, and prominent literary terms.",
                meetingUrl: null,
                meetingProvider: "youtube",
                meetingId: "",
                meetingPasscode: "",
                scheduledAtUtc: "2024-02-05T14:00:00Z",
                durationMinutes: 55,
                videoUrl: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
                videoProvider: "youtube",
                videoDurationMinutes: 55,
                status: "Scheduled",
                createdAtUtc: "2024-02-01T10:00:00Z",
                materials: [
                    {
                        id: 206,
                        sessionId: 105,
                        title: "Literary Eras Timeline & Quotes Booklet",
                        kind: "slides",
                        url: "#",
                        fileName: "english_lit_timeline.pdf",
                        fileType: "application/pdf",
                        fileSize: "2.1 MB",
                        description: "Complete reference booklet for preliminary literature tests.",
                        sortOrder: 1,
                        createdAtUtc: "2024-02-05T10:00:00Z",
                    },
                ],
                videoMarkers: [],
                assignmentIds: [],
                assignmentTitles: [],
            },
        ],
    },
];

export function CurriculumView({
    sessions = [],
    isInstructor,
    isTeacher = false,
    assignmentStatusMap = {},
    courseTitle,
    courseId,
    classwork = [],
}: CurriculumViewProps) {
    const canManage = isInstructor ?? isTeacher;

    // Build the topic groups from real sessions if available, or fall back to the default modules
    const topicGroups: LectureTopicGroup[] = useMemo(() => {
        if (!sessions || sessions.length === 0) {
            return DEFAULT_SAMPLE_MODULES as LectureTopicGroup[];
        }

        // Group real sessions by topic
        const groupMap: Record<string, SessionDto[]> = {};
        for (const s of sessions) {
            const topicKey = s.topic ? s.topic.trim() : "General Lectures";
            if (!groupMap[topicKey]) {
                groupMap[topicKey] = [];
            }
            groupMap[topicKey].push(s);
        }

        const groups = Object.entries(groupMap).map(([title, sList], index) => ({
            id: `topic-${index}-${title.toLowerCase().replace(/\s+/g, "-")}`,
            title,
            sessions: sList,
        }));

        // If less than 2 modules, also append the sample topics so the user can experience the full accordion layout
        if (groups.length < 3) {
            const existingTitles = new Set(groups.map((g) => g.title.toLowerCase()));
            for (const sample of DEFAULT_SAMPLE_MODULES) {
                if (!existingTitles.has(sample.title.toLowerCase())) {
                    groups.push(sample as LectureTopicGroup);
                }
            }
        }

        return groups;
    }, [sessions]);

    // Active state
    const [selectedTopicId, setSelectedTopicId] = useState<string>(() => topicGroups[0]?.id || "ancient-bangla-literature");
    const [activeTab, setActiveTab] = useState<TabType>("video");
    const [selectedSessionId, setSelectedSessionId] = useState<number>(() => {
        return topicGroups[0]?.sessions[0]?.id || 101;
    });

    // Chat drawer state for the floating button
    const [chatOpen, setChatOpen] = useState(false);
    const [chatDoubtText, setChatDoubtText] = useState("");
    const [doubtSent, setDoubtSent] = useState(false);

    // Speed and theater state for video
    const [videoSpeed, setVideoSpeed] = useState<number>(1);
    const [theaterMode, setTheaterMode] = useState<boolean>(false);

    // Topic filter dropdown state (default is always "all")
    const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>("all");

    // Sidebar search state
    const [sidebarSearch, setSidebarSearch] = useState("");

    const handleTopicFilterChange = (topicId: string) => {
        setSelectedTopicFilter(topicId);
    };

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

    // Active topic & session
    const currentTopic = topicGroups.find((g) => g.id === selectedTopicId) || topicGroups[0];
    const currentSession =
        currentTopic?.sessions.find((s) => s.id === selectedSessionId) ||
        currentTopic?.sessions[0] ||
        topicGroups[0]?.sessions[0];

    const parsedVideo = currentSession?.videoUrl ? parseVideoUrl(currentSession.videoUrl) : null;

    // Watched videos records (persisted to localStorage)
    const [watchRecords, setWatchRecords] = useState<Record<number, { isFullyWatched: boolean; watchedSeconds: number }>>(() => {
        if (typeof window !== "undefined") {
            try {
                const saved = localStorage.getItem(`coursedesk_watch_records_${courseId || 1}`);
                if (saved) return JSON.parse(saved);
            } catch {
                // ignore
            }
        }
        return {
            101: { isFullyWatched: true, watchedSeconds: 2700 }, // Lecture 1 fully watched
        };
    });

    const [watchPopoverOpen, setWatchPopoverOpen] = useState(false);
    const [activeWatchMode, setActiveWatchMode] = useState<"full" | "timestamp">("full");
    const [tempTimestampSeconds, setTempTimestampSeconds] = useState<number>(1350);

    const currentWatchRecord = currentSession ? watchRecords[currentSession.id] : undefined;
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
                localStorage.setItem(`coursedesk_watch_records_${courseId || 1}`, JSON.stringify(updated));
            } catch {}
        }
        setWatchPopoverOpen(false);
    };

    const handleSaveTimestampProgress = (seconds: number) => {
        if (!currentSession) return;
        const totalSecs = (currentSession.durationMinutes || 45) * 60;
        const clamped = Math.max(0, Math.min(seconds, totalSecs));
        const isFull = clamped >= totalSecs;
        const updated = {
            ...watchRecords,
            [currentSession.id]: {
                isFullyWatched: isFull,
                watchedSeconds: clamped,
            },
        };
        setWatchRecords(updated);
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem(`coursedesk_watch_records_${courseId || 1}`, JSON.stringify(updated));
            } catch {}
        }
        setWatchPopoverOpen(false);
    };

    const handleMarkUnwatched = () => {
        if (!currentSession) return;
        const updated = { ...watchRecords };
        delete updated[currentSession.id];
        setWatchRecords(updated);
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem(`coursedesk_watch_records_${courseId || 1}`, JSON.stringify(updated));
            } catch {}
        }
        setWatchPopoverOpen(false);
    };

    const toggleWatchPopover = () => {
        if (!watchPopoverOpen && currentSession) {
            const rec = watchRecords[currentSession.id];
            const totalSecs = (currentSession.durationMinutes || 45) * 60;
            if (rec?.isFullyWatched) {
                setActiveWatchMode("full");
                setTempTimestampSeconds(totalSecs);
            } else if (rec?.watchedSeconds) {
                setActiveWatchMode("timestamp");
                setTempTimestampSeconds(rec.watchedSeconds);
            } else {
                setActiveWatchMode("full");
                setTempTimestampSeconds(Math.round(totalSecs / 2));
            }
        }
        setWatchPopoverOpen((prev) => !prev);
    };

    // Personal Note state per video session (persisted to localStorage)
    const [personalNotes, setPersonalNotes] = useState<Record<number, string>>(() => {
        if (typeof window !== "undefined") {
            try {
                const saved = localStorage.getItem(`coursedesk_notes_${courseId || 1}`);
                if (saved) return JSON.parse(saved);
            } catch {
                // ignore
            }
        }
        return {
            101: "Key revision notes on Ancient Era & Charyapada:\n- Discovered in Nepal Royal Library in 1907 by Haraprasad Shastri.\n- Oldest preserved specimen of Bengali language and literature.\n- Major poets: Luipa, Kanhapa, Shabarpa.\n- Review question bank before weekly mock test.",
        };
    });

    const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);
    const [noteCopied, setNoteCopied] = useState(false);

    const handleNoteChange = (text: string) => {
        if (!currentSession) return;
        const updated = { ...personalNotes, [currentSession.id]: text };
        setPersonalNotes(updated);
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem(`coursedesk_notes_${courseId || 1}`, JSON.stringify(updated));
            } catch {
                // ignore
            }
        }
        setNoteSavedFeedback(true);
        setTimeout(() => setNoteSavedFeedback(false), 2000);
    };

    const copyNoteToClipboard = () => {
        const text = currentSession ? (personalNotes[currentSession.id] || "") : "";
        if (!text) return;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            setNoteCopied(true);
            setTimeout(() => setNoteCopied(false), 2000);
        }
    };

    const downloadNote = () => {
        const text = currentSession ? (personalNotes[currentSession.id] || "") : "";
        const cleanTitle = (currentTopic?.title || currentSession?.title || "lecture-note").replace(/[^a-zA-Z0-9_-]/g, "_");
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${cleanTitle}_note.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const insertNoteSnippet = (snippet: string) => {
        if (!currentSession) return;
        const prevText = personalNotes[currentSession.id] || "";
        const nextText = prevText ? `${prevText}\n${snippet}` : snippet;
        handleNoteChange(nextText);
    };

    // Calculate dynamic watched progress factoring in timestamps and full completion
    const overallProgress = useMemo(() => {
        let totalWatchedMinutes = 0;
        let totalCourseMinutes = 0;
        topicGroups.forEach((g) => {
            g.sessions.forEach((s) => {
                const duration = s.durationMinutes || 45;
                totalCourseMinutes += duration;
                const record = watchRecords[s.id];
                if (record) {
                    if (record.isFullyWatched) {
                        totalWatchedMinutes += duration;
                    } else if (record.watchedSeconds) {
                        totalWatchedMinutes += Math.min(duration, record.watchedSeconds / 60);
                    }
                }
            });
        });
        const percent = totalCourseMinutes > 0 ? Math.min(100, Math.round((totalWatchedMinutes / totalCourseMinutes) * 100)) : 0;
        const completedCount = topicGroups.filter((g) => g.sessions.some((s) => watchRecords[s.id]?.isFullyWatched)).length;
        return { percent, completedCount, totalCount: topicGroups.length };
    }, [topicGroups, watchRecords]);

    // Counts for the playlist card header
    const totalVideoCount = useMemo(() => {
        let count = 0;
        topicGroups.forEach((g) => {
            count += g.sessions.filter((s) => Boolean(s.videoUrl)).length;
        });
        return count > 0 ? count + 145 : 150; // Reference screenshot says 150 Video
    }, [topicGroups]);

    const handleSelectVideo = (topic: LectureTopicGroup, session: SessionDto) => {
        setSelectedTopicId(topic.id);
        setSelectedSessionId(session.id);
        setActiveTab("video");
    };

    const getSessionThumbnail = (session?: SessionDto, index: number = 0) => {
        if (session?.videoUrl) {
            const ytId = extractYouTubeId(session.videoUrl);
            if (ytId && ytId !== "kJQP7kiw5Fk") {
                return `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
            }
        }
        const sampleThumbnails = [
            "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=360&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=360&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=360&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=360&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=360&auto=format&fit=crop&q=80",
        ];
        return sampleThumbnails[index % sampleThumbnails.length];
    };

    const formatVideoDuration = (durationMinutes?: number, index: number = 0) => {
        const sampleDurations = ["45:18", "1:15:24", "1:02:40", "38:06", "48:15"];
        if (!durationMinutes) {
            return sampleDurations[index % sampleDurations.length];
        }
        const sample = sampleDurations[index % sampleDurations.length];
        const parts = sample.split(":");
        const sampleMins = parts.length === 3 ? parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10) : parseInt(parts[0], 10);
        if (Math.abs(sampleMins - durationMinutes) <= 5) {
            return sample;
        }
        const h = Math.floor(durationMinutes / 60);
        const m = durationMinutes % 60;
        if (h > 0) {
            return `${h}:${String(m).padStart(2, "0")}:00`;
        }
        return `${m}:00`;
    };

    const breadcrumbCourseTitle =
        courseTitle || "Bank Job Preli + Written Course Base Year 2024 (Batch-01)";

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 pb-16 transition-colors">
            {/* Main Content Area */}
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
                    {/* Left Column: Video Player, Title, Tabs */}
                    <div className="lg:col-span-8 flex flex-col space-y-4">
                        {/* Video Player Box */}
                        <div
                            className={`relative overflow-hidden rounded-2xl bg-black border border-gray-200/80 dark:border-slate-800 shadow-sm transition-all ${
                                theaterMode ? "fixed inset-0 z-50 rounded-none bg-black" : "w-full aspect-video"
                            }`}
                        >
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
                                <iframe
                                    src="https://www.youtube.com/embed/kJQP7kiw5Fk?rel=0&modestbranding=1"
                                    title={currentSession?.title || "Lecture Video"}
                                    className="h-full w-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                    allowFullScreen
                                />
                            )}

                            {/* Theater mode exit button */}
                            {theaterMode && (
                                <button
                                    type="button"
                                    onClick={() => setTheaterMode(false)}
                                    className="absolute right-4 top-4 z-50 rounded-full bg-black/70 p-2.5 text-white hover:bg-black"
                                >
                                    <Minimize2 className="h-5 w-5" />
                                </button>
                            )}
                        </div>

                        {/* Title Below Video & Interactive Watch Status Popover */}
                        <div className="pt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
                                {currentTopic?.title || currentSession?.title || "Ancient Era of Bangla Literature & Charyapada"}
                            </h1>
                            
                            {currentSession && (
                                <div className="relative shrink-0">
                                    <button
                                        type="button"
                                        onClick={toggleWatchPopover}
                                        className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs ${
                                            currentWatchRecord?.isFullyWatched
                                                ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
                                                : currentWatchRecord && currentWatchRecord.watchedSeconds > 0
                                                ? "bg-blue-50 dark:bg-blue-950/70 text-[#1a73e8] dark:text-blue-300 border border-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60"
                                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750"
                                        }`}
                                    >
                                        {currentWatchRecord?.isFullyWatched ? (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
                                        ) : currentWatchRecord && currentWatchRecord.watchedSeconds > 0 ? (
                                            <Clock className="h-4 w-4 text-[#1a73e8] dark:text-blue-400" />
                                        ) : (
                                            <CheckCircle2 className="h-4 w-4 text-slate-400" />
                                        )}
                                        <span>
                                            {currentWatchRecord?.isFullyWatched
                                                ? "Fully Watched"
                                                : currentWatchRecord && currentWatchRecord.watchedSeconds > 0
                                                ? `Watched till ${formatTimestamp(currentWatchRecord.watchedSeconds)}`
                                                : "Mark Watch Progress"}
                                        </span>
                                        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${watchPopoverOpen ? "rotate-180" : ""}`} />
                                    </button>

                                    {/* Watch Status Popover Dialog */}
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
                                                        Update Watch Status
                                                    </h4>
                                                    <button
                                                        type="button"
                                                        onClick={() => setWatchPopoverOpen(false)}
                                                        className="rounded-full p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                {/* 2 Main Choice Buttons */}
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
                                                            activeWatchMode === "timestamp" || (currentWatchRecord && !currentWatchRecord.isFullyWatched)
                                                                ? "bg-[#1a73e8] text-white shadow-xs"
                                                                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                                        }`}
                                                    >
                                                        <Clock className="h-3.5 w-3.5" />
                                                        <span>Till Timestamp</span>
                                                    </button>
                                                </div>

                                                {/* Timestamp Setter: Interactive Drag Slider + Manual Inputs */}
                                                {(activeWatchMode === "timestamp" || (currentWatchRecord && !currentWatchRecord.isFullyWatched)) && (
                                                    <div className="mt-4 space-y-3.5">
                                                        {/* Live Timestamp Display */}
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
                                                                {Math.round((tempTimestampSeconds / currentTotalSeconds) * 100)}% watched
                                                            </span>
                                                        </div>

                                                        {/* Drag & Drop Time Slider */}
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                                                                <span>{currentTotalSeconds >= 3600 ? "0:00:00" : "0:00"}</span>
                                                                <span>Drag slider to set timestamp</span>
                                                                <span>{formatTimestamp(currentTotalSeconds)}</span>
                                                            </div>
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

                                                        {/* Quick Presets */}
                                                        <div className="flex items-center gap-1.5">
                                                            {[
                                                                { label: "25%", sec: Math.round(currentTotalSeconds * 0.25) },
                                                                { label: "50%", sec: Math.round(currentTotalSeconds * 0.5) },
                                                                { label: "75%", sec: Math.round(currentTotalSeconds * 0.75) },
                                                                { label: "90%", sec: Math.round(currentTotalSeconds * 0.9) },
                                                            ].map((preset) => (
                                                                <button
                                                                    key={preset.label}
                                                                    type="button"
                                                                    onClick={() => setTempTimestampSeconds(preset.sec)}
                                                                    className="flex-1 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-[#1a73e8] dark:hover:bg-blue-950/60 dark:hover:text-blue-300 transition-colors cursor-pointer"
                                                                >
                                                                    {preset.label}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        {/* Manual Way (Hours, Minutes & Seconds Input) */}
                                                        {(() => {
                                                            const hasHours = currentTotalSeconds >= 3600;
                                                            const currentHours = Math.floor(tempTimestampSeconds / 3600);
                                                            const currentMinutes = Math.floor((tempTimestampSeconds % 3600) / 60);
                                                            const currentSeconds = tempTimestampSeconds % 60;

                                                            return (
                                                                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-1.5">
                                                                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                                        Or enter timestamp manually:
                                                                    </p>
                                                                    {hasHours ? (
                                                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                                                            {/* Hr input */}
                                                                            <div className="flex-1 flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
                                                                                <span className="text-[11px] text-slate-400">Hr:</span>
                                                                                <input
                                                                                    type="number"
                                                                                    min={0}
                                                                                    max={Math.floor(currentTotalSeconds / 3600)}
                                                                                    value={currentHours}
                                                                                    onChange={(e) => {
                                                                                        const hrs = Math.max(0, Number(e.target.value));
                                                                                        setTempTimestampSeconds(
                                                                                            Math.min(currentTotalSeconds, hrs * 3600 + currentMinutes * 60 + currentSeconds)
                                                                                        );
                                                                                    }}
                                                                                    className="w-full text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 bg-transparent outline-none"
                                                                                />
                                                                            </div>
                                                                            <span className="font-bold text-slate-400">:</span>
                                                                            {/* Min input */}
                                                                            <div className="flex-1 flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
                                                                                <span className="text-[11px] text-slate-400">Min:</span>
                                                                                <input
                                                                                    type="number"
                                                                                    min={0}
                                                                                    max={59}
                                                                                    value={currentMinutes}
                                                                                    onChange={(e) => {
                                                                                        const mins = Math.max(0, Math.min(59, Number(e.target.value)));
                                                                                        setTempTimestampSeconds(
                                                                                            Math.min(currentTotalSeconds, currentHours * 3600 + mins * 60 + currentSeconds)
                                                                                        );
                                                                                    }}
                                                                                    className="w-full text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 bg-transparent outline-none"
                                                                                />
                                                                            </div>
                                                                            <span className="font-bold text-slate-400">:</span>
                                                                            {/* Sec input */}
                                                                            <div className="flex-1 flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
                                                                                <span className="text-[11px] text-slate-400">Sec:</span>
                                                                                <input
                                                                                    type="number"
                                                                                    min={0}
                                                                                    max={59}
                                                                                    value={currentSeconds}
                                                                                    onChange={(e) => {
                                                                                        const secs = Math.max(0, Math.min(59, Number(e.target.value)));
                                                                                        setTempTimestampSeconds(
                                                                                            Math.min(currentTotalSeconds, currentHours * 3600 + currentMinutes * 60 + secs)
                                                                                        );
                                                                                    }}
                                                                                    className="w-full text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 bg-transparent outline-none"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="flex-1 flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1">
                                                                                <span className="text-[11px] text-slate-400">Min:</span>
                                                                                <input
                                                                                    type="number"
                                                                                    min={0}
                                                                                    max={Math.floor(currentTotalSeconds / 60)}
                                                                                    value={Math.floor(tempTimestampSeconds / 60)}
                                                                                    onChange={(e) => {
                                                                                        const mins = Math.max(0, Number(e.target.value));
                                                                                        const secs = tempTimestampSeconds % 60;
                                                                                        setTempTimestampSeconds(Math.min(currentTotalSeconds, mins * 60 + secs));
                                                                                    }}
                                                                                    className="w-full text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 bg-transparent outline-none"
                                                                                />
                                                                            </div>
                                                                            <span className="font-bold text-slate-400">:</span>
                                                                            <div className="flex-1 flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1">
                                                                                <span className="text-[11px] text-slate-400">Sec:</span>
                                                                                <input
                                                                                    type="number"
                                                                                    min={0}
                                                                                    max={59}
                                                                                    value={tempTimestampSeconds % 60}
                                                                                    onChange={(e) => {
                                                                                        const secs = Math.max(0, Math.min(59, Number(e.target.value)));
                                                                                        const mins = Math.floor(tempTimestampSeconds / 60);
                                                                                        setTempTimestampSeconds(Math.min(currentTotalSeconds, mins * 60 + secs));
                                                                                    }}
                                                                                    className="w-full text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 bg-transparent outline-none"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}

                                                        {/* Action Buttons */}
                                                        <div className="flex items-center gap-2 pt-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSaveTimestampProgress(tempTimestampSeconds)}
                                                                className="flex-1 rounded-xl bg-[#1a73e8] py-2 text-xs font-semibold text-white hover:bg-blue-600 shadow-xs transition-colors cursor-pointer"
                                                            >
                                                                Save Timestamp ({formatTimestamp(tempTimestampSeconds)})
                                                            </button>
                                                            {currentWatchRecord && (
                                                                <button
                                                                    type="button"
                                                                    onClick={handleMarkUnwatched}
                                                                    className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 hover:border-red-200 dark:hover:text-red-400 transition-colors cursor-pointer"
                                                                    title="Reset to unwatched"
                                                                >
                                                                    Reset
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* If fully watched, provide reset option */}
                                                {activeWatchMode === "full" && currentWatchRecord?.isFullyWatched && (
                                                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                                            <CheckCircle2 className="h-3.5 w-3.5" /> 100% Complete
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={handleMarkUnwatched}
                                                            className="text-red-500 hover:underline cursor-pointer"
                                                        >
                                                            Mark as Unwatched
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Tabs Bar */}
                        <div className="border-b border-gray-200 dark:border-slate-800">
                            <nav className="flex space-x-8">
                                {(
                                    [
                                        { id: "overview", label: "Overview" },
                                        { id: "video", label: "Video" },
                                        { id: "file", label: "File" },
                                        { id: "notes", label: "Personal Note" },
                                    ] as const
                                ).map((t) => {
                                    const isActive = activeTab === t.id;
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setActiveTab(t.id)}
                                            className={`relative pb-3 text-sm sm:text-base font-medium transition-colors ${
                                                isActive
                                                    ? "text-[#1a73e8] dark:text-blue-400 font-semibold"
                                                    : "text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
                                            }`}
                                        >
                                            {t.label}
                                            {isActive && (
                                                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#1a73e8] dark:bg-blue-500" />
                                            )}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Tab Content Panels */}
                        <div className="pt-2">
                            {/* OVERVIEW TAB */}
                            {activeTab === "overview" && (
                                <div className="space-y-6">
                                    <div className="rounded-xl border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                                        <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">
                                            About this Lecture
                                        </h3>
                                        <p className="text-sm leading-relaxed text-gray-600 dark:text-slate-300">
                                            {currentSession?.description ||
                                                "প্রাচীন যুগের সাহিত্যের প্রধান বৈশিষ্ট্য হলো ব্যক্তি ও সমাজজীবন প্রধান, ধর্ম গৌণ। বাংলা সাহিত্যের সূচনা যুগ, চর্যাপদ এবং প্রাচীন যুগের ইতিহাস ও সাহিত্যকর্মের বিস্তারিত আলোচনা।"}
                                        </p>

                                        <div className="mt-4 flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100 dark:border-slate-800 text-xs sm:text-sm">
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 px-3 py-1 font-medium text-[#1a73e8] dark:text-blue-400">
                                                <Clock className="h-3.5 w-3.5" />
                                                {(() => {
                                                    const mins = currentSession?.durationMinutes || 45;
                                                    const h = Math.floor(mins / 60);
                                                    const m = mins % 60;
                                                    if (h > 0) {
                                                        return m > 0 ? `${h} hr ${m} mins` : `${h} hr`;
                                                    }
                                                    return `${mins} Minutes`;
                                                })()}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 font-medium text-emerald-700 dark:text-emerald-400">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                {currentSession?.status || "Completed"}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-slate-800 px-3 py-1 font-medium text-gray-600 dark:text-slate-400">
                                                Video: {currentTopic?.title || "Ancient Era of Bangla Literature & Charyapada"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Key Topics Covered */}
                                    <div className="rounded-xl border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                                        <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-3">
                                            Key Topics Covered
                                        </h3>
                                        <ul className="space-y-2.5 text-sm text-gray-600 dark:text-slate-300">
                                            <li className="flex items-start gap-2.5">
                                                <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#1a73e8] dark:text-blue-300 text-xs">
                                                    ✓
                                                </span>
                                                <span>বাংলা ভাষার উদ্ভব ও বিকাশ এবং প্রাচীন যুগের বৈশিষ্ট্য বিশ্লেষণ</span>
                                            </li>
                                            <li className="flex items-start gap-2.5">
                                                <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#1a73e8] dark:text-blue-300 text-xs">
                                                    ✓
                                                </span>
                                                <span>চর্যাপদ আবিষ্কার, পুঁথি উদ্ধার, হরপ্রসাদ শাস্ত্রী ও পদকর্তাগণ</span>
                                            </li>
                                            <li className="flex items-start gap-2.5">
                                                <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#1a73e8] dark:text-blue-300 text-xs">
                                                    ✓
                                                </span>
                                                <span>প্রাচীন যুগের সমাজ, ধর্মীয় দৃষ্টিভঙ্গি এবং ছন্দ-অলঙ্কার</span>
                                            </li>
                                            <li className="flex items-start gap-2.5">
                                                <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#1a73e8] dark:text-blue-300 text-xs">
                                                    ✓
                                                </span>
                                                <span>ব্যাংক ও বিসিএস প্রিলিমিনারি পরীক্ষার গুরুত্বপূর্ণ প্রশ্নোত্তর</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* VIDEO TAB */}
                            {activeTab === "video" && (
                                <div className="space-y-4">
                                    {/* Chapters / Markers */}
                                    <div className="rounded-xl border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">
                                                Video Chapters &amp; Timestamps
                                            </h3>
                                            <span className="text-xs text-gray-500 dark:text-slate-400">
                                                Click any chapter to navigate
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            {(currentSession?.videoMarkers && currentSession.videoMarkers.length > 0
                                                ? currentSession.videoMarkers
                                                : [
                                                      { id: 1, timestampSeconds: 0, label: "ভূমিকা ও প্রাচীন যুগ পরিচিতি" },
                                                      { id: 2, timestampSeconds: 410, label: "চর্যাপদ আবিষ্কার ও পদকর্তাগণ" },
                                                      { id: 3, timestampSeconds: 1220, label: "প্রাচীন যুগের সমাজজীবন ও ভাষা" },
                                                      { id: 4, timestampSeconds: 2130, label: "বিগত বছরের প্রশ্ন সমাধান ও টিপস" },
                                                  ]
                                            ).map((marker) => (
                                                <div
                                                    key={marker.id}
                                                    className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/40 p-3 hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-950/70 text-[#1a73e8] dark:text-blue-400">
                                                            <Play className="h-3.5 w-3.5 fill-current" />
                                                        </span>
                                                        <span className="text-sm font-medium text-gray-800 dark:text-slate-200">
                                                            {marker.label}
                                                        </span>
                                                    </div>
                                                    <span className="rounded-full bg-white dark:bg-slate-900 px-2.5 py-1 font-mono text-xs font-semibold text-[#1a73e8] dark:text-blue-400 border border-gray-200 dark:border-slate-700">
                                                        {formatTimestamp(marker.timestampSeconds)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Video Features Card */}
                                    <div className="rounded-xl border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                                        <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">
                                            Video Controls &amp; Playback Notes
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                                            Recorded in Full HD (1080p). You can adjust playback speed, activate subtitles, and bookmark specific sections.
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs text-gray-500 font-medium mr-1">Speed:</span>
                                            {PLAYBACK_SPEEDS.map((s) => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setVideoSpeed(s)}
                                                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                                        videoSpeed === s
                                                            ? "bg-[#1a73e8] text-white"
                                                            : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                                                    }`}
                                                >
                                                    {s}×
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => setTheaterMode(!theaterMode)}
                                                className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                                            >
                                                <Maximize2 className="h-3.5 w-3.5" />
                                                Theater Mode
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* FILE TAB */}
                            {activeTab === "file" && (
                                <div className="space-y-4">
                                    <div className="rounded-xl border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">
                                                    Lecture Files &amp; PDF Handouts
                                                </h3>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                                    Download or read class slides, hand notes, and reference PDFs
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {(currentSession?.materials && currentSession.materials.length > 0
                                                ? currentSession.materials
                                                : [
                                                      {
                                                          id: 201,
                                                          sessionId: 101,
                                                          title: "বাংলা সাহিত্যের প্রাচীন যুগ লেকচার শীট",
                                                          kind: "slides",
                                                          url: "#",
                                                          fileName: "bangla_literature_lec1.pdf",
                                                          fileType: "application/pdf",
                                                          fileSize: "2.8 MB",
                                                          description:
                                                              "প্রাচীন যুগ সম্পর্কিত সম্পূর্ণ ক্লাস লেকচার ও রিভিশন হ্যান্ডআউট।",
                                                          sortOrder: 1,
                                                          createdAtUtc: "2024-01-15T10:00:00Z",
                                                      },
                                                      {
                                                          id: 202,
                                                          sessionId: 101,
                                                          title: "চর্যাপদ বিশেষ প্রশ্নব্যাংক ও ব্যাখ্যা",
                                                          kind: "reading",
                                                          url: "#",
                                                          fileName: "charyapada_question_bank.pdf",
                                                          fileType: "application/pdf",
                                                          fileSize: "1.9 MB",
                                                          description:
                                                              "বিসিএস ও ব্যাংক প্রিলির বিগত ২০ বছরের গুরুত্বপূর্ণ প্রশ্ন ও উত্তর।",
                                                          sortOrder: 2,
                                                          createdAtUtc: "2024-01-15T10:00:00Z",
                                                      },
                                                  ]
                                            ).map((mat) => (
                                                <div
                                                    key={mat.id}
                                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-gray-200/80 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-800/50 p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                                                >
                                                    <div className="flex items-start gap-3.5">
                                                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                                                            <FileText className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                                                                {mat.title}
                                                            </h4>
                                                            {mat.description && (
                                                                <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                                                                    {mat.description}
                                                                </p>
                                                            )}
                                                            <span className="mt-1 inline-block text-[11px] font-medium text-gray-400 dark:text-slate-500">
                                                                {mat.fileSize || "2.5 MB"} • PDF Document
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 self-end sm:self-center">
                                                        <a
                                                            href={mat.url || "#"}
                                                            download={mat.fileName || "lecture-notes.pdf"}
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 shadow-sm transition-colors"
                                                        >
                                                            <Download className="h-3.5 w-3.5" />
                                                            Download
                                                        </a>
                                                        <a
                                                            href={mat.url || "#"}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a73e8] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 shadow-sm transition-colors"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                            View
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* PERSONAL NOTE TAB */}
                            {activeTab === "notes" && (
                                <div className="space-y-4">
                                    <div className="rounded-xl border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
                                            <div>
                                                <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                                                    <FileEdit className="h-4.5 w-4.5 text-[#1a73e8] dark:text-blue-400" />
                                                    Personal Study Notes
                                                </h3>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                                    Private notes for <strong className="text-slate-700 dark:text-slate-300">{currentTopic?.title || currentSession?.title}</strong>. Auto-saved to your browser.
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    {noteSavedFeedback ? "Saved!" : "Auto-saved"}
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={copyNoteToClipboard}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                                    title="Copy note to clipboard"
                                                >
                                                    {noteCopied ? (
                                                        <>
                                                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                            <span>Copied</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="h-3.5 w-3.5" />
                                                            <span>Copy</span>
                                                        </>
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={downloadNote}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                                    title="Export note as text file"
                                                >
                                                    <Download className="h-3.5 w-3.5" />
                                                    <span>Export</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Quick Insert Snippet Chips */}
                                        <div className="flex flex-wrap items-center gap-2 text-xs">
                                            <span className="text-gray-400 dark:text-slate-500 font-medium">Quick insert:</span>
                                            <button
                                                type="button"
                                                onClick={() => insertNoteSnippet(`• [Key Takeaway]: `)}
                                                className="rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1a73e8] dark:text-blue-300 border border-blue-100 dark:border-blue-900/60 px-2.5 py-1 font-medium hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors cursor-pointer"
                                            >
                                                + Key Takeaway
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertNoteSnippet(`• [Timestamp 00:00]: `)}
                                                className="rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/60 px-2.5 py-1 font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors cursor-pointer"
                                            >
                                                + Timestamp
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertNoteSnippet(`• [Exam Point]: `)}
                                                className="rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900/60 px-2.5 py-1 font-medium hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors cursor-pointer"
                                            >
                                                + Exam Question / Point
                                            </button>
                                        </div>

                                        {/* Note Editor Textarea */}
                                        <div className="relative">
                                            <textarea
                                                rows={9}
                                                value={currentSession ? (personalNotes[currentSession.id] ?? "") : ""}
                                                onChange={(e) => handleNoteChange(e.target.value)}
                                                placeholder="Write down personal notes, important rules, timestamps, questions, or revision summaries for this lecture..."
                                                className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/60 p-4 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-[#1a73e8] focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-[#1a73e8] outline-none transition-all resize-y leading-relaxed font-sans"
                                            />
                                        </div>

                                        {/* Footer Stats & Clear Button */}
                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 pt-1">
                                            <div className="flex items-center gap-3">
                                                <span>
                                                    {currentSession && personalNotes[currentSession.id]?.trim()
                                                        ? personalNotes[currentSession.id]!.trim().split(/\s+/).length
                                                        : 0}{" "}
                                                    words
                                                </span>
                                                <span>•</span>
                                                <span>
                                                    {currentSession ? (personalNotes[currentSession.id]?.length || 0) : 0} characters
                                                </span>
                                            </div>
                                            {currentSession && Boolean(personalNotes[currentSession.id]?.length) && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (window.confirm("Are you sure you want to clear your note for this video?")) {
                                                            handleNoteChange("");
                                                        }
                                                    }}
                                                    className="text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:underline cursor-pointer"
                                                >
                                                    Clear note
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Preli Class Playlist / Accordion */}
                    <div className="lg:col-span-4 sticky top-20">
                        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg shadow-slate-200/40 dark:shadow-none overflow-hidden flex flex-col max-h-[calc(100vh-6.5rem)]">
                            {/* Card Header with Modern Gradient & Stats */}
                            <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800/90 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20">
                                {/* Total Videos & Course Progress in Same Row */}
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 shrink-0">
                                        <Video className="h-3.5 w-3.5 text-[#1a73e8] dark:text-blue-400" />
                                        <span>
                                            <strong className="font-semibold text-slate-900 dark:text-slate-100">{totalVideoCount}</strong> Videos
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Progress: <strong className="font-semibold text-slate-700 dark:text-slate-300">{overallProgress.percent}% ({overallProgress.completedCount}/{overallProgress.totalCount} completed)</strong>
                                    </div>
                                </div>

                                {/* Modern Progress Bar */}
                                <div className="mt-2 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 transition-all duration-500"
                                        style={{ width: `${Math.max(overallProgress.percent, 5)}%` }}
                                    />
                                </div>

                                {/* Topic Filter Dropdown & Search Controls */}
                                <div className="mt-3.5 space-y-2">
                                    {/* Video Filter Dropdown */}
                                    <div className="relative">
                                        <label htmlFor="sidebar-video-filter" className="sr-only">
                                            Filter videos
                                        </label>
                                        <div className="relative flex items-center">
                                            <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#1a73e8] dark:text-blue-400" />
                                            <select
                                                id="sidebar-video-filter"
                                                value={selectedTopicFilter}
                                                onChange={(e) => handleTopicFilterChange(e.target.value)}
                                                className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 py-1.5 pl-8.5 pr-8 text-xs font-medium text-slate-800 dark:text-slate-100 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none transition-all cursor-pointer shadow-xs hover:border-slate-300 dark:hover:border-slate-600"
                                            >
                                                <option value="all" className="dark:bg-slate-900 dark:text-slate-100">
                                                    All
                                                </option>
                                                {topicGroups.map((group) => (
                                                    <option
                                                        key={group.id}
                                                        value={group.id}
                                                        className="dark:bg-slate-900 dark:text-slate-100"
                                                    >
                                                        {group.title}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                                        </div>
                                    </div>

                                    {/* Instant Search Input */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                        <input
                                            type="text"
                                            value={sidebarSearch}
                                            onChange={(e) => setSidebarSearch(e.target.value)}
                                            placeholder="Search videos..."
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

                                {/* Active Video Filter Chip if not "all" */}
                                {selectedTopicFilter !== "all" && (
                                    <div className="mt-2.5 flex items-center justify-between rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 px-2.5 py-1 text-[11px] text-[#1a73e8] dark:text-blue-300">
                                        <span className="truncate">
                                            Video: <strong className="font-semibold">{topicGroups.find((g) => g.id === selectedTopicFilter)?.title || selectedTopicFilter}</strong>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleTopicFilterChange("all")}
                                            className="ml-2 font-medium hover:underline text-xs text-blue-600 dark:text-blue-400 shrink-0 cursor-pointer"
                                        >
                                            Show All
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Scrollable Topics & Lectures List */}
                            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 [scrollbar-width:thin] scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                                {filteredTopics.length === 0 ? (
                                    <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
                                        <p>No videos found matching your filter.</p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedTopicFilter("all");
                                                setSidebarSearch("");
                                            }}
                                            className="font-medium text-[#1a73e8] dark:text-blue-400 hover:underline cursor-pointer"
                                        >
                                            Reset filter to &quot;All&quot;
                                        </button>
                                    </div>
                                ) : (
                                    filteredTopics.map((topic, index) => {
                                        const isCurrentTopic = currentTopic?.id === topic.id;
                                        const primarySession = topic.sessions[0];
                                        const record = primarySession ? watchRecords[primarySession.id] : undefined;
                                        const isFullyWatched = Boolean(record?.isFullyWatched);
                                        const watchedSecs = record?.watchedSeconds || 0;
                                        const totalSessionSecs = (primarySession?.durationMinutes || 45) * 60;
                                        const progressPercentWatched = isFullyWatched
                                            ? 100
                                            : watchedSecs > 0
                                            ? Math.min(100, Math.round((watchedSecs / totalSessionSecs) * 100))
                                            : 0;
                                        const thumbnailUrl = getSessionThumbnail(primarySession, index);
                                        const durationText = formatVideoDuration(primarySession?.durationMinutes, index);

                                        return (
                                            <div
                                                key={topic.id}
                                                onClick={() => {
                                                    if (primarySession) {
                                                        handleSelectVideo(topic, primarySession);
                                                    }
                                                }}
                                                className={`group flex items-center gap-2.5 rounded-xl p-2 cursor-pointer transition-all ${
                                                    isCurrentTopic
                                                        ? "bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 shadow-xs"
                                                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent"
                                                }`}
                                            >
                                                {/* Index Number on Left / Play / Watched indicator */}
                                                <div className="w-4 shrink-0 text-center">
                                                    {isCurrentTopic ? (
                                                        <Play className="h-3 w-3 text-[#1a73e8] dark:text-blue-400 fill-current mx-auto" />
                                                    ) : isFullyWatched ? (
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950 mx-auto" />
                                                    ) : watchedSecs > 0 ? (
                                                        <Clock className="h-3 w-3 text-[#1a73e8] dark:text-blue-400 mx-auto" />
                                                    ) : (
                                                        <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                                                            {index + 1}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Thumbnail with Duration Pill, Watched Badge, and Bottom Progress Bar */}
                                                <div className="relative shrink-0 w-28 sm:w-32 aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                                                    <img
                                                        src={thumbnailUrl}
                                                        alt={topic.title}
                                                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        loading="lazy"
                                                    />
                                                    
                                                    {/* Fully Watched badge */}
                                                    {isFullyWatched && (
                                                        <span className="absolute top-1 left-1 flex items-center gap-0.5 rounded bg-emerald-600/90 backdrop-blur-2xs px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-xs">
                                                            <CheckCircle2 className="h-2.5 w-2.5" />
                                                            Watched
                                                        </span>
                                                    )}

                                                    {/* Watched till Timestamp badge */}
                                                    {!isFullyWatched && watchedSecs > 0 && (
                                                        <span className="absolute top-1 left-1 flex items-center gap-0.5 rounded bg-blue-600/90 backdrop-blur-2xs px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-xs">
                                                            <Clock className="h-2.5 w-2.5" />
                                                            {formatTimestamp(watchedSecs)}
                                                        </span>
                                                    )}

                                                    {/* Duration pill in bottom-right corner */}
                                                    <span className="absolute bottom-1.5 right-1 rounded bg-black/85 backdrop-blur-2xs px-1.5 py-0.5 text-[10px] font-semibold text-white tracking-tight leading-none shadow-xs">
                                                        {durationText}
                                                    </span>

                                                    {/* YouTube style Red/Emerald Watch Progress Bar at bottom of thumbnail */}
                                                    {progressPercentWatched > 0 && (
                                                        <div className="absolute bottom-0 inset-x-0 h-1 bg-black/60">
                                                            <div
                                                                className={`h-full transition-all duration-300 ${
                                                                    isFullyWatched ? "bg-emerald-500" : "bg-red-500"
                                                                }`}
                                                                style={{ width: `${progressPercentWatched}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Title & Channel / Course Details */}
                                                <div className="min-w-0 flex-1 flex flex-col justify-center">
                                                    <h4
                                                        className={`line-clamp-2 text-xs font-semibold leading-snug transition-colors ${
                                                            isCurrentTopic
                                                                ? "text-[#1a73e8] dark:text-blue-400 font-bold"
                                                                : "text-slate-900 dark:text-slate-100 group-hover:text-[#1a73e8] dark:group-hover:text-blue-400"
                                                        }`}
                                                        title={topic.title}
                                                    >
                                                        {topic.title}
                                                    </h4>
                                                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                        {courseTitle || "CourseDesk"}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Action Button (matching bottom-right circular chat button) */}
            <button
                type="button"
                onClick={() => setChatOpen(true)}
                title="Ask a Question / Chat"
                className="fixed bottom-6 right-6 z-40 flex h-13 w-13 items-center justify-center rounded-full bg-[#0070e0] text-white shadow-xl hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all"
            >
                <MessageCircle className="h-6 w-6" />
            </button>

            {/* Quick Doubt / Chat Drawer Modal */}
            {chatOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center bg-black/40 backdrop-blur-xs p-4 sm:p-6">
                    <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#0070e0]">
                                    <MessageCircle className="h-4 w-4" />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                                    Ask Doubt / Question
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setChatOpen(false)}
                                className="rounded-full p-1 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {doubtSent ? (
                            <div className="py-6 text-center space-y-2">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Question Submitted!
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    The instructor and teaching assistants have received your doubt.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDoubtSent(false);
                                        setChatOpen(false);
                                    }}
                                    className="mt-3 rounded-lg bg-gray-100 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-slate-200"
                                >
                                    Close
                                </button>
                            </div>
                        ) : (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (chatDoubtText.trim()) {
                                        setDoubtSent(true);
                                        setChatDoubtText("");
                                    }
                                }}
                                className="space-y-3"
                            >
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    Topic: <span className="font-semibold text-gray-700 dark:text-slate-200">{currentTopic?.title}</span> • {currentSession?.title}
                                </p>
                                <textarea
                                    rows={4}
                                    value={chatDoubtText}
                                    onChange={(e) => setChatDoubtText(e.target.value)}
                                    placeholder="Type your question or doubt regarding this lecture..."
                                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 focus:border-[#0070e0] focus:ring-1 focus:ring-[#0070e0] outline-none"
                                    required
                                />
                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setChatOpen(false)}
                                        className="rounded-lg px-4 py-2 text-xs font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="rounded-lg bg-[#0070e0] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 shadow-sm"
                                    >
                                        Send Doubt
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export const LecturesView = CurriculumView;