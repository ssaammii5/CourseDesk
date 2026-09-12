"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Minimize2 } from "lucide-react";
import Link from "next/link";
import { getAssignmentsRequest, type AssignmentDto } from "@/lib/api/assignments";
import { IconButton } from "@/components/ui/IconButton";
import type { DueAssignment } from "@/types";

function formatDueDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatDueTime(iso: string): string {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function DueSoonCard() {
    const [collapsed, setCollapsed] = useState(false);
    const [dueSoonAssignments, setDueSoonAssignments] = useState<DueAssignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        getAssignmentsRequest()
            .then((dtos) => {
                if (cancelled) return;
                const now = Date.now();
                const upcoming = dtos
                    .filter((d) => new Date(d.deadlineUtc).getTime() > now)
                    .sort((a, b) => new Date(a.deadlineUtc).getTime() - new Date(b.deadlineUtc).getTime())
                    .slice(0, 5)
                    .map((d) => ({
                        id: d.id,
                        title: d.title,
                        courseName: d.courseName ?? "",
                        dueDate: formatDueDate(d.deadlineUtc),
                        dueTime: formatDueTime(d.deadlineUtc),
                    }));
                setDueSoonAssignments(upcoming);
            })
            .catch(() => {
                if (!cancelled) setDueSoonAssignments([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <section className="rounded-xl bg-[#f9fafc] px-6 py-5 shadow-sm">
            <div className="flex items-center justify-between">
                <h2 className="text-xl text-gray-800">Due soon</h2>
                <div className="flex items-center gap-3">
                    <Link href="/todo" className="text-sm font-medium text-[#1a73e8] hover:underline">
                        View To-do
                    </Link>
                    <IconButton
                        label={collapsed ? "Expand" : "Collapse"}
                        onClick={() => setCollapsed((v) => !v)}
                        className="h-9 w-9"
                    >
                        <Minimize2 className="h-5 w-5" />
                    </IconButton>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-6">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
                </div>
            ) : !collapsed && (
                dueSoonAssignments.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-600">Nothing is due soon.</p>
                ) : (
                    <ul className="mt-4">
                        {dueSoonAssignments.map((a) => (
                            <li key={a.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                                <div className="flex min-w-0 flex-1 items-center gap-4">
                                    <ClipboardList className="h-6 w-6 shrink-0 text-gray-600" />
                                    <a href="#" className="truncate text-[15px] text-gray-800 hover:text-[#1a73e8]">
                                        {a.title}
                                    </a>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-gray-600">Class</p>
                                    <a href="#" className="block truncate text-sm text-[#1a73e8] hover:underline">
                                        {a.courseName}
                                    </a>
                                </div>
                                <p className="shrink-0 text-sm text-gray-700 sm:text-right">
                                    <span className="block">{a.dueDate},</span>
                                    <span className="block">{a.dueTime}</span>
                                </p>
                            </li>
                        ))}
                    </ul>
                )
            )}
        </section>
    );
}