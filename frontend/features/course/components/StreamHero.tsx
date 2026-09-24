"use client";

import { useMemo, useState } from "react";
import {
    Calendar,
    Check,
    Clock,
    Copy,
    ExternalLink,
    GraduationCap,
    Info,
    Megaphone,
    Plus,
    Radio,
    Share2,
    Users,
    Video,
    X,
} from "lucide-react";
import type { CourseDto } from "@/lib/api/courses";
import type { ClassDetails } from "@/types";
import {
    getLiveClassState,
    formatCountdown,
    type SessionDto,
    type LiveClassState,
} from "@/types/session";

export interface StreamHeroProps {
    title: string;
    details: ClassDetails;
    course?: CourseDto | null;
    nextSession: SessionDto | null;
    announcementsCount?: number;
    isInstructor?: boolean;
    onNewAnnouncement?: () => void;
}

export function StreamHero({
    title,
    details,
    course,
    nextSession,
    announcementsCount = 0,
    isInstructor = false,
    onNewAnnouncement,
}: StreamHeroProps) {
    const [infoOpen, setInfoOpen] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const state: LiveClassState = nextSession?.scheduledAtUtc
        ? getLiveClassState(nextSession.scheduledAtUtc, nextSession.durationMinutes)
        : "upcoming";

    const isLive = state === "live" && !!nextSession;
    const isUpcoming = state === "upcoming" && !!nextSession?.scheduledAtUtc;

    const meetingUrl = nextSession?.meetingUrl || course?.meetingUrl || null;
    const meetingId = nextSession?.meetingId || course?.meetingId || "";
    const meetingPasscode =
        nextSession?.meetingPasscode || course?.meetingPasscode || "";

    const primaryInstructor = useMemo(() => {
        const names = course?.instructorNames || course?.teacherNames;
        if (names && names.length > 0) {
            return names[0];
        }
        const instructorPerson = details.people.find(
            (p) => p.role === "Instructor" || (p.role as string) === "Teacher"
        );
        return instructorPerson?.name || "Instructor";
    }, [course, details.people]);

    const learnerCount =
        course?.learnerCount ??
        course?.studentCount ??
        details.people.filter((p) => p.role === "Learner" || (p.role as string) === "Student").length;

    const sessionLabel = course?.session || details.session || null;
    const subjectLabel = course?.subject || null;
    const programLabel = course?.program || course?.department || null;

    const handleCopyLink = () => {
        if (typeof window !== "undefined") {
            navigator.clipboard.writeText(window.location.href);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        }
    };

    const handleCopyField = (text: string, fieldName: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 1800);
    };

    return (
        <>
            {/* Live Class Alert Ribbon (only shown if class is currently live) */}
            {isLive && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-800 dark:border-rose-500/20 dark:bg-rose-950/40 dark:text-rose-200">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="relative flex h-2 w-2 shrink-0">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                        </span>
                        <span className="font-bold uppercase tracking-wider text-[11px]">Class is Live:</span>
                        <span className="truncate font-medium">
                            {nextSession ? `Session ${nextSession.sessionNumber}: ${nextSession.title}` : title}
                        </span>
                    </div>

                    {meetingUrl && (
                        <a
                            href={meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1 font-semibold text-white shadow-xs hover:bg-rose-500 transition-colors"
                        >
                            <Video className="h-3.5 w-3.5" />
                            <span>Join Live Room</span>
                        </a>
                    )}
                </div>
            )}

            {/* Integrated Modern Workspace Header */}
            <header className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800/90 dark:bg-slate-900/90">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Left: Category Breadcrumbs, Title, Meta Chips */}
                    <div className="min-w-0 flex-1 space-y-2">
                        {/* Tags line */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            {subjectLabel && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 text-[11px]">
                                    {subjectLabel}
                                </span>
                            )}
                            {sessionLabel && (
                                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-[11px]">
                                    {sessionLabel}
                                </span>
                            )}
                            {programLabel && (
                                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-[11px]">
                                    {programLabel}
                                </span>
                            )}

                            {!isLive && isUpcoming && nextSession?.scheduledAtUtc && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-medium text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/50 dark:text-sky-300">
                                    <Clock className="h-3 w-3" />
                                    <span>Class in {formatCountdown(nextSession.scheduledAtUtc)}</span>
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                            {title}
                        </h1>

                        {/* Meta information line */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                                <GraduationCap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                <span>{primaryInstructor}</span>
                            </div>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <div className="flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5" />
                                <span>{learnerCount} Learners</span>
                            </div>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <div className="flex items-center gap-1.5">
                                <Megaphone className="h-3.5 w-3.5" />
                                <span>{announcementsCount} Announcements</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Modern Compact Action Bar */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0 dark:border-slate-800">
                        {/* Share Button */}
                        <button
                            type="button"
                            onClick={handleCopyLink}
                            title="Share course link"
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            {copiedLink ? (
                                <>
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                                </>
                            ) : (
                                <>
                                    <Share2 className="h-3.5 w-3.5 text-slate-400" />
                                    <span>Share</span>
                                </>
                            )}
                        </button>

                        {/* Meeting & Course Details */}
                        <button
                            type="button"
                            onClick={() => setInfoOpen(true)}
                            title="Meeting details and access credentials"
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <Info className="h-3.5 w-3.5 text-slate-400" />
                            <span>Meeting Info</span>
                        </button>

                        {/* Instructor New Announcement */}
                        {isInstructor && onNewAnnouncement && (
                            <button
                                type="button"
                                onClick={onNewAnnouncement}
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 transition-all active:scale-95"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                <span>New Announcement</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Meeting Credentials Dialog */}
            {infoOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 dark:border-slate-800">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                    Course & Meeting Info
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Virtual classroom credentials and course details
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setInfoOpen(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-4 space-y-3 text-xs text-slate-700 dark:text-slate-300">
                            {/* Course name */}
                            <div>
                                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">Course</p>
                                <p className="mt-0.5 text-xs font-semibold text-slate-900 dark:text-slate-100">{title}</p>
                            </div>

                            {/* Meeting URL */}
                            {meetingUrl && (
                                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                                            Virtual Classroom Link
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => handleCopyField(meetingUrl, "url")}
                                            className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline dark:text-indigo-400 cursor-pointer"
                                        >
                                            {copiedField === "url" ? (
                                                <>
                                                    <Check className="h-3 w-3 text-emerald-500" />
                                                    <span className="text-emerald-500">Copied</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="h-3 w-3" />
                                                    <span>Copy Link</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <a
                                        href={meetingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-1 flex items-center gap-1 truncate text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                                    >
                                        <span className="truncate">{meetingUrl}</span>
                                        <ExternalLink className="h-3 w-3 shrink-0" />
                                    </a>
                                </div>
                            )}

                            {/* Meeting ID & Passcode */}
                            {(meetingId || meetingPasscode) && (
                                <div className="grid grid-cols-2 gap-2.5">
                                    {meetingId && (
                                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10.5px] font-semibold text-slate-400">Meeting ID</p>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyField(meetingId, "id")}
                                                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                                                >
                                                    {copiedField === "id" ? (
                                                        <Check className="h-3 w-3 text-emerald-500" />
                                                    ) : (
                                                        <Copy className="h-3 w-3" />
                                                    )}
                                                </button>
                                            </div>
                                            <p className="mt-1 font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                                                {meetingId}
                                            </p>
                                        </div>
                                    )}

                                    {meetingPasscode && (
                                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10.5px] font-semibold text-slate-400">Passcode</p>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyField(meetingPasscode, "passcode")}
                                                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                                                >
                                                    {copiedField === "passcode" ? (
                                                        <Check className="h-3 w-3 text-emerald-500" />
                                                    ) : (
                                                        <Copy className="h-3 w-3" />
                                                    )}
                                                </button>
                                            </div>
                                            <p className="mt-1 font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                                                {meetingPasscode}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Instructor & Learner Summary */}
                            <div className="grid grid-cols-2 gap-2.5 pt-1">
                                <div>
                                    <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">Instructor</p>
                                    <p className="mt-0.5 text-xs font-medium text-slate-900 dark:text-slate-100">{primaryInstructor}</p>
                                </div>
                                <div>
                                    <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">Class Size</p>
                                    <p className="mt-0.5 text-xs font-medium text-slate-900 dark:text-slate-100">{learnerCount} Students</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setInfoOpen(false)}
                                className="cursor-pointer rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
