"use client";

import { useEffect, useMemo, useState } from "react";
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
    Sparkles,
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
    const [, setTick] = useState(0);
    const [infoOpen, setInfoOpen] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Refresh countdown every 30 seconds
    useEffect(() => {
        const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
        return () => window.clearInterval(id);
    }, []);

    const state: LiveClassState = nextSession?.scheduledAtUtc
        ? getLiveClassState(nextSession.scheduledAtUtc, nextSession.durationMinutes)
        : "upcoming";

    const isLive = state === "live" && !!nextSession;
    const isUpcoming = state === "upcoming" && !!nextSession?.scheduledAtUtc;

    // Meeting details: session overrides course
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

    const accentColor = details.bannerColor || "#4f46e5";

    return (
        <>
            <section
                aria-label="Stream Command Header"
                className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950 text-white shadow-xl dark:border-slate-800"
            >
                {/* Dynamic Ambient Mesh Glow */}
                <div
                    className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-30 blur-3xl transition-opacity duration-1000"
                    style={{ backgroundColor: accentColor }}
                />
                <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-indigo-600/25 blur-3xl" />
                <div className="pointer-events-none absolute left-1/3 top-0 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl" />

                {/* Subtle tech micro-grid pattern */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.05]"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
                        backgroundSize: "24px 24px",
                    }}
                />

                <div className="relative z-10 flex flex-col justify-between gap-5 p-6 sm:p-8">
                    {/* Top Row: Context Badges & Live Status */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            {subjectLabel && (
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-200 backdrop-blur-md">
                                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                                    {subjectLabel}
                                </span>
                            )}
                            {sessionLabel && (
                                <span className="inline-flex items-center rounded-lg border border-indigo-400/25 bg-indigo-500/15 px-3 py-1 text-xs font-medium text-indigo-200">
                                    {sessionLabel}
                                </span>
                            )}
                            {programLabel && (
                                <span className="hidden sm:inline-flex items-center rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-1 text-xs text-slate-300">
                                    {programLabel}
                                </span>
                            )}
                        </div>

                        {/* Live / Upcoming Status Pill */}
                        {isLive ? (
                            <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-rose-300 shadow-sm shadow-rose-950/50">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                                </span>
                                <span>Lecture Live Now</span>
                            </div>
                        ) : isUpcoming && nextSession?.scheduledAtUtc ? (
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/15 px-3.5 py-1 text-xs font-medium text-sky-200">
                                <Clock className="h-3.5 w-3.5 text-sky-300" />
                                <span>Starts in {formatCountdown(nextSession.scheduledAtUtc)}</span>
                            </div>
                        ) : null}
                    </div>

                    {/* Middle Row: Title & Subtitle */}
                    <div className="min-w-0 py-1">
                        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
                            {title}
                        </h1>

                        {isLive && nextSession && (
                            <div className="mt-2.5 flex items-center gap-2 text-sm font-medium text-rose-200">
                                <Radio className="h-4 w-4 animate-pulse text-rose-400" />
                                <span>
                                    Session {nextSession.sessionNumber}: {nextSession.title}
                                    {nextSession.topic ? ` — ${nextSession.topic}` : ""}
                                </span>
                            </div>
                        )}

                        {!isLive && isUpcoming && nextSession && (
                            <p className="mt-2 text-xs text-slate-300 sm:text-sm">
                                Next Session: <span className="font-semibold text-white">Session {nextSession.sessionNumber}</span> — {nextSession.title}
                            </p>
                        )}
                    </div>

                    {/* Bottom Row: Metrics Ribbon & Action Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
                        {/* Quick Metrics */}
                        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300">
                            <div className="flex items-center gap-1.5">
                                <GraduationCap className="h-4 w-4 text-indigo-400" />
                                <span className="font-semibold text-slate-100">{primaryInstructor}</span>
                            </div>

                            <div className="flex items-center gap-1.5 text-slate-300">
                                <Users className="h-4 w-4 text-indigo-400" />
                                <span>{learnerCount} Learners</span>
                            </div>

                            <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
                                <Megaphone className="h-3.5 w-3.5 text-indigo-400" />
                                <span>{announcementsCount} Updates</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            {/* Live Join Button */}
                            {isLive && meetingUrl && (
                                <a
                                    href={meetingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-900/40 transition-all hover:scale-[1.02] hover:from-rose-500 hover:to-red-400 active:scale-[0.98]"
                                >
                                    <Video className="h-4 w-4" />
                                    <span>Enter Live Room</span>
                                </a>
                            )}

                            {/* Share button */}
                            <button
                                type="button"
                                onClick={handleCopyLink}
                                title="Share course link"
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
                            >
                                {copiedLink ? (
                                    <>
                                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                                        <span className="text-emerald-300">Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-3.5 w-3.5 text-slate-300" />
                                        <span>Share</span>
                                    </>
                                )}
                            </button>

                            {/* Class Details button */}
                            <button
                                type="button"
                                onClick={() => setInfoOpen(true)}
                                title="View meeting details & credentials"
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
                            >
                                <Info className="h-3.5 w-3.5 text-slate-300" />
                                <span>Details</span>
                            </button>

                            {/* Instructor New Announcement CTA */}
                            {isInstructor && onNewAnnouncement && (
                                <button
                                    type="button"
                                    onClick={onNewAnnouncement}
                                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-900/30 transition-all hover:from-indigo-400 hover:to-indigo-500 active:scale-95"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>New Post</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Class Details & Meeting Info Modal */}
            {infoOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                    Course & Meeting Info
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Direct access credentials and class metadata
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setInfoOpen(false)}
                                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mt-4 space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
                            {/* Course name */}
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Course</p>
                                <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
                            </div>

                            {/* Meeting URL */}
                            {meetingUrl && (
                                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                            Virtual Classroom Link
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => handleCopyField(meetingUrl, "url")}
                                            className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
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
                                        className="mt-1.5 flex items-center gap-1 truncate text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                                    >
                                        <span className="truncate">{meetingUrl}</span>
                                        <ExternalLink className="h-3 w-3 shrink-0" />
                                    </a>
                                </div>
                            )}

                            {/* Meeting ID & Passcode */}
                            {(meetingId || meetingPasscode) && (
                                <div className="grid grid-cols-2 gap-3">
                                    {meetingId && (
                                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-semibold text-slate-400">Meeting ID</p>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyField(meetingId, "id")}
                                                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                                >
                                                    {copiedField === "id" ? (
                                                        <Check className="h-3 w-3 text-emerald-500" />
                                                    ) : (
                                                        <Copy className="h-3 w-3" />
                                                    )}
                                                </button>
                                            </div>
                                            <p className="mt-1 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                {meetingId}
                                            </p>
                                        </div>
                                    )}

                                    {meetingPasscode && (
                                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-semibold text-slate-400">Passcode</p>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyField(meetingPasscode, "passcode")}
                                                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                                >
                                                    {copiedField === "passcode" ? (
                                                        <Check className="h-3 w-3 text-emerald-500" />
                                                    ) : (
                                                        <Copy className="h-3 w-3" />
                                                    )}
                                                </button>
                                            </div>
                                            <p className="mt-1 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                {meetingPasscode}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Instructor & Learner Summary */}
                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Instructor</p>
                                    <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{primaryInstructor}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Class Size</p>
                                    <p className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{learnerCount} Students</p>
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
