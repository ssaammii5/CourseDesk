"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { SessionDto } from "@/types/session";
import { SessionCard } from "../components/SessionCard";

interface CurriculumViewProps {
    sessions: SessionDto[];
    isInstructor?: boolean;
    isTeacher?: boolean;
    assignmentStatusMap: Record<number, string>;
}

type StatusFilter = "all" | "Scheduled" | "Completed" | "Live" | "Cancelled";

export function CurriculumView({
    sessions,
    isInstructor,
    isTeacher = false,
    assignmentStatusMap,
}: CurriculumViewProps) {
    const canManage = isInstructor ?? isTeacher;
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        return sessions.filter((s) => {
            const matchStatus = statusFilter === "all" || s.status === statusFilter;
            const q = search.toLowerCase();
            const matchSearch =
                !q ||
                s.title.toLowerCase().includes(q) ||
                s.topic.toLowerCase().includes(q);
            return matchStatus && matchSearch;
        });
    }, [sessions, statusFilter, search]);

    return (
        <div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                        Curriculum &amp; Sessions
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                        {sessions.length} session{sessions.length === 1 ? "" : "s"} •{" "}
                        {filtered.length} shown
                    </p>
                </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search sessions…"
                        className="w-full rounded-md border border-gray-400/80 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="rounded-md border border-gray-400/80 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                >
                    <option value="all">All statuses</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Live">Live</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
            </div>

            <div className="mt-6 space-y-4">
                {filtered.length === 0 ? (
                    <div className="rounded-lg border border-gray-200 bg-white py-16 text-center">
                        <p className="text-sm text-gray-600">No sessions found.</p>
                    </div>
                ) : (
                    filtered.map((session) => (
                        <SessionCard
                            key={session.id}
                            session={session}
                            isTeacher={isTeacher}
                            assignmentStatusMap={assignmentStatusMap}
                        />
                    ))
                )}
            </div>
        </div>
    );
}