"use client";

import { useMemo, useState } from "react";
import {
    ChevronDown,
    ChevronUp,
    ChevronsDownUp,
    ChevronsUpDown,
    ClipboardList,
    EllipsisVertical,
    SquareUserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { IconButton } from "@/components/ui/IconButton";
import type { ClassworkEntry } from "@/lib/schemas";

interface ClassworkViewProps {
    items: ClassworkEntry[];
    courseId?: number;
}

export function ClassworkView({ items, courseId }: ClassworkViewProps) {
    const router = useRouter();
    const [topicFilter, setTopicFilter] = useState("all");
    const [collapsedTopics, setCollapsedTopics] = useState<ReadonlySet<string>>(new Set());
    const [expandedItems, setExpandedItems] = useState<ReadonlySet<number>>(new Set());

    // Students never see draft items created by teachers.
    const published = useMemo(() => items.filter((i) => i.status !== "Draft"), [items]);

    const topics = useMemo(() => Array.from(new Set(published.map((i) => i.topic))), [published]);
    const visibleGroups = topics
        .filter((t) => topicFilter === "all" || t === topicFilter)
        .map((topic) => ({ topic, entries: published.filter((i) => i.topic === topic) }));

    const allCollapsed =
        visibleGroups.length > 0 && visibleGroups.every((g) => collapsedTopics.has(g.topic));

    const toggleTopic = (topic: string) => {
        setCollapsedTopics((prev) => {
            const next = new Set(prev);
            if (next.has(topic)) next.delete(topic);
            else next.add(topic);
            return next;
        });
    };

    const toggleAll = () => {
        setCollapsedTopics(allCollapsed ? new Set() : new Set(visibleGroups.map((g) => g.topic)));
    };

    const toggleItem = (id: number) => {
        setExpandedItems((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-8">
            {/* Toolbar */}
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <fieldset className="relative w-full max-w-[420px] rounded border border-gray-500/70 focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8]">
                    <legend className="ml-3 bg-white px-1 text-xs text-gray-800">Topic filter</legend>
                    <div className="relative">
                        <select
                            value={topicFilter}
                            onChange={(e) => setTopicFilter(e.target.value)}
                            className="w-full appearance-none bg-transparent py-4 pl-4 pr-10 text-[15px] text-gray-900 focus:outline-none"
                        >
                            <option value="all">All topics</option>
                            {topics.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-800" />
                    </div>
                </fieldset>
                <div className="flex items-center gap-6">
                    <button
                        type="button"
                        onClick={() => courseId !== undefined && router.push(`/class/${courseId}/work`)}
                        className="flex cursor-pointer items-center gap-3 rounded-full border border-gray-400 px-5 py-2.5 text-sm font-medium text-[#1a73e8] hover:bg-blue-50"
                    >
                        <SquareUserRound className="h-5 w-5" />
                        View your work
                    </button>
                    <button
                        type="button"
                        onClick={toggleAll}
                        className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#1a73e8] hover:underline"
                    >
                        {allCollapsed ? <ChevronsUpDown className="h-5 w-5" /> : <ChevronsDownUp className="h-5 w-5" />}
                        {allCollapsed ? "Expand all" : "Collapse all"}
                    </button>
                </div>
            </div>

            {/* Topics */}
            {visibleGroups.length === 0 && (
                <p className="py-16 text-center text-sm text-gray-600">No classwork posted yet.</p>
            )}
            {visibleGroups.map((group) => {
                const collapsed = collapsedTopics.has(group.topic);
                return (
                    <section key={group.topic} className="mt-12">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-2xl text-gray-900">{group.topic}</h2>
                            <div className="flex items-center">
                                <IconButton
                                    label={collapsed ? "Expand topic" : "Collapse topic"}
                                    onClick={() => toggleTopic(group.topic)}
                                    className="h-10 w-10"
                                >
                                    <ChevronUp className={`h-5 w-5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
                                </IconButton>
                                <IconButton label="More options" className="h-10 w-10">
                                    <EllipsisVertical className="h-5 w-5" />
                                </IconButton>
                            </div>
                        </div>
                        <div className="mt-3 border-t border-gray-300" />
                        {!collapsed &&
                            group.entries.map((entry) => (
                                <ClassworkRow
                                    key={entry.id}
                                    entry={entry}
                                    expanded={expandedItems.has(entry.id)}
                                    onToggle={() => toggleItem(entry.id)}
                                />
                            ))}
                    </section>
                );
            })}
        </div>
    );
}

function ClassworkRow({
    entry,
    expanded,
    onToggle,
}: {
    entry: ClassworkEntry;
    expanded: boolean;
    onToggle: () => void;
}) {
    const header = (
        <button
            type="button"
            onClick={onToggle}
            className={`flex w-full cursor-pointer items-center gap-5 text-left hover:bg-gray-900/5 ${expanded ? "px-4 py-4" : "px-2 py-4"
                }`}
        >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-300/70 text-gray-700">
                <ClipboardList className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1 truncate text-[15px] text-gray-900">{entry.title}</span>
            <span className="shrink-0 text-[15px] text-gray-800">{entry.dueLabel}</span>
            <EllipsisVertical className="h-5 w-5 shrink-0 text-gray-700" />
        </button>
    );

    if (!expanded) {
        return <div className="border-b border-gray-300">{header}</div>;
    }

    return (
        <div className="my-3 overflow-hidden rounded-lg bg-[#e8eef5]">
            {header}
            <div className="border-t border-gray-300/80 px-6 pb-4 pt-4">
                <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-medium text-gray-800">{entry.postedLabel}</p>
                    <p className="text-sm text-gray-800">{entry.status}</p>
                </div>
                <p className="mt-5 whitespace-pre-line text-sm leading-6 text-gray-800">{entry.description}</p>
            </div>
            <div className="border-t border-gray-300/80 px-6 py-3">
                <a href="#" className="text-sm font-medium text-[#1a73e8] hover:underline">
                    View instructions
                </a>
            </div>
        </div>
    );
}