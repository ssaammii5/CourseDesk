"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import {
    ArrowRight,
    BookOpen,
    Check,
    ChevronDown,
    ClipboardList,
    Copy,
    EllipsisVertical,
    Eye,
    EyeOff,
    GripVertical,
    LayoutGrid,
    List,
    Megaphone,
    Pencil,
    Search,
    Users,
    Video,
    X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    getMyCoursesRequest,
    getCoursePreferencesRequest,
    updateCoursePreferencesRequest,
    type CourseDto,
} from "@/lib/api/courses";
import { avatarClassFor, emojiFor, headerColorFor } from "@/lib/utils/theme";
import { initialOf } from "@/lib/utils/format";
import type { HomeCourse } from "@/types";
import { useAuth } from "@/hooks/useAuth";

type SortMode = "custom" | "alphabetical" | "students";
type ViewMode = "grid" | "list";

interface CoursesLayout {
    order: number[];
    hiddenIds: number[];
    sort: SortMode;
    view?: ViewMode;
}

const STORAGE_KEY = "coursedesk.courses.layout.v2";

function defaultLayout(ids: number[]): CoursesLayout {
    return { order: ids, hiddenIds: [], sort: "custom", view: "grid" };
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
            sort: parsed.sort === "alphabetical" || parsed.sort === "students" ? parsed.sort : "custom",
            view: parsed.view === "list" ? "list" : "grid",
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
        meetingUrl: null,
        meetingProvider: "",
        tags: c.tags ?? [],
    };
}

