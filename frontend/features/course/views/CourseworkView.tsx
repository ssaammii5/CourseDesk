"use client";

import { useMemo, useState } from "react";
import {
    AlertCircle,
    ArrowRight,
    Award,
    Calendar,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    ChevronsDownUp,
    ChevronsUpDown,
    Clock,
    Copy,
    ExternalLink,
    FileText,
    Filter,
    Layers,
    Paperclip,
    Search,
    Sparkles,
    SquareUserRound,
    X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api/client";
import type { CourseworkEntry } from "@/types";

export interface CourseworkViewProps {
    items: CourseworkEntry[];
    courseId?: number;
    assignmentStatusMap?: Record<number, string>;
}
export type ClassworkViewProps = CourseworkViewProps;

export type AssignmentStage = "Assigned" | "Draft" | "Submitted" | "Graded" | "Missed";
export type StatusFilter = "all" | "assigned" | "draft" | "submitted" | "graded" | "missed";

export function getEffectiveStage(
    status?: string,
    deadlineUtc?: string,
): AssignmentStage {
    if (status === "Graded") return "Graded";
    if (status === "Submitted" || status === "Turned in") return "Submitted";
    if (status === "Draft") return "Draft";
    if (status === "Missed") return "Missed";
    if (deadlineUtc) {
        const due = new Date(deadlineUtc).getTime();
        if (!isNaN(due) && due < Date.now()) {
            return "Missed";
        }
    }
    return "Assigned";
}

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

export function CourseworkView({
    items,
    courseId,
    assignmentStatusMap = {},
}: CourseworkViewProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [topicFilter, setTopicFilter] = useState<string>("all");
    const [collapsedTopics, setCollapsedTopics] = useState<ReadonlySet<string>>(new Set());
    const [expandedItems, setExpandedItems] = useState<ReadonlySet<number>>(new Set());
    const [copiedId, setCopiedId] = useState<number | null>(null);

    // Learners only see published items
    const published = useMemo(() => items.filter((i) => i.status !== "Draft"), [items]);

    // Unique topics
    const topics = useMemo(() => {
        const set = new Set<string>();
        for (const item of published) {
            const t = item.topic.trim();
            if (t) set.add(t);
        }
        return Array.from(set).sort();
    }, [published]);

    // Overall 5-stage metrics for learner
    const metrics = useMemo(() => {
        let assigned = 0;
        let draft = 0;
        let submitted = 0;
        let graded = 0;
        let missed = 0;

        for (const item of published) {
            const rawStatus = assignmentStatusMap[item.id] || item.status;
            const stage = getEffectiveStage(rawStatus, item.deadlineUtc);

            if (stage === "Assigned") assigned++;
            else if (stage === "Draft") draft++;
            else if (stage === "Submitted") submitted++;
            else if (stage === "Graded") graded++;
            else if (stage === "Missed") missed++;
        }

        return {
            total: published.length,
            assigned,
            draft,
            submitted,
            graded,
            missed,
        };
    }, [published, assignmentStatusMap]);

    // Filter items based on search and selected filters
    const filteredItems = useMemo(() => {
        return published.filter((item) => {
            const rawStatus = assignmentStatusMap[item.id] || item.status;
            const stage = getEffectiveStage(rawStatus, item.deadlineUtc);

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

            // 5 Stages filter
            if (statusFilter !== "all") {
                if (statusFilter === "assigned" && stage !== "Assigned") return false;
                if (statusFilter === "draft" && stage !== "Draft") return false;
                if (statusFilter === "submitted" && stage !== "Submitted") return false;
                if (statusFilter === "graded" && stage !== "Graded") return false;
                if (statusFilter === "missed" && stage !== "Missed") return false;
            }

            return true;
        });
    }, [published, searchQuery, topicFilter, statusFilter, assignmentStatusMap]);

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

    const toggleItem = (id: number) => {
        setExpandedItems((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleCopyLink = (entryId: number) => {
        if (typeof window === "undefined" || !courseId) return;
        const url = `${window.location.origin}/course/${courseId}/assignments/${entryId}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopiedId(entryId);
            setTimeout(() => setCopiedId(null), 2000);
        });
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

    return (
        <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-8 space-y-8">
            {/* Top Header Card */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 sm:p-8 shadow-sm">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-transparent blur-3xl pointer-events-none" />
                <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-gradient-to-tr from-purple-500/10 via-pink-500/10 to-transparent blur-3xl pointer-events-none" />

                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 mb-3">
                            <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            Academic Workspace
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Coursework & Assignments
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-xl">
                            Track all your course assignments, upcoming deadlines, and submission statuses in one place.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {courseId !== undefined && (
                            <button
                                type="button"
                                onClick={() => router.push(`/course/${courseId}/work`)}
                                className="inline-flex cursor-pointer items-center gap-2.5 rounded-xl border border-blue-200/80 dark:border-blue-800/60 bg-blue-50/70 hover:bg-blue-100/80 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 px-4 py-2.5 text-sm font-semibold text-blue-700 dark:text-blue-300 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xs"
                            >
                                <SquareUserRound className="h-4 w-4" />
                                <span>View your work</span>
                            </button>
                        )}
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

                {/* KPI Metrics Row - 5 Stages */}
                <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    {/* Assigned */}
                    <button
                        type="button"
                        onClick={() => setStatusFilter(statusFilter === "assigned" ? "all" : "assigned")}
                        className={`flex items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                            statusFilter === "assigned"
                                ? "border-blue-400 bg-blue-50/80 dark:bg-blue-950/40 dark:border-blue-700 shadow-xs ring-2 ring-blue-500/20"
                                : "border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/50"
                        }`}
                    >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Layers className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{metrics.assigned}</p>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Assigned</p>
                        </div>
                    </button>

                    {/* Draft */}
                    <button
                        type="button"
                        onClick={() => setStatusFilter(statusFilter === "draft" ? "all" : "draft")}
                        className={`flex items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                            statusFilter === "draft"
                                ? "border-amber-400 bg-amber-50/80 dark:bg-amber-950/40 dark:border-amber-700 shadow-xs ring-2 ring-amber-500/20"
                                : "border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/50"
                        }`}
                    >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{metrics.draft}</p>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Draft</p>
                        </div>
                    </button>

                    {/* Submitted */}
                    <button
                        type="button"
                        onClick={() => setStatusFilter(statusFilter === "submitted" ? "all" : "submitted")}
                        className={`flex items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                            statusFilter === "submitted"
                                ? "border-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 dark:border-indigo-700 shadow-xs ring-2 ring-indigo-500/20"
                                : "border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/50"
                        }`}
                    >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{metrics.submitted}</p>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Submitted</p>
                        </div>
                    </button>

                    {/* Graded */}
                    <button
                        type="button"
                        onClick={() => setStatusFilter(statusFilter === "graded" ? "all" : "graded")}
                        className={`flex items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                            statusFilter === "graded"
                                ? "border-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 dark:border-emerald-700 shadow-xs ring-2 ring-emerald-500/20"
                                : "border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/50"
                        }`}
                    >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Award className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{metrics.graded}</p>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Graded</p>
                        </div>
                    </button>

                    {/* Missed */}
                    <button
                        type="button"
                        onClick={() => setStatusFilter(statusFilter === "missed" ? "all" : "missed")}
                        className={`flex items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                            statusFilter === "missed"
                                ? "border-rose-400 bg-rose-50/80 dark:bg-rose-950/40 dark:border-rose-700 shadow-xs ring-2 ring-rose-500/20"
                                : "border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/50"
                        }`}
                    >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{metrics.missed}</p>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Missed</p>
                        </div>
                    </button>
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
                            <option value="all">All Topics ({published.length})</option>
                            {topics.map((t) => {
                                const count = published.filter((i) => i.topic.trim() === t).length;
                                return (
                                    <option key={t} value={t}>
                                        {t} ({count})
                                    </option>
                                );
                            })}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    </div>

                    {/* Stage Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 p-1 border border-slate-200/60 dark:border-slate-700/60">
                        {(
                            [
                                { id: "all", label: `All (${published.length})` },
                                { id: "assigned", label: `Assigned (${metrics.assigned})` },
                                { id: "draft", label: `Draft (${metrics.draft})` },
                                { id: "submitted", label: `Submitted (${metrics.submitted})` },
                                { id: "graded", label: `Graded (${metrics.graded})` },
                                { id: "missed", label: `Missed (${metrics.missed})` },
                            ] as const
                        ).map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setStatusFilter(tab.id as StatusFilter)}
                                className={`cursor-pointer rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-all ${statusFilter === tab.id
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
                        {hasActiveFilters ? "No matching assignments found" : "No assignments posted yet"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                        {hasActiveFilters
                            ? "Try adjusting your search query or filters to find what you are looking for."
                            : "Your instructor has not published any assignments yet."}
                    </p>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium transition-colors"
                        >
                            Reset all filters
                        </button>
                    )}
                </div>
            )}

            {/* Topic Groups */}
            <div className="space-y-10">
                {visibleGroups.map((group) => {
                    const collapsed = collapsedTopics.has(group.topic);
                    const totalInTopic = group.entries.length;
                    const completedInTopic = group.entries.filter((e) => {
                        const status = assignmentStatusMap[e.id] || e.status;
                        const stage = getEffectiveStage(status, e.deadlineUtc);
                        return stage === "Graded" || stage === "Submitted";
                    }).length;

                    return (
                        <section key={group.topic} className="space-y-4">
                            {/* Topic Section Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <span className="h-6 w-1 rounded-full bg-blue-600 dark:bg-blue-500 shrink-0" />
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                            {group.topic}
                                        </h2>
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60">
                                            {totalInTopic} {totalInTopic === 1 ? "item" : "items"}
                                        </span>
                                        {totalInTopic > 0 && completedInTopic > 0 && (
                                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
                                                {completedInTopic}/{totalInTopic} completed
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
                                        const effectiveStatus = assignmentStatusMap[entry.id] || entry.status;
                                        const expanded = expandedItems.has(entry.id);
                                        return (
                                            <CourseworkItemCard
                                                key={entry.id}
                                                entry={entry}
                                                effectiveStatus={effectiveStatus}
                                                courseId={courseId}
                                                expanded={expanded}
                                                copied={copiedId === entry.id}
                                                onToggle={() => toggleItem(entry.id)}
                                                onCopyLink={() => handleCopyLink(entry.id)}
                                            />
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
        </div>
    );
}

function CourseworkItemCard({
    entry,
    effectiveStatus,
    courseId,
    expanded,
    copied,
    onToggle,
    onCopyLink,
}: {
    entry: CourseworkEntry;
    effectiveStatus: string;
    courseId?: number;
    expanded: boolean;
    copied: boolean;
    onToggle: () => void;
    onCopyLink: () => void;
}) {
    const stage = getEffectiveStage(effectiveStatus, entry.deadlineUtc);

    const Icon = FileText;
    const iconClass = "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-800/40";
    const tagClass = "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-800/40";
    const label = "Assignment";

    return (
        <div
            className={`group rounded-2xl border transition-all duration-200 ${expanded
                ? "border-blue-400/60 dark:border-blue-500/50 bg-white dark:bg-slate-800/90 shadow-md ring-1 ring-blue-500/10"
                : "border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs"
                }`}
        >
            {/* Header row */}
            <div
                role="button"
                tabIndex={0}
                onClick={onToggle}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onToggle();
                    }
                }}
                className="flex items-center gap-4 p-4 sm:p-4.5 cursor-pointer text-left select-none"
            >
                {/* Type Icon Badge */}
                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${iconClass} transition-transform group-hover:scale-105`}
                >
                    <Icon className="h-5 w-5" />
                </div>

                {/* Main Content */}
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${tagClass}`}>
                            {label}
                        </span>
                        {entry.maxMarks !== undefined && entry.maxMarks > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                <Award className="h-3 w-3" />
                                {entry.maxMarks} pts
                            </span>
                        )}
                    </div>
                    <h3 className="mt-1 text-[15px] font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {entry.title}
                    </h3>
                </div>

                {/* Status & Due Date Info */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex flex-col items-end text-right">
                        {/* 5-Stage Status Badge */}
                        {stage === "Graded" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                                <Award className="h-3 w-3" />
                                Graded
                            </span>
                        ) : stage === "Submitted" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
                                <Check className="h-3 w-3" />
                                Submitted
                            </span>
                        ) : stage === "Draft" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                                <Clock className="h-3 w-3" />
                                Draft
                            </span>
                        ) : stage === "Missed" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40">
                                <AlertCircle className="h-3 w-3" />
                                Missed
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                Assigned
                            </span>
                        )}

                        {/* Due label */}
                        <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDateTime(entry.deadlineUtc, entry.dueLabel)}
                        </span>
                    </div>

                    {/* Expand Chevron */}
                    <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-transform ${expanded ? "rotate-180" : ""
                            }`}
                    >
                        <ChevronDown className="h-4 w-4" />
                    </div>
                </div>
            </div>

            {/* Expanded Content Drawer */}
            {expanded && (
                <div className="border-t border-slate-200/70 dark:border-slate-700/70 bg-slate-50/60 dark:bg-slate-900/40 p-5 sm:p-6 rounded-b-2xl space-y-5 animate-in fade-in duration-150">
                    {/* Missed Warning Banner */}
                    {stage === "Missed" && (
                        <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3 text-xs text-rose-700 dark:text-rose-300">
                            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                            <div>
                                <p className="font-semibold">Submission Deadline Passed</p>
                                <p className="text-rose-600/90 dark:text-rose-300/90">This assignment was missed and can no longer be submitted.</p>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                            Instructions & Overview
                        </h4>
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                            {entry.description || "No specific instructions provided for this assignment."}
                        </p>
                    </div>

                    {/* Attachments */}
                    {entry.attachments && entry.attachments.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Attachments ({entry.attachments.length})
                            </h4>
                            <div className="flex flex-wrap gap-2.5">
                                {entry.attachments.map((att) => {
                                    const rawUrl = att.url;
                                    const fileUrl = rawUrl?.startsWith("http")
                                        ? rawUrl
                                        : rawUrl
                                        ? `${API_URL}${rawUrl}`
                                        : undefined;

                                    return fileUrl ? (
                                        <a
                                            key={att.id}
                                            href={fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-2xs"
                                        >
                                            <Paperclip className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                            <span className="truncate max-w-[220px]">{att.fileName}</span>
                                            {att.fileSize && (
                                                <span className="text-[10px] text-slate-400 font-normal">
                                                    ({att.fileSize})
                                                </span>
                                            )}
                                        </a>
                                    ) : (
                                        <div
                                            key={att.id}
                                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300"
                                        >
                                            <Paperclip className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                            <span className="truncate max-w-[220px]">{att.fileName}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5">
                            <Calendar className="h-3.5 w-3.5 text-blue-500" />
                            <span>{entry.postedLabel}</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5">
                            <Clock className="h-3.5 w-3.5 text-indigo-500" />
                            <span>{formatDateTime(entry.deadlineUtc, entry.dueLabel)}</span>
                        </div>
                        {entry.maxMarks !== undefined && entry.maxMarks > 0 && (
                            <div className="flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5">
                                <Award className="h-3.5 w-3.5 text-amber-500" />
                                <span>Max Score: {entry.maxMarks} pts</span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/80">
                        <button
                            type="button"
                            onClick={onCopyLink}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
                        >
                            {copied ? (
                                <>
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    <span>Link copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="h-3.5 w-3.5" />
                                    <span>Copy link</span>
                                </>
                            )}
                        </button>

                        {courseId !== undefined && (
                            <Link
                                href={`/course/${courseId}/assignments/${entry.id}`}
                                className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                                    stage === "Missed"
                                        ? "border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
                                }`}
                            >
                                <span>
                                    {stage === "Missed"
                                        ? "View details (Submission closed)"
                                        : stage === "Graded"
                                        ? "View grade & feedback"
                                        : stage === "Submitted"
                                        ? "Review your submission"
                                        : stage === "Draft"
                                        ? "Continue draft"
                                        : "View instructions & submit"}
                                </span>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export const ClassworkView = CourseworkView;