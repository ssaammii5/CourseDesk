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
import type { ClassworkEntry } from "@/types";

const KIND_ICONS: Record<NonNullable<ClassworkEntry["kind"]>, LucideIcon> = {
    assignment: ClipboardList,
    material: BookMarked,
    quiz: HelpCircle,
};

function rightLabel(entry: ClassworkEntry): string {
    if (entry.status === "Draft") return "Draft";
    return entry.kind === "material" ? entry.postedLabel : entry.dueLabel;
}

interface TeacherClassworkViewProps {
    items: ClassworkEntry[];
    onCreate: () => void;
    onEdit: (entry: ClassworkEntry) => void;
    onDelete: (entry: ClassworkEntry) => void;
    courseId?: number;
}

export function TeacherClassworkView({
    items,
    onCreate,
    onEdit,
    onDelete,
    courseId,
}: TeacherClassworkViewProps) {
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
                <p className="py-16 text-center text-sm text-gray-600">
                    Nothing posted yet. Use Create to add your first assignment.
                </p>
            )}
            {groups.map(([topic, entries]) => {
                const collapsed = collapsedTopics.has(topic);
                return (
                    <section key={topic} className="mt-10 px-2 sm:px-10">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl text-gray-900">{topic}</h2>
                            <button
                                type="button"
                                aria-label={collapsed ? `Expand ${topic}` : `Collapse ${topic}`}
                                onClick={() => toggleTopic(topic)}
                                className="cursor-pointer rounded-full p-2 text-gray-700 hover:bg-gray-900/5"
                            >
                                <ChevronUp className={`h-5 w-5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
                            </button>
                        </div>
                        <div className="mt-3 border-t border-gray-300" />
                        {!collapsed &&
                            entries.map((entry) => {
                                const Icon = KIND_ICONS[entry.kind ?? "assignment"] ?? ClipboardList;
                                return (
                                    <div
                                        key={entry.id}
                                        className="flex items-center gap-5 border-b border-gray-300 px-2 py-4"
                                    >
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-700">
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (courseId && entry.kind !== "material" && entry.status !== "Draft") {
                                                    router.push(`/class/${courseId}/assignments/${entry.id}`);
                                                } else {
                                                    onEdit(entry);
                                                }
                                            }}
                                            title={entry.title}
                                            className="min-w-0 flex-1 truncate text-left text-[15px] font-medium text-gray-900 hover:text-[#1a73e8]"
                                        >
                                            {entry.title}
                                        </button>
                                        <span className="shrink-0 text-[14px] text-gray-600">{rightLabel(entry)}</span>

                                        {/* Quick Review action for assignments */}
                                        {courseId && entry.kind !== "material" && entry.status !== "Draft" && (
                                            <button
                                                type="button"
                                                onClick={() => router.push(`/class/${courseId}/assignments/${entry.id}`)}
                                                className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:border-[#1a73e8] hover:bg-blue-50/50 hover:text-[#1a73e8] transition-colors"
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
                                                className="cursor-pointer rounded-full p-2 text-gray-700 hover:bg-gray-900/5"
                                            >
                                                <EllipsisVertical className="h-5 w-5" />
                                            </button>
                                            {menuFor === entry.id && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                                                    <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                                                        {courseId && entry.kind !== "material" && entry.status !== "Draft" && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setMenuFor(null);
                                                                    router.push(`/class/${courseId}/assignments/${entry.id}`);
                                                                }}
                                                                className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-[#1a73e8] hover:bg-blue-50 font-medium"
                                                            >
                                                                <ClipboardList className="h-4 w-4 text-[#1a73e8]" />
                                                                Review student work
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setMenuFor(null);
                                                                onEdit(entry);
                                                            }}
                                                            className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-50"
                                                        >
                                                            <Pencil className="h-4 w-4 text-gray-600" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setMenuFor(null);
                                                                onDelete(entry);
                                                            }}
                                                            className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-[#c5221f] hover:bg-red-50"
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