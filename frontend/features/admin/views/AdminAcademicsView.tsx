"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    Tag,
    UserCheck,
    Users,
    GraduationCap,
    BookOpen,
    Check,
    X,
    UserPlus,
    UserMinus,
    AlertCircle,
    Layers,
    ExternalLink,
} from "lucide-react";
import { DataTable, ConfirmDialog, ModernDropdown } from "@/components/ui";
import { CategoryFormModal } from "../components/AcademicFormModal";
import {
    getCategoriesRequest,
    createCategoryRequest,
    updateCategoryRequest,
    deleteCategoryRequest,
    type CategoryDto,
} from "@/lib/api/academics";
import {
    getCoursesRequest,
    setCourseInstructorsRequest,
    batchUpdateCourseLearnersRequest,
    type CourseDto,
} from "@/lib/api/courses";
import { getUsersRequest, type UserDto } from "@/lib/api/users";
import { resolveAvatarUrl, initialOf } from "@/lib/utils/format";
import { avatarClassFor } from "@/lib/utils/theme";

type ActiveTab = "categories" | "instructors" | "learners";

const TABS: { id: ActiveTab; label: string; icon: React.ReactNode; desc: string }[] = [
    {
        id: "categories",
        label: "Categories",
        icon: <Tag className="h-4 w-4" />,
        desc: "Classify and organize courses into domains",
    },
    {
        id: "instructors",
        label: "Instructor Allotment",
        icon: <UserCheck className="h-4 w-4" />,
        desc: "Visual assignment of instructors to courses",
    },
    {
        id: "learners",
        label: "Learner Allotment",
        icon: <GraduationCap className="h-4 w-4" />,
        desc: "Visual enrollment and roster management",
    },
];

