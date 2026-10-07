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
    AlertCircle,
    Layers,
    ExternalLink,
    ShieldAlert,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    Briefcase,
    Calendar,
    Award,
    Filter,
} from "lucide-react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ui";
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

type MainTab = "studio" | "categories";
type QuickCourseFilter = "all" | "needs-faculty" | "empty-roster" | "active";

const TABS: { id: MainTab; label: string; icon: React.ReactNode; desc: string }[] = [
    {
        id: "studio",
        label: "Course Allocation",
        icon: <Layers className="h-4 w-4" />,
        desc: "Unified faculty staffing & student enrollment per course",
    },
    {
        id: "categories",
        label: "Categories",
        icon: <Tag className="h-4 w-4" />,
        desc: "Organize courses into domains and subject tracks",
    },
];

export function AdminAcademicsView() {
    const [activeTab, setActiveTab] = useState<MainTab>("studio");
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [courses, setCourses] = useState<CourseDto[]>([]);
    const [users, setUsers] = useState<UserDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Selected Course for Studio
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

    // Category Tab States
    const [categorySearch, setCategorySearch] = useState("");
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);
    const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<CategoryDto | null>(null);

    // Studio Left Panel Filters
    const [courseSearch, setCourseSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [quickFilter, setQuickFilter] = useState<QuickCourseFilter>("all");

    // Studio Right Panel - Instructor Allotment Modal
    const [allotInstructorsModalOpen, setAllotInstructorsModalOpen] = useState(false);
    const [allotInstructorsSearch, setAllotInstructorsSearch] = useState("");
    const [instructorsToAllot, setInstructorsToAllot] = useState<number[]>([]);

    // Studio Right Panel - Learner Search & Batch Roster
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

    // All active instructors & learners
    const allInstructors = useMemo(() => {
        return users.filter((u) => (u.role === "Instructor" || u.role === "Teacher") && u.isActive);
    }, [users]);

    const allLearners = useMemo(() => {
        return users.filter((u) => (u.role === "Learner" || u.role === "Student") && u.isActive);
    }, [users]);

    // Workload calculation for instructors (how many courses each instructor is teaching)
    const instructorWorkloadMap = useMemo(() => {
        const map = new Map<number, number>();
        for (const c of courses) {
            const insIds = c.instructorIds ?? c.teacherIds ?? [];
            for (const id of insIds) {
                map.set(id, (map.get(id) ?? 0) + 1);
            }
        }
        return map;
    }, [courses]);

    // Filtered courses for Studio
    const filteredCourses = useMemo(() => {
        return courses.filter((c) => {
            const matchSearch =
                !courseSearch ||
                c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
                (c.subject && c.subject.toLowerCase().includes(courseSearch.toLowerCase()));

            const matchCat =
                categoryFilter === "all" ||
                c.department === categoryFilter ||
                categories.find((cat) => cat.id.toString() === categoryFilter)?.name === c.department ||
                categories.find((cat) => cat.id.toString() === categoryFilter)?.code === c.department;

            const insCount = (c.instructorIds ?? c.teacherIds ?? []).length;
            const lrnCount = (c.learnerIds ?? c.studentIds ?? []).length;

            let matchQuick = true;
            if (quickFilter === "needs-faculty") matchQuick = insCount === 0;
            else if (quickFilter === "empty-roster") matchQuick = lrnCount === 0;
            else if (quickFilter === "active") matchQuick = c.isActive;

            return matchSearch && matchCat && matchQuick;
        });
    }, [courses, courseSearch, categoryFilter, categories, quickFilter]);

    // Urgent stats
    const coursesNeedingFacultyCount = useMemo(() => {
        return courses.filter((c) => (c.instructorIds ?? c.teacherIds ?? []).length === 0).length;
    }, [courses]);

    const coursesEmptyRosterCount = useMemo(() => {
        return courses.filter((c) => (c.learnerIds ?? c.studentIds ?? []).length === 0).length;
    }, [courses]);

    const totalEnrollmentsCount = useMemo(() => {
        return courses.reduce((sum, c) => sum + (c.learnerIds ?? c.studentIds ?? []).length, 0);
    }, [courses]);

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

    // ── INSTRUCTOR ALLOTMENT ACTIONS ───────────────────────────────────────
    const currentCourseInstructors = useMemo(() => {
        if (!selectedCourse) return [];
        const ids = selectedCourse.instructorIds ?? selectedCourse.teacherIds ?? [];
        return users.filter((u) => ids.includes(u.id));
    }, [selectedCourse, users]);

    const availableInstructorsToAllot = useMemo(() => {
        if (!selectedCourse) return [];
        const currentIds = selectedCourse.instructorIds ?? selectedCourse.teacherIds ?? [];
        const query = allotInstructorsSearch.toLowerCase().trim();
        return allInstructors.filter((ins) => {
            if (currentIds.includes(ins.id)) return false;
            if (!query) return true;
            return (
                ins.name.toLowerCase().includes(query) ||
                ins.email.toLowerCase().includes(query)
            );
        });
    }, [selectedCourse, allInstructors, allotInstructorsSearch]);

    const handleBatchAllotInstructors = async () => {
        if (!selectedCourse || instructorsToAllot.length === 0) return;
        const currentIds = selectedCourse.instructorIds ?? selectedCourse.teacherIds ?? [];
        const nextIds = Array.from(new Set([...currentIds, ...instructorsToAllot]));
        try {
            setError(null);
            const updated = await setCourseInstructorsRequest(selectedCourse.id, nextIds);
            setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            flashSuccess(
                `Successfully allotted ${instructorsToAllot.length} instructor${instructorsToAllot.length > 1 ? "s" : ""} to course.`,
            );
            setAllotInstructorsModalOpen(false);
            setInstructorsToAllot([]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to allot instructors.");
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

    // ── LEARNER ROSTER ACTIONS ─────────────────────────────────────────────
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
            flashSuccess(`Successfully enrolled ${learnersToEnroll.length} learners.`);
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
                    <div className="h-10 w-10 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
                    <p className="text-sm font-medium text-slate-500">Loading Course Allocation &amp; Categories...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 space-y-8">
            {/* Feedback notifications */}
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

            {/* ══════════════════════════════════════════════════════════════════
                EXECUTIVE KPI & HEADER HERO
               ══════════════════════════════════════════════════════════════════ */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/40 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">
                        <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                        <span>Academic Management Hub</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                        Course Allocation &amp; Categories
                    </h1>
                    <p className="mt-1.5 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl">
                        Comprehensive command center to allot instructors, orchestrate student enrollment rosters, and organize curriculum domains.
                    </p>
                </div>

                {/* 4 Professional KPI Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4 shrink-0">
                    {/* Metric 1: Total Courses */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-3.5 shadow-xs transition-all hover:border-blue-200 dark:hover:border-blue-900">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                            <span className="text-xs font-medium">Courses</span>
                            <BookOpen className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            {courses.length}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-400">
                            {courses.filter((c) => c.isActive).length} active curricula
                        </div>
                    </div>

                    {/* Metric 2: Categories */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-3.5 shadow-xs transition-all hover:border-indigo-200 dark:hover:border-indigo-900">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                            <span className="text-xs font-medium">Categories</span>
                            <Tag className="h-4 w-4 text-indigo-500" />
                        </div>
                        <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            {categories.length}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-400">
                            Curriculum tracks
                        </div>
                    </div>

                    {/* Metric 3: Instructor Staffing Health */}
                    <div
                        onClick={() => {
                            setActiveTab("studio");
                            setQuickFilter(coursesNeedingFacultyCount > 0 ? "needs-faculty" : "all");
                        }}
                        className={`cursor-pointer rounded-2xl border p-3.5 shadow-xs transition-all ${
                            coursesNeedingFacultyCount > 0
                                ? "border-amber-300 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-400"
                                : "border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Staffing Alert</span>
                            <ShieldAlert
                                className={`h-4 w-4 ${
                                    coursesNeedingFacultyCount > 0 ? "text-amber-500" : "text-emerald-500"
                                }`}
                            />
                        </div>
                        <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            {coursesNeedingFacultyCount === 0 ? "100%" : coursesNeedingFacultyCount}
                        </div>
                        <div className="mt-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                            {coursesNeedingFacultyCount === 0 ? "All courses staffed" : "Need instructor allotment"}
                        </div>
                    </div>

                    {/* Metric 4: Total Enrollments */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-3.5 shadow-xs transition-all hover:border-violet-200 dark:hover:border-violet-900">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                            <span className="text-xs font-medium">Enrollments</span>
                            <GraduationCap className="h-4 w-4 text-violet-500" />
                        </div>
                        <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            {totalEnrollmentsCount}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-400">
                            Total student seats
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                PRIMARY SEGMENTED TAB BAR (NO HORIZONTAL SCROLL)
               ══════════════════════════════════════════════════════════════════ */}
            <div className="border-b border-slate-200 dark:border-slate-800">
                <nav className="flex w-full items-center gap-2 sm:gap-6">
                    {TABS.map((tab) => {
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`group relative flex cursor-pointer items-center gap-2.5 pb-3.5 pt-1 text-sm font-semibold transition-all ${
                                    active
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                                }`}
                            >
                                <span
                                    className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                                        active
                                            ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200"
                                    }`}
                                >
                                    {tab.icon}
                                </span>
                                <div>
                                    <span className="text-sm font-bold tracking-tight">{tab.label}</span>
                                    <span className="hidden md:inline-block ml-2 text-xs font-normal text-slate-400">
                                        ({tab.id === "studio" ? `${courses.length} courses` : `${categories.length} categories`})
                                    </span>
                                </div>
                                {active && (
                                    <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-t-full bg-blue-600 dark:bg-blue-500" />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                TAB 1: COURSE ALLOCATION STUDIO
               ══════════════════════════════════════════════════════════════════ */}
            {activeTab === "studio" && (
                <div className="space-y-6">
                    {/* Search & Fast Status Triage Bar */}
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3 sm:p-4 shadow-xs">
                        <div className="flex flex-1 flex-wrap items-center gap-3">
                            {/* Search box with clear button */}
                            <div className="relative min-w-[260px] max-w-md flex-1">
                                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={courseSearch}
                                    onChange={(e) => setCourseSearch(e.target.value)}
                                    placeholder="Search courses by name or subject code..."
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 pl-10 pr-9 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                                {courseSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setCourseSearch("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            {/* Category Filter Select */}
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-slate-400 shrink-0 hidden sm:block" />
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.name}>
                                            {c.name} {c.code ? `(${c.code})` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Status Pills */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                                type="button"
                                onClick={() => setQuickFilter("all")}
                                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                                    quickFilter === "all"
                                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200"
                                }`}
                            >
                                All ({courses.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setQuickFilter("needs-faculty")}
                                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                                    quickFilter === "needs-faculty"
                                        ? "bg-amber-600 text-white shadow-xs"
                                        : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/50 hover:bg-amber-100"
                                }`}
                            >
                                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                <span>Unstaffed ({coursesNeedingFacultyCount})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setQuickFilter("empty-roster")}
                                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                                    quickFilter === "empty-roster"
                                        ? "bg-violet-600 text-white shadow-xs"
                                        : "bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200/80 dark:border-violet-900/50 hover:bg-violet-100"
                                }`}
                            >
                                Empty Roster ({coursesEmptyRosterCount})
                            </button>
                        </div>
                    </div>

                    {/* Master-Detail Split Pane */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        {/* ── Left Column: Course Directory (4 cols) ──────────────── */}
                        <div className="lg:col-span-4 space-y-2.5 max-h-[820px] overflow-y-auto pr-1 custom-scrollbar">
                            <div className="flex items-center justify-between px-1 pb-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <span>Curriculum Courses ({filteredCourses.length})</span>
                                <span className="text-[11px] text-slate-400">Select to Allocate</span>
                            </div>

                            {filteredCourses.map((c) => {
                                const isSelected = selectedCourse?.id === c.id;
                                const insIds = c.instructorIds ?? c.teacherIds ?? [];
                                const insCount = insIds.length;
                                const lrnCount = (c.learnerIds ?? c.studentIds ?? []).length;
                                const courseInstructors = users.filter((u) => insIds.includes(u.id));

                                return (
                                    <div
                                        key={c.id}
                                        onClick={() => {
                                            setSelectedCourseId(c.id);
                                            setSelectedEnrolledIds([]);
                                            setInstructorsToAllot([]);
                                            setAllotInstructorsSearch("");
                                        }}
                                        className={`group relative cursor-pointer rounded-2xl border p-4 transition-all ${
                                            isSelected
                                                ? "border-l-4 border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 shadow-md ring-1 ring-blue-500/20"
                                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-sm"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="truncate rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                    {c.department || "General"}
                                                </span>
                                                {c.subject && (
                                                    <span className="text-[11px] font-mono text-slate-400">
                                                        {c.subject}
                                                    </span>
                                                )}
                                            </div>

                                            {insCount === 0 ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 px-2 py-0.5 text-[10px] font-bold shrink-0">
                                                    ⚠️ Unstaffed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-semibold shrink-0">
                                                    <Check className="h-3 w-3" />
                                                    {insCount} {insCount === 1 ? "Instructor" : "Instructors"}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {c.name}
                                        </h3>

                                        {/* Instructor Avatars stack & Learner count */}
                                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2.5 text-xs text-slate-500">
                                            <div className="flex items-center gap-1.5">
                                                {courseInstructors.length > 0 ? (
                                                    <div className="flex -space-x-1.5 overflow-hidden">
                                                        {courseInstructors.slice(0, 3).map((ins) => {
                                                            const avatar = resolveAvatarUrl(ins.avatar);
                                                            return avatar ? (
                                                                <img
                                                                    key={ins.id}
                                                                    src={avatar}
                                                                    alt={ins.name}
                                                                    className="inline-block h-5 w-5 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover"
                                                                />
                                                            ) : (
                                                                <div
                                                                    key={ins.id}
                                                                    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900"
                                                                >
                                                                    {initialOf(ins.name)}
                                                                </div>
                                                            );
                                                        })}
                                                        {courseInstructors.length > 3 && (
                                                            <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-[9px] font-bold text-slate-600 dark:text-slate-300 ring-2 ring-white dark:ring-slate-900">
                                                                +{courseInstructors.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                                        No instructor
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                                <GraduationCap className="h-3.5 w-3.5 text-violet-500" />
                                                <span>{lrnCount} Students</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {filteredCourses.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-400">
                                    No courses match your filter criteria.
                                </div>
                            )}
                        </div>

                        {/* ── Right Column: Enterprise Allocation Studio (8 cols) ── */}
                        <div className="lg:col-span-8">
                            {selectedCourse ? (
                                <div className="space-y-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm">
                                    {/* Active Course Banner */}
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="inline-block rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/50 dark:border-blue-900/50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                                                    {selectedCourse.department || "General Domain"}
                                                </span>
                                                {selectedCourse.subject && (
                                                    <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300 font-mono">
                                                        {selectedCourse.subject}
                                                    </span>
                                                )}
                                                {selectedCourse.isActive && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                        Active Course
                                                    </span>
                                                )}
                                            </div>
                                            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                                                {selectedCourse.name}
                                            </h2>
                                            {selectedCourse.scheduleNotes && (
                                                <p className="mt-1.5 text-xs sm:text-sm text-slate-500 flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                    <span>{selectedCourse.scheduleNotes}</span>
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <Link
                                                href={`/course/${selectedCourse.id}`}
                                                target="_blank"
                                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
                                            >
                                                <span>Course Workspace</span>
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </Link>
                                        </div>
                                    </div>

                                    {/* ── Coordinated Two-Column Studio: Faculty/Instructors + Students ── */}
                                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                                        {/* ══ Column 1: Instructor Allotment ══ */}
                                        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-5 shadow-xs">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                                                            <UserCheck className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                                                Assigned Instructors
                                                            </h4>
                                                            <p className="text-[11px] text-slate-400">
                                                                {currentCourseInstructors.length}{" "}
                                                                {currentCourseInstructors.length === 1
                                                                    ? "instructor allotted"
                                                                    : "instructors allotted"}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setInstructorsToAllot([]);
                                                            setAllotInstructorsSearch("");
                                                            setAllotInstructorsModalOpen(true);
                                                        }}
                                                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-2xs"
                                                    >
                                                        <UserPlus className="h-3.5 w-3.5" />
                                                        <span>Allot Instructors</span>
                                                    </button>
                                                </div>

                                                {/* Assigned Instructors List */}
                                                <div className="space-y-2">
                                                    {currentCourseInstructors.map((ins) => {
                                                        const avatarUrl = resolveAvatarUrl(ins.avatar);
                                                        const initial = initialOf(ins.name);
                                                        const load = instructorWorkloadMap.get(ins.id) ?? 1;
                                                        return (
                                                            <div
                                                                key={ins.id}
                                                                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-xs hover:border-slate-300 transition-all"
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    {avatarUrl ? (
                                                                        <img
                                                                            src={avatarUrl}
                                                                            alt={ins.name}
                                                                            className="h-9 w-9 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
                                                                        />
                                                                    ) : (
                                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                                                                            {initial}
                                                                        </div>
                                                                    )}
                                                                    <div className="min-w-0">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                                                                {ins.name}
                                                                            </p>
                                                                            <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 px-2 py-0.2 text-[9px] font-bold text-blue-600 dark:text-blue-300">
                                                                                Instructor
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-[11px] text-slate-400 truncate">
                                                                            {ins.email}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    <span className="hidden sm:inline-block rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                                                                        Teaching {load} {load === 1 ? "course" : "courses"}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleUnassignInstructor(ins.id)}
                                                                        className="cursor-pointer rounded-xl p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
                                                                        title="Remove instructor from course"
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}

                                                    {currentCourseInstructors.length === 0 && (
                                                        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-300/80 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 py-8 text-center px-4">
                                                            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2">
                                                                <ShieldAlert className="h-5 w-5" />
                                                            </div>
                                                            <h5 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                                                                No Instructors Allotted
                                                            </h5>
                                                            <p className="text-xs text-amber-700 dark:text-amber-400 max-w-xs mt-1">
                                                                This course is currently unstaffed. Click &quot;Allot Instructors&quot; to assign designated faculty.
                                                            </p>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setInstructorsToAllot([]);
                                                                    setAllotInstructorsSearch("");
                                                                    setAllotInstructorsModalOpen(true);
                                                                }}
                                                                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                                                            >
                                                                <UserPlus className="h-3.5 w-3.5" />
                                                                <span>Allot Instructors</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                                                <span>Workload monitored automatically</span>
                                                <span>{allInstructors.length} registered faculty instructors</span>
                                            </div>
                                        </div>

                                        {/* ══ Column 2: Student Enrollment Roster ══ */}
                                        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-5 shadow-xs">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400">
                                                            <GraduationCap className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                                                Student Roster
                                                            </h4>
                                                            <p className="text-[11px] text-slate-400">
                                                                {currentCourseLearners.length}{" "}
                                                                {currentCourseLearners.length === 1
                                                                    ? "learner enrolled"
                                                                    : "learners enrolled"}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setLearnersToEnroll([]);
                                                            setEnrollModalSearch("");
                                                            setEnrollModalOpen(true);
                                                        }}
                                                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 transition-colors shadow-2xs"
                                                    >
                                                        <UserPlus className="h-3.5 w-3.5" />
                                                        <span>Enroll Learners</span>
                                                    </button>
                                                </div>

                                                {/* Search & Bulk Action Toolbar */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="relative flex-1">
                                                        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                                        <input
                                                            type="text"
                                                            value={enrolledLearnerSearch}
                                                            onChange={(e) => setEnrolledLearnerSearch(e.target.value)}
                                                            placeholder="Filter enrolled students..."
                                                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-1.5 pl-8 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    </div>

                                                    {selectedEnrolledIds.length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={handleBatchUnenrollSelected}
                                                            className="cursor-pointer rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900 px-3 py-1.5 text-xs font-semibold hover:bg-red-100 transition-colors shrink-0 shadow-2xs"
                                                        >
                                                            Unenroll ({selectedEnrolledIds.length})
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Roster Scroll List */}
                                                <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 custom-scrollbar">
                                                    {filteredEnrolledLearners.map((lrn) => {
                                                        const isChecked = selectedEnrolledIds.includes(lrn.id);
                                                        const avatarUrl = resolveAvatarUrl(lrn.avatar);
                                                        const initial = initialOf(lrn.name);
                                                        const lId =
                                                            lrn.learnerDetails?.learnerId ||
                                                            lrn.studentDetails?.studentId ||
                                                            "";
                                                        return (
                                                            <div
                                                                key={lrn.id}
                                                                className={`flex items-center justify-between p-3 transition-colors ${
                                                                    isChecked
                                                                        ? "bg-violet-50/60 dark:bg-violet-950/30"
                                                                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0">
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
                                                                    {avatarUrl ? (
                                                                        <img
                                                                            src={avatarUrl}
                                                                            alt={lrn.name}
                                                                            className="h-8 w-8 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
                                                                        />
                                                                    ) : (
                                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
                                                                            {initial}
                                                                        </div>
                                                                    )}
                                                                    <div className="min-w-0">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                                                                {lrn.name}
                                                                            </p>
                                                                            {lId && (
                                                                                <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-slate-600 dark:text-slate-300">
                                                                                {lId}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-[11px] text-slate-400 truncate">
                                                                            {lrn.email}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleUnenrollSingleLearner(lrn.id)}
                                                                    className="cursor-pointer text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-lg transition-colors shrink-0"
                                                                    title="Unenroll learner"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}

                                                    {filteredEnrolledLearners.length === 0 && (
                                                        <div className="p-8 text-center text-xs text-slate-400">
                                                            {currentCourseLearners.length === 0 ? (
                                                                <div className="space-y-2">
                                                                    <p className="font-medium text-slate-600 dark:text-slate-300">
                                                                        No learners enrolled yet
                                                                    </p>
                                                                    <p className="text-[11px]">
                                                                        Click &quot;Enroll Learners&quot; to assign students to this course.
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                "No students matching your search criteria."
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                                                <span>
                                                    {selectedEnrolledIds.length > 0
                                                        ? `${selectedEnrolledIds.length} selected for batch action`
                                                        : "Multi-select checkboxes enabled"}
                                                </span>
                                                <span>{allLearners.length} registered learners</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-8 text-center">
                                    <BookOpen className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
                                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                                        No Course Selected
                                    </h4>
                                    <p className="mt-1 text-xs text-slate-500 max-w-sm">
                                        Select a course from the directory on the left to begin allotting instructors and enrolling students.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                TAB 2: CATEGORIES DOMAINS
               ══════════════════════════════════════════════════════════════════ */}
            {activeTab === "categories" && (
                <div className="space-y-6">
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
                        <button
                            type="button"
                            onClick={() => {
                                setEditingCategory(null);
                                setCategoryModalOpen(true);
                            }}
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all shrink-0"
                        >
                            <Plus className="h-4 w-4" />
                            Add Category
                        </button>
                    </div>

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
                                                                setSelectedCourseId(c.id);
                                                                setActiveTab("studio");
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
                                                setCategoryFilter(cat.name);
                                                setActiveTab("studio");
                                            }}
                                            className="text-blue-600 hover:underline dark:text-blue-400 font-semibold inline-flex items-center gap-1 cursor-pointer"
                                        >
                                            <span>Manage Allocations</span>
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

            {/* ══════════════════════════════════════════════════════════════════
                MODAL: ALLOT INSTRUCTORS DIRECTORY
               ══════════════════════════════════════════════════════════════════ */}
            {allotInstructorsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                                    Allot Instructors to &ldquo;{selectedCourse?.name}&rdquo;
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Select instructors from directory to allot to this course.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAllotInstructorsModalOpen(false)}
                                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={allotInstructorsSearch}
                                    onChange={(e) => setAllotInstructorsSearch(e.target.value)}
                                    placeholder="Search instructors by name or email..."
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 pl-9 pr-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (instructorsToAllot.length === availableInstructorsToAllot.length) {
                                        setInstructorsToAllot([]);
                                    } else {
                                        setInstructorsToAllot(availableInstructorsToAllot.map((ins) => ins.id));
                                    }
                                }}
                                className="cursor-pointer text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400 shrink-0"
                            >
                                {instructorsToAllot.length === availableInstructorsToAllot.length
                                    ? "Deselect All"
                                    : "Select All Filtered"}
                            </button>
                        </div>

                        <div className="mt-4 max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 custom-scrollbar">
                            {availableInstructorsToAllot.length === 0 ? (
                                <p className="p-8 text-center text-xs text-slate-400">
                                    No available instructors found to allot to this course.
                                </p>
                            ) : (
                                availableInstructorsToAllot.map((ins) => {
                                    const isSelected = instructorsToAllot.includes(ins.id);
                                    const avatarUrl = resolveAvatarUrl(ins.avatar);
                                    const initial = initialOf(ins.name);
                                    const load = instructorWorkloadMap.get(ins.id) ?? 0;
                                    return (
                                        <div
                                            key={ins.id}
                                            onClick={() => {
                                                if (isSelected) {
                                                    setInstructorsToAllot((prev) =>
                                                        prev.filter((id) => id !== ins.id),
                                                    );
                                                } else {
                                                    setInstructorsToAllot((prev) => [...prev, ins.id]);
                                                }
                                            }}
                                            className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                                                isSelected
                                                    ? "bg-blue-50/70 dark:bg-blue-950/40"
                                                    : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => {}}
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                                {avatarUrl ? (
                                                    <img
                                                        src={avatarUrl}
                                                        alt={ins.name}
                                                        className="h-8 w-8 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
                                                    />
                                                ) : (
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                                                        {initial}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                                        {ins.name}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400">{ins.email}</p>
                                                </div>
                                            </div>
                                            <span
                                                className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                                                    load === 0
                                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                                        : load > 3
                                                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                                                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                                }`}
                                            >
                                                {load === 0 ? "Available" : `Teaching ${load} ${load === 1 ? "course" : "courses"}`}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="mt-5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                            <span className="text-xs text-slate-500 font-semibold">
                                {instructorsToAllot.length} selected for allotment
                            </span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setAllotInstructorsModalOpen(false)}
                                    className="cursor-pointer rounded-xl px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={instructorsToAllot.length === 0}
                                    onClick={handleBatchAllotInstructors}
                                    className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <Check className="h-4 w-4" />
                                    Allot Selected ({instructorsToAllot.length})
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                MODAL: ENROLL LEARNERS DIRECTORY
               ══════════════════════════════════════════════════════════════════ */}
            {enrollModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                                    Enroll Learners into &ldquo;{selectedCourse?.name}&rdquo;
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Select learners from directory to enroll into this course roster.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEnrollModalOpen(false)}
                                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 pl-9 pr-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                                className="cursor-pointer text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400 shrink-0"
                            >
                                {learnersToEnroll.length === availableLearnersToEnroll.length
                                    ? "Deselect All"
                                    : "Select All Filtered"}
                            </button>
                        </div>

                        <div className="mt-4 max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 custom-scrollbar">
                            {availableLearnersToEnroll.length === 0 ? (
                                <p className="p-8 text-center text-xs text-slate-400">
                                    No available learners found to enroll in this course.
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
                                                    ? "bg-blue-50/70 dark:bg-blue-950/40"
                                                    : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => {}}
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                                {avatarUrl ? (
                                                    <img
                                                        src={avatarUrl}
                                                        alt={lrn.name}
                                                        className="h-8 w-8 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
                                                    />
                                                ) : (
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                                                        {initial}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
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
                            <span className="text-xs text-slate-500 font-semibold">
                                {learnersToEnroll.length} selected for enrollment
                            </span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEnrollModalOpen(false)}
                                    className="cursor-pointer rounded-xl px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={learnersToEnroll.length === 0}
                                    onClick={handleBatchEnroll}
                                    className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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