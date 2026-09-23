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
import { avatarClassFor, emojiFor, headerColorFor } from "@/lib/utils/theme";
import { initialOf } from "@/lib/utils/format";
import type { HomeCourse } from "@/types";

type SortMode = "custom" | "alphabetical";

interface CoursesLayout {
    order: number[];
    hiddenIds: number[];
    sort: SortMode;
}

const STORAGE_KEY = "coursedesk.courses.layout.v1";

function defaultLayout(ids: number[]): CoursesLayout {
    return { order: ids, hiddenIds: [], sort: "custom" };
}

function loadLayout(ids: number[]): CoursesLayout {
    const fallback = defaultLayout(ids);
    if (typeof window === "undefined") return fallback;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw) as Partial<CoursesLayout>;
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

function mapCourseToHomeCourse(c: CourseDto): HomeCourse {
    const rawNames =
        c.instructorNames && c.instructorNames.length > 0
            ? c.instructorNames
            : c.teacherNames && c.teacherNames.length > 0
            ? c.teacherNames
            : [c.instructorName, c.teacherName];

    const uniqueNames = Array.from(
        new Set(rawNames.map((n) => n?.trim()).filter((n): n is string => Boolean(n)))
    );

    const displayName = uniqueNames.length > 0 ? uniqueNames.join(", ") : "No instructor assigned";

    return {
        id: c.id,
        name: c.name,
        subject: c.subject || c.program,
        instructorId: c.instructorId ?? c.teacherId ?? 0,
        instructorName: displayName,
        instructorIds: c.instructorIds ?? c.teacherIds ?? [],
        instructorNames: uniqueNames,
        teacherId: c.teacherId ?? c.instructorId ?? 0,
        teacherName: displayName,
        teacherIds: c.teacherIds ?? c.instructorIds ?? [],
        teacherNames: uniqueNames,
        learnerCount: c.learnerCount ?? c.studentCount,
        studentCount: c.studentCount ?? c.learnerCount,
        headerColor: headerColorFor(c.id),
        emoji: emojiFor(c.id),
        instructorAvatarClass: avatarClassFor(c.id),
        teacherAvatarClass: avatarClassFor(c.id),
    };
}

