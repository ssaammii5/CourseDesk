"use client";

import { useState } from "react";
import {
    Calendar,
    ChevronDown,
    ChevronUp,
    ClipboardList,
    Download,
    ExternalLink,
    FileText,
    Link2,
    Paperclip,
    PlayCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { SessionDto, SessionMaterial } from "@/types/session";
import { VideoPlayer, StatusBadge } from "@/components/ui";

interface SessionCardProps {
    session: SessionDto;
    isInstructor?: boolean;
    isTeacher?: boolean;
    assignmentStatusMap: Record<number, string>;
}

function materialIcon(kind: string) {
    switch (kind) {
        case "slides":
        case "reading":
        case "cheat_sheet":
            return <FileText className="h-4 w-4" />;
        case "code":
            return <Paperclip className="h-4 w-4" />;
        case "link":
            return <Link2 className="h-4 w-4" />;
        default:
            return <Download className="h-4 w-4" />;
    }
}

export function SessionCard({
    session,
    isTeacher,
    assignmentStatusMap,
}: SessionCardProps) {
    const router = useRouter();
    const [expanded, setExpanded] = useState(false);

    const hasVideo = Boolean(session.videoUrl);
    const scheduledDate = session.scheduledAtUtc
        ? new Date(session.scheduledAtUtc)
        : null;

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md">
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left"
            >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] text-sm font-bold text-[#174ea6]">
                    {session.sessionNumber}
                </span>
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-gray-900">
                        {session.title}
                    </h3>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        {scheduledDate && (
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {scheduledDate.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                })}
                            </span>
                        )}
                        {session.topic && <span>• {session.topic}</span>}
                    </div>
                </div>
                <StatusBadge status={session.status} />
                {expanded ? (
                    <ChevronUp className="h-5 w-5 shrink-0 text-gray-400" />
                ) : (
                    <ChevronDown className="h-5 w-5 shrink-0 text-gray-400" />
                )}
            </button>

            {expanded && (
                <div className="border-t border-gray-100">
                    {hasVideo && session.videoUrl && (
                        <div className="p-5">
                            <p className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                                <PlayCircle className="h-4 w-4 text-[#1a73e8]" />
                                Lecture Replay
                            </p>
                            <VideoPlayer
                                url={session.videoUrl}
                                title={session.title}
                                markers={session.videoMarkers}
                            />
                        </div>
                    )}

                    {session.materials.length > 0 && (
                        <div className="px-5 pb-4">
                            <p className="mb-2 text-sm font-medium text-gray-700">
                                Session Materials
                            </p>
                            <div className="space-y-2">
                                {session.materials.map((mat: SessionMaterial) => (
                                    <div
                                        key={mat.id}
                                        className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5"
                                    >
                                        <span className="text-gray-500">{materialIcon(mat.kind)}</span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-gray-800">
                                                {mat.title}
                                            </p>
                                            {mat.description && (
                                                <p className="truncate text-xs text-gray-500">
                                                    {mat.description}
                                                </p>
                                            )}
                                        </div>
                                        {mat.url && (
                                            <a
                                                href={mat.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-[#1a73e8] hover:bg-blue-50"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                Open
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {session.assignmentIds.length > 0 && (
                        <div className="border-t border-gray-100 bg-[#fef7e0]/40 px-5 py-4">
                            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                                <ClipboardList className="h-4 w-4 text-[#b06000]" />
                                Assignment
                            </p>
                            {session.assignmentIds.map((aid, i) => {
                                const status = assignmentStatusMap[aid];
                                return (
                                    <button
                                        key={aid}
                                        type="button"
                                        onClick={() =>
                                            router.push(
                                                `/course/${session.courseId}/assignments/${aid}`,
                                            )
                                        }
                                        className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-left transition-shadow hover:shadow-sm"
                                    >
                                        <span className="truncate text-sm font-medium text-gray-900">
                                            {session.assignmentTitles[i] ?? `Assignment #${aid}`}
                                        </span>
                                        {status && <StatusBadge status={status} />}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {session.description && (
                        <div className="border-t border-gray-100 px-5 py-4">
                            <p className="whitespace-pre-line text-sm leading-6 text-gray-600">
                                {session.description}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}