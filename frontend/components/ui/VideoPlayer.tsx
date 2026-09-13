"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Maximize2, Minimize2, Play } from "lucide-react";
import {
    parseVideoUrl,
    formatTimestamp,
    PLAYBACK_SPEEDS,
} from "@/lib/utils/video";
import type { VideoMarker } from "@/types/session";

interface VideoPlayerProps {
    url: string;
    title?: string;
    markers?: VideoMarker[];
}

export function VideoPlayer({ url, title, markers = [] }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [speed, setSpeed] = useState(1);
    const [theater, setTheater] = useState(false);
    const parsed = parseVideoUrl(url);

    const isEmbeddable =
        parsed.provider === "youtube" || parsed.provider === "vimeo";
    const isDirect = parsed.provider === "direct";

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = speed;
        }
    }, [speed]);

    return (
        <div
            className={`overflow-hidden rounded-xl border border-gray-200 bg-black ${theater ? "fixed inset-0 z-50 rounded-none" : ""
                }`}
        >
            <div className={`relative ${theater ? "h-full" : "aspect-video"}`}>
                {isEmbeddable ? (
                    <iframe
                        src={parsed.embedUrl}
                        title={title ?? "Lecture recording"}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                    />
                ) : isDirect ? (
                    <video
                        ref={videoRef}
                        src={parsed.embedUrl}
                        controls
                        className="h-full w-full"
                    />
                ) : (
                    <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-4 bg-gray-900 p-8 text-center">
                        <Play className="h-12 w-12 text-gray-400" />
                        <p className="text-sm text-gray-300">
                            This recording is hosted externally.
                        </p>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-full bg-[#1a63d8] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#1554b5]"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Open Recording
                        </a>
                    </div>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3">
                <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">Speed:</span>
                    {PLAYBACK_SPEEDS.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setSpeed(s)}
                            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${speed === s
                                ? "bg-[#1a73e8] text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            {s}×
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() => setTheater((v) => !v)}
                    title={theater ? "Exit theater mode" : "Theater mode"}
                    className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                >
                    {theater ? (
                        <Minimize2 className="h-4 w-4" />
                    ) : (
                        <Maximize2 className="h-4 w-4" />
                    )}
                </button>
            </div>

            {markers.length > 0 && (
                <div className="border-t border-gray-100 bg-white px-4 py-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Chapters
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {markers.map((m) => (
                            <span
                                key={m.id}
                                className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-700"
                            >
                                <span className="font-mono font-medium text-[#1a73e8]">
                                    {formatTimestamp(m.timestampSeconds)}
                                </span>
                                {m.label}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}