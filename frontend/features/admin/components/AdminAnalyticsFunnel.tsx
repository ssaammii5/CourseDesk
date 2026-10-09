"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    FileCheck2,
    Clock,
    AlertCircle,
    Users,
    GraduationCap,
    UserCheck,
    ArrowRight,
    TrendingUp,
    ShieldCheck,
    PieChart,
} from "lucide-react";
import type { DashboardStats } from "@/lib/api/dashboard";

interface AdminAnalyticsFunnelProps {
    stats: DashboardStats;
    userCounts: {
        total: number;
        instructors: number;
        learners: number;
        coordinators: number;
    };
    isCoordinator: boolean;
}

export function AdminAnalyticsFunnel({ stats, userCounts, isCoordinator }: AdminAnalyticsFunnelProps) {
    const router = useRouter();

    // Submission breakdown calculations
    const totalSubmissions = stats.totalSubmissions;
    const graded = stats.gradedSubmissions;
    const pending = stats.pendingSubmissions;
    const notSubmitted = Math.max(0, totalSubmissions - graded - pending);

    const gradedPct = totalSubmissions > 0 ? Math.round((graded / totalSubmissions) * 100) : 0;
    const pendingPct = totalSubmissions > 0 ? Math.round((pending / totalSubmissions) * 100) : 0;
    const notSubmittedPct = totalSubmissions > 0 ? Math.max(0, 100 - gradedPct - pendingPct) : 0;

    // User breakdown calculations
    const totalUsers = userCounts.total;
    const learnerPct = totalUsers > 0 ? Math.round((userCounts.learners / totalUsers) * 100) : 0;
    const instructorPct = totalUsers > 0 ? Math.round((userCounts.instructors / totalUsers) * 100) : 0;
    const coordinatorPct = totalUsers > 0 ? Math.max(0, 100 - learnerPct - instructorPct) : 0;

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Card 1: Submissions & Evaluation Funnel */}
            <section className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/90 sm:p-7">
                <div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                                <FileCheck2 className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                    Submission Evaluation Funnel
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Turnaround pipeline & scoring progression
                                </p>
                            </div>
                        </div>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {gradedPct}% Graded
                        </span>
                    </div>

                    {/* Segmented Pipeline Bar */}
                    <div className="mt-6">
                        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            {gradedPct > 0 && (
                                <div
                                    style={{ width: `${gradedPct}%` }}
                                    className="bg-emerald-500 transition-all duration-500"
                                    title={`Graded: ${graded} (${gradedPct}%)`}
                                />
                            )}
                            {pendingPct > 0 && (
                                <div
                                    style={{ width: `${pendingPct}%` }}
                                    className="bg-amber-500 transition-all duration-500"
                                    title={`Awaiting Review: ${pending} (${pendingPct}%)`}
                                />
                            )}
                            {notSubmittedPct > 0 && (
                                <div
                                    style={{ width: `${notSubmittedPct}%` }}
                                    className="bg-slate-300 dark:bg-slate-700 transition-all duration-500"
                                    title={`Unsubmitted / In Progress: ${notSubmitted} (${notSubmittedPct}%)`}
                                />
                            )}
                        </div>

                        {/* Metric Legend & Details */}
                        <div className="mt-5 grid grid-cols-3 gap-3">
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Graded</span>
                                </div>
                                <p className="mt-1.5 text-lg font-bold text-slate-900 dark:text-slate-100">{graded}</p>
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{gradedPct}% of total</p>
                            </div>

                            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Needs Review</span>
                                </div>
                                <p className="mt-1.5 text-lg font-bold text-slate-900 dark:text-slate-100">{pending}</p>
                                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">{pendingPct}% queue</p>
                            </div>

                            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/60">
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Remaining</span>
                                </div>
                                <p className="mt-1.5 text-lg font-bold text-slate-900 dark:text-slate-100">{notSubmitted}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{notSubmittedPct}% balance</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800/80">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        Total {totalSubmissions} assignments tracked
                    </span>
                    <button
                        type="button"
                        onClick={() => router.push("/submissions")}
                        className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                        <span>Manage Submissions</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                </div>
            </section>

            {/* Card 2: User Ecosystem & Platform Demographics */}
            <section className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/90 sm:p-7">
                <div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                    Community Ecosystem
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    User distribution across academic roles
                                </p>
                            </div>
                        </div>

                        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                            {totalUsers} Members
                        </span>
                    </div>

                    {/* Segmented User Distribution Bar */}
                    <div className="mt-6">
                        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            {learnerPct > 0 && (
                                <div
                                    style={{ width: `${learnerPct}%` }}
                                    className="bg-emerald-500 transition-all duration-500"
                                    title={`Learners: ${userCounts.learners} (${learnerPct}%)`}
                                />
                            )}
                            {instructorPct > 0 && (
                                <div
                                    style={{ width: `${instructorPct}%` }}
                                    className="bg-blue-500 transition-all duration-500"
                                    title={`Instructors: ${userCounts.instructors} (${instructorPct}%)`}
                                />
                            )}
                            {!isCoordinator && coordinatorPct > 0 && (
                                <div
                                    style={{ width: `${coordinatorPct}%` }}
                                    className="bg-purple-500 transition-all duration-500"
                                    title={`Co-ordinators: ${userCounts.coordinators} (${coordinatorPct}%)`}
                                />
                            )}
                        </div>

                        {/* Detailed Role Breakdown Cards */}
                        <div className={`mt-5 grid gap-3 ${!isCoordinator ? "grid-cols-3" : "grid-cols-2"}`}>
                            {/* Learners */}
                            <button
                                type="button"
                                onClick={() => router.push("/learners")}
                                className="group cursor-pointer rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-left transition-all hover:border-emerald-200 hover:bg-emerald-100/60 hover:shadow-xs dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:hover:border-emerald-700/60 dark:hover:bg-emerald-950/60"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <GraduationCap className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                        <span className="text-xs font-semibold text-slate-700 transition-colors group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-slate-100">Learners</span>
                                    </div>
                                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{learnerPct}%</span>
                                </div>
                                <p className="mt-1.5 text-lg font-bold text-slate-900 dark:text-slate-100">
                                    {userCounts.learners}
                                </p>
                                <p className="text-[11px] text-slate-500 transition-colors group-hover:text-emerald-700 dark:text-slate-400 dark:group-hover:text-emerald-300">
                                    View roster →
                                </p>
                            </button>

                            {/* Instructors */}
                            <button
                                type="button"
                                onClick={() => router.push("/instructors")}
                                className="group cursor-pointer rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-left transition-all hover:border-blue-200 hover:bg-blue-100/60 hover:shadow-xs dark:border-blue-900/40 dark:bg-blue-950/30 dark:hover:border-blue-700/60 dark:hover:bg-blue-950/60"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                        <span className="text-xs font-semibold text-slate-700 transition-colors group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-slate-100">Instructors</span>
                                    </div>
                                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">{instructorPct}%</span>
                                </div>
                                <p className="mt-1.5 text-lg font-bold text-slate-900 dark:text-slate-100">
                                    {userCounts.instructors}
                                </p>
                                <p className="text-[11px] text-slate-500 transition-colors group-hover:text-blue-700 dark:text-slate-400 dark:group-hover:text-blue-300">
                                    View faculty →
                                </p>
                            </button>

                            {/* Co-ordinators */}
                            {!isCoordinator && (
                                <button
                                    type="button"
                                    onClick={() => router.push("/coordinators")}
                                    className="group cursor-pointer rounded-xl border border-purple-100 bg-purple-50/50 p-3 text-left transition-all hover:border-purple-200 hover:bg-purple-100/60 hover:shadow-xs dark:border-purple-900/40 dark:bg-purple-950/30 dark:hover:border-purple-700/60 dark:hover:bg-purple-950/60"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <UserCheck className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                            <span className="text-xs font-semibold text-slate-700 transition-colors group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-slate-100">Co-ordinators</span>
                                        </div>
                                        <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">{coordinatorPct}%</span>
                                    </div>
                                    <p className="mt-1.5 text-lg font-bold text-slate-900 dark:text-slate-100">
                                        {userCounts.coordinators}
                                    </p>
                                    <p className="text-[11px] text-slate-500 transition-colors group-hover:text-purple-700 dark:text-slate-400 dark:group-hover:text-purple-300">
                                        View managers →
                                    </p>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800/80">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        {stats.activeUsers ?? totalUsers} active platform accounts
                    </span>
                    <button
                        type="button"
                        onClick={() => router.push("/learners")}
                        className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                    >
                        <span>User Management</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                </div>
            </section>
        </div>
    );
}
