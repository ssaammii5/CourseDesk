"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ClipboardList } from "lucide-react";
import {
    todoData,
    todoTabs,
    type TodoTabId,
    type TodoTask,
} from "@/lib/todoData";

const ICON_TONES: Record<string, string> = {
    gray: "bg-gray-200 text-gray-700",
    blue: "bg-[#d7e3fd] text-[#174ea6]",
    green: "bg-[#ceead6] text-[#137333]",
};

const DUE_TONES: Record<string, string> = {
    green: "text-[#137333]",
    red: "text-[#c5221f]",
    gray: "text-gray-600",
    default: "text-gray-800",
};

/* All sections start collapsed */
function initialOpen(tab: TodoTabId): Record<string, boolean> {
    const map: Record<string, boolean> = {};
    for (const s of todoData[tab]) map[s.id] = false;
    return map;
}

export function TodoView() {
    const [tab, setTab] = useState<TodoTabId>("assigned");
    const [classFilter, setClassFilter] = useState("all");
    const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
        initialOpen("assigned"),
    );

    const sections = todoData[tab];

    const classOptions = useMemo(
        () => Array.from(new Set(sections.flatMap((s) => s.tasks.map((t) => t.courseName)))),
        [sections],
    );

    const visibleSections = sections.map((s) => ({
        ...s,
        tasks: classFilter === "all" ? s.tasks : s.tasks.filter((t) => t.courseName === classFilter),
    }));

    const switchTab = (next: TodoTabId) => {
        setTab(next);
        setClassFilter("all");
        setOpenSections(initialOpen(next)); // collapsed again on every tab switch
    };

    const toggleSection = (id: string) =>
        setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-white">
            {/* Tabs */}
            <div className="sticky top-16 z-30 border-b border-gray-200 bg-white">
                <nav className="flex gap-8 px-4 sm:gap-12 sm:px-8">
                    {todoTabs.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => switchTab(t.id)}
                            className={`relative cursor-pointer py-4 text-sm font-medium transition-colors ${tab === t.id ? "text-[#1a73e8]" : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            {t.label}
                            {tab === t.id && (
                                <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-t-full bg-[#1a73e8]" />
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mx-auto w-full max-w-[1000px] px-4 py-8 sm:px-8">
                {/* Class filter */}
                <div className="relative w-full max-w-[380px] rounded border border-gray-500/70 focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8]">
                    <select
                        value={classFilter}
                        onChange={(e) => setClassFilter(e.target.value)}
                        className="w-full appearance-none bg-transparent px-4 py-4 text-[15px] text-gray-900 focus:outline-none"
                    >
                        <option value="all">All classes</option>
                        {classOptions.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-800" />
                </div>

                {/* Due-date sections */}
                <div className="mt-6">
                    {visibleSections.map((s) => {
                        const count = s.tasks.length;
                        const open = !!openSections[s.id];
                        return (
                            <section key={s.id}>
                                <button
                                    type="button"
                                    onClick={() => toggleSection(s.id)}
                                    className="group flex w-full cursor-pointer items-center justify-between py-4"
                                >
                                    <span className="text-[22px] text-gray-900">{s.label}</span>
                                    <span className="flex items-center gap-4">
                                        <span
                                            className={`text-sm font-medium ${count > 0 ? "text-[#1a73e8]" : "text-gray-600"
                                                }`}
                                        >
                                            {count}
                                        </span>
                                        <span className="relative">
                                            <ChevronDown
                                                className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""} ${count > 0 ? "text-gray-800" : "text-gray-400"
                                                    }`}
                                            />
                                            {/* Hover tooltip: Expand / Collapse */}
                                            <span className="pointer-events-none absolute bottom-full right-0 z-20 mb-1.5 whitespace-nowrap rounded bg-[#3c4043] px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100">
                                                {open ? "Collapse" : "Expand"}
                                            </span>
                                        </span>
                                    </span>
                                </button>

                                {open && count > 0 && (
                                    <div>
                                        {s.tasks.map((task) => (
                                            <TodoRow key={task.id} task={task} />
                                        ))}
                                    </div>
                                )}
                            </section>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function TodoRow({ task }: { task: TodoTask }) {
    const iconTone = ICON_TONES[task.iconTone ?? "gray"];
    const dueTone = DUE_TONES[task.dueTone ?? "default"];
    return (
        <div className="flex items-center justify-between gap-6 border-b border-gray-200 py-4">
            <div className="flex min-w-0 items-center gap-5">
                <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconTone}`}
                >
                    <ClipboardList className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-gray-900">{task.title}</p>
                    <p className="truncate text-sm text-gray-600">{task.courseName}</p>
                </div>
            </div>
            <div className="shrink-0 text-right">
                {task.dueLabel && <p className={`text-sm font-medium ${dueTone}`}>{task.dueLabel}</p>}
                {task.note && <p className="mt-0.5 text-xs italic text-gray-600">{task.note}</p>}
            </div>
        </div>
    );
}