export function CoursesSection() {
    const [homeCourses, setHomeCourses] = useState<HomeCourse[]>([]);
    const [layout, setLayout] = useState<CoursesLayout>(() => defaultLayout([]));
    const [hydrated, setHydrated] = useState(false);
    const [hiddenOpen, setHiddenOpen] = useState(true);
    const [draggingId, setDraggingId] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Fetch the user's courses, then restore the persisted layout.
    useEffect(() => {
        let cancelled = false;
        const load = () => {
            getMyCoursesRequest()
                .then((dtos) => {
                    if (cancelled) return;
                    const mapped = dtos.map(mapCourseToHomeCourse);
                    setHomeCourses(mapped);
                    setLayout(loadLayout(mapped.map((c) => c.id)));
                    setHydrated(true);
                })
                .catch(() => {
                    if (!cancelled) {
                        setHomeCourses([]);
                        setHydrated(true);
                    }
                });
        };

        load();
        window.addEventListener("coursedesk:courses-updated", load);
        return () => {
            cancelled = true;
            window.removeEventListener("coursedesk:courses-updated", load);
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

    const visibleCourses = useMemo(() => {
        const ordered = layout.order
            .map((id) => homeCourses.find((c) => c.id === id))
            .filter((c): c is HomeCourse => c !== undefined && !hiddenSet.has(c.id));
        if (layout.sort === "alphabetical") {
            return [...ordered].sort((a, b) => a.name.localeCompare(b.name));
        }
        return ordered;
    }, [homeCourses, layout.order, layout.sort, hiddenSet]);

    const hiddenCourses = useMemo(() => {
        const ordered = layout.order
            .map((id) => homeCourses.find((c) => c.id === id))
            .filter((c): c is HomeCourse => c !== undefined && hiddenSet.has(c.id));
        if (layout.sort === "alphabetical") {
            return [...ordered].sort((a, b) => a.name.localeCompare(b.name));
        }
        return ordered;
    }, [homeCourses, layout.order, layout.sort, hiddenSet]);

    const canDrag = isEditing && layout.sort === "custom";

    const enterEditMode = () => {
        setIsEditing(true);
        setLayout((prev) => (prev.sort === "alphabetical" ? { ...prev, sort: "custom" } : prev));
    };

    const exitEditMode = () => {
        setIsEditing(false);
        setDraggingId(null);
    };

    const hideCourse = (id: number) =>
        setLayout((prev) =>
            prev.hiddenIds.includes(id) ? prev : { ...prev, hiddenIds: [...prev.hiddenIds, id] },
        );

    const unhideCourse = (id: number) =>
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
                <h2 className="text-xl text-gray-800">My Courses</h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="relative">
                        <select
                            aria-label="Sort courses"
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
                            ? "Edit mode: drag cards to rearrange your courses."
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

            {visibleCourses.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-600">
                    {homeCourses.length === 0
                        ? "You are not enrolled in any courses."
                        : "All of your courses are hidden. Expand the Hidden courses section below to unhide them."}
                </p>
            ) : (
                <div
                    className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                >
                    {visibleCourses.map((c) => (
                        <div
                            key={c.id}
                            draggable={canDrag}
                            onDragStart={(e) => handleDragStart(e, c.id)}
                            onDragOver={(e) => handleDragOver(e, c.id)}
                            onDrop={handleDrop}
                            onDragEnd={handleDragEnd}
                            className={`transition-opacity duration-150 ${draggingId === c.id ? "opacity-50" : "opacity-100"}`}
                        >
                            <CourseCard course={c} canDrag={canDrag} onToggleHide={() => hideCourse(c.id)} />
                        </div>
                    ))}
                </div>
            )}

            {hiddenCourses.length > 0 && (
                <div className="mt-6 border-t border-gray-300/60 pt-4">
                    <button
                        type="button"
                        onClick={() => setHiddenOpen((v) => !v)}
                        aria-expanded={hiddenOpen}
                        className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-2 hover:bg-gray-900/5"
                    >
                        <span className="flex items-center gap-3 text-base font-medium text-gray-800">
                            <EyeOff className="h-5 w-5 text-gray-600" />
                            Hidden courses
                            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-300/80 px-1.5 text-xs font-semibold text-gray-700">
                                {hiddenCourses.length}
                            </span>
                        </span>
                        <ChevronDown
                            className={`h-5 w-5 text-gray-700 transition-transform duration-200 ${hiddenOpen ? "rotate-180" : ""}`}
                        />
                    </button>
                    {hiddenOpen && (
                        <div className="mt-4 grid grid-cols-1 gap-5 pb-1 md:grid-cols-2 xl:grid-cols-3">
                            {hiddenCourses.map((c) => (
                                <CourseCard key={c.id} course={c} isHidden onToggleHide={() => unhideCourse(c.id)} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

interface CourseCardProps {
    course: HomeCourse;
    isHidden?: boolean;
    canDrag?: boolean;
    onToggleHide: () => void;
}

export function CourseCard({ course, isHidden = false, canDrag = false, onToggleHide }: CourseCardProps) {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <article
            className={`group/card relative rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md ${isHidden ? "opacity-80" : ""
                }${canDrag ? " cursor-grab active:cursor-grabbing" : ""}`}
        >
            <Link href={`/course/${course.id}`} draggable={false} className="block" title={course.name}>
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
                    <p
                        className="mt-1 truncate text-xs text-white/90"
                        title={course.instructorName ?? course.teacherName ?? "No instructor assigned"}
                    >
                        {course.instructorName ?? course.teacherName ?? "No instructor assigned"}
                    </p>
                    <span
                        title={course.instructorName ?? course.teacherName ?? undefined}
                        className={`absolute -bottom-7 right-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white shadow-md ${course.instructorAvatarClass ?? course.teacherAvatarClass}`}
                    >
                        {initialOf(
                            course.instructorNames?.[0] ??
                            course.teacherNames?.[0] ??
                            course.instructorName ??
                            course.teacherName
                        )}
                        {((course.instructorNames?.length ?? 0) > 1 || (course.teacherNames?.length ?? 0) > 1) && (
                            <span
                                className="absolute -bottom-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-bold text-white shadow ring-2 ring-white"
                                title={`${(course.instructorNames ?? course.teacherNames)?.length} instructors: ${(course.instructorNames ?? course.teacherNames)?.join(", ")}`}
                            >
                                +{((course.instructorNames ?? course.teacherNames)?.length ?? 1) - 1}
                            </span>
                        )}
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
                        onClick={() => router.push(`/course/${course.id}/work`)}
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
                                    {isHidden ? "Unhide course" : "Hide course"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </article>
    );
}

export const ClassesSection = CoursesSection;
export const ClassCard = CourseCard;