"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Tag, Plus, Check } from "lucide-react";
import type { AdminCourse } from "@/types";
import type { TagDto } from "@/lib/api/academics";

interface CourseTagsModalProps {
    open: boolean;
    course: AdminCourse | null;
    availableTags: TagDto[];
    onSave: (courseId: number, tags: string[]) => Promise<void>;
    onCreateTag?: (tagName: string) => Promise<TagDto | void>;
    onClose: () => void;
}

export function CourseTagsModal({
    open,
    course,
    availableTags,
    onSave,
    onCreateTag,
    onClose,
}: CourseTagsModalProps) {
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [newTagName, setNewTagName] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open && course) {
            setSelectedTags(course.tags ?? []);
            setSearch("");
            setNewTagName("");
        }
    }, [open, course]);

    // Combine tags from availableTags and course's existing tags
    const allKnownTags = useMemo(() => {
        const set = new Set<string>();
        for (const t of availableTags) {
            if (t.name) set.add(t.name);
        }
        for (const t of selectedTags) {
            if (t) set.add(t);
        }
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [availableTags, selectedTags]);

    const filteredTags = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return allKnownTags;
        return allKnownTags.filter((t) => t.toLowerCase().includes(query));
    }, [allKnownTags, search]);

    const toggleTag = (tagName: string) => {
        const clean = tagName.trim().replace(/^#+/, "");
        if (!clean) return;
        setSelectedTags((prev) =>
            prev.some((t) => t.toLowerCase() === clean.toLowerCase())
                ? prev.filter((t) => t.toLowerCase() !== clean.toLowerCase())
                : [...prev, clean]
        );
    };

    const handleCreateAndSelect = async () => {
        const clean = newTagName.trim().replace(/^#+/, "");
        if (!clean) return;
        if (!selectedTags.some((t) => t.toLowerCase() === clean.toLowerCase())) {
            setSelectedTags((prev) => [...prev, clean]);
        }
        if (onCreateTag) {
            await onCreateTag(clean);
        }
        setNewTagName("");
    };

    const handleSave = async () => {
        if (!course) return;
        setSaving(true);
        try {
            await onSave(course.id, selectedTags);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    if (!open || !course) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl transition-all"
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
                            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                Assign Tags
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[280px] sm:max-w-sm">
                                {course.name}
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

                {/* Body */}
                <div className="mt-5 space-y-4">
                    {/* Search / Filter Tags */}
                    <div>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filter existing tags..."
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    {/* Tag Selection Chips */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Available Tags ({selectedTags.length} selected)
                        </label>
                        <div className="max-h-48 overflow-y-auto p-2 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 flex flex-wrap gap-2">
                            {filteredTags.length > 0 ? (
                                filteredTags.map((tagName) => {
                                    const isSelected = selectedTags.some(
                                        (t) => t.toLowerCase() === tagName.toLowerCase()
                                    );
                                    return (
                                        <button
                                            key={tagName}
                                            type="button"
                                            onClick={() => toggleTag(tagName)}
                                            className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                                isSelected
                                                    ? "bg-blue-600 text-white shadow-xs"
                                                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400"
                                            }`}
                                        >
                                            {isSelected && <Check className="h-3 w-3 stroke-[2.5]" />}
                                            <span>{tagName}</span>
                                        </button>
                                    );
                                })
                            ) : (
                                <p className="text-xs text-slate-400 p-2 italic">
                                    No tags match your search.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Add New Tag On The Fly */}
                    <div className="pt-2">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Create New Tag
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        void handleCreateAndSelect();
                                    }
                                }}
                                placeholder="Enter tag name"
                                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <button
                                type="button"
                                onClick={() => void handleCreateAndSelect()}
                                disabled={!newTagName.trim()}
                                className="cursor-pointer inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/60 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Add</span>
                            </button>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">
                            Clear type tag without any &quot;#&quot; prefix.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
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
                        <span>{saving ? "Saving..." : "Save Tags"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
