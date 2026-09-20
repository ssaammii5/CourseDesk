"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";
import { initialOf } from "@/lib/utils/format";
import type { LearnerWorkData, LearnerWorkTask } from "@/lib/learnerWork";

const TASK_FILTERS = ["All", "Assigned", "Turned in", "Graded"] as const;
type TaskFilter = (typeof TASK_FILTERS)[number];

export interface LearnerWorkViewProps {
    work: LearnerWorkData;
    courseId: number;
}

export function LearnerWorkView({ work, courseId }: LearnerWorkViewProps) {
    const router = useRouter();
    const [filter, setFilter] = useState<TaskFilter>("All");

    const displayName = work.learnerName || "Learner";

    const visibleTasks = useMemo(
        () => (filter === "All" ? work.tasks : work.tasks.filter((t) => t.status === filter)),
        [filter, work.tasks],
    );

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-white">
            <div className="mx-auto w-full max-w-[1000px] px-4 py-10 sm:px-8">
                {/* Learner header */}
                <div className="flex items-center gap-6">
                    <span
                        className={`flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full text-4xl text-white ${work.avatarClass}`}
                    >
                        {initialOf(displayName)}
                    </span>
                    <h1 className="min-w-0 truncate text-[32px] text-gray-900">{displayName}</h1>
                </div>

                <div className="mt-8 border-t border-gray-300" />

                {/* Task filter */}
                <fieldset className="relative mt-8 w-full max-w-[380px] rounded border border-gray-500/70 focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8]">
                    <legend className="ml-3 bg-white px-1 text-xs text-gray-800">Task filter</legend>
                    <div className="relative">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as TaskFilter)}
                            className="w-full appearance-none bg-transparent py-4 pl-4 pr-10 text-[15px] text-gray-900 focus:outline-none"
                        >
                            {TASK_FILTERS.map((f) => (
                                <option key={f} value={f}>
                                    {f}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-800" />
                    </div>
                </fieldset>

                {/* Task list */}
                <ul className="mt-6">
                    {visibleTasks.length === 0 && (
                        <li className="py-12 text-center text-sm text-gray-600">No tasks for this filter.</li>
                    )}
                    {visibleTasks.map((task) => (
                        <TaskRow
                            key={task.id}
                            task={task}
                            onClick={() => router.push(`/course/${courseId}/assignments/${task.id}`)}
                        />
                    ))}
                </ul>
            </div>
        </div>
    );
}

function TaskRow({ task, onClick }: { task: LearnerWorkTask; onClick: () => void }) {
    return (
        <li className="border-b border-gray-300">
            <button
                type="button"
                onClick={onClick}
                className="flex w-full cursor-pointer items-center justify-between gap-6 rounded py-4 text-left transition-colors hover:bg-gray-900/5"
            >
                <div className="min-w-0">
                    <div className="flex items-center gap-3">
                        <span className="truncate text-base text-gray-900">{task.title}</span>
                        {task.attachmentCount > 0 && (
                            <span className="flex shrink-0 items-center gap-1 text-xs text-gray-800">
                                <Paperclip className="h-3.5 w-3.5" />
                                {task.attachmentCount}
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-sm text-gray-800">{task.dueLabel}</p>
                </div>
                <span className="shrink-0 text-sm font-medium text-gray-900">{task.status}</span>
            </button>
        </li>
    );
}
