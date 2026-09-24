"use client";

import { useMemo, useState } from "react";
import {
    BookMarked,
    ChevronUp,
    ChevronsDownUp,
    ChevronsUpDown,
    ClipboardList,
    EllipsisVertical,
    HelpCircle,
    Pencil,
    Plus,
    Trash2,
    type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { CourseworkEntry, ClassworkEntry } from "@/types";

const KIND_ICONS: Record<NonNullable<CourseworkEntry["kind"]>, LucideIcon> = {
    assignment: ClipboardList,
    material: BookMarked,
    quiz: HelpCircle,
};

function rightLabel(entry: CourseworkEntry): string {
    if (entry.status === "Draft") return "Draft";
    return entry.kind === "material" ? entry.postedLabel : entry.dueLabel;
}

export interface InstructorCourseworkViewProps {
    items: CourseworkEntry[];
    onCreate: () => void;
    onEdit: (entry: CourseworkEntry) => void;
    onDelete: (entry: CourseworkEntry) => void;
    courseId?: number;
}
export type InstructorClassworkViewProps = InstructorCourseworkViewProps;

export function InstructorCourseworkView({
    items,
    onCreate,
    onEdit,
    onDelete,
    courseId,
}: InstructorCourseworkViewProps) {
    const router = useRouter();
    const [collapsedTopics, setCollapsedTopics] = useState<ReadonlySet<string>>(new Set());
    const [menuFor, setMenuFor] = useState<number | null>(null);

    const groups = useMemo(() => {
        const map = new Map<string, ClassworkEntry[]>();
        for (const item of items) {
            const topic = item.topic.trim() || "No topic";
            if (!map.has(topic)) map.set(topic, []);
            map.get(topic)!.push(item);
        }
        return Array.from(map.entries());
    }, [items]);

    const allCollapsed = groups.length > 0 && groups.every(([t]) => collapsedTopics.has(t));

    const toggleTopic = (topic: string) => {
        setCollapsedTopics((prev) => {
            const next = new Set(prev);
            if (next.has(topic)) next.delete(topic);
            else next.add(topic);
            return next;
        });
    };

    const toggleAll = () => {
        setCollapsedTopics(allCollapsed ? new Set() : new Set(groups.map(([t]) => t)));
    };

    return (
        <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-8">
            {/* Create button */}
            <div className="px-2 sm:px-10">
                <button
                    type="button"
                    onClick={onCreate}
                    className="flex cursor-pointer items-center gap-3 rounded-full bg-[#1a63d8] px-7 py-3 text-sm font-medium text-white hover:bg-[#1554b5]"
                >
                    <Plus className="h-5 w-5" />
                    Create
                </button>
            </div>

            {/* Collapse all */}
            <div className="mt-10 flex justify-end px-2 sm:px-10">
                <button
                    type="button"
                    onClick={toggleAll}
                    className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#1a73e8] hover:underline"
                >
                    {allCollapsed ? <ChevronsUpDown className="h-5 w-5" /> : <ChevronsDownUp className="h-5 w-5" />}
                    {allCollapsed ? "Expand all" : "Collapse all"}
                </button>
            </div>

            {/* Topics */}
            {groups.length === 0 && (
                <p className="py-16 text-center text-sm text-gray-600 dark:text-slate-400">
                    Nothing posted yet. Use Create to add your first assignment.
                </p>
            )}
            {groups.map(([topic, entries]) => {
                const collapsed = collapsedTopics.has(topic);
                return (
                    <section key={topic} className="mt-10 px-2 sm:px-10">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl text-gray-900 dark:text-slate-100">{topic}</h2>
                            <button
                                type="button"
                                aria-label={collapsed ? `Expand ${topic}` : `Collapse ${topic}`}
                                onClick={() => toggleTopic(topic)}
                                className="cursor-pointer rounded-full p-2 text-gray-700 dark:text-slate-300 hover:bg-gray-900/5 dark:hover:bg-slate-800"
                            >
                                <ChevronUp className={`h-5 w-5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
                            </button>
                        </div>
                        <div className="mt-3 border-t border-gray-300 dark:border-slate-800" />
                        {!collapsed &&
                            entries.map((entry) => {
                                const Icon = KIND_ICONS[entry.kind ?? "assignment"] ?? ClipboardList;
                                return (
                                    <div
                                        key={entry.id}
                                        className="flex items-center gap-5 border-b border-gray-300 dark:border-slate-800 px-2 py-4"
                                    >
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300">
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (courseId && entry.kind !== "material" && entry.status !== "Draft") {
                                                    router.push(`/course/${courseId}/assignments/${entry.id}`);
                                                } else {
                                                    onEdit(entry);
                                                }
                                            }}
                                            title={entry.title}
                                            className="min-w-0 flex-1 truncate text-left text-[15px] font-medium text-gray-900 dark:text-slate-200 hover:text-[#1a73e8] dark:hover:text-blue-400"
                                        >
                                            {entry.title}
                                        </button>
                                        <span className="shrink-0 text-[14px] text-gray-600 dark:text-slate-400">{rightLabel(entry)}</span>

                                        {/* Quick Review action for assignments */}
                                        {courseId && entry.kind !== "material" && entry.status !== "Draft" && (
                                            <button
                                                type="button"
                                                onClick={() => router.push(`/course/${courseId}/assignments/${entry.id}`)}
                                                className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-xs font-medium text-gray-700 dark:text-slate-300 hover:border-[#1a73e8] hover:bg-blue-50/50 dark:hover:bg-slate-700 hover:text-[#1a73e8] dark:hover:text-blue-400 transition-colors"
                                            >
                                                Review work
                                            </button>
                                        )}

                                        {/* Kebab menu */}
                                        <div className="relative shrink-0">
                                            <button
                                                type="button"
                                                aria-label={`More options for ${entry.title}`}
                                                onClick={() => setMenuFor(menuFor === entry.id ? null : entry.id)}
                                                className="cursor-pointer rounded-full p-2 text-gray-700 dark:text-slate-300 hover:bg-gray-900/5 dark:hover:bg-slate-800"
                                            >
                                                <EllipsisVertical className="h-5 w-5" />
                                            </button>
                                            {menuFor === entry.id && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                                                    <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1 shadow-lg">
                                                        {courseId && entry.kind !== "material" && entry.status !== "Draft" && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setMenuFor(null);
                                                                    router.push(`/course/${courseId}/assignments/${entry.id}`);
                                                                }}
                                                                className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-[#1a73e8] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 font-medium"
                                                            >
                                                                <ClipboardList className="h-4 w-4 text-[#1a73e8] dark:text-blue-400" />
                                                                Review learner work
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setMenuFor(null);
                                                                onEdit(entry);
                                                            }}
                                                            className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-gray-900 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700"
                                                        >
                                                            <Pencil className="h-4 w-4 text-gray-600 dark:text-slate-400" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setMenuFor(null);
                                                                onDelete(entry);
                                                            }}
                                                            className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-[#c5221f] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                    </section>
                );
            })}
        </div>
    );
}

export const InstructorClassworkView = InstructorCourseworkView;
