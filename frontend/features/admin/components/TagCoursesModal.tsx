"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Tag, Search, Check, BookOpen } from "lucide-react";
import type { AdminCourse } from "@/types";
import type { TagDto } from "@/lib/api/academics";

interface TagCoursesModalProps {
    open: boolean;
    tag: TagDto | null;
    courses: AdminCourse[];
    onSave: (tagId: number, courseIds: number[]) => Promise<void>;
    onClose: () => void;
}

export function TagCoursesModal({
    open,
    tag,
    courses,
    onSave,
    onClose,
}: TagCoursesModalProps) {
    const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
    const [search, setSearch] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open && tag) {
            const matchingIds = courses
                .filter((c) => c.tags && c.tags.some((t) => t.toLowerCase() === tag.name.toLowerCase()))
                .map((c) => c.id);
            setSelectedCourseIds(matchingIds);
            setSearch("");
        }
    }, [open, tag, courses]);

    const filteredCourses = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return courses;
        return courses.filter(
            (c) =>
                c.name.toLowerCase().includes(query) ||
                (c.department && c.department.toLowerCase().includes(query))
        );
    }, [courses, search]);

    const toggleCourse = (id: number) => {
        setSelectedCourseIds((prev) =>
            prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        const allFilteredIds = filteredCourses.map((c) => c.id);
        setSelectedCourseIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    };

    const handleDeselectAll = () => {
        const filteredSet = new Set(filteredCourses.map((c) => c.id));
        setSelectedCourseIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    };

    const handleSave = async () => {
        if (!tag) return;
        setSaving(true);
        try {
            await onSave(tag.id, selectedCourseIds);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    if (!open || !tag) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl transition-all"
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                            <Tag className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                    Manage Courses for Tag
                                </h2>
                                <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200/50 dark:border-blue-900/50 px-2 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                                    {tag.name}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Select all courses that should have this classification tag.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filter courses..."
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleSelectAll}
                            className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1"
                        >
                            Select All
                        </button>
                        <span className="text-slate-300 dark:text-slate-700">|</span>
                        <button
                            type="button"
                            onClick={handleDeselectAll}
                            className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-2 py-1"
                        >
                            Deselect All
                        </button>
                    </div>
                </div>

                {/* Courses List with Checkboxes */}
                <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80">
                    {filteredCourses.length > 0 ? (
                        filteredCourses.map((c) => {
                            const isChecked = selectedCourseIds.includes(c.id);
                            return (
                                <label
                                    key={c.id}
                                    className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                                        isChecked
                                            ? "bg-blue-50/50 dark:bg-blue-950/20"
                                            : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0 pr-2">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleCourse(c.id)}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <div className="min-w-0">
                                            <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                {c.name}
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                {c.department || "General"}
                                            </p>
                                        </div>
                                    </div>
                                    {isChecked && (
                                        <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                                            <Check className="h-3 w-3 stroke-[2.5]" />
                                            Tagged
                                        </span>
                                    )}
                                </label>
                            );
                        })
                    ) : (
                        <div className="py-10 text-center text-xs text-slate-400">
                            <BookOpen className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-600 mb-1.5" />
                            No courses match your filter.
                        </div>
                    )}
                </div>

                {/* Count summary */}
                <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                    <span>
                        Selected: <strong className="text-slate-900 dark:text-slate-100">{selectedCourseIds.length}</strong> of{" "}
                        {courses.length} courses
                    </span>
                </div>

                {/* Footer */}
                <div className="mt-5 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => void handleSave()}
                        disabled={saving}
                        className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                        <Check className="h-4 w-4 stroke-[2.5]" />
                        <span>{saving ? "Saving..." : "Save Changes"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