export function AdminAcademicsView() {
    const [activeTab, setActiveTab] = useState<ActiveTab>("categories");
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [courses, setCourses] = useState<CourseDto[]>([]);
    const [users, setUsers] = useState<UserDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Selected Course for Allotment Tabs
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

    // Category Tab States
    const [categorySearch, setCategorySearch] = useState("");
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);
    const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<CategoryDto | null>(null);

    // Allotment Tab Filters & Searches
    const [courseFilterSearch, setCourseFilterSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");

    // Instructor Tab States
    const [instructorSearch, setInstructorSearch] = useState("");
    const [selectedInstructorToAdd, setSelectedInstructorToAdd] = useState<number | "">("");

    // Learner Tab States
    const [enrolledLearnerSearch, setEnrolledLearnerSearch] = useState("");
    const [selectedEnrolledIds, setSelectedEnrolledIds] = useState<number[]>([]);
    const [enrollModalOpen, setEnrollModalOpen] = useState(false);
    const [enrollModalSearch, setEnrollModalSearch] = useState("");
    const [learnersToEnroll, setLearnersToEnroll] = useState<number[]>([]);

    const flashSuccess = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(null), 3500);
    };

    const loadAll = useCallback(async () => {
        try {
            setError(null);
            const [cats, crss, usrs] = await Promise.all([
                getCategoriesRequest(),
                getCoursesRequest(),
                getUsersRequest().catch(() => []),
            ]);
            setCategories(cats);
            setCourses(crss);
            setUsers(usrs);

            if (crss.length > 0 && selectedCourseId === null) {
                setSelectedCourseId(crss[0].id);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load academic data.");
        } finally {
            setLoading(false);
        }
    }, [selectedCourseId]);

    useEffect(() => {
        void loadAll();
    }, [loadAll]);

    // Active selected course
    const selectedCourse = useMemo(() => {
        return courses.find((c) => c.id === selectedCourseId) || courses[0] || null;
    }, [courses, selectedCourseId]);

    // Active Instructors & Learners lists
    const allInstructors = useMemo(() => {
        return users.filter((u) => (u.role === "Instructor" || u.role === "Teacher") && u.isActive);
    }, [users]);

    const allLearners = useMemo(() => {
        return users.filter((u) => (u.role === "Learner" || u.role === "Student") && u.isActive);
    }, [users]);

    // Filtered categories
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

    // Filtered courses for allotment left panel
    const filteredCourses = useMemo(() => {
        return courses.filter((c) => {
            const matchSearch =
                !courseFilterSearch ||
                c.name.toLowerCase().includes(courseFilterSearch.toLowerCase()) ||
                (c.subject && c.subject.toLowerCase().includes(courseFilterSearch.toLowerCase()));
            const matchCategory =
                categoryFilter === "all" ||
                c.department === categoryFilter ||
                categories.find((cat) => cat.id.toString() === categoryFilter)?.name === c.department ||
                categories.find((cat) => cat.id.toString() === categoryFilter)?.code === c.department;
            return matchSearch && matchCategory;
        });
    }, [courses, courseFilterSearch, categoryFilter, categories]);

    // Category CRUD
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
            await loadAll();
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
            await loadAll();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete category.");
            setDeleteCategoryTarget(null);
        }
    };

    // ── INSTRUCTOR ALLOTMENT HANDLERS ──────────────────────────────────────
    const currentCourseInstructors = useMemo(() => {
        if (!selectedCourse) return [];
        const ids = selectedCourse.instructorIds ?? selectedCourse.teacherIds ?? [];
        return users.filter((u) => ids.includes(u.id));
    }, [selectedCourse, users]);

    const availableInstructorsToAllot = useMemo(() => {
        if (!selectedCourse) return [];
        const currentIds = selectedCourse.instructorIds ?? selectedCourse.teacherIds ?? [];
        return allInstructors.filter(
            (ins) =>
                !currentIds.includes(ins.id) &&
                (ins.name.toLowerCase().includes(instructorSearch.toLowerCase()) ||
                    ins.email.toLowerCase().includes(instructorSearch.toLowerCase())),
        );
    }, [selectedCourse, allInstructors, instructorSearch]);

    const handleAssignInstructor = async (instructorId: number) => {
        if (!selectedCourse) return;
        const currentIds = selectedCourse.instructorIds ?? selectedCourse.teacherIds ?? [];
        if (currentIds.includes(instructorId)) return;
        const nextIds = [...currentIds, instructorId];
        try {
            setError(null);
            const updated = await setCourseInstructorsRequest(selectedCourse.id, nextIds);
            setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            setSelectedInstructorToAdd("");
            flashSuccess("Instructor assigned successfully.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to assign instructor.");
        }
    };

    const handleUnassignInstructor = async (instructorId: number) => {
        if (!selectedCourse) return;
        const currentIds = selectedCourse.instructorIds ?? selectedCourse.teacherIds ?? [];
        const nextIds = currentIds.filter((id) => id !== instructorId);
        try {
            setError(null);
            const updated = await setCourseInstructorsRequest(selectedCourse.id, nextIds);
            setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            flashSuccess("Instructor removed from course.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to unassign instructor.");
        }
    };

    // ── LEARNER ALLOTMENT HANDLERS ─────────────────────────────────────────
    const currentCourseLearners = useMemo(() => {
        if (!selectedCourse) return [];
        const ids = selectedCourse.learnerIds ?? selectedCourse.studentIds ?? [];
        return users.filter((u) => ids.includes(u.id));
    }, [selectedCourse, users]);

    const filteredEnrolledLearners = useMemo(() => {
        const query = enrolledLearnerSearch.toLowerCase().trim();
        if (!query) return currentCourseLearners;
        return currentCourseLearners.filter((l) => {
            const studentId = l.learnerDetails?.learnerId || l.studentDetails?.studentId || "";
            return (
                l.name.toLowerCase().includes(query) ||
                l.email.toLowerCase().includes(query) ||
                studentId.toLowerCase().includes(query)
            );
        });
    }, [currentCourseLearners, enrolledLearnerSearch]);

    const availableLearnersToEnroll = useMemo(() => {
        if (!selectedCourse) return [];
        const currentIds = selectedCourse.learnerIds ?? selectedCourse.studentIds ?? [];
        const query = enrollModalSearch.toLowerCase().trim();
        return allLearners.filter((l) => {
            if (currentIds.includes(l.id)) return false;
            if (!query) return true;
            const studentId = l.learnerDetails?.learnerId || l.studentDetails?.studentId || "";
            return (
                l.name.toLowerCase().includes(query) ||
                l.email.toLowerCase().includes(query) ||
                studentId.toLowerCase().includes(query)
            );
        });
    }, [selectedCourse, allLearners, enrollModalSearch]);

    const handleBatchEnroll = async () => {
        if (!selectedCourse || learnersToEnroll.length === 0) return;
        try {
            setError(null);
            const updated = await batchUpdateCourseLearnersRequest(
                selectedCourse.id,
                learnersToEnroll,
                [],
            );
            setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            flashSuccess(`Enrolled ${learnersToEnroll.length} learners successfully.`);
            setEnrollModalOpen(false);
            setLearnersToEnroll([]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to enroll learners.");
        }
    };

    const handleUnenrollSingleLearner = async (learnerId: number) => {
        if (!selectedCourse) return;
        try {
            setError(null);
            const updated = await batchUpdateCourseLearnersRequest(
                selectedCourse.id,
                [],
                [learnerId],
            );
            setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            setSelectedEnrolledIds((prev) => prev.filter((id) => id !== learnerId));
            flashSuccess("Learner unenrolled.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to unenroll learner.");
        }
    };

    const handleBatchUnenrollSelected = async () => {
        if (!selectedCourse || selectedEnrolledIds.length === 0) return;
        try {
            setError(null);
            const updated = await batchUpdateCourseLearnersRequest(
                selectedCourse.id,
                [],
                selectedEnrolledIds,
            );
            setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            flashSuccess(`Unenrolled ${selectedEnrolledIds.length} learners.`);
            setSelectedEnrolledIds([]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to unenroll learners.");
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-9 w-9 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
                    <p className="text-sm text-slate-500">Loading course allocations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-[1300px] px-4 py-8 sm:px-8">
            {/* Feedback notifications */}
            {error && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-5 py-3.5 text-sm text-red-700 dark:text-red-300">
                    <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                    <span>{error}</span>
                </div>
            )}
            {successMessage && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-5 py-3.5 text-sm text-emerald-700 dark:text-emerald-300 animate-in fade-in">
                    <Check className="h-5 w-5 shrink-0 text-emerald-500" />
                    <span>{successMessage}</span>
                </div>
            )}

            {/* Page Header with Stats */}
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Course Allocations &amp; Categories
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Manage course taxonomy, instructor staffing, and learner rosters in one place.
                    </p>
                </div>

                {/* Quick Stats Pill Bar */}
                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                        <Tag className="h-3.5 w-3.5 text-blue-500" />
                        <span>{categories.length} Categories</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                        <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                        <span>{courses.length} Courses</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                        <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                        <span>{allInstructors.length} Instructors</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                        <GraduationCap className="h-3.5 w-3.5 text-violet-500" />
                        <span>{allLearners.length} Learners</span>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mt-6 border-b border-slate-200 dark:border-slate-800">
                <nav className="flex items-center gap-2 sm:gap-6">
                    {TABS.map((tab) => {
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative flex cursor-pointer items-center gap-2.5 px-3 py-3.5 text-sm font-semibold transition-all ${
                                    active
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                                }`}
                            >
                                <span className={`p-1 rounded-lg ${active ? "bg-blue-50 dark:bg-blue-950/60" : ""}`}>
                                    {tab.icon}
                                </span>
                                <span>{tab.label}</span>
                                {active && (
                                    <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-t-full bg-blue-600 dark:bg-blue-500" />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                TAB 1: CATEGORIES
               ══════════════════════════════════════════════════════════════════ */}
            {activeTab === "categories" && (
                <div className="mt-6 space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative max-w-md flex-1">
                            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={categorySearch}
                                onChange={(e) => setCategorySearch(e.target.value)}
                                placeholder="Search categories by name, code, or description..."
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setEditingCategory(null);
                                setCategoryModalOpen(true);
                            }}
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all"
                        >
                            <Plus className="h-4 w-4" />
                            Add Category
                        </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredCategories.map((cat) => (
                            <div
                                key={cat.id}
                                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800/60 transition-all"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            {cat.code && (
                                                <span className="inline-block rounded-lg bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                                                    {cat.code}
                                                </span>
                                            )}
                                            <span className="inline-block rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                {cat.courseCount ?? 0} {cat.courseCount === 1 ? "Course" : "Courses"}
                                            </span>
                                        </div>
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
                                    </div>

                                    <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100">
                                        {cat.name}
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                                        {cat.description || "No description provided for this category."}
                                    </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                                    <span>ID: #{cat.id}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCategoryFilter(cat.name);
                                            setActiveTab("instructors");
                                        }}
                                        className="text-blue-600 hover:underline dark:text-blue-400 font-medium inline-flex items-center gap-1 cursor-pointer"
                                    >
                                        View Allotments →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredCategories.length === 0 && (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 py-16 text-center">
                            <Tag className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
                            <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                                No categories found
                            </h4>
                            <p className="mt-1 text-sm text-slate-500">
                                {categorySearch ? "Try adjusting your search criteria" : "Get started by adding your first course category."}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                TAB 2: INSTRUCTOR ALLOTMENT (SPLIT-PANE)
               ══════════════════════════════════════════════════════════════════ */}
            {activeTab === "instructors" && (
                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left Panel: Course Directory */}
                    <div className="lg:col-span-4 xl:col-span-4 space-y-3">
                        <div className="flex flex-col gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={courseFilterSearch}
                                    onChange={(e) => setCourseFilterSearch(e.target.value)}
                                    placeholder="Filter courses..."
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                            >
                                <option value="all">All Categories</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.name}>
                                        {c.name} {c.code ? `(${c.code})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                            {filteredCourses.map((c) => {
                                const isSelected = selectedCourse?.id === c.id;
                                const insIds = c.instructorIds ?? c.teacherIds ?? [];
                                const count = insIds.length;
                                return (
                                    <div
                                        key={c.id}
                                        onClick={() => setSelectedCourseId(c.id)}
                                        className={`group cursor-pointer rounded-xl border p-3.5 transition-all ${
                                            isSelected
                                                ? "border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/30 shadow-sm ring-1 ring-blue-500/20"
                                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                                {c.department || "General"}
                                            </span>
                                            {count === 0 ? (
                                                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                                                    Unassigned
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                                    {count} {count === 1 ? "Instructor" : "Instructors"}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                                            {c.name}
                                        </h4>
                                    </div>
                                );
                            })}
                            {filteredCourses.length === 0 && (
                                <p className="text-center text-xs text-slate-400 py-6">No matching courses.</p>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Instructor Assignment Details */}
                    <div className="lg:col-span-8 xl:col-span-8">
                        {selectedCourse ? (
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                                <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                                {selectedCourse.department || "No Category"}
                                            </span>
                                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                                {selectedCourse.name}
                                            </h2>
                                        </div>
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                                            <UserCheck className="h-3.5 w-3.5 text-blue-500" />
                                            {currentCourseInstructors.length} Assigned
                                        </span>
                                    </div>
                                </div>

                                {/* Active Assigned Instructors Cards */}
                                <div className="mt-6">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                                        Assigned Instructors
                                    </h3>

                                    {currentCourseInstructors.length === 0 ? (
                                        <div className="mt-3 flex flex-col items-center justify-center rounded-xl border border-dashed border-amber-300 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/10 p-6 text-center">
                                            <UserCheck className="h-8 w-8 text-amber-500 mb-2" />
                                            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                                                No instructors allotted to this course yet.
                                            </p>
                                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                                                Select an instructor below to assign them.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                            {currentCourseInstructors.map((ins) => {
                                                const avatarUrl = resolveAvatarUrl(ins.avatar);
                                                const initial = initialOf(ins.name);
                                                return (
                                                    <div
                                                        key={ins.id}
                                                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3.5 shadow-xs"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            {avatarUrl ? (
                                                                <img
                                                                    src={avatarUrl}
                                                                    alt={ins.name}
                                                                    className="h-10 w-10 rounded-full object-cover shrink-0"
                                                                />
                                                            ) : (
                                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                                                                    {initial}
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                                    {ins.name}
                                                                </p>
                                                                <p className="text-xs text-slate-500 truncate">
                                                                    {ins.email}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUnassignInstructor(ins.id)}
                                                            className="cursor-pointer shrink-0 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                                                            title="Unassign instructor"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                            Remove
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Assign New Instructor Section */}
                                <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
                                        Allot Additional Instructor
                                    </h3>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <select
                                            value={selectedInstructorToAdd}
                                            onChange={(e) =>
                                                setSelectedInstructorToAdd(
                                                    e.target.value ? Number(e.target.value) : "",
                                                )
                                            }
                                            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-2.5 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="">Choose an instructor to allot...</option>
                                            {availableInstructorsToAllot.map((ins) => (
                                                <option key={ins.id} value={ins.id}>
                                                    {ins.name} ({ins.email})
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            disabled={!selectedInstructorToAdd}
                                            onClick={() => {
                                                if (typeof selectedInstructorToAdd === "number") {
                                                    handleAssignInstructor(selectedInstructorToAdd);
                                                }
                                            }}
                                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <UserPlus className="h-4 w-4" />
                                            Assign to Course
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                                <p className="text-sm text-slate-400">Select a course to manage instructors.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                TAB 3: LEARNER ALLOTMENT (SPLIT-PANE ROSTER)
               ══════════════════════════════════════════════════════════════════ */}
            {activeTab === "learners" && (
                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left Panel: Course Directory */}
                    <div className="lg:col-span-4 xl:col-span-4 space-y-3">
                        <div className="flex flex-col gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={courseFilterSearch}
                                    onChange={(e) => setCourseFilterSearch(e.target.value)}
                                    placeholder="Filter courses..."
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                            >
                                <option value="all">All Categories</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.name}>
                                        {c.name} {c.code ? `(${c.code})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                            {filteredCourses.map((c) => {
                                const isSelected = selectedCourse?.id === c.id;
                                const lCount = (c.learnerIds ?? c.studentIds ?? []).length;
                                return (
                                    <div
                                        key={c.id}
                                        onClick={() => {
                                            setSelectedCourseId(c.id);
                                            setSelectedEnrolledIds([]);
                                        }}
                                        className={`group cursor-pointer rounded-xl border p-3.5 transition-all ${
                                            isSelected
                                                ? "border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/30 shadow-sm ring-1 ring-blue-500/20"
                                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                                {c.department || "General"}
                                            </span>
                                            <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                                                {lCount} Enrolled
                                            </span>
                                        </div>
                                        <h4 className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                                            {c.name}
                                        </h4>
                                    </div>
                                );
                            })}
                            {filteredCourses.length === 0 && (
                                <p className="text-center text-xs text-slate-400 py-6">No matching courses.</p>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Learner Roster & Enrollment Workspace */}
                    <div className="lg:col-span-8 xl:col-span-8">
                        {selectedCourse ? (
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                                {/* Header */}
                                <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div>
                                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                                {selectedCourse.department || "No Category"}
                                            </span>
                                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                                {selectedCourse.name}
                                            </h2>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setLearnersToEnroll([]);
                                                    setEnrollModalSearch("");
                                                    setEnrollModalOpen(true);
                                                }}
                                                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all"
                                            >
                                                <UserPlus className="h-4 w-4" />
                                                Enroll Learners
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Action & Search Bar */}
                                <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="relative max-w-sm flex-1">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={enrolledLearnerSearch}
                                            onChange={(e) => setEnrolledLearnerSearch(e.target.value)}
                                            placeholder="Search enrolled learners by name or email..."
                                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    {selectedEnrolledIds.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleBatchUnenrollSelected}
                                            className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900 px-3.5 py-2 text-xs font-semibold hover:bg-red-100 transition-colors"
                                        >
                                            <UserMinus className="h-4 w-4" />
                                            Unenroll Selected ({selectedEnrolledIds.length})
                                        </button>
                                    )}
                                </div>

                                {/* Enrolled Roster */}
                                <div className="mt-4">
                                    {currentCourseLearners.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 py-12 text-center">
                                            <GraduationCap className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                No learners currently enrolled in this course.
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Click &ldquo;Enroll Learners&rdquo; to add students.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                                    <tr>
                                                        <th className="p-3 w-10 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    filteredEnrolledLearners.length > 0 &&
                                                                    filteredEnrolledLearners.every((l) =>
                                                                        selectedEnrolledIds.includes(l.id),
                                                                    )
                                                                }
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedEnrolledIds(
                                                                            filteredEnrolledLearners.map((l) => l.id),
                                                                        );
                                                                    } else {
                                                                        setSelectedEnrolledIds([]);
                                                                    }
                                                                }}
                                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                            />
                                                        </th>
                                                        <th className="p-3 font-semibold">Learner Name</th>
                                                        <th className="p-3 font-semibold">Email</th>
                                                        <th className="p-3 font-semibold">Learner ID</th>
                                                        <th className="p-3 font-semibold text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {filteredEnrolledLearners.map((lrn) => {
                                                        const isChecked = selectedEnrolledIds.includes(lrn.id);
                                                        const avatarUrl = resolveAvatarUrl(lrn.avatar);
                                                        const initial = initialOf(lrn.name);
                                                        const lId =
                                                            lrn.learnerDetails?.learnerId ||
                                                            lrn.studentDetails?.studentId ||
                                                            "-";
                                                        return (
                                                            <tr
                                                                key={lrn.id}
                                                                className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                                                                    isChecked
                                                                        ? "bg-blue-50/40 dark:bg-blue-950/20"
                                                                        : ""
                                                                }`}
                                                            >
                                                                <td className="p-3 text-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        onChange={(e) => {
                                                                            if (e.target.checked) {
                                                                                setSelectedEnrolledIds((prev) => [
                                                                                    ...prev,
                                                                                    lrn.id,
                                                                                ]);
                                                                            } else {
                                                                                setSelectedEnrolledIds((prev) =>
                                                                                    prev.filter((id) => id !== lrn.id),
                                                                                );
                                                                            }
                                                                        }}
                                                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                                    />
                                                                </td>
                                                                <td className="p-3">
                                                                    <div className="flex items-center gap-2.5">
                                                                        {avatarUrl ? (
                                                                            <img
                                                                                src={avatarUrl}
                                                                                alt={lrn.name}
                                                                                className="h-7 w-7 rounded-full object-cover shrink-0"
                                                                            />
                                                                        ) : (
                                                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                                                                                {initial}
                                                                            </div>
                                                                        )}
                                                                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                                                                            {lrn.name}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-3 text-slate-500 dark:text-slate-400">
                                                                    {lrn.email}
                                                                </td>
                                                                <td className="p-3">
                                                                    <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                                                                        {lId}
                                                                    </span>
                                                                </td>
                                                                <td className="p-3 text-right">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleUnenrollSingleLearner(lrn.id)
                                                                        }
                                                                        className="cursor-pointer text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                                                                    >
                                                                        Unenroll
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                                <p className="text-sm text-slate-400">Select a course to view enrolled learners.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                MODAL: ENROLL LEARNERS
               ══════════════════════════════════════════════════════════════════ */}
            {enrollModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                    Enroll Learners into &ldquo;{selectedCourse?.name}&rdquo;
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Select learners from directory to enroll into this course.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEnrollModalOpen(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={enrollModalSearch}
                                    onChange={(e) => setEnrollModalSearch(e.target.value)}
                                    placeholder="Search by name, email, or student ID..."
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (learnersToEnroll.length === availableLearnersToEnroll.length) {
                                        setLearnersToEnroll([]);
                                    } else {
                                        setLearnersToEnroll(availableLearnersToEnroll.map((l) => l.id));
                                    }
                                }}
                                className="cursor-pointer text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                            >
                                {learnersToEnroll.length === availableLearnersToEnroll.length
                                    ? "Deselect All"
                                    : "Select All"}
                            </button>
                        </div>

                        <div className="mt-4 max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800">
                            {availableLearnersToEnroll.length === 0 ? (
                                <p className="p-8 text-center text-xs text-slate-400">
                                    No available learners found to enroll.
                                </p>
                            ) : (
                                availableLearnersToEnroll.map((lrn) => {
                                    const isSelected = learnersToEnroll.includes(lrn.id);
                                    const avatarUrl = resolveAvatarUrl(lrn.avatar);
                                    const initial = initialOf(lrn.name);
                                    const lId =
                                        lrn.learnerDetails?.learnerId ||
                                        lrn.studentDetails?.studentId ||
                                        "";
                                    return (
                                        <div
                                            key={lrn.id}
                                            onClick={() => {
                                                if (isSelected) {
                                                    setLearnersToEnroll((prev) =>
                                                        prev.filter((id) => id !== lrn.id),
                                                    );
                                                } else {
                                                    setLearnersToEnroll((prev) => [...prev, lrn.id]);
                                                }
                                            }}
                                            className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                                                isSelected
                                                    ? "bg-blue-50/60 dark:bg-blue-950/40"
                                                    : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => {}} // handled by parent div onClick
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                                {avatarUrl ? (
                                                    <img
                                                        src={avatarUrl}
                                                        alt={lrn.name}
                                                        className="h-8 w-8 rounded-full object-cover shrink-0"
                                                    />
                                                ) : (
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                                                        {initial}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                                        {lrn.name}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400">{lrn.email}</p>
                                                </div>
                                            </div>
                                            {lId && (
                                                <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                                    {lId}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="mt-5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                            <span className="text-xs text-slate-500 font-medium">
                                {learnersToEnroll.length} selected
                            </span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEnrollModalOpen(false)}
                                    className="cursor-pointer rounded-xl px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={learnersToEnroll.length === 0}
                                    onClick={handleBatchEnroll}
                                    className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Check className="h-4 w-4" />
                                    Enroll Selected ({learnersToEnroll.length})
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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