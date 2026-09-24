"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import {
    ArrowRight,
    Check,
    ChevronDown,
    ClipboardList,
    EllipsisVertical,
    Eye,
    EyeOff,
    GripVertical,
    Pencil,
    Users,
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
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!menuOpen) return;
        const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("pointerdown", handleOutsideClick);
        return () => {
            document.removeEventListener("pointerdown", handleOutsideClick);
        };
    }, [menuOpen]);

    const instructors =
        course.instructorNames && course.instructorNames.length > 0
            ? course.instructorNames
            : course.teacherNames && course.teacherNames.length > 0
                ? course.teacherNames
                : (course.instructorName ?? course.teacherName ?? "No instructor assigned")
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);

    const instructorText = instructors.join(", ") || "No instructor assigned";
    const studentTotal = course.studentCount ?? course.learnerCount ?? 0;

    const avatarBgColors = [
        course.instructorAvatarClass ?? "bg-blue-600",
        "bg-indigo-600",
        "bg-purple-600",
        "bg-emerald-600",
        "bg-amber-600",
    ];

    return (
        <article
            onClick={() => {
                if (canDrag) return;
                if (menuOpen) {
                    setMenuOpen(false);
                    return;
                }
                router.push(`/course/${course.id}`);
            }}
            className={`group/card relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white transition-all duration-300 ${
                menuOpen ? "shadow-md" : "hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
            } ${isHidden ? "opacity-75 grayscale-[0.2]" : ""}${canDrag ? " cursor-grab active:cursor-grabbing" : ""}`}
        >
            {/* Header Banner */}
            <div
                className="relative flex h-28 flex-col justify-between overflow-hidden px-5 py-3.5"
                style={{
                    background: `linear-gradient(135deg, ${course.headerColor} 0%, ${course.headerColor}e6 100%)`,
                }}
            >
                {/* Decorative ambient orb */}
                <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-xl" />

                {/* Watermark emoji */}
                <span
                    aria-hidden
                    className="pointer-events-none absolute -bottom-1 right-3 select-none text-5xl opacity-20 transition-transform duration-300 group-hover/card:scale-110"
                >
                    {course.emoji}
                </span>

                {/* Top Row: Tag / Category & Menu */}
                <div className="relative z-10 flex items-center justify-between">
                    <span className="inline-flex max-w-[200px] truncate items-center rounded-full border border-white/20 bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-white backdrop-blur-md">
                        {course.subject || "Course"}
                    </span>

                    <div ref={menuRef} className="relative z-20" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            aria-label="More options"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setMenuOpen((v) => !v);
                            }}
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition-all hover:bg-black/35 hover:scale-105 active:scale-95"
                        >
                            <EllipsisVertical className="h-4 w-4" />
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 top-full z-30 mt-1.5 w-44 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setMenuOpen(false);
                                        onToggleHide();
                                    }}
                                    className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
                                >
                                    {isHidden ? (
                                        <Eye className="h-4 w-4 text-slate-500" />
                                    ) : (
                                        <EyeOff className="h-4 w-4 text-slate-500" />
                                    )}
                                    {isHidden ? "Unhide course" : "Hide course"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Drag to reorder indicator */}
                {canDrag && (
                    <div className="pointer-events-none relative z-10 inline-flex w-fit items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                        <GripVertical className="h-3 w-3" />
                        Drag to reorder
                    </div>
                )}
            </div>

            {/* Card Body */}
            <div className="flex flex-1 flex-col justify-between gap-4 p-5">
                <div>
                    <Link
                        href={`/course/${course.id}`}
                        draggable={false}
                        onClick={(e) => e.stopPropagation()}
                        className="group/title block"
                        title={course.name}
                    >
                        <h3 className="truncate text-base font-bold text-slate-900 transition-colors group-hover/title:text-blue-600">
                            {course.name}
                        </h3>
                    </Link>
                </div>

                {/* Instructor Row */}
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2 overflow-hidden shrink-0">
                        {instructors.slice(0, 3).map((name, idx) => (
                            <span
                                key={idx}
                                title={name}
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-white shadow-sm ${avatarBgColors[idx % avatarBgColors.length]
                                    }`}
                            >
                                {initialOf(name)}
                            </span>
                        ))}
                        {instructors.length > 3 && (
                            <span
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700 ring-2 ring-white shadow-sm"
                                title={instructors.slice(3).join(", ")}
                            >
                                +{instructors.length - 3}
                            </span>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                            {instructors.length > 1 ? "Instructors" : "Instructor"}
                        </p>
                        <p className="truncate text-xs font-medium text-slate-700" title={instructorText}>
                            {instructorText}
                        </p>
                    </div>
                </div>

                {/* Meta Stats Row */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        {studentTotal.toLocaleString()} {studentTotal === 1 ? "learner" : "learners"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                    </span>
                </div>
            </div>

            {/* Card Footer Actions */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-5 py-3">
                <button
                    type="button"
                    aria-label="View work"
                    onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/course/${course.id}/work`);
                    }}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 hover:text-slate-900"
                >
                    <ClipboardList className="h-3.5 w-3.5 text-slate-500" />
                    View Work
                </button>
                <Link
                    href={`/course/${course.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow"
                >
                    Enter Course
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/card:translate-x-0.5" />
                </Link>
            </div>
        </article>
    );
}

export const ClassesSection = CoursesSection;
export const ClassCard = CourseCard;