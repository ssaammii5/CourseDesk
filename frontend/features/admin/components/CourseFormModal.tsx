"use client";

import { useState, useEffect, useRef } from "react";
import type { AdminCourse } from "@/types";
import {
    getCategoriesRequest,
    getTagsRequest,
    createTagRequest,
    type CategoryDto,
    type TagDto,
} from "@/lib/api/academics";
import {
    X,
    ChevronDown,
    Check,
    BookOpen,
    Layers,
    Search,
    Plus,
    Tag,
} from "lucide-react";

interface CourseFormModalProps {
    open: boolean;
    course: AdminCourse | null;
    isCoordinator?: boolean;
    onSave: (data: Omit<AdminCourse, "id">) => void;
    onClose: () => void;
}

export function CourseFormModal({
    open,
    course,
    onSave,
    onClose,
}: CourseFormModalProps) {
    const [name, setName] = useState("");
    const [department, setDepartment] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [availableTags, setAvailableTags] = useState<TagDto[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState("");

    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const tagDropdownRef = useRef<HTMLDivElement>(null);

    // Load available categories and tags
    useEffect(() => {
        if (!open) return;
        let isMounted = true;
        setLoadingCategories(true);

        Promise.all([
            getCategoriesRequest().catch(() => []),
            getTagsRequest().catch(() => []),
        ])
            .then(([cats, tgs]) => {
                if (isMounted) {
                    setCategories(cats);
                    setAvailableTags(tgs);
                }
            })
            .finally(() => {
                if (isMounted) {
                    setLoadingCategories(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [open]);

    // Populate or reset form fields
    useEffect(() => {
        if (!open) return;
        if (course) {
            setName(course.name || "");
            setDepartment(course.department || "");
            setIsActive(course.isActive !== false);
            setSelectedTags(course.tags || []);
        } else {
            setName("");
            setDepartment("");
            setIsActive(true);
            setSelectedTags([]);
        }
        setTagInput("");
        setIsTagDropdownOpen(false);
        setErrors({});
        setIsDropdownOpen(false);
        setCategorySearch("");
    }, [open, course]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
                setIsTagDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Focus category search input when dropdown opens
    useEffect(() => {
        if (isDropdownOpen) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        } else {
            setCategorySearch("");
        }
    }, [isDropdownOpen]);

    if (!open) return null;

    const filteredCategories = categories.filter((cat) => {
        if (!categorySearch.trim()) return true;
        const q = categorySearch.toLowerCase().trim();
        return (
            cat.name.toLowerCase().includes(q) ||
            (cat.code && cat.code.toLowerCase().includes(q))
        );
    });

    const selectedCategory = categories.find((c) => c.name === department);

    // Filter available tags for suggestion dropdown
    const filteredAvailableTags = availableTags.filter((t) => {
        if (!tagInput.trim()) return true;
        return t.name.toLowerCase().includes(tagInput.trim().toLowerCase());
    });

    const toggleTag = (tagName: string) => {
        const clean = tagName.trim().replace(/^#+/, "");
        if (!clean) return;
        setSelectedTags((prev) =>
            prev.some((t) => t.toLowerCase() === clean.toLowerCase())
                ? prev.filter((t) => t.toLowerCase() !== clean.toLowerCase())
                : [...prev, clean]
        );
    };

    const removeTag = (tagName: string) => {
        setSelectedTags((prev) =>
            prev.filter((t) => t.toLowerCase() !== tagName.toLowerCase())
        );
    };

    const handleAddCustomTag = () => {
        const clean = tagInput.trim().replace(/^#+/, "");
        if (!clean) return;
        if (!selectedTags.some((t) => t.toLowerCase() === clean.toLowerCase())) {
            setSelectedTags((prev) => [...prev, clean]);
        }
        // Save to global catalog in background if not already present
        if (!availableTags.some((t) => t.name.toLowerCase() === clean.toLowerCase())) {
            createTagRequest({ name: clean })
                .then((newTag) => {
                    setAvailableTags((prev) => [...prev, newTag]);
                })
                .catch(() => {});
        }
        setTagInput("");
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!name.trim()) {
            newErrors.name = "Course title is required.";
        }
        if (!department.trim()) {
            newErrors.department = "Please select a category.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSave({
            name: name.trim(),
            department: department.trim(),
            isActive,
            tags: selectedTags,
            program: course?.program ?? "",
            session: course?.session ?? "",
            instructorIds: course?.instructorIds ?? [],
            learnerIds: course?.learnerIds ?? [],
            teacherIds: course?.teacherIds ?? course?.instructorIds ?? [],
            studentIds: course?.studentIds ?? course?.learnerIds ?? [],
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
        >
            <div
                className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative px-6 pt-6 pb-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 shadow-sm">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {course ? "Edit Course" : "Add New Course"}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {course
                                    ? "Update the details and classification for this course"
                                    : "Fill in the details to create a new course"}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                    {/* 1. Course Title */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Course Title <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (errors.name) {
                                        setErrors((prev) => ({ ...prev, name: "" }));
                                    }
                                }}
                                placeholder="Enter course title..."
                                className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-800/60 border text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 ${
                                    errors.name
                                        ? "border-red-400 dark:border-red-500/60 bg-red-50/20 dark:bg-red-950/10"
                                        : "border-gray-200 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600"
                                }`}
                            />
                        </div>
                        {errors.name && (
                            <p className="text-xs text-red-500 dark:text-red-400 mt-1 font-medium">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* 2. Category Dropdown (Modern) */}
                    <div className="space-y-1.5" ref={dropdownRef}>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Category <span className="text-red-500">*</span>
                        </label>

                        <div className="relative">
                            {/* Modern Dropdown Trigger Button */}
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen((prev) => !prev)}
                                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm border bg-gray-50 dark:bg-gray-800/60 transition-all text-left focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 cursor-pointer ${
                                    errors.department
                                        ? "border-red-400 dark:border-red-500/60 bg-red-50/20 dark:bg-red-950/10"
                                        : isDropdownOpen
                                        ? "border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20"
                                        : "border-gray-200 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600"
                                }`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-5 h-5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                        <Layers className="w-3 h-3" />
                                    </div>
                                    {department ? (
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {department}
                                            </span>
                                            {selectedCategory?.code && (
                                                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 tracking-wider uppercase">
                                                    {selectedCategory.code}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 dark:text-gray-500">
                                            Select category
                                        </span>
                                    )}
                                </div>
                                <ChevronDown
                                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ml-2 ${
                                        isDropdownOpen ? "rotate-180 text-blue-600" : ""
                                    }`}
                                />
                            </button>

                            {/* Dropdown Popover */}
                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1.5 z-30 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-1.5 animate-in fade-in-50 zoom-in-95 duration-150">
                                    {/* Search Inside Dropdown if categories exist */}
                                    {categories.length > 5 && (
                                        <div className="relative mb-1.5 px-1 pt-0.5">
                                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                ref={searchInputRef}
                                                type="text"
                                                value={categorySearch}
                                                onChange={(e) => setCategorySearch(e.target.value)}
                                                placeholder="Search categories..."
                                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700/80 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                                            />
                                        </div>
                                    )}

                                    {/* Options List */}
                                    <div className="max-h-52 overflow-y-auto space-y-0.5 custom-scrollbar">
                                        {loadingCategories ? (
                                            <div className="py-4 text-center text-xs text-gray-400 dark:text-gray-500">
                                                Loading categories...
                                            </div>
                                        ) : filteredCategories.length === 0 ? (
                                            <div className="py-4 text-center text-xs text-gray-400 dark:text-gray-500">
                                                {categorySearch
                                                    ? "No categories match your search"
                                                    : "No categories available"}
                                            </div>
                                        ) : (
                                            filteredCategories.map((cat) => {
                                                const isSelected = department === cat.name;
                                                return (
                                                    <button
                                                        key={cat.id || cat.name}
                                                        type="button"
                                                        onClick={() => {
                                                            setDepartment(cat.name);
                                                            setIsDropdownOpen(false);
                                                            if (errors.department) {
                                                                setErrors((prev) => ({
                                                                    ...prev,
                                                                    department: "",
                                                                }));
                                                            }
                                                        }}
                                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                                                            isSelected
                                                                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold"
                                                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/70"
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span className="truncate">{cat.name}</span>
                                                            {cat.code && (
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase">
                                                                    {cat.code}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {isSelected && (
                                                            <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                                        )}
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {errors.department && (
                            <p className="text-xs text-red-500 dark:text-red-400 mt-1 font-medium">
                                {errors.department}
                            </p>
                        )}
                    </div>

                    {/* 3. Course Tags */}
                    <div className="space-y-1.5" ref={tagDropdownRef}>
                        <div className="flex items-center justify-between">
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Tags <span className="text-gray-400 font-normal lowercase">(optional)</span>
                            </label>
                            {selectedTags.length > 0 && (
                                <span className="text-[11px] text-gray-400">
                                    {selectedTags.length} selected
                                </span>
                            )}
                        </div>

                        {/* Selected Tags Display */}
                        {selectedTags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                                {selectedTags.map((t) => (
                                    <span
                                        key={t}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50 animate-in fade-in"
                                    >
                                        <span>{t}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeTag(t)}
                                            className="text-blue-400 hover:text-blue-700 dark:hover:text-blue-200 cursor-pointer"
                                            aria-label={`Remove tag ${t}`}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Tag Input & Suggestions */}
                        <div className="relative">
                            <div className="flex items-center gap-1.5">
                                <div className="relative flex-1">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 flex items-center justify-center pointer-events-none">
                                        <Tag className="w-3.5 h-3.5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => {
                                            setTagInput(e.target.value);
                                            if (!isTagDropdownOpen) setIsTagDropdownOpen(true);
                                        }}
                                        onFocus={() => setIsTagDropdownOpen(true)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAddCustomTag();
                                            }
                                        }}
                                        placeholder="Enter tags..."
                                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddCustomTag}
                                    disabled={!tagInput.trim()}
                                    className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/60 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 shrink-0"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add
                                </button>
                            </div>

                            {/* Tag Suggestions Dropdown */}
                            {isTagDropdownOpen && availableTags.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1.5 z-30 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-2 animate-in fade-in-50 zoom-in-95 duration-150">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1">
                                        Suggested Tags:
                                    </p>
                                    <div className="max-h-40 overflow-y-auto flex flex-wrap gap-1.5 p-1 custom-scrollbar">
                                        {filteredAvailableTags.map((t) => {
                                            const isSelected = selectedTags.some(
                                                (st) => st.toLowerCase() === t.name.toLowerCase()
                                            );
                                            return (
                                                <button
                                                    key={t.id || t.name}
                                                    type="button"
                                                    onClick={() => toggleTag(t.name)}
                                                    className={`cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                                        isSelected
                                                            ? "bg-blue-600 text-white font-semibold shadow-xs"
                                                            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50"
                                                    }`}
                                                >
                                                    {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                                                    <span>{t.name}</span>
                                                </button>
                                            );
                                        })}
                                        {filteredAvailableTags.length === 0 && (
                                            <p className="text-xs text-gray-400 p-2 italic">
                                                No matching existing tags. Press &quot;Add&quot; to create &quot;{tagInput.trim()}&quot;.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 4. Active Course Toggle */}
                    <div className="pt-1">
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                            <div>
                                <label
                                    htmlFor="course-active-toggle"
                                    className="text-xs font-semibold text-gray-800 dark:text-gray-200 cursor-pointer block"
                                >
                                    Active Course
                                </label>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                    {isActive
                                        ? "Course is active and accessible for teaching and learning"
                                        : "Course is archived/hidden from active catalogs"}
                                </p>
                            </div>
                            <button
                                type="button"
                                id="course-active-toggle"
                                role="switch"
                                aria-checked={isActive}
                                onClick={() => setIsActive((prev) => !prev)}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                                    isActive
                                        ? "bg-emerald-500 dark:bg-emerald-600"
                                        : "bg-gray-200 dark:bg-gray-700"
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                        isActive ? "translate-x-5" : "translate-x-0"
                                    }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            {course ? (
                                <Check className="w-4 h-4 stroke-[2.5]" />
                            ) : (
                                <Plus className="w-4 h-4 stroke-[2.5]" />
                            )}
                            {course ? "Update Course" : "Create Course"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}