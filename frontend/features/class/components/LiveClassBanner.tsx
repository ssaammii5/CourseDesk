"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, ExternalLink, Radio, Video } from "lucide-react";
import type { SessionDto } from "@/types/session";
import { getLiveClassState, formatCountdown } from "@/types/session";
import type { LiveClassState } from "@/types/session";

interface LiveClassBannerProps {
    nextSession: SessionDto | null;
    scheduleNotes?: string;
    isEnrolled: boolean;
}

export function LiveClassBanner({
    nextSession,
    scheduleNotes,
    isEnrolled,
}: LiveClassBannerProps) {
    const [, setTick] = useState(0);

    useEffect(() => {
        const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
        return () => window.clearInterval(id);
    }, []);

    const state: LiveClassState = nextSession
        ? getLiveClassState(nextSession.scheduledAtUtc, nextSession.durationMinutes)
        : "upcoming";

    const effectiveMeetingUrl = nextSession?.meetingUrl ?? null;
    const providerLabel = (nextSession?.meetingProvider ?? "").toLowerCase();

    if (state === "live" && isEnrolled && nextSession) {
        return (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-600 to-rose-500 px-6 py-5 text-white shadow-lg">
                <span className="absolute right-5 top-5 flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
                </span>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <Radio className="h-5 w-5 animate-pulse" />
                            <span className="text-sm font-bold uppercase tracking-widest">
                                Class is Live
                            </span>
                        </div>
                        <h3 className="mt-1 truncate text-xl font-semibold">
                            {nextSession.title}
                        </h3>
                        {nextSession.topic && (
                            <p className="mt-0.5 truncate text-sm text-white/80">
                                {nextSession.topic}
                            </p>
                        )}
                    </div>

                    {effectiveMeetingUrl && (
                        <a
                            href={effectiveMeetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-red-600 shadow-md transition-transform hover:scale-105"
                        >
                            {providerLabel === "zoom" || providerLabel === "meet" || providerLabel === "teams" ? (
                                <Video className="h-5 w-5" />
                            ) : (
                                <ExternalLink className="h-5 w-5" />
                            )}
                            Join Now
                        </a>
                    )}
                </div>

                {nextSession.meetingPasscode && (
                    <p className="mt-3 text-xs text-white/70">
                        Passcode:{" "}
                        <span className="font-mono font-bold">{nextSession.meetingPasscode}</span>
                    </p>
                )}
            </div>
        );
    }

    if (state === "upcoming" && nextSession) {
        const scheduledDate = nextSession.scheduledAtUtc
            ? new Date(nextSession.scheduledAtUtc)
            : null;

        return (
            <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[#1a73e8]">
                            <Calendar className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">
                                Next Live Class
                            </span>
                        </div>
                        <h3 className="mt-1 truncate text-lg font-semibold text-gray-900">
                            Session {nextSession.sessionNumber}: {nextSession.title}
                        </h3>
                        {scheduledDate && (
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {scheduledDate.toLocaleDateString("en-US", {
                                        weekday: "short",
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {scheduledDate.toLocaleTimeString("en-US", {
                                        hour: "numeric",
                                        minute: "2-digit",
                                    })}
                                </span>
                                <span className="text-gray-400">
                                    ({nextSession.durationMinutes} min)
                                </span>
                            </div>
                        )}
                        {nextSession.topic && (
                            <p className="mt-1 text-sm text-gray-500">{nextSession.topic}</p>
                        )}
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                        {nextSession.scheduledAtUtc && (
                            <span className="rounded-full bg-[#e8f0fe] px-4 py-1.5 text-sm font-semibold text-[#174ea6]">
                                Starts in {formatCountdown(nextSession.scheduledAtUtc)}
                            </span>
                        )}
                        {scheduleNotes && (
                            <span className="text-xs text-gray-500">{scheduleNotes}</span>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (!scheduleNotes) {
        return null;
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-3">
            <div className="flex items-center gap-2.5 text-xs text-gray-600">
                <Video className="h-4 w-4 text-gray-400" />
                <span>{scheduleNotes}</span>
            </div>
        </div>
    );
}