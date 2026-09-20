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
    Radio,
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

export interface CourseHeroBannerProps {
    title: string;
    details: ClassDetails;
    course?: CourseDto | null;
    nextSession: SessionDto | null;
    isInstructor?: boolean;
    isTeacher?: boolean;
}
export type ClassHeroBannerProps = CourseHeroBannerProps;

export function CourseHeroBanner({
    title,
    details,
    course,
    nextSession,
    isInstructor,
    isTeacher,
}: CourseHeroBannerProps) {
    const [, setTick] = useState(0);
    const [infoOpen, setInfoOpen] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Update countdown every 30s
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

    // Instructor names
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

    // Learner count
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

    const handleCopyText = (text: string, fieldName: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 1800);
    };

    return (
        <>
            <section
                aria-label="Class Overview"
                className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-xl"
            >
                {/* Ambient dynamic background lighting */}
                <div
                    className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-25 blur-3xl"
                    style={{ backgroundColor: details.bannerColor || "#3b82f6" }}
                />
                <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl" />

                {/* Subtle tech micro-grid pattern */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
                        backgroundSize: "20px 20px",
                    }}
                />

                <div className="relative z-10 flex flex-col justify-between gap-4 p-5 sm:p-6">
                    {/* Top Row: Context Badges & Live Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                            {subjectLabel && (
                                <span className="inline-flex items-center rounded-md border border-white/15 bg-white/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-slate-200 backdrop-blur-md">
                                    {subjectLabel}
                                </span>
                            )}
                            {sessionLabel && (
                                <span className="inline-flex items-center rounded-md border border-indigo-400/25 bg-indigo-500/15 px-2.5 py-0.5 text-xs font-medium text-indigo-200">
                                    {sessionLabel}
                                </span>
                            )}
                            {programLabel && (
                                <span className="hidden sm:inline-flex items-center rounded-md border border-slate-700/60 bg-slate-800/60 px-2.5 py-0.5 text-xs text-slate-300">
                                    {programLabel}
                                </span>
                            )}
                        </div>

                        {/* Live / Upcoming Status Pill */}
                        {isLive ? (
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-300">
                                <Radio className="h-3.5 w-3.5 animate-pulse text-rose-400" />
                                <span>Class is Live</span>
                            </div>
                        ) : isUpcoming && nextSession?.scheduledAtUtc ? (
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/25 bg-sky-500/15 px-3 py-1 text-xs font-medium text-sky-200">
                                <Clock className="h-3 w-3 text-sky-300" />
                                <span>Starts in {formatCountdown(nextSession.scheduledAtUtc)}</span>
                            </div>
                        ) : null}
                    </div>

                    {/* Middle Row: Course Title & Live Headline */}
                    <div className="min-w-0">
                        <h1 className="truncate text-2xl font-bold tracking-tight text-white sm:text-3xl">
                            {title}
                        </h1>

                        {isLive && nextSession && (
                            <p className="mt-1 flex items-center gap-2 truncate text-sm font-medium text-rose-200">
                                <span className="flex h-2 w-2 rounded-full bg-rose-400 animate-ping" />
                                Session {nextSession.sessionNumber}: {nextSession.title}
                                {nextSession.topic ? ` — ${nextSession.topic}` : ""}
                            </p>
                        )}

                        {!isLive && isUpcoming && nextSession && (
                            <p className="mt-1 truncate text-xs text-slate-400 sm:text-sm">
                                Upcoming: Session {nextSession.sessionNumber} — {nextSession.title}
                            </p>
                        )}
                    </div>

                    {/* Bottom Row: Metadata & Interactive Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/5">
                        {/* Instructor & Learner Meta */}
                        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300">
                            <div className="flex items-center gap-1.5">
                                <GraduationCap className="h-4 w-4 text-indigo-400" />
                                <span className="font-medium text-slate-200">{primaryInstructor}</span>
                            </div>

                            <div className="flex items-center gap-1.5 text-slate-400">
                                <Users className="h-3.5 w-3.5" />
                                <span>{learnerCount} Learners</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {/* Direct Join CTA if Live */}
                            {isLive && meetingUrl && (
                                <a
                                    href={meetingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg shadow-rose-900/40 transition-all hover:bg-rose-500 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Video className="h-3.5 w-3.5" />
                                    <span>Join Live</span>
                                </a>
                            )}

                            {/* Copy Link Button */}
                            <button
                                type="button"
                                onClick={handleCopyLink}
                                title="Copy class link"
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
                            >
                                {copiedLink ? (
                                    <>
                                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                                        <span className="text-emerald-300">Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                                        <span className="hidden sm:inline">Share</span>
                                    </>
                                )}
                            </button>

                            {/* Class Details Trigger */}
                            <button
                                type="button"
                                onClick={() => setInfoOpen(true)}
                                title="Class information & meeting details"
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
                            >
                                <Info className="h-3.5 w-3.5 text-slate-400" />
                                <span>Details</span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Class Details Modal */}
            {infoOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-[#1a73e8]">
                                    Class Information
                                </span>
                                <h2 className="mt-1 text-lg font-bold text-gray-900">{title}</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setInfoOpen(false)}
                                className="cursor-pointer rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mt-5 divide-y divide-gray-100 text-sm">
                            {subjectLabel && (
                                <div className="flex justify-between py-2.5">
                                    <span className="text-gray-500">Subject Code</span>
                                    <span className="font-semibold text-gray-900">{subjectLabel}</span>
                                </div>
                            )}

                            {sessionLabel && (
                                <div className="flex justify-between py-2.5">
                                    <span className="text-gray-500">Session / Cohort</span>
                                    <span className="font-medium text-gray-900">{sessionLabel}</span>
                                </div>
                            )}

                            {course?.program && (
                                <div className="flex justify-between py-2.5">
                                    <span className="text-gray-500">Program</span>
                                    <span className="font-medium text-gray-900">{course.program}</span>
                                </div>
                            )}

                            {course?.department && (
                                <div className="flex justify-between py-2.5">
                                    <span className="text-gray-500">Department</span>
                                    <span className="font-medium text-gray-900">{course.department}</span>
                                </div>
                            )}

                            <div className="flex justify-between py-2.5">
                                <span className="text-gray-500">Instructor(s)</span>
                                <span className="font-medium text-gray-900">
                                    {(course?.instructorNames || course?.teacherNames)?.join(", ") || primaryInstructor}
                                </span>
                            </div>

                            <div className="flex justify-between py-2.5">
                                <span className="text-gray-500">Enrolled Learners</span>
                                <span className="font-medium text-gray-900">{learnerCount} Learners</span>
                            </div>

                            {/* Meeting Credentials Section */}
                            {(meetingUrl || meetingId || meetingPasscode) && (
                                <div className="pt-4 mt-2">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        <Video className="h-3.5 w-3.5 text-[#1a73e8]" />
                                        <span>Virtual Classroom Details</span>
                                    </div>

                                    <div className="mt-2 space-y-2 rounded-xl bg-gray-50 p-3 border border-gray-100">
                                        {meetingUrl && (
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs text-gray-500">Room Link</span>
                                                <a
                                                    href={meetingUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#1a73e8] hover:underline"
                                                >
                                                    Open Link
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                        )}

                                        {meetingId && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">Meeting ID</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-xs font-semibold text-gray-900">
                                                        {meetingId}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyText(meetingId, "id")}
                                                        className="cursor-pointer p-0.5 text-gray-400 hover:text-gray-600"
                                                        title="Copy Meeting ID"
                                                    >
                                                        {copiedField === "id" ? (
                                                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="h-3.5 w-3.5" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {meetingPasscode && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">Passcode</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-xs font-semibold text-gray-900">
                                                        {meetingPasscode}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleCopyText(meetingPasscode, "passcode")
                                                        }
                                                        className="cursor-pointer p-0.5 text-gray-400 hover:text-gray-600"
                                                        title="Copy Passcode"
                                                    >
                                                        {copiedField === "passcode" ? (
                                                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="h-3.5 w-3.5" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {course?.scheduleNotes && (
                                <div className="py-2.5">
                                    <span className="text-xs font-semibold text-gray-500">
                                        Schedule Notes:
                                    </span>
                                    <p className="mt-1 text-xs text-gray-700 bg-gray-50 p-2.5 rounded-lg">
                                        {course.scheduleNotes}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={() => setInfoOpen(false)}
                                className="w-full cursor-pointer rounded-xl bg-gray-900 py-2.5 text-center text-sm font-semibold text-white hover:bg-gray-800"
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

export const ClassHeroBanner = CourseHeroBanner;
