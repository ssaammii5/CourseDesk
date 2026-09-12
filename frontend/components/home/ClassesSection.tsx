"use client";

import { useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
import {
    Check,
    ChevronDown,
    ClipboardList,
    EllipsisVertical,
    Eye,
    EyeOff,
    GripVertical,
    Pencil,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMyCoursesRequest, type CourseDto } from "@/lib/api/courses";
import { avatarClassFor, emojiFor, headerColorFor } from "@/lib/courseTheme";
import { initialOf, type HomeClass } from "@/lib/schemas";

type SortMode = "custom" | "alphabetical";

interface ClassesLayout {
    order: number[];
    hiddenIds: number[];
    sort: SortMode;
}

const STORAGE_KEY = "eclassroompro.classes.layout.v1";

function defaultLayout(ids: number[]): ClassesLayout {
    return { order: ids, hiddenIds: [], sort: "custom" };
}

function loadLayout(ids: number[]): ClassesLayout {
    const fallback = defaultLayout(ids);
    if (typeof window === "undefined") return fallback;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw) as Partial<ClassesLayout>;
        const knownIds = new Set(ids);
        const savedOrder = Array.isArray(parsed.order)
            ? parsed.order.filter((id): id is number => typeof id === "number" && knownIds.has(id))
            : [];
        const missingIds = ids.filter((id) => !savedOrder.includes(id));
        const hiddenIds = Array.isArray(parsed.hiddenIds)
            ? parsed.hiddenIds.filter((id): id is number => typeof id === "number" && knownIds.has(id))
            : [];
        return {
            order: [...savedOrder, ...missingIds],
            hiddenIds,
            sort: parsed.sort === "alphabetical" ? "alphabetical" : "custom",
        };
    } catch {
        return fallback;
    }
}

function mapCourseToHomeClass(c: CourseDto): HomeClass {
    return {
        id: c.id,
        name: c.name,
        subject: c.subject || c.program,
        teacherId: c.teacherId ?? 0,
        teacherName: c.teacherName ?? "No teacher assigned",
        studentCount: c.studentCount,
        headerColor: headerColorFor(c.id),
        emoji: emojiFor(c.id),
        teacherAvatarClass: avatarClassFor(c.id),
    };
}

