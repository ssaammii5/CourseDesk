"use client";

import { useMemo, useState } from "react";
import {
    Award,
    Calendar,
    ChevronDown,
    ChevronUp,
    ChevronsDownUp,
    ChevronsUpDown,
    ClipboardList,
    Clock,
    EllipsisVertical,
    FileText,
    Filter,
    Layers,
    Pencil,
    Plus,
    Search,
    Sparkles,
    Trash2,
    Users,
    X,
    type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { CourseworkEntry } from "@/types";
import type { SubmissionDto } from "@/lib/api/submissions";

const KIND_CONFIG = {
    icon: FileText,
    iconClass:
        "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-800/40",
    label: "Assignment",
    tagClass:
        "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-800/40",
};

type StatusFilter = "all" | "published" | "draft";

function formatDateTime(iso?: string, fallback = ""): string {
    if (!iso) return fallback;
    try {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return fallback;
        const now = new Date();
        const isSameYear = d.getFullYear() === now.getFullYear();

        const dateStr = d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            ...(isSameYear ? {} : { year: "numeric" }),
        });
        const timeStr = d.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
        });
        return `${dateStr}, ${timeStr}`;
    } catch {
        return fallback;
    }
}

export interface InstructorCourseworkViewProps {
    items: CourseworkEntry[];
    onCreate: () => void;
    onEdit: (entry: CourseworkEntry) => void;
    onDelete: (entry: CourseworkEntry) => void;
    courseId?: number;
    submissions?: SubmissionDto[];
}
export type InstructorClassworkViewProps = InstructorCourseworkViewProps;

export function InstructorCourseworkView({
    items,
    onCreate,
    onEdit,
    onDelete,
    courseId,
    submissions = [],
}: InstructorCourseworkViewProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [topicFilter, setTopicFilter] = useState<string>("all");
    const [collapsedTopics, setCollapsedTopics] = useState<ReadonlySet<string>>(new Set());
    const [menuFor, setMenuFor] = useState<number | null>(null);
    const [deletingItem, setDeletingItem] = useState<CourseworkEntry | null>(null);

    // Compute submissions count by assignment
    const submissionStats = useMemo(() => {
        const stats: Record<number, { total: number; turnedIn: number; graded: number }> = {};
        for (const sub of submissions) {
            if (!stats[sub.assignmentId]) {
                stats[sub.assignmentId] = { total: 0, turnedIn: 0, graded: 0 };
            }
            stats[sub.assignmentId].total++;
            if (sub.status === "Graded") {
                stats[sub.assignmentId].graded++;
            } else if (sub.status === "Submitted" || sub.submittedAtUtc) {
                stats[sub.assignmentId].turnedIn++;
            }
        }
        return stats;
    }, [submissions]);

    // Unique topics
    const topics = useMemo(() => {
        const set = new Set<string>();
        for (const item of items) {
            const t = item.topic.trim();
            if (t) set.add(t);
        }
        return Array.from(set).sort();
    }, [items]);

    // Instructor metrics
    const metrics = useMemo(() => {
        let publishedCount = 0;
        let draftCount = 0;
        let totalSubs = 0;

        for (const item of items) {
            if (item.status === "Draft") {
                draftCount++;
            } else {
                publishedCount++;
            }
            const s = submissionStats[item.id];
            if (s) {
                totalSubs += s.total;
            } else if (item.submissionCount) {
                totalSubs += item.submissionCount;
            }
        }

        return {
            total: items.length,
            published: publishedCount,
            drafts: draftCount,
            totalSubmissions: totalSubs,
        };
    }, [items, submissionStats]);

    // Filter items based on search and filters
    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const isDraft = item.status === "Draft";

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = item.title.toLowerCase().includes(q);
                const matchTopic = item.topic.toLowerCase().includes(q);
                const matchDesc = item.description?.toLowerCase().includes(q);
                if (!matchTitle && !matchTopic && !matchDesc) return false;
            }

            // Topic filter
            if (topicFilter !== "all" && item.topic !== topicFilter) return false;

            // Status filter
            if (statusFilter === "published" && isDraft) return false;
            if (statusFilter === "draft" && !isDraft) return false;

            return true;
        });
    }, [items, searchQuery, topicFilter, statusFilter]);

    // Group filtered items by topic
    const visibleGroups = useMemo(() => {
        const map = new Map<string, CourseworkEntry[]>();
        for (const item of filteredItems) {
            const topic = item.topic.trim() || "General Coursework";
            if (!map.has(topic)) map.set(topic, []);
            map.get(topic)!.push(item);
        }
        return Array.from(map.entries()).map(([topic, entries]) => ({
            topic,
            entries,
        }));
    }, [filteredItems]);

    const allCollapsed =
        visibleGroups.length > 0 && visibleGroups.every((g) => collapsedTopics.has(g.topic));

    const toggleTopic = (topic: string) => {
        setCollapsedTopics((prev) => {
            const next = new Set(prev);
            if (next.has(topic)) next.delete(topic);
            else next.add(topic);
            return next;
        });
    };

    const toggleAll = () => {
        setCollapsedTopics(allCollapsed ? new Set() : new Set(visibleGroups.map((g) => g.topic)));
    };

    const hasActiveFilters =
        searchQuery.trim() !== "" ||
        statusFilter !== "all" ||
        topicFilter !== "all";

    const resetFilters = () => {
        setSearchQuery("");
        setStatusFilter("all");
        setTopicFilter("all");
    };

    const handleConfirmDelete = () => {
        if (deletingItem) {
            onDelete(deletingItem);
            setDeletingItem(null);
        }
    };

    return (
        <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-8 space-y-8">
            {/* Top Header Card */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 sm:p-8 shadow-sm">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-transparent blur-3xl pointer-events-none" />
                <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-gradient-to-tr from-purple-500/10 via-pink-500/10 to-transparent blur-3xl pointer-events-none" />

                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40 mb-3">
                            <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                            Instructor Studio
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Coursework Management
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-xl">
                            Publish assignments, organize topics, and review learner submissions.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={onCreate}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 text-sm font-semibold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Create Assignment</span>
                        </button>

                        <button
                            type="button"
                            onClick={toggleAll}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 transition-all shadow-xs"
                        >
                            {allCollapsed ? (
                                <ChevronsUpDown className="h-4 w-4 text-slate-500" />
                            ) : (
                                <ChevronsDownUp className="h-4 w-4 text-slate-500" />
                            )}
                            <span>{allCollapsed ? "Expand all" : "Collapse all"}</span>
                        </button>
                    </div>
                </div>

                {/* KPI Metrics Row */}
                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 p-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Layers className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{metrics.total}</p>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Assignments</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 p-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{metrics.published}</p>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Published</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 p-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{metrics.drafts}</p>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Drafts</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 p-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">
                                {metrics.totalSubmissions}
                            </p>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Submissions</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modern Search & Filters Bar */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-4 shadow-xs">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search assignments or topics..."
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 py-2.5 pl-10 pr-9 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Topic Filter */}
                    <div className="relative">
                        <select
                            value={topicFilter}
                            onChange={(e) => setTopicFilter(e.target.value)}
                            aria-label="Filter by topic"
                            className="appearance-none rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 py-2.5 pl-3.5 pr-9 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                        >
                            <option value="all">All Topics ({items.length})</option>
                            {topics.map((t) => {
                                const count = items.filter((i) => i.topic.trim() === t).length;
                                return (
                                    <option key={t} value={t}>
                                        {t} ({count})
                                    </option>
                                );
                            })}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    </div>

                    {/* Status Filter Pills */}
                    <div className="flex items-center gap-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 p-1 border border-slate-200/60 dark:border-slate-700/60">
                        {(
                            [
                                { id: "all", label: "All" },
                                { id: "published", label: "Published" },
                                { id: "draft", label: "Drafts" },
                            ] as const
                        ).map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setStatusFilter(tab.id)}
                                className={`rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-all ${statusFilter === tab.id
                                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                            <X className="h-3.5 w-3.5" />
                            Clear filters
                        </button>
                    )}
                </div>
            </div>

            {/* Empty State */}
            {visibleGroups.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-12 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
                        <Filter className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {hasActiveFilters ? "No matching coursework found" : "No coursework created yet"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                        {hasActiveFilters
                            ? "Try adjusting your search query or filters to find what you are looking for."
                            : "Create your first assignment to get started."}
                    </p>
                    <div className="mt-5 flex gap-3">
                        {hasActiveFilters ? (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex items-center gap-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 py-2 text-sm font-medium transition-colors"
                            >
                                Reset all filters
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={onCreate}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-sm font-semibold transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Create Coursework
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Topic Groups */}
            <div className="space-y-10">
                {visibleGroups.map((group) => {
                    const collapsed = collapsedTopics.has(group.topic);
                    const totalInTopic = group.entries.length;
                    const draftsInTopic = group.entries.filter((e) => e.status === "Draft").length;

                    return (
                        <section key={group.topic} className="space-y-4">
                            {/* Topic Section Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <span className="h-6 w-1 rounded-full bg-indigo-600 dark:bg-indigo-500 shrink-0" />
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                            {group.topic}
                                        </h2>
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60">
                                            {totalInTopic} {totalInTopic === 1 ? "item" : "items"}
                                        </span>
                                        {draftsInTopic > 0 && (
                                            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-200/50 dark:border-amber-800/50">
                                                {draftsInTopic} {draftsInTopic === 1 ? "draft" : "drafts"}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => toggleTopic(group.topic)}
                                    className="self-start sm:self-auto inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <span>{collapsed ? "Expand topic" : "Collapse"}</span>
                                    <ChevronDown
                                        className={`h-3.5 w-3.5 transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`}
                                    />
                                </button>
                            </div>

                            {/* Topic Items List */}
                            {!collapsed ? (
                                <div className="space-y-3">
                                    {group.entries.map((entry) => {
                                        const config = KIND_CONFIG;
                                        const Icon = config.icon;
                                        const isDraft = entry.status === "Draft";
                                        const stats = submissionStats[entry.id];
                                        const hasSubs = stats && stats.total > 0;

                                        return (
                                            <div
                                                key={entry.id}
                                                className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition-all duration-200"
                                            >
                                                {/* Left Icon and Title */}
                                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                                    <div
                                                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${config.iconClass}`}
                                                    >
                                                        <Icon className="h-5 w-5" />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span
                                                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${config.tagClass}`}
                                                            >
                                                                {config.label}
                                                            </span>

                                                            {isDraft ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40">
                                                                    Draft
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/40">
                                                                    Published
                                                                </span>
                                                            )}

                                                            {entry.maxMarks !== undefined && entry.maxMarks > 0 && (
                                                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                                    <Award className="h-3 w-3" />
                                                                    {entry.maxMarks} pts
                                                                </span>
                                                            )}
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (courseId && !isDraft) {
                                                                    router.push(`/course/${courseId}/assignments/${entry.id}`);
                                                                } else {
                                                                    onEdit(entry);
                                                                }
                                                            }}
                                                            className="mt-1 text-left text-[15px] font-semibold text-slate-900 dark:text-white truncate block hover:text-blue-600 dark:hover:text-blue-400 transition-colors w-full"
                                                        >
                                                            {entry.title}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Right Information & Quick Actions */}
                                                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                                                    {/* Submissions Pill for Instructor */}
                                                    {hasSubs && (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
                                                            <Users className="h-3.5 w-3.5" />
                                                            <span>
                                                                {stats.turnedIn} submitted · {stats.graded} graded
                                                            </span>
                                                        </span>
                                                    )}

                                                    {/* Due Date */}
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        <span>{formatDateTime(entry.deadlineUtc, entry.dueLabel)}</span>
                                                    </span>

                                                    {/* Quick Review action */}
                                                    {courseId && !isDraft && (
                                                        <button
                                                            type="button"
                                                            onClick={() => router.push(`/course/${courseId}/assignments/${entry.id}`)}
                                                            className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/40 px-3.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100/80 dark:hover:bg-blue-900/60 transition-colors"
                                                        >
                                                            <ClipboardList className="h-3.5 w-3.5" />
                                                            <span>Review work</span>
                                                        </button>
                                                    )}

                                                    {/* Kebab menu */}
                                                    <div className="relative shrink-0">
                                                        <button
                                                            type="button"
                                                            aria-label={`More options for ${entry.title}`}
                                                            onClick={() => setMenuFor(menuFor === entry.id ? null : entry.id)}
                                                            className="cursor-pointer rounded-full p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                        >
                                                            <EllipsisVertical className="h-4 w-4" />
                                                        </button>

                                                        {menuFor === entry.id && (
                                                            <>
                                                                <div className="fixed inset-0 z-20" onClick={() => setMenuFor(null)} />
                                                                <div className="absolute right-0 z-30 mt-1 w-52 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                                                                    {courseId && !isDraft && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setMenuFor(null);
                                                                                router.push(`/course/${courseId}/assignments/${entry.id}`);
                                                                            }}
                                                                            className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700/80 transition-colors"
                                                                        >
                                                                            <ClipboardList className="h-4 w-4" />
                                                                            <span>Review submissions</span>
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setMenuFor(null);
                                                                            onEdit(entry);
                                                                        }}
                                                                        className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors"
                                                                    >
                                                                        <Pencil className="h-4 w-4 text-slate-500" />
                                                                        <span>Edit coursework</span>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setMenuFor(null);
                                                                            setDeletingItem(entry);
                                                                        }}
                                                                        className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                        <span>Delete</span>
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => toggleTopic(group.topic)}
                                    className="w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-800 text-center transition-colors cursor-pointer"
                                >
                                    {totalInTopic} {totalInTopic === 1 ? "assignment" : "assignments"} collapsed • Click to show
                                </button>
                            )}
                        </section>
                    );
                })}
            </div>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                open={deletingItem !== null}
                title="Delete Assignment"
                message={`Are you sure you want to delete "${deletingItem?.title}"? This will remove all associated submissions.`}
                confirmLabel="Delete"
                variant="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeletingItem(null)}
            />
        </div>
    );
}

export const InstructorClassworkView = InstructorCourseworkView;
