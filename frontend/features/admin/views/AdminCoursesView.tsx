"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    BookOpen,
    Tag,
    ArrowRight,
    AlertCircle,
    CheckCircle2,
    Users,
    GraduationCap,
} from "lucide-react";
import type { AdminCourse } from "@/types";
import { DataTable, StatusBadge, ConfirmDialog, ModernDropdown } from "@/components/ui";
import { CourseFormModal } from "../components/CourseFormModal";
import { CategoryFormModal } from "../components/AcademicFormModal";
import { useAuth } from "@/hooks/useAuth";
import {
    getCoursesRequest,
    createCourseRequest,
    updateCourseRequest,
    deleteCourseRequest,
    type CourseDto,
} from "@/lib/api/courses";
import {
    getCategoriesRequest,
    createCategoryRequest,
    updateCategoryRequest,
    deleteCategoryRequest,
    type CategoryDto,
} from "@/lib/api/academics";

function mapCourseDtoToAdminCourse(dto: CourseDto): AdminCourse {
    const iIds = dto.instructorIds ?? dto.teacherIds ?? [];
    const lIds = dto.learnerIds ?? dto.studentIds ?? [];
    return {
        id: dto.id,
        name: dto.name,
        program: dto.program,
        department: dto.department,
        instructorIds: iIds,
        learnerIds: lIds,
        teacherIds: iIds,
        studentIds: lIds,
        session: dto.session,
        isActive: dto.isActive,
    };
}

type CoursesTab = "courses" | "categories";

export function AdminCoursesView() {
    const { user: currentUser } = useAuth();
    const isCoordinator = currentUser?.role === "Coordinator";

    const [activeTab, setActiveTab] = useState<CoursesTab>("courses");
    const [courses, setCourses] = useState<AdminCourse[]>([]);
    const [courseNames, setCourseNames] = useState<Record<number, string[]>>({});
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Courses Tab Filters & Modals
    const [search, setSearch] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("all");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AdminCourse | null>(null);

    // Categories Tab Filters & Modals
    const [categorySearch, setCategorySearch] = useState("");
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);
    const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<CategoryDto | null>(null);

    const flashSuccess = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(null), 3500);
    };

    const loadAllData = useCallback(async () => {
        try {
            setError(null);
            const [dtos, cats] = await Promise.all([
                getCoursesRequest(),
                getCategoriesRequest().catch(() => []),
            ]);
            setCourses(dtos.map(mapCourseDtoToAdminCourse));
            setCategories(cats);

            const names: Record<number, string[]> = {};
            for (const d of dtos) {
                names[d.id] = d.instructorNames ?? d.teacherNames ?? [];
            }
            setCourseNames(names);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load courses data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadAllData();
    }, [loadAllData]);

    const departmentOptions = useMemo(() => {
        const fromCats = categories.map((c) => c.name);
        const fromCourses = courses.map((c) => c.department).filter(Boolean);
        return Array.from(new Set([...fromCats, ...fromCourses])).sort();
    }, [categories, courses]);

    const filteredCourses = useMemo(() => {
        return courses.filter((c) => {
            const instructorNames = (courseNames[c.id] ?? []).join(", ");
            const matchSearch =
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                instructorNames.toLowerCase().includes(search.toLowerCase());
            const matchDept = departmentFilter === "all" || c.department === departmentFilter;
            return matchSearch && matchDept;
        });
    }, [courses, courseNames, search, departmentFilter]);

    const filteredCategories = useMemo(() => {
        const query = categorySearch.toLowerCase().trim();
        if (!query) return categories;
        return categories.filter(
            (c) =>
                c.name.toLowerCase().includes(query) ||
                (c.code && c.code.toLowerCase().includes(query)) ||
                (c.description && c.description.toLowerCase().includes(query)),
        );
    }, [categories, categorySearch]);

    // ── COURSE ACTIONS ─────────────────────────────────────────────────────
    const handleSaveCourse = async (data: Omit<AdminCourse, "id">) => {
        try {
            setError(null);
            const instIds = data.instructorIds ?? data.teacherIds ?? [];
            const lrnIds = data.learnerIds ?? data.studentIds ?? [];
            const payload = {
                name: data.name,
                subject: "",
                program: data.program,
                department: data.department,
                session: data.session,
                isActive: data.isActive,
                instructorIds: instIds,
                learnerIds: lrnIds,
                teacherIds: instIds,
                studentIds: lrnIds,
            };
            if (editingCourse) {
                await updateCourseRequest(editingCourse.id, payload);
                flashSuccess(`Course "${data.name}" updated successfully.`);
            } else {
                await createCourseRequest(payload);
                flashSuccess(`Course "${data.name}" created successfully.`);
            }
            setModalOpen(false);
            setEditingCourse(null);
            await loadAllData();
            if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("coursedesk:courses-updated"));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save course.");
        }
    };

    const handleDeleteCourse = async () => {
        if (!deleteTarget) return;
        try {
            setError(null);
            await deleteCourseRequest(deleteTarget.id);
            flashSuccess(`Course "${deleteTarget.name}" deleted.`);
            setDeleteTarget(null);
            await loadAllData();
            if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("coursedesk:courses-updated"));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete course.");
            setDeleteTarget(null);
        }
    };

    // ── CATEGORY ACTIONS ───────────────────────────────────────────────────
    const handleSaveCategory = async (data: { name: string; code?: string; description?: string }) => {
        try {
            setError(null);
            if (editingCategory) {
                await updateCategoryRequest(editingCategory.id, data);
                flashSuccess(`Category "${data.name}" updated successfully.`);
            } else {
                await createCategoryRequest(data);
                flashSuccess(`Category "${data.name}" created successfully.`);
            }
            setCategoryModalOpen(false);
            setEditingCategory(null);
            await loadAllData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save category.");
        }
    };

    const handleDeleteCategory = async () => {
        if (!deleteCategoryTarget) return;
        try {
            setError(null);
            await deleteCategoryRequest(deleteCategoryTarget.id);
            flashSuccess(`Category "${deleteCategoryTarget.name}" deleted.`);
            setDeleteCategoryTarget(null);
            await loadAllData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete category.");
            setDeleteCategoryTarget(null);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-9 w-9 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
                    <p className="text-sm font-medium text-slate-500">Loading courses and categories...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-8 space-y-6">
            {/* Feedback Notifications */}
            {error && (
                <div className="flex items-center gap-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-5 py-3.5 text-sm text-red-700 dark:text-red-300 shadow-sm animate-in fade-in">
                    <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                    <span className="font-medium">{error}</span>
                </div>
            )}
            {successMessage && (
                <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-5 py-3.5 text-sm text-emerald-700 dark:text-emerald-300 shadow-sm animate-in fade-in">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                    <span className="font-medium">{successMessage}</span>
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Courses &amp; Categories
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Manage course curricula, schedules, and organize academic domain categories.
                    </p>
                </div>

                {!isCoordinator && (
                    <div className="flex items-center gap-2">
                        {activeTab === "courses" ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingCourse(null);
                                    setModalOpen(true);
                                }}
                                className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all"
                            >
                                <Plus className="h-4 w-4" />
                                Add Course
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingCategory(null);
                                    setCategoryModalOpen(true);
                                }}
                                className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all"
                            >
                                <Plus className="h-4 w-4" />
                                Add Category
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Segmented Tab Navigation */}
            <div className="border-b border-slate-200 dark:border-slate-800">
                <nav className="flex items-center gap-4 sm:gap-8">
                    <button
                        type="button"
                        onClick={() => setActiveTab("courses")}
                        className={`group relative flex cursor-pointer items-center gap-2.5 pb-3.5 pt-1 text-sm font-semibold transition-all ${
                            activeTab === "courses"
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                        }`}
                    >
                        <span
                            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                                activeTab === "courses"
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                            }`}
                        >
                            <BookOpen className="h-3.5 w-3.5" />
                        </span>
                        <span>Courses</span>
                        <span className="text-xs font-normal text-slate-400">({courses.length})</span>
                        {activeTab === "courses" && (
                            <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-t-full bg-blue-600 dark:bg-blue-500" />
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("categories")}
                        className={`group relative flex cursor-pointer items-center gap-2.5 pb-3.5 pt-1 text-sm font-semibold transition-all ${
                            activeTab === "categories"
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                        }`}
                    >
                        <span
                            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                                activeTab === "categories"
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                            }`}
                        >
                            <Tag className="h-3.5 w-3.5" />
                        </span>
                        <span>Categories</span>
                        <span className="text-xs font-normal text-slate-400">({categories.length})</span>
                        {activeTab === "categories" && (
                            <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-t-full bg-blue-600 dark:bg-blue-500" />
                        )}
                    </button>
                </nav>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                TAB 1: COURSES MANAGEMENT
               ══════════════════════════════════════════════════════════════════ */}
            {activeTab === "courses" && (
                <div className="space-y-6">
                    {/* Filters Toolbar */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-xs">
                        <div className="relative max-w-sm flex-1">
                            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search courses or instructors..."
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <ModernDropdown
                                value={departmentFilter}
                                onChange={setDepartmentFilter}
                                options={[
                                    { value: "all", label: "All Categories" },
                                    ...departmentOptions.map((d) => ({ value: d, label: d })),
                                ]}
                                size="md"
                                buttonClassName="w-full sm:w-56 rounded-xl"
                            />
                        </div>
                    </div>

                    {/* Courses DataTable */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
                        <DataTable
                            columns={[
                                { key: "name", header: "Course Title" },
                                {
                                    key: "department",
                                    header: "Category",
                                    render: (c: AdminCourse) => (
                                        <span className="inline-block rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            {c.department || "General"}
                                        </span>
                                    ),
                                },
                                {
                                    key: "instructors",
                                    header: "Instructors",
                                    render: (c: AdminCourse) => {
                                        const names = (courseNames[c.id] ?? []).join(", ");
                                        return names ? (
                                            <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100" title={names}>
                                                {names}
                                            </span>
                                        ) : (
                                            <span className="text-xs italic text-amber-600 dark:text-amber-400 font-medium">
                                                ⚠️ Not allotted
                                            </span>
                                        );
                                    },
                                },
                                {
                                    key: "learners",
                                    header: "Learners",
                                    className: "text-center",
                                    render: (c: AdminCourse) => (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                                            <GraduationCap className="h-3.5 w-3.5" />
                                            {(c.learnerIds ?? c.studentIds ?? []).length}
                                        </span>
                                    ),
                                },
                                {
                                    key: "isActive",
                                    header: "Status",
                                    render: (c: AdminCourse) => <StatusBadge status={c.isActive ? "Active" : "Inactive"} />,
                                },
                                {
                                    key: "actions",
                                    header: "Actions",
                                    className: "text-right",
                                    render: (c: AdminCourse) => (
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                type="button"
                                                title={isCoordinator ? "Assign Users" : "Edit Course"}
                                                onClick={() => {
                                                    setEditingCourse(c);
                                                    setModalOpen(true);
                                                }}
                                                className="cursor-pointer rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            {!isCoordinator && (
                                                <button
                                                    type="button"
                                                    title="Delete Course"
                                                    onClick={() => setDeleteTarget(c)}
                                                    className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    ),
                                },
                            ]}
                            data={filteredCourses}
                            keyExtractor={(c) => c.id}
                            emptyMessage="No courses match your filters."
                        />
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                TAB 2: CATEGORIES MANAGEMENT
               ══════════════════════════════════════════════════════════════════ */}
            {activeTab === "categories" && (
                <div className="space-y-6">
                    {/* Categories Toolbar */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-xs">
                        <div className="relative max-w-md flex-1">
                            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={categorySearch}
                                onChange={(e) => setCategorySearch(e.target.value)}
                                placeholder="Search categories by name, code, or description..."
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    {/* Category Cards Grid */}
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredCategories.map((cat) => {
                            const matchingCourses = courses.filter(
                                (c) => c.department === cat.name || c.department === cat.code,
                            );
                            return (
                                <div
                                    key={cat.id}
                                    className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700/60 transition-all"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                {cat.code ? (
                                                    <span className="inline-block rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/50 dark:border-blue-900/50 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                                                        {cat.code}
                                                    </span>
                                                ) : (
                                                    <span className="inline-block rounded-xl bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                                                        CAT #{cat.id}
                                                    </span>
                                                )}
                                                <span className="inline-block rounded-xl bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                    {matchingCourses.length}{" "}
                                                    {matchingCourses.length === 1 ? "Course" : "Courses"}
                                                </span>
                                            </div>
                                            {!isCoordinator && (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        title="Edit Category"
                                                        onClick={() => {
                                                            setEditingCategory(cat);
                                                            setCategoryModalOpen(true);
                                                        }}
                                                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        title="Delete Category"
                                                        onClick={() => setDeleteCategoryTarget(cat)}
                                                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
                                            {cat.name}
                                        </h3>
                                        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                                            {cat.description || "No description provided for this academic domain."}
                                        </p>

                                        {/* Associated Courses Mini-Chips */}
                                        {matchingCourses.length > 0 && (
                                            <div className="mt-4 space-y-1.5">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    Courses in this domain:
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {matchingCourses.slice(0, 4).map((c) => (
                                                        <button
                                                            key={c.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setDepartmentFilter(c.department || "all");
                                                                setActiveTab("courses");
                                                            }}
                                                            className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/60 dark:hover:text-blue-300 transition-colors border border-slate-200/60 dark:border-slate-700/60"
                                                        >
                                                            <span>{c.name}</span>
                                                        </button>
                                                    ))}
                                                    {matchingCourses.length > 4 && (
                                                        <span className="text-[11px] text-slate-400 px-1 py-0.5">
                                                            +{matchingCourses.length - 4} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                                        <span>Domain #{cat.id}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDepartmentFilter(cat.name);
                                                setActiveTab("courses");
                                            }}
                                            className="text-blue-600 hover:underline dark:text-blue-400 font-semibold inline-flex items-center gap-1 cursor-pointer"
                                        >
                                            <span>View Courses ({matchingCourses.length})</span>
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {filteredCategories.length === 0 && (
                        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 py-16 text-center">
                            <Tag className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
                            <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                                No categories found
                            </h4>
                            <p className="mt-1 text-sm text-slate-500">
                                {categorySearch ? "Try adjusting your search query." : "Add your first curriculum category."}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Course Form Modal */}
            <CourseFormModal
                open={modalOpen}
                course={editingCourse}
                isCoordinator={isCoordinator}
                onSave={handleSaveCourse}
                onClose={() => {
                    setModalOpen(false);
                    setEditingCourse(null);
                }}
            />

            {/* Confirm Course Delete Dialog */}
            <ConfirmDialog
                open={!!deleteTarget}
                title="Delete Course"
                message={`Are you sure you want to delete "${deleteTarget?.name}"? All associated assignments will be affected.`}
                confirmLabel="Delete Course"
                variant="danger"
                onConfirm={handleDeleteCourse}
                onCancel={() => setDeleteTarget(null)}
            />

            {/* Category Form Modal */}
            <CategoryFormModal
                open={categoryModalOpen}
                item={editingCategory}
                onSave={handleSaveCategory}
                onClose={() => {
                    setCategoryModalOpen(false);
                    setEditingCategory(null);
                }}
            />

            {/* Confirm Category Delete Dialog */}
            <ConfirmDialog
                open={!!deleteCategoryTarget}
                title="Delete Category"
                message={`Are you sure you want to delete "${deleteCategoryTarget?.name}"? Courses in this category will become uncategorized.`}
                confirmLabel="Delete Category"
                variant="danger"
                onConfirm={handleDeleteCategory}
                onCancel={() => setDeleteCategoryTarget(null)}
            />
        </div>
    );
}