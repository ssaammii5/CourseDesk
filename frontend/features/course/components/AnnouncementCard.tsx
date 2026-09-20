"use client";

import { EllipsisVertical, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { IconButton } from "@/components/ui";
import { initialOf } from "@/lib/utils/format";
import type { Announcement } from "@/types";

interface AnnouncementCardProps {
    announcement: Announcement;
    href?: string;
}

export function AnnouncementCard({ announcement, href }: AnnouncementCardProps) {
    const router = useRouter();

    return (
        <article className="overflow-hidden rounded-lg bg-[#f1f3f4]">
            {/* Clickable content */}
            <div
                className={`p-4 sm:p-5 ${href ? "cursor-pointer transition-colors hover:bg-gray-900/5" : ""
                    }`}
                onClick={() => href && router.push(href)}
            >
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <span
                            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium text-white ${announcement.avatarClass}`}
                        >
                            {initialOf(announcement.author)}
                        </span>
                        <div>
                            <p className="text-sm font-medium text-gray-900">{announcement.author}</p>
                            <p className="text-xs text-gray-600">{announcement.date}</p>
                        </div>
                    </div>
                    <span onClick={(e) => e.stopPropagation()}>
                        <IconButton label="More options" className="h-9 w-9">
                            <EllipsisVertical className="h-5 w-5" />
                        </IconButton>
                    </span>
                </div>

                {/* Body */}
                <p className="mt-4 text-sm text-gray-800">{announcement.text}</p>

                {/* Attachments */}
                {announcement.attachments.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {announcement.attachments.map((att) => (
                            <a
                                key={att.id}
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                className="flex overflow-hidden rounded-lg border border-gray-300 bg-white transition-shadow hover:shadow-md"
                            >
                                <span className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3">
                                    <span className="truncate text-sm font-medium text-gray-900 underline">
                                        {att.title}
                                    </span>
                                    <span className="mt-1 text-xs text-gray-600">{att.fileType}</span>
                                </span>
                                <span
                                    className={`flex w-24 shrink-0 items-center justify-center text-3xl ${att.thumbClass}`}
                                >
                                    📄
                                </span>
                            </a>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-300/70 px-4 py-3">
                <button
                    type="button"
                    className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#1a73e8] hover:underline"
                >
                    <MessageSquare className="h-5 w-5" />
                    Add comment
                </button>
            </div>
        </article>
    );
}