export function ClassesSection() {
    const [homeClasses, setHomeClasses] = useState<HomeClass[]>([]);
    const [layout, setLayout] = useState<ClassesLayout>(() => defaultLayout([]));
    const [hydrated, setHydrated] = useState(false);
    const [hiddenOpen, setHiddenOpen] = useState(true);
    const [draggingId, setDraggingId] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Fetch the user's courses, then restore the persisted layout.
    useEffect(() => {
        let cancelled = false;
        getMyCoursesRequest()
            .then((dtos) => {
                if (cancelled) return;
                const mapped = dtos.map(mapCourseToHomeClass);
                setHomeClasses(mapped);
                setLayout(loadLayout(mapped.map((c) => c.id)));
                setHydrated(true);
            })
            .catch(() => {
                if (!cancelled) {
                    setHomeClasses([]);
                    setHydrated(true);
                }
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
        } catch {
            // Storage unavailable — keep state in memory only.
        }
    }, [hydrated, layout]);

    const hiddenSet = useMemo(() => new Set(layout.hiddenIds), [layout.hiddenIds]);

    const visibleClasses = useMemo(() => {
        const ordered = layout.order
            .map((id) => homeClasses.find((c) => c.id === id))
            .filter((c): c is HomeClass => c !== undefined && !hiddenSet.has(c.id));
        if (layout.sort === "alphabetical") {
            return [...ordered].sort((a, b) => a.name.localeCompare(b.name));
        }
        return ordered;
    }, [homeClasses, layout.order, layout.sort, hiddenSet]);

    const hiddenClasses = useMemo(() => {
        const ordered = layout.order
            .map((id) => homeClasses.find((c) => c.id === id))
            .filter((c): c is HomeClass => c !== undefined && hiddenSet.has(c.id));
        if (layout.sort === "alphabetical") {
            return [...ordered].sort((a, b) => a.name.localeCompare(b.name));
        }
        return ordered;
    }, [homeClasses, layout.order, layout.sort, hiddenSet]);

    const canDrag = isEditing && layout.sort === "custom";

    const enterEditMode = () => {
        setIsEditing(true);
        setLayout((prev) => (prev.sort === "alphabetical" ? { ...prev, sort: "custom" } : prev));
    };

    const exitEditMode = () => {
        setIsEditing(false);
        setDraggingId(null);
    };

    const hideClass = (id: number) =>
        setLayout((prev) =>
            prev.hiddenIds.includes(id) ? prev : { ...prev, hiddenIds: [...prev.hiddenIds, id] },
        );

    const unhideClass = (id: number) =>
        setLayout((prev) => ({ ...prev, hiddenIds: prev.hiddenIds.filter((x) => x !== id) }));

    const handleSortChange = (value: string) => {
        const sort: SortMode = value === "alphabetical" ? "alphabetical" : "custom";
        setLayout((prev) => ({ ...prev, sort }));
    };

    const handleDragStart = (e: DragEvent<HTMLDivElement>, id: number) => {
        setDraggingId(id);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(id));
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>, overId: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (draggingId === null || draggingId === overId) return;
        setLayout((prev) => {
            const from = prev.order.indexOf(draggingId);
            const to = prev.order.indexOf(overId);
            if (from === -1 || to === -1 || from === to) return prev;
            const order = [...prev.order];
            order.splice(from, 1);
            order.splice(to, 0, draggingId);
            return { ...prev, order };
        });
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDraggingId(null);
    };

    const handleDragEnd = () => setDraggingId(null);

    if (!hydrated) {
        return (
            <section className="rounded-xl bg-[#f9fafc] px-6 py-5 shadow-sm">
                <div className="flex justify-center py-10">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
                </div>
            </section>
        );
    }

    return (
        <section className="rounded-xl bg-[#f9fafc] px-6 py-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl text-gray-800">Classes</h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="relative">
                        <select
                            aria-label="Sort classes"
                            value={layout.sort}
                            onChange={(e) => handleSortChange(e.target.value)}
                            className="cursor-pointer appearance-none rounded-full border border-gray-400 bg-transparent py-2 pl-4 pr-9 text-sm font-medium text-[#1a73e8] hover:bg-blue-50 focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                        >
                            <option value="custom">Custom order</option>
                            <option value="alphabetical">Alphabetical (A–Z)</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1a73e8]" />
                    </div>
                    <button
                        type="button"
                        onClick={isEditing ? exitEditMode : enterEditMode}
                        className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${isEditing
                            ? "border-[#1a63d8] bg-[#1a63d8] text-white hover:bg-[#1554b5]"
                            : "border-gray-400 text-[#1a73e8] hover:bg-blue-50"
                            }`}
                    >
                        {isEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                        {isEditing ? "Done" : "Edit"}
                    </button>
                </div>
            </div>

            {isEditing && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#e8f0fe] px-4 py-2.5">
                    <p className="text-sm text-[#174ea6]">
                        {canDrag
                            ? "Edit mode: drag cards to rearrange your classes."
                            : 'Edit mode: switch sorting to "Custom order" to drag cards.'}
                    </p>
                    <button
                        type="button"
                        onClick={exitEditMode}
                        className="cursor-pointer text-sm font-medium text-[#1a73e8] hover:underline"
                    >
                        Done
                    </button>
                </div>
            )}

            {visibleClasses.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-600">
                    {homeClasses.length === 0
                        ? "You are not enrolled in any classes."
                        : "All of your classes are hidden. Expand the Hidden classes section below to unhide them."}
                </p>
            ) : (
                <div
                    className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                >
                    {visibleClasses.map((c) => (
                        <div
                            key={c.id}
                            draggable={canDrag}
                            onDragStart={(e) => handleDragStart(e, c.id)}
                            onDragOver={(e) => handleDragOver(e, c.id)}
                            onDrop={handleDrop}
                            onDragEnd={handleDragEnd}
                            className={`transition-opacity duration-150 ${draggingId === c.id ? "opacity-50" : "opacity-100"}`}
                        >
                            <ClassCard course={c} canDrag={canDrag} onToggleHide={() => hideClass(c.id)} />
                        </div>
                    ))}
                </div>
            )}

            {hiddenClasses.length > 0 && (
                <div className="mt-6 border-t border-gray-300/60 pt-4">
                    <button
                        type="button"
                        onClick={() => setHiddenOpen((v) => !v)}
                        aria-expanded={hiddenOpen}
                        className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-2 hover:bg-gray-900/5"
                    >
                        <span className="flex items-center gap-3 text-base font-medium text-gray-800">
                            <EyeOff className="h-5 w-5 text-gray-600" />
                            Hidden classes
                            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-300/80 px-1.5 text-xs font-semibold text-gray-700">
                                {hiddenClasses.length}
                            </span>
                        </span>
                        <ChevronDown
                            className={`h-5 w-5 text-gray-700 transition-transform duration-200 ${hiddenOpen ? "rotate-180" : ""}`}
                        />
                    </button>
                    {hiddenOpen && (
                        <div className="mt-4 grid grid-cols-1 gap-5 pb-1 md:grid-cols-2 xl:grid-cols-3">
                            {hiddenClasses.map((c) => (
                                <ClassCard key={c.id} course={c} isHidden onToggleHide={() => unhideClass(c.id)} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

interface ClassCardProps {
    course: HomeClass;
    isHidden?: boolean;
    canDrag?: boolean;
    onToggleHide: () => void;
}

function ClassCard({ course, isHidden = false, canDrag = false, onToggleHide }: ClassCardProps) {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <article
            className={`group/card relative rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md ${isHidden ? "opacity-80" : ""
                }${canDrag ? " cursor-grab active:cursor-grabbing" : ""}`}
        >
            <Link href={`/class/${course.id}`} draggable={false} className="block" title={course.name}>
                <div
                    className="relative h-28 rounded-t-lg px-4 pt-4"
                    style={{ backgroundColor: course.headerColor }}
                >
                    <span aria-hidden className="absolute right-3 top-3 rotate-12 text-5xl opacity-90">
                        {course.emoji}
                    </span>
                    <span className="block truncate pr-10 text-xl font-medium text-white hover:underline">
                        {course.name}
                    </span>
                    {course.subject && (
                        <p className="mt-1 truncate text-sm font-medium text-white/90">{course.subject}</p>
                    )}
                    <p className="mt-1 truncate text-xs text-white/90">
                        {course.teacherName ?? "No teacher assigned"}
                    </p>
                    <span
                        className={`absolute -bottom-7 right-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white ${course.teacherAvatarClass}`}
                    >
                        {initialOf(course.teacherName)}
                    </span>
                    {canDrag && (
                        <span className="pointer-events-none absolute bottom-2 left-3 flex items-center gap-1 rounded-full bg-black/35 px-2 py-1 text-[11px] font-medium text-white">
                            <GripVertical className="h-3.5 w-3.5" />
                            Drag to reorder
                        </span>
                    )}
                </div>
                <div className="h-24" />
            </Link>

            <div className="flex items-center justify-center gap-8 rounded-b-lg border-t border-gray-200 py-2 text-gray-600">
                <div className="group relative">
                    <button
                        type="button"
                        aria-label="View your work"
                        onClick={() => router.push(`/class/${course.id}/work`)}
                        className="cursor-pointer rounded p-2 hover:bg-gray-900/5"
                    >
                        <ClipboardList className="h-5 w-5" />
                    </button>
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-[#3c4043] px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100">
                        View your work
                    </span>
                </div>

                <div className="relative">
                    <button
                        type="button"
                        aria-label="More options"
                        onClick={() => setMenuOpen((v) => !v)}
                        className={`rounded p-2 hover:bg-gray-900/5 ${menuOpen ? "bg-gray-900/10" : ""}`}
                    >
                        <EllipsisVertical className="h-5 w-5" />
                    </button>
                    {menuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                            <div className="absolute bottom-full right-0 z-20 mb-2 w-48 rounded-lg bg-[#e9eef4] py-2 shadow-lg">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        onToggleHide();
                                    }}
                                    className="flex w-full cursor-pointer items-center gap-3 px-5 py-3 text-left text-sm text-gray-900 hover:bg-gray-900/5"
                                >
                                    {isHidden ? <Eye className="h-4 w-4 text-gray-700" /> : <EyeOff className="h-4 w-4 text-gray-700" />}
                                    {isHidden ? "Unhide class" : "Hide class"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </article>
    );
}