export function CoursesSection() {
    const { user } = useAuth();
    const isInstructor = user?.role === "Instructor" || user?.role === "Admin";

    const [homeCourses, setHomeCourses] = useState<HomeCourse[]>([]);
    const [layout, setLayout] = useState<CoursesLayout>(() => defaultLayout([]));
    const [hydrated, setHydrated] = useState(false);
    const [hiddenOpen, setHiddenOpen] = useState(false);
    const [draggingId, setDraggingId] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>("grid");

    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch user courses and restore layout from backend + local cache
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const [dtos, backendPref] = await Promise.all([
                    getMyCoursesRequest(),
                    getCoursePreferencesRequest().catch(() => null),
                ]);
                if (cancelled) return;
                const mapped = dtos.map(mapCourseToHomeCourse);
                setHomeCourses(mapped);

                const courseIds = mapped.map((c) => c.id);
                const localLayout = loadLayout(courseIds);

                let finalLayout = localLayout;
                if (backendPref) {
                    const knownIds = new Set(courseIds);
                    const backendOrder = Array.isArray(backendPref.courseOrder)
                        ? backendPref.courseOrder.filter((id): id is number => typeof id === "number" && knownIds.has(id))
                        : [];
                    const missingIds = courseIds.filter((id) => !backendOrder.includes(id));
                    const backendHidden = Array.isArray(backendPref.hiddenCourseIds)
                        ? backendPref.hiddenCourseIds.filter((id): id is number => typeof id === "number" && knownIds.has(id))
                        : [];

                    // If backend preferences exist, use them; if empty, fallback to localLayout
                    if (
                        backendOrder.length > 0 ||
                        backendHidden.length > 0 ||
                        backendPref.sortMode !== "custom" ||
                        backendPref.viewMode !== "grid"
                    ) {
                        finalLayout = {
                            order: [...backendOrder, ...missingIds],
                            hiddenIds: backendHidden,
                            sort:
                                backendPref.sortMode === "alphabetical" || backendPref.sortMode === "students"
                                    ? backendPref.sortMode
                                    : "custom",
                            view: backendPref.viewMode === "list" ? "list" : "grid",
                        };
                    } else if (localLayout.hiddenIds.length > 0 || localLayout.order.length > 0) {
                        // Migrate local preferences to backend
                        updateCoursePreferencesRequest({
                            hiddenCourseIds: localLayout.hiddenIds,
                            courseOrder: localLayout.order,
                            sortMode: localLayout.sort,
                            viewMode: localLayout.view ?? "grid",
                        }).catch(() => {});
                    }
                }

                setLayout(finalLayout);
                if (finalLayout.view) setViewMode(finalLayout.view);
                setHydrated(true);
            } catch {
                if (!cancelled) {
                    setHomeCourses([]);
                    setHydrated(true);
                }
            }
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
            window.localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ ...layout, view: viewMode }),
            );
        } catch {
            // Storage unavailable
        }

        // Sync to backend database (debounced to prevent excessive writes during drag & drop)
        if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
        }
        syncTimeoutRef.current = setTimeout(() => {
            updateCoursePreferencesRequest({
                hiddenCourseIds: layout.hiddenIds,
                courseOrder: layout.order,
                sortMode: layout.sort,
                viewMode,
            }).catch(() => {
                // Silently fallback to local storage
            });
        }, 400);

        return () => {
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
        };
    }, [hydrated, layout, viewMode]);

    const hiddenSet = useMemo(() => new Set(layout.hiddenIds), [layout.hiddenIds]);

    const visibleCourses = useMemo(() => {
        let ordered = layout.order
            .map((id) => homeCourses.find((c) => c.id === id))
            .filter((c): c is HomeCourse => c !== undefined && !hiddenSet.has(c.id));

        if (layout.sort === "alphabetical") {
            ordered = [...ordered].sort((a, b) => a.name.localeCompare(b.name));
        } else if (layout.sort === "students") {
            ordered = [...ordered].sort(
                (a, b) => (b.studentCount ?? b.learnerCount ?? 0) - (a.studentCount ?? a.learnerCount ?? 0),
            );
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            return ordered.filter(
                (c) =>
                    c.name.toLowerCase().includes(query) ||
                    (c.subject && c.subject.toLowerCase().includes(query)) ||
                    (c.instructorName && c.instructorName.toLowerCase().includes(query)),
            );
        }

        return ordered;
    }, [homeCourses, layout.order, layout.sort, hiddenSet, searchQuery]);

    const hiddenCourses = useMemo(() => {
        let ordered = layout.order
            .map((id) => homeCourses.find((c) => c.id === id))
            .filter((c): c is HomeCourse => c !== undefined && hiddenSet.has(c.id));

        if (layout.sort === "alphabetical") {
            ordered = [...ordered].sort((a, b) => a.name.localeCompare(b.name));
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            return ordered.filter(
                (c) =>
                    c.name.toLowerCase().includes(query) ||
                    (c.subject && c.subject.toLowerCase().includes(query)) ||
                    (c.instructorName && c.instructorName.toLowerCase().includes(query)),
            );
        }

        return ordered;
    }, [homeCourses, layout.order, layout.sort, hiddenSet, searchQuery]);

    const canDrag = isEditing && layout.sort === "custom" && viewMode === "grid";

    const enterEditMode = () => {
        setIsEditing(true);
        setViewMode("grid");
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
        const sort: SortMode =
            value === "alphabetical" ? "alphabetical" : value === "students" ? "students" : "custom";
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
            <section
                id="courses-section"
                className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
                <div className="flex items-center justify-center py-16">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent dark:border-blue-400" />
                </div>
            </section>
        );
    }

    return (
        <section
            id="courses-section"
            className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all dark:border-slate-800 dark:bg-slate-900 sm:p-7"
        >
            {/* Header row */}
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/60 dark:bg-blue-950/70 dark:text-blue-400">
                        <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {isInstructor ? "Courses You Instruct" : "My Enrolled Courses"}
                            </h2>
                            <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:border-slate-700/60 dark:bg-slate-800 dark:text-slate-200">
                                {visibleCourses.length}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {isInstructor
                                ? "Manage your syllabus, coursework, and live classrooms."
                                : "Access your active classes, coursework, and live sessions."}
                        </p>
                    </div>
                </div>

                {/* Controls: Search, Sort, View, Reorder */}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                    {/* Search filter input */}
                    <div className="relative min-w-[180px] max-w-xs flex-1 sm:w-56 sm:flex-initial">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder="Filter courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-8.5 pr-8 text-xs text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:border-blue-400 dark:focus:bg-slate-800"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {/* View Switcher: Grid vs List */}
                    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/70 p-1 dark:border-slate-700 dark:bg-slate-800">
                        <button
                            type="button"
                            onClick={() => setViewMode("grid")}
                            aria-label="Grid view"
                            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                                viewMode === "grid"
                                    ? "bg-white text-blue-600 shadow-xs dark:bg-slate-700 dark:text-blue-300 dark:shadow-none"
                                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                            }`}
                        >
                            <LayoutGrid className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("list")}
                            aria-label="List view"
                            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                                viewMode === "list"
                                    ? "bg-white text-blue-600 shadow-xs dark:bg-slate-700 dark:text-blue-300 dark:shadow-none"
                                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                            }`}
                        >
                            <List className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative">
                        <select
                            aria-label="Sort courses"
                            value={layout.sort}
                            onChange={(e) => handleSortChange(e.target.value)}
                            className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3.5 pr-8 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-750"
                        >
                            <option value="custom" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100">
                                Custom Order
                            </option>
                            <option value="alphabetical" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100">
                                Alphabetical (A–Z)
                            </option>
                            <option value="students" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100">
                                Most Learners
                            </option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-400" />
                    </div>

                    {/* Drag & Reorder button */}
                    <button
                        type="button"
                        onClick={isEditing ? exitEditMode : enterEditMode}
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all shadow-xs ${
                            isEditing
                                ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-600 dark:text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-750"
                        }`}
                    >
                        {isEditing ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                        <span>{isEditing ? "Done" : "Reorder"}</span>
                    </button>
                </div>
            </div>

            {/* Reorder edit notification banner */}
            {isEditing && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3 dark:border-blue-900/60 dark:bg-blue-950/50">
                    <div className="flex items-center gap-2 text-xs font-medium text-blue-900 dark:text-blue-200">
                        <GripVertical className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span>
                            {canDrag
                                ? "Drag and drop the cards to customize your preferred course layout."
                                : "Switch sorting to \"Custom Order\" and Grid view to drag cards."}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={exitEditMode}
                        className="text-xs font-bold text-blue-700 hover:underline dark:text-blue-400"
                    >
                        Finish Reordering
                    </button>
                </div>
            )}

            {/* Courses Display */}
            {visibleCourses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-500">
                        <BookOpen className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {searchQuery
                            ? `No courses matching "${searchQuery}"`
                            : homeCourses.length === 0
                                ? "You are not enrolled in any courses yet."
                                : "All courses are currently hidden."}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {searchQuery
                            ? "Try searching with a different term."
                            : homeCourses.length === 0
                                ? "Once you are enrolled or assigned courses, they will appear right here."
                                : "Expand the Hidden Courses drawer below to unhide your courses."}
                    </p>
                </div>
            ) : viewMode === "grid" ? (
                /* Grid View */
                <div
                    className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
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
                            className={`h-full transition-all duration-200 ${
                                draggingId === c.id ? "scale-95 opacity-50 ring-2 ring-blue-500 rounded-2xl" : "opacity-100"
                            }`}
                        >
                            <CourseCard
                                course={c}
                                canDrag={canDrag}
                                onToggleHide={() => hideCourse(c.id)}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                /* Compact List View */
                <div className="mt-6 divide-y divide-slate-100 rounded-xl border border-slate-200/80 overflow-hidden dark:divide-slate-800 dark:border-slate-800">
                    {visibleCourses.map((c) => (
                        <CourseListRow
                            key={c.id}
                            course={c}
                            onToggleHide={() => hideCourse(c.id)}
                        />
                    ))}
                </div>
            )}

            {/* Hidden Courses Drawer */}
            {hiddenCourses.length > 0 && (
                <div className="mt-8 border-t border-slate-200/70 pt-5 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={() => setHiddenOpen((v) => !v)}
                        aria-expanded={hiddenOpen}
                        className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                        <span className="flex items-center gap-3 text-sm font-bold text-slate-800 dark:text-slate-200">
                            <EyeOff className="h-4.5 w-4.5 text-slate-500 dark:text-slate-400" />
                            <span>Hidden Courses</span>
                            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:border-slate-700/60 dark:bg-slate-800 dark:text-slate-300">
                                {hiddenCourses.length}
                            </span>
                        </span>
                        <ChevronDown
                            className={`h-4.5 w-4.5 text-slate-500 transition-transform duration-200 ${
                                hiddenOpen ? "rotate-180" : ""
                            }`}
                        />
                    </button>

                    {hiddenOpen && (
                        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {hiddenCourses.map((c) => (
                                <div key={c.id} className="h-full">
                                    <CourseCard
                                        course={c}
                                        isHidden
                                        onToggleHide={() => unhideCourse(c.id)}
                                    />
                                </div>
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

export function CourseCard({
    course,
    isHidden = false,
    canDrag = false,
    onToggleHide,
}: CourseCardProps) {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [copied, setCopied] = useState(false);
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

    const handleCopyLink = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuOpen(false);
        const url = `${window.location.origin}/course/${course.id}`;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

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
            className={`group/card relative flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 ${
                menuOpen
                    ? "shadow-md z-20"
                    : "hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:hover:border-slate-700"
            } ${isHidden ? "opacity-75 grayscale-[0.2]" : ""}${
                canDrag ? " cursor-grab active:cursor-grabbing ring-1 ring-blue-400/50" : ""
            }`}
        >
            {/* Header Banner */}
            <div
                className="relative flex h-28 flex-col justify-between rounded-t-2xl px-5 py-3.5"
                style={{
                    background: `linear-gradient(135deg, ${course.headerColor} 0%, ${course.headerColor}e6 100%)`,
                }}
            >
                {/* Decorative background with clipping */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-t-2xl">
                    {/* Decorative ambient radial orb */}
                    <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/15 blur-xl" />

                    {/* Watermark emoji */}
                    <span
                        aria-hidden
                        className="absolute -bottom-2 right-3 select-none text-5xl opacity-20 transition-transform duration-300 group-hover/card:scale-115"
                    >
                        {course.emoji}
                    </span>
                </div>

                {/* Top Row: Tag / Category & Menu */}
                <div className="relative z-10 flex items-center justify-between">
                    <span className="inline-flex max-w-[200px] truncate items-center rounded-full border border-white/20 bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-white backdrop-blur-md">
                        {course.subject || "Course"}
                    </span>

                    <div ref={menuRef} className="relative z-30" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            aria-label="More options"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setMenuOpen((v) => !v);
                            }}
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-black/35 active:scale-95"
                        >
                            <EllipsisVertical className="h-4 w-4" />
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 top-full z-50 mt-1.5 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-2xl dark:border-slate-700 dark:bg-slate-800 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setMenuOpen(false);
                                        onToggleHide();
                                    }}
                                    className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-left text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-700"
                                >
                                    {isHidden ? (
                                        <Eye className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                                    ) : (
                                        <EyeOff className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                                    )}
                                    {isHidden ? "Unhide Course" : "Hide Course"}
                                </button>

                                <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setMenuOpen(false);
                                        router.push(`/course/${course.id}?tab=coursework`);
                                    }}
                                    className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                                >
                                    <ClipboardList className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                    Coursework
                                </button>

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setMenuOpen(false);
                                        router.push(`/course/${course.id}?tab=stream`);
                                    }}
                                    className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                                >
                                    <Megaphone className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                    Announcements
                                </button>

                                <button
                                    type="button"
                                    onClick={handleCopyLink}
                                    className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                                >
                                    <Copy className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                    {copied ? "Link Copied!" : "Copy Course Link"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Drag to reorder indicator or Live Meeting pill */}
                <div className="relative z-10 flex items-center justify-between">
                    {canDrag ? (
                        <div className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                            <GripVertical className="h-3 w-3" />
                            Drag to reorder
                        </div>
                    ) : course.meetingUrl ? (
                        <a
                            href={course.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs backdrop-blur-sm transition-transform hover:scale-105"
                        >
                            <Video className="h-3 w-3 animate-pulse" />
                            Live Session
                        </a>
                    ) : (
                        <div />
                    )}
                </div>
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
                        <h3 className="truncate text-base font-bold text-slate-900 transition-colors group-hover/title:text-blue-600 dark:text-white dark:group-hover/title:text-blue-400">
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
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-white shadow-xs dark:ring-slate-900 ${
                                    avatarBgColors[idx % avatarBgColors.length]
                                }`}
                            >
                                {initialOf(name)}
                            </span>
                        ))}
                        {instructors.length > 3 && (
                            <span
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700 ring-2 ring-white shadow-xs dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-900"
                                title={instructors.slice(3).join(", ")}
                            >
                                +{instructors.length - 3}
                            </span>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {instructors.length > 1 ? "Instructors" : "Instructor"}
                        </p>
                        <p
                            className="truncate text-xs font-medium text-slate-700 dark:text-slate-300"
                            title={instructorText}
                        >
                            {instructorText}
                        </p>
                    </div>
                </div>

                {/* Meta Stats Row */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                        <Users className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        {studentTotal.toLocaleString()} {studentTotal === 1 ? "learner" : "learners"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                    </span>
                </div>
            </div>

            {/* Card Footer Actions */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-5 py-3 dark:border-slate-800 dark:bg-slate-950/60">
                <button
                    type="button"
                    aria-label="View coursework"
                    onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/course/${course.id}?tab=coursework`);
                    }}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white"
                >
                    <ClipboardList className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    Coursework
                </button>

                <Link
                    href={`/course/${course.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 hover:shadow-sm"
                >
                    Enter Course
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/card:translate-x-0.5" />
                </Link>
            </div>
        </article>
    );
}

interface CourseListRowProps {
    course: HomeCourse;
    onToggleHide: () => void;
}

function CourseListRow({ course, onToggleHide }: CourseListRowProps) {
    const router = useRouter();
    const studentTotal = course.studentCount ?? course.learnerCount ?? 0;

    return (
        <div
            onClick={() => router.push(`/course/${course.id}`)}
            className="group flex cursor-pointer flex-col gap-3 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 sm:flex-row sm:items-center sm:justify-between"
        >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl shadow-xs"
                    style={{
                        background: `linear-gradient(135deg, ${course.headerColor} 0%, ${course.headerColor}dd 100%)`,
                    }}
                >
                    {course.emoji}
                </div>

                <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {course.subject || "Course"}
                        </span>
                        {course.meetingUrl && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-300">
                                <Video className="h-3 w-3" />
                                Live
                            </span>
                        )}
                    </div>
                    <h4 className="truncate text-sm font-bold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                        {course.name}
                    </h4>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {course.instructorName || "No instructor assigned"}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 border-t border-slate-100 sm:border-t-0 sm:pt-0 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Users className="h-3.5 w-3.5" />
                    <span>{studentTotal.toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/course/${course.id}?tab=coursework`);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                        Coursework
                    </button>
                    <Link
                        href={`/course/${course.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                    >
                        <span>Enter</span>
                        <ArrowRight className="h-3 w-3" />
                    </Link>
                    <button
                        type="button"
                        title="Hide course"
                        aria-label="Hide course"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleHide();
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    >
                        <EyeOff className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export const ClassesSection = CoursesSection;
export const ClassCard = CourseCard;