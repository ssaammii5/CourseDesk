"use client";

import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, ArrowRight, Clock, FileCheck } from "lucide-react";
import type { SubmissionDto } from "@/lib/api/submissions";

interface AdminUrgentQueueProps {
    pendingCount: number;
    pendingSubmissions: SubmissionDto[];
}

export function AdminUrgentQueue({ pendingCount, pendingSubmissions }: AdminUrgentQueueProps) {
    const router = useRouter();

    if (pendingCount === 0) {
        return (
            <div className="flex items-center justify-between rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 sm:p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                <div className="flex items-center gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                            Grading Queue Cleared
                        </h2>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">
                            All student assignments have been reviewed and graded. No pending evaluations remaining.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => router.push("/submissions")}
                    className="hidden sm:inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-200"
                >
                    <span>View All Submissions</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                </button>
            </div>
        );
    }

    const previewList = pendingSubmissions.slice(0, 3);

    return (
        <section aria-label="Grading Backlog Spotlight" className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-amber-50/70 p-4 sm:p-5 dark:border-amber-900/50 dark:bg-gradient-to-r dark:from-amber-950/30 dark:via-slate-900/40 dark:to-amber-950/20">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Left Alert Message */}
                <div className="flex items-start sm:items-center gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                        <AlertCircle className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                                Attention Required: {pendingCount} {pendingCount === 1 ? "Submission" : "Submissions"} Awaiting Evaluation
                            </h2>
                            <span className="inline-flex items-center rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-900/80 dark:text-amber-200">
                                Priority Queue
                            </span>
                        </div>
                        <p className="mt-0.5 text-xs text-amber-800/90 dark:text-amber-300/80">
                            Learners have turned in work ready for instructor review and score assignment.
                        </p>
                    </div>
                </div>

                {/* Right Action */}
                <button
                    type="button"
                    onClick={() => router.push("/submissions")}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 self-start lg:self-center rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-amber-700 active:scale-95"
                >
                    <FileCheck className="h-4 w-4" />
                    <span>Open Evaluation Desk</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                </button>
            </div>

            {/* Quick Preview Chips for top items */}
            {previewList.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-amber-200/60 dark:border-amber-900/40">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-[11px] font-semibold text-amber-900/80 dark:text-amber-300/80">
                            Recent Pending:
                        </span>
                        {previewList.map((sub) => {
                            const name = sub.learnerName || sub.studentName || "Learner";
                            const title = sub.assignmentTitle || "Assignment";
                            return (
                                <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => router.push(`/submissions/${sub.id}`)}
                                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-800 shadow-xs transition-colors hover:bg-amber-100 hover:text-amber-900 dark:bg-slate-850 dark:text-slate-200 dark:hover:bg-amber-950/60"
                                >
                                    <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                    <span className="font-semibold">{name}</span>
                                    <span className="text-slate-400 dark:text-slate-500">•</span>
                                    <span className="max-w-[140px] truncate text-slate-600 dark:text-slate-400">{title}</span>
                                    <span className="text-amber-600 font-semibold dark:text-amber-400 text-[10px]">Grade →</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
}
