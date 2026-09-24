"use client";

import { Pin, Send, Sparkles } from "lucide-react";
import { initialOf } from "@/lib/utils/format";

interface StreamComposerProps {
    authorName?: string | null;
    authorId?: number;
    onClick: () => void;
}

export function StreamComposer({ authorName, authorId = 1, onClick }: StreamComposerProps) {
    const displayName = authorName || "Instructor";

    return (
        <div
            onClick={onClick}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all duration-200 hover:border-indigo-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/90 dark:hover:border-indigo-700/60"
        >
            <div className="flex items-center gap-3.5">
                {/* Avatar */}
                <div className="relative shrink-0">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-sm font-semibold text-white shadow-xs">
                        {initialOf(displayName)}
                    </span>
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900">
                        <span className="h-1 w-1 rounded-full bg-white" />
                    </span>
                </div>

                {/* Simulated Input Bar */}
                <div className="flex min-w-0 flex-1 items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/80 px-4 py-2.5 transition-colors group-hover:border-slate-300 group-hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50 dark:group-hover:border-slate-700 dark:group-hover:bg-slate-800/80">
                    <span className="truncate text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        Share an update, lecture material, or announcement with your class…
                    </span>

                    <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
                        <span className="flex items-center gap-1 rounded-md bg-white px-2 py-0.5 shadow-2xs border border-slate-200/60 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300">
                            <Pin className="h-3 w-3 text-amber-500" />
                            Pin
                        </span>
                        <span className="flex items-center gap-1 rounded-md bg-white px-2 py-0.5 shadow-2xs border border-slate-200/60 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300">
                            <Sparkles className="h-3 w-3 text-indigo-500" />
                            Format
                        </span>
                    </div>
                </div>

                {/* Publish CTA Button */}
                <button
                    type="button"
                    className="hidden sm:inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all group-hover:bg-indigo-500"
                >
                    <Send className="h-3.5 w-3.5" />
                    <span>Post</span>
                </button>
            </div>
        </div>
    );
}
