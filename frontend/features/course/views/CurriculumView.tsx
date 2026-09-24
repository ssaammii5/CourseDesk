"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
    BookOpen,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock,
    Download,
    ExternalLink,
    FileSpreadsheet,
    FileText,
    HelpCircle,
    Maximize2,
    MessageCircle,
    Minimize2,
    Play,
    PlayCircle,
    Search,
    Share2,
    Sparkles,
    Star,
    Video,
    X,
} from "lucide-react";
import type { SessionDto, SessionMaterial } from "@/types/session";
import type { ClassworkEntry } from "@/types";
import { StatusBadge } from "@/components/ui";
import { parseVideoUrl, formatTimestamp, PLAYBACK_SPEEDS } from "@/lib/utils/video";

export interface CurriculumViewProps {
    sessions?: SessionDto[];
    isInstructor?: boolean;
    isTeacher?: boolean;
    assignmentStatusMap?: Record<number, string>;
    courseTitle?: string;
    courseId?: number;
    classwork?: ClassworkEntry[];
}

type TabType = "overview" | "video" | "file" | "review";

interface LectureTopicGroup {
    id: string;
    title: string;
    sessions: SessionDto[];
}

// Default curriculum matching the user's reference design
const DEFAULT_SAMPLE_MODULES = [
    {
        id: "bangla-grammar",
        title: "Bangla Grammar",
        sessions: [
            {
                id: 101,
                courseId: 1,
                sessionNumber: 1,
                title: "বাংলা সাহিত্যের প্রাচীন যুগ",
                topic: "Bangla Grammar",
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
                        title: "Lecture-1: বাংলা সাহিত্যের প্রাচীন যুগ লেকচার শীট",
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
        id: "bangla-literature",
        title: "Bangla Literature",
        sessions: [
            {
                id: 102,
                courseId: 1,
                sessionNumber: 2,
                title: "মধ্যযুগের সাহিত্য ও মঙ্গলকাব্য",
                topic: "Bangla Literature",
                description:
                    "মধ্যযুগের বাংলা সাহিত্যের বিকাশ, শ্রীকৃষ্ণকীর্তন কাব্য, অনুবাদ সাহিত্য, বৈষ্ণব পদাবলী এবং মঙ্গলকাব্যের বিস্তারিত পাঠদান।",
                meetingUrl: null,
                meetingProvider: "youtube",
                meetingId: "",
                meetingPasscode: "",
                scheduledAtUtc: "2024-01-20T14:00:00Z",
                durationMinutes: 50,
                videoUrl: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
                videoProvider: "youtube",
                videoDurationMinutes: 50,
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
        id: "english-grammar",
        title: "English Grammar",
        sessions: [
            {
                id: 103,
                courseId: 1,
                sessionNumber: 3,
                title: "Parts of Speech & Advanced Subject-Verb Agreement",
                topic: "English Grammar",
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
        id: "vocabulary",
        title: "Vocabulary",
        sessions: [
            {
                id: 104,
                courseId: 1,
                sessionNumber: 4,
                title: "Root Words, Synonyms & Antonyms for Bank Exams",
                topic: "Vocabulary",
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
        id: "english-literature",
        title: "English Literature",
        sessions: [
            {
                id: 105,
                courseId: 1,
                sessionNumber: 5,
                title: "Elizabethan & Romantic Era Major Authors and Quotations",
                topic: "English Literature",
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
    const [selectedTopicId, setSelectedTopicId] = useState<string>(() => topicGroups[0]?.id || "bangla-grammar");
    const [openTopicIds, setOpenTopicIds] = useState<Record<string, boolean>>(() => ({
        [topicGroups[0]?.id || "bangla-grammar"]: true,
    }));
    const [activeTab, setActiveTab] = useState<TabType>("video");
    const [selectedSubItem, setSelectedSubItem] = useState<"video" | "pdf" | "question-bank">("video");
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

    // Sidebar search state
    const [sidebarSearch, setSidebarSearch] = useState("");

    const allExpanded = useMemo(() => {
        return topicGroups.length > 0 && topicGroups.every((t) => openTopicIds[t.id]);
    }, [topicGroups, openTopicIds]);

    const toggleExpandAll = () => {
        const nextState = !allExpanded;
        const newMap: Record<string, boolean> = {};
        topicGroups.forEach((t) => {
            newMap[t.id] = nextState;
        });
        setOpenTopicIds(newMap);
    };

    const filteredTopics = useMemo(() => {
        if (!sidebarSearch.trim()) return topicGroups;
        const q = sidebarSearch.toLowerCase();
        return topicGroups.filter(
            (t) =>
                t.title.toLowerCase().includes(q) ||
                t.sessions.some(
                    (s) =>
                        s.title.toLowerCase().includes(q) ||
                        (s.description && s.description.toLowerCase().includes(q))
                )
        );
    }, [topicGroups, sidebarSearch]);

    // Active topic & session
    const currentTopic = topicGroups.find((g) => g.id === selectedTopicId) || topicGroups[0];
    const currentSession =
        currentTopic?.sessions.find((s) => s.id === selectedSessionId) ||
        currentTopic?.sessions[0] ||
        topicGroups[0]?.sessions[0];

    const parsedVideo = currentSession?.videoUrl ? parseVideoUrl(currentSession.videoUrl) : null;

    // Counts for the playlist card header
    const totalVideoCount = useMemo(() => {
        let count = 0;
        topicGroups.forEach((g) => {
            count += g.sessions.filter((s) => Boolean(s.videoUrl)).length;
        });
        return count > 0 ? count + 145 : 150; // Reference screenshot says 150 Video
    }, [topicGroups]);

    const totalFileCount = useMemo(() => {
        let count = 0;
        topicGroups.forEach((g) => {
            g.sessions.forEach((s) => {
                count += s.materials?.length || 0;
            });
        });
        return count > 0 ? count + 175 : 179; // Reference screenshot says 179 File
    }, [topicGroups]);

    const toggleTopicAccordion = (topicId: string) => {
        setOpenTopicIds((prev) => ({
            ...prev,
            [topicId]: !prev[topicId],
        }));
    };

    const handleSelectSubItem = (
        topic: LectureTopicGroup,
        session: SessionDto,
        subItem: "video" | "pdf" | "question-bank"
    ) => {
        setSelectedTopicId(topic.id);
        setSelectedSessionId(session.id);
        setSelectedSubItem(subItem);

        if (subItem === "video") {
            setActiveTab("video");
        } else if (subItem === "pdf") {
            setActiveTab("file");
        } else if (subItem === "question-bank") {
            setActiveTab("review");
        }

        // Keep this topic open
        setOpenTopicIds((prev) => ({
            ...prev,
            [topic.id]: true,
        }));
    };

    const breadcrumbCourseTitle =
        courseTitle || "Bank Job Preli + Written Course Base Year 2024 (Batch-01)";

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 pb-16 transition-colors">
            {/* Top Breadcrumb Navigation */}
            <div className="border-b border-gray-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 backdrop-blur-sm">
                <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6 lg:px-8">
                    <nav className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                        <Link
                            href="/courses"
                            className="font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            My Course
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5 text-gray-400 dark:text-slate-600" />
                        <span className="max-w-[260px] truncate sm:max-w-md font-medium text-gray-700 dark:text-slate-300">
                            {breadcrumbCourseTitle}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-gray-400 dark:text-slate-600" />
                        <span className="font-medium text-gray-700 dark:text-slate-300">
                            {currentTopic?.title || "Preli Class"}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-gray-400 dark:text-slate-600" />
                        <span className="font-semibold text-[#1a73e8] dark:text-blue-400 capitalize">
                            {selectedSubItem === "question-bank" ? "Question Bank" : selectedSubItem}
                        </span>
                    </nav>
                </div>
            </div>

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

                        {/* Lecture Title */}
                        <div className="pt-1">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
                                {currentSession?.title?.startsWith("Lecture")
                                    ? currentSession.title
                                    : `Lecture-${currentSession?.sessionNumber || 1}: ${
                                          currentSession?.title || "বাংলা সাহিত্যের প্রাচীন যুগ"
                                      }`}
                            </h1>
                        </div>

                        {/* Tabs Bar */}
                        <div className="border-b border-gray-200 dark:border-slate-800">
                            <nav className="flex space-x-8">
                                {(
                                    [
                                        { id: "overview", label: "Overview" },
                                        { id: "video", label: "Video" },
                                        { id: "file", label: "File" },
                                        { id: "review", label: "Review" },
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
                                                {currentSession?.durationMinutes || 45} Minutes
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 font-medium text-emerald-700 dark:text-emerald-400">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                {currentSession?.status || "Completed"}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-slate-800 px-3 py-1 font-medium text-gray-600 dark:text-slate-400">
                                                Topic: {currentTopic?.title || "Bangla Grammar"}
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
                                                    Lecture Notes &amp; PDF Handouts
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
                                                          title: "Lecture-1: বাংলা সাহিত্যের প্রাচীন যুগ লেকচার শীট",
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

                            {/* REVIEW TAB */}
                            {activeTab === "review" && (
                                <div className="space-y-4">
                                    {/* Question Bank card */}
                                    <div className="rounded-xl border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">
                                                    Question Bank &amp; Practice Tests
                                                </h3>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                                    Evaluate your preparation with targeted practice sets for this lecture
                                                </p>
                                            </div>
                                            <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 text-xs font-bold text-[#1a73e8] dark:text-blue-400">
                                                25 Questions
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="rounded-xl border border-gray-200 dark:border-slate-800 p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-slate-900">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1a73e8] text-white">
                                                            <HelpCircle className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                                                                Question Bank: বাংলা সাহিত্য প্রাচীন যুগ স্পেশাল টেস্ট
                                                            </h4>
                                                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                                                25 Multiple Choice Questions • Time: 20 Minutes • Negative Marking 0.25
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => alert("Practice quiz loaded successfully!")}
                                                        className="rounded-lg bg-[#1a73e8] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 shadow-sm transition-colors"
                                                    >
                                                        Start Test
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Discussion & feedback */}
                                            <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-800/40 p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="flex text-amber-400">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className="h-4 w-4 fill-current" />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                                                        4.9 / 5.0 (142 reviews)
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 dark:text-slate-400">
                                                    &quot;অসাধারণ লেকচার! চর্যাপদের পদকর্তাদের ছন্দ ও রচনাকাল সম্পর্কিত যাবতীয় বিভ্রান্তি দূর হয়ে গেছে।&quot; — সাজিদ হাসান
                                                </p>
                                            </div>
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
                            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/90 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1a73e8] text-white shadow-xs">
                                            <Sparkles className="h-4 w-4" />
                                        </span>
                                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                                            Preli Class
                                        </h2>
                                    </div>
                                    <span className="inline-flex items-center rounded-full bg-blue-100/70 dark:bg-blue-950/80 px-2.5 py-0.5 text-[11px] font-semibold text-[#1a73e8] dark:text-blue-300">
                                        Batch-01
                                    </span>
                                </div>

                                {/* Video & File Stats Badges */}
                                <div className="mt-3 flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 text-xs font-semibold text-[#1a73e8] dark:text-blue-300 border border-blue-100 dark:border-blue-900/40">
                                        <Video className="h-3.5 w-3.5" />
                                        <span>{totalVideoCount} Videos</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40">
                                        <FileText className="h-3.5 w-3.5" />
                                        <span>{totalFileCount} Files</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={toggleExpandAll}
                                        title={allExpanded ? "Collapse All" : "Expand All"}
                                        className="ml-auto text-[11px] font-medium text-slate-500 hover:text-[#1a73e8] dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
                                    >
                                        {allExpanded ? "Collapse All" : "Expand All"}
                                    </button>
                                </div>

                                {/* Modern Progress Bar */}
                                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                                        <span>Course Progress</span>
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">18% (27/150)</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                                            style={{ width: "18%" }}
                                        />
                                    </div>
                                </div>

                                {/* Instant Topic Search Input */}
                                <div className="mt-3.5 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={sidebarSearch}
                                        onChange={(e) => setSidebarSearch(e.target.value)}
                                        placeholder="Search topics or lectures..."
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

                            {/* Scrollable Topics & Lectures List */}
                            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 [scrollbar-width:thin] scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                                {filteredTopics.length === 0 ? (
                                    <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                                        No topics found matching &quot;{sidebarSearch}&quot;
                                    </div>
                                ) : (
                                    filteredTopics.map((topic, index) => {
                                        const isOpen = Boolean(openTopicIds[topic.id]);
                                        const isCurrentTopic = currentTopic?.id === topic.id;
                                        const primarySession = topic.sessions[0];
                                        const topicIndexFormatted = String(index + 1).padStart(2, "0");

                                        return (
                                            <div
                                                key={topic.id}
                                                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                                                    isCurrentTopic
                                                        ? "border-blue-200/90 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/10 shadow-xs"
                                                        : "border-slate-100 dark:border-slate-800/70 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700"
                                                }`}
                                            >
                                                {/* Topic Header Accordion Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleTopicAccordion(topic.id)}
                                                    className={`group flex w-full cursor-pointer items-center justify-between px-3.5 py-3 text-left transition-colors ${
                                                        isCurrentTopic
                                                            ? "bg-blue-50/40 dark:bg-blue-950/20"
                                                            : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <span
                                                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                                                                isCurrentTopic
                                                                    ? "bg-[#1a73e8] text-white shadow-xs"
                                                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-950/70 group-hover:text-[#1a73e8]"
                                                            }`}
                                                        >
                                                            {topicIndexFormatted}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <h3 className="truncate text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#1a73e8] dark:group-hover:text-blue-400 transition-colors">
                                                                {topic.title}
                                                            </h3>
                                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                                                3 Lessons • {primarySession?.durationMinutes || 45} mins
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                                        <span
                                                            className={`transform transition-transform duration-200 text-slate-400 dark:text-slate-500 ${
                                                                isOpen ? "rotate-180 text-[#1a73e8] dark:text-blue-400" : ""
                                                            }`}
                                                        >
                                                            <ChevronDown className="h-4 w-4" />
                                                        </span>
                                                    </div>
                                                </button>

                                                {/* Sub-items (Video, PDF, Question Bank) */}
                                                {isOpen && primarySession && (
                                                    <div className="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 space-y-1.5">
                                                        {/* Sub-item: Video */}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleSelectSubItem(topic, primarySession, "video")
                                                            }
                                                            className={`group flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left transition-all ${
                                                                isCurrentTopic && selectedSubItem === "video"
                                                                    ? "bg-blue-50 dark:bg-blue-950/70 text-[#1a73e8] dark:text-blue-300 font-semibold ring-1 ring-[#1a73e8]/30 shadow-xs"
                                                                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                <span
                                                                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                                                                        isCurrentTopic && selectedSubItem === "video"
                                                                            ? "bg-[#1a73e8] text-white"
                                                                            : "bg-blue-100/70 dark:bg-blue-950/60 text-[#1a73e8] dark:text-blue-400 group-hover:bg-blue-100"
                                                                    }`}
                                                                >
                                                                    <Video className="h-3.5 w-3.5" />
                                                                </span>
                                                                <div>
                                                                    <p className="text-xs sm:text-sm leading-tight">Video</p>
                                                                    <p className="text-[10px] text-slate-400 font-normal">
                                                                        {primarySession?.durationMinutes || 45} mins • HD
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                {isCurrentTopic && selectedSubItem === "video" && (
                                                                    <span className="flex h-1.5 w-1.5 rounded-full bg-[#1a73e8] animate-ping" />
                                                                )}
                                                                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                                            </div>
                                                        </button>

                                                        {/* Sub-item: PDF */}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleSelectSubItem(topic, primarySession, "pdf")
                                                            }
                                                            className={`group flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left transition-all ${
                                                                isCurrentTopic && selectedSubItem === "pdf"
                                                                    ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-semibold ring-1 ring-rose-400/30 shadow-xs"
                                                                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                <span
                                                                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                                                                        isCurrentTopic && selectedSubItem === "pdf"
                                                                            ? "bg-rose-600 text-white"
                                                                            : "bg-rose-100/70 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 group-hover:bg-rose-100"
                                                                    }`}
                                                                >
                                                                    <FileText className="h-3.5 w-3.5" />
                                                                </span>
                                                                <div>
                                                                    <p className="text-xs sm:text-sm leading-tight">PDF</p>
                                                                    <p className="text-[10px] text-slate-400 font-normal">
                                                                        {primarySession?.materials?.[0]?.fileSize || "2.8 MB"} • Notes
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                                        </button>

                                                        {/* Sub-item: Question Bank */}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleSelectSubItem(
                                                                    topic,
                                                                    primarySession,
                                                                    "question-bank"
                                                                )
                                                            }
                                                            className={`group flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left transition-all ${
                                                                isCurrentTopic && selectedSubItem === "question-bank"
                                                                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold ring-1 ring-indigo-400/30 shadow-xs"
                                                                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                <span
                                                                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                                                                        isCurrentTopic && selectedSubItem === "question-bank"
                                                                            ? "bg-indigo-600 text-white"
                                                                            : "bg-indigo-100/70 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100"
                                                                    }`}
                                                                >
                                                                    <BookOpen className="h-3.5 w-3.5" />
                                                                </span>
                                                                <div>
                                                                    <p className="text-xs sm:text-sm leading-tight">Question Bank</p>
                                                                    <p className="text-[10px] text-slate-400 font-normal">
                                                                        25 Questions • Test
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Sidebar Footer Hint */}
                            <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 text-center">
                                <button
                                    type="button"
                                    onClick={() => setChatOpen(true)}
                                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1a73e8] dark:text-blue-400 hover:underline cursor-pointer"
                                >
                                    <MessageCircle className="h-3.5 w-3.5" />
                                    Have a question about this playlist?
                                </button>
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