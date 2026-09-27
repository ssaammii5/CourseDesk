"use client";

import { useId, useMemo, useState } from "react";
import {
    ArrowUpDown,
    BookOpen,
    Check,
    CheckCircle2,
    Copy,
    GraduationCap,
    LayoutGrid,
    List,
    Mail,
    Search,
    Share2,
    ShieldCheck,
    UserPlus,
    Users,
    UserX,
    X,
} from "lucide-react";
import { initialOf } from "@/lib/utils/format";
import type { ClassPerson } from "@/types";

export interface PeopleViewProps {
    people: ClassPerson[];
    courseName?: string;
    courseId?: number;
    isInstructor?: boolean;
}

export function PeopleView({
    people,
    courseName = "Course",
    courseId,
    isInstructor = false,
}: PeopleViewProps) {
    const searchInputId = useId();
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<"all" | "instructors" | "learners">("all");
    const [sortBy, setSortBy] = useState<"name-asc" | "name-desc">("name-asc");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    const instructors = useMemo(
        () => people.filter((p) => p.role === "Instructor" || (p.role as string) === "Teacher"),
        [people]
    );

    const learners = useMemo(
        () => people.filter((p) => p.role === "Learner" || (p.role as string) === "Student"),
        [people]
    );

    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => {
            setToastMessage((current) => (current === message ? null : current));
        }, 2800);
    };

    const handleCopy = async (text: string, key: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedKey(key);
            showToast(`Copied ${label} to clipboard!`);
            setTimeout(() => {
                setCopiedKey((curr) => (curr === key ? null : curr));
            }, 2000);
        } catch {
            showToast("Failed to copy to clipboard");
        }
    };

    const copyAllEmails = (list: ClassPerson[], label: string) => {
        const emails = list
            .map((p) => p.email)
            .filter((e): e is string => Boolean(e && e.trim().length > 0));

        if (emails.length === 0) {
            showToast(`No email addresses found for ${label.toLowerCase()}`);
            return;
        }

        void handleCopy(emails.join(", "), "all-emails", `${emails.length} email addresses`);
    };

    // Filter and sort
    const filterAndSort = (list: ClassPerson[]) => {
        let result = list;

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    (p.email && p.email.toLowerCase().includes(q))
            );
        }

        return [...result].sort((a, b) => {
            if (sortBy === "name-asc") {
                return a.name.localeCompare(b.name);
            }
            return b.name.localeCompare(a.name);
        });
    };

    const filteredInstructors = useMemo(
        () => filterAndSort(instructors),
        [instructors, searchQuery, sortBy]
    );

    const filteredLearners = useMemo(
        () => filterAndSort(learners),
        [learners, searchQuery, sortBy]
    );

    const totalFilteredCount =
        (roleFilter === "all" || roleFilter === "instructors" ? filteredInstructors.length : 0) +
        (roleFilter === "all" || roleFilter === "learners" ? filteredLearners.length : 0);

    return (
        <div className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-8">
            {/* Filter & Search Bar */}
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                        id={searchInputId}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search members by name or email..."
                        className="w-full rounded-xl border border-slate-200/90 bg-slate-50/70 py-2 pl-9 pr-8 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-[#1a73e8] focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-950"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Filter Pills & View Mode */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Role Filter Tabs */}
                    <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
                        <button
                            type="button"
                            onClick={() => setRoleFilter("all")}
                            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                roleFilter === "all"
                                    ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                            }`}
                        >
                            All ({people.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setRoleFilter("instructors")}
                            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                roleFilter === "instructors"
                                    ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                            }`}
                        >
                            Instructors ({instructors.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setRoleFilter("learners")}
                            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                roleFilter === "learners"
                                    ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                            }`}
                        >
                            Learners ({learners.length})
                        </button>
                    </div>

                    {/* Sort button */}
                    <button
                        type="button"
                        onClick={() =>
                            setSortBy((prev) => (prev === "name-asc" ? "name-desc" : "name-asc"))
                        }
                        title={`Sorting: ${sortBy === "name-asc" ? "A to Z" : "Z to A"}`}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
                        <span className="hidden sm:inline">
                            {sortBy === "name-asc" ? "A → Z" : "Z → A"}
                        </span>
                    </button>

                    {/* View Switcher */}
                    <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
                        <button
                            type="button"
                            onClick={() => setViewMode("grid")}
                            title="Grid View"
                            className={`cursor-pointer rounded-lg p-1.5 transition-all ${
                                viewMode === "grid"
                                    ? "bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400"
                                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                            }`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("list")}
                            title="List / Table View"
                            className={`cursor-pointer rounded-lg p-1.5 transition-all ${
                                viewMode === "list"
                                    ? "bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400"
                                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                            }`}
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Invite Members */}
                    {isInstructor && (
                        <button
                            type="button"
                            onClick={() => setIsInviteModalOpen(true)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#1a73e8] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-600 transition-all dark:bg-blue-600 dark:hover:bg-blue-500"
                        >
                            <UserPlus className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Invite Members</span>
                            <span className="sm:hidden">Invite</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Results Counter if searching */}
            {searchQuery.trim() && (
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <p>
                        Found{" "}
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {totalFilteredCount}
                        </span>{" "}
                        match{totalFilteredCount === 1 ? "" : "es"} for &quot;{searchQuery}&quot;
                    </p>
                    <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="cursor-pointer text-[#1a73e8] hover:underline dark:text-blue-400"
                    >
                        Clear search
                    </button>
                </div>
            )}

            {/* Content Sections */}
            <div className="mt-8 space-y-12">
                {/* 1. Instructors Section */}
                {(roleFilter === "all" || roleFilter === "instructors") && (
                    <section>
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300">
                                    <GraduationCap className="h-4 w-4" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                        Instructors &amp; Teaching Staff
                                    </h2>
                                </div>
                                <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200/60 dark:bg-purple-950/50 dark:border-purple-800/60 dark:text-purple-300">
                                    {filteredInstructors.length}
                                </span>
                            </div>

                            {filteredInstructors.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => copyAllEmails(filteredInstructors, "Instructors")}
                                    className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                    <span>Copy emails</span>
                                </button>
                            )}
                        </div>

                        {filteredInstructors.length === 0 ? (
                            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/40">
                                <GraduationCap className="mx-auto h-8 w-8 text-slate-400" />
                                <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {searchQuery
                                        ? "No instructors match your search criteria."
                                        : "No instructors assigned yet."}
                                </p>
                            </div>
                        ) : viewMode === "grid" ? (
                            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredInstructors.map((p) => (
                                    <InstructorCard
                                        key={p.id}
                                        person={p}
                                        isCopied={copiedKey === `inst-${p.id}`}
                                        onCopyEmail={() =>
                                            p.email &&
                                            handleCopy(p.email, `inst-${p.id}`, p.email)
                                        }
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                <PeopleTable
                                    people={filteredInstructors}
                                    copiedKey={copiedKey}
                                    onCopyEmail={handleCopy}
                                />
                            </div>
                        )}
                    </section>
                )}

                {/* 2. Learners Section */}
                {(roleFilter === "all" || roleFilter === "learners") && (
                    <section>
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
                                    <BookOpen className="h-4 w-4" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                        Enrolled Learners
                                    </h2>
                                </div>
                                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/60 dark:bg-blue-950/50 dark:border-blue-800/60 dark:text-blue-300">
                                    {filteredLearners.length}
                                </span>
                            </div>

                            {filteredLearners.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => copyAllEmails(filteredLearners, "Learners")}
                                    className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                    <span>Copy all learner emails</span>
                                </button>
                            )}
                        </div>

                        {filteredLearners.length === 0 ? (
                            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-10 text-center dark:border-slate-800 dark:bg-slate-900/40">
                                {searchQuery ? (
                                    <>
                                        <UserX className="mx-auto h-8 w-8 text-slate-400" />
                                        <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                            No learners match &quot;{searchQuery}&quot;
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery("")}
                                            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1a73e8] hover:underline dark:text-blue-400"
                                        >
                                            Reset search query
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Users className="mx-auto h-9 w-9 text-slate-400" />
                                        <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                                            No learners enrolled yet
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            Share the course link or invite learners to get started.
                                        </p>
                                        {isInstructor && (
                                            <button
                                                type="button"
                                                onClick={() => setIsInviteModalOpen(true)}
                                                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1a73e8] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 shadow-xs"
                                            >
                                                <UserPlus className="h-3.5 w-3.5" />
                                                <span>Invite Learners</span>
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        ) : viewMode === "grid" ? (
                            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {filteredLearners.map((p) => (
                                    <LearnerCard
                                        key={p.id}
                                        person={p}
                                        isCopied={copiedKey === `lrn-${p.id}`}
                                        onCopyEmail={() =>
                                            p.email &&
                                            handleCopy(p.email, `lrn-${p.id}`, p.email)
                                        }
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                <PeopleTable
                                    people={filteredLearners}
                                    copiedKey={copiedKey}
                                    onCopyEmail={handleCopy}
                                />
                            </div>
                        )}
                    </section>
                )}
            </div>

            {/* Invite Modal */}
            {isInviteModalOpen && (
                <InviteModal
                    courseName={courseName}
                    courseId={courseId}
                    onClose={() => setIsInviteModalOpen(false)}
                    onCopyLink={(link) => handleCopy(link, "invite-link", "course invite link")}
                    isCopied={copiedKey === "invite-link"}
                />
            )}

            {/* Floating Toast notification */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-slate-800 bg-slate-900/95 px-4 py-3 text-xs font-medium text-white shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/95 animate-in fade-in slide-in-from-bottom-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{toastMessage}</span>
                </div>
            )}
        </div>
    );
}

/* ─────────────── Instructor Card Component ─────────────── */
function InstructorCard({
    person,
    isCopied,
    onCopyEmail,
}: {
    person: ClassPerson;
    isCopied: boolean;
    onCopyEmail: () => void;
}) {
    return (
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-purple-200/70 bg-gradient-to-br from-white via-purple-50/20 to-indigo-50/30 p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md dark:border-purple-900/40 dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-900 dark:hover:border-purple-700/60">
            <div>
                {/* Top: Avatar & Badge */}
                <div className="flex items-start justify-between gap-3">
                    <div className="relative">
                        <span
                            className={`flex h-12 w-12 items-center justify-center rounded-2xl text-base font-bold text-white shadow-sm ring-2 ring-purple-200 dark:ring-purple-900 ${person.avatarClass}`}
                        >
                            {initialOf(person.name)}
                        </span>
                        <span
                            className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white ring-2 ring-white dark:ring-slate-900"
                            title="Verified Instructor"
                        >
                            <ShieldCheck className="h-3 w-3" />
                        </span>
                    </div>

                    <span className="inline-flex items-center gap-1 rounded-full border border-purple-200/80 bg-purple-100/70 px-2.5 py-1 text-[11px] font-semibold text-purple-700 dark:border-purple-900/70 dark:bg-purple-950/60 dark:text-purple-300">
                        <GraduationCap className="h-3 w-3" />
                        Instructor
                    </span>
                </div>

                {/* Name & Email */}
                <div className="mt-4">
                    <h3
                        className="truncate text-base font-bold text-slate-900 dark:text-white"
                        title={person.name}
                    >
                        {person.name}
                    </h3>
                    <p
                        className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400"
                        title={person.email || "No email available"}
                    >
                        {person.email || "Instructor"}
                    </p>
                </div>
            </div>

            {/* Actions footer */}
            <div className="mt-5 flex items-center justify-between border-t border-purple-100/80 pt-3 dark:border-slate-800/80">
                {person.email ? (
                    <a
                        href={`mailto:${encodeURIComponent(person.email)}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1a73e8] hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                        <Mail className="h-3.5 w-3.5" />
                        <span>Send email</span>
                    </a>
                ) : (
                    <span className="text-[11px] text-slate-400">Instructor</span>
                )}

                {person.email && (
                    <button
                        type="button"
                        onClick={onCopyEmail}
                        title="Copy email"
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200/80 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                    >
                        {isCopied ? (
                            <>
                                <Check className="h-3 w-3 text-emerald-500" />
                                <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                            </>
                        ) : (
                            <>
                                <Copy className="h-3 w-3 text-slate-400" />
                                <span>Copy</span>
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}

/* ─────────────── Learner Card Component ─────────────── */
function LearnerCard({
    person,
    isCopied,
    onCopyEmail,
}: {
    person: ClassPerson;
    isCopied: boolean;
    onCopyEmail: () => void;
}) {
    return (
        <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700/60">
            <div>
                {/* Top: Avatar & Role badge */}
                <div className="flex items-center justify-between gap-3">
                    <span
                        className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white shadow-xs ${person.avatarClass}`}
                    >
                        {initialOf(person.name)}
                    </span>

                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        Learner
                    </span>
                </div>

                {/* Name & Email */}
                <div className="mt-3.5">
                    <h3
                        className="truncate text-sm font-semibold text-slate-900 dark:text-white"
                        title={person.name}
                    >
                        {person.name}
                    </h3>
                    <p
                        className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400"
                        title={person.email || "No email"}
                    >
                        {person.email || "Enrolled Learner"}
                    </p>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800">
                {person.email ? (
                    <a
                        href={`mailto:${encodeURIComponent(person.email)}`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-[#1a73e8] dark:text-slate-400 dark:hover:text-blue-400"
                    >
                        <Mail className="h-3 w-3" />
                        <span>Mail</span>
                    </a>
                ) : (
                    <span className="text-[11px] text-slate-400">Enrolled</span>
                )}

                {person.email && (
                    <button
                        type="button"
                        onClick={onCopyEmail}
                        title="Copy email address"
                        className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                        {isCopied ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                            <Copy className="h-3.5 w-3.5" />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}

/* ─────────────── People Table View ─────────────── */
function PeopleTable({
    people,
    copiedKey,
    onCopyEmail,
}: {
    people: ClassPerson[];
    copiedKey: string | null;
    onCopyEmail: (text: string, key: string, label: string) => void;
}) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
                        <th className="py-3 pl-5 pr-4">Member</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 pl-4 pr-5 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm dark:divide-slate-800/80">
                    {people.map((person) => {
                        const isInstructor =
                            person.role === "Instructor" || (person.role as string) === "Teacher";
                        const isCopied = copiedKey === `tbl-${person.id}`;

                        return (
                            <tr
                                key={person.id}
                                className="group hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                            >
                                <td className="py-3 pl-5 pr-4">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-2xs ${person.avatarClass}`}
                                        >
                                            {initialOf(person.name)}
                                        </span>
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            {person.name}
                                        </span>
                                    </div>
                                </td>

                                <td className="py-3 px-4">
                                    {isInstructor ? (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-purple-200/80 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/60 dark:text-purple-300">
                                            <GraduationCap className="h-3 w-3" />
                                            Instructor
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                            Learner
                                        </span>
                                    )}
                                </td>

                                <td className="py-3 px-4">
                                    {person.email ? (
                                        <span className="text-xs text-slate-600 dark:text-slate-300">
                                            {person.email}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">None</span>
                                    )}
                                </td>

                                <td className="py-3 pl-4 pr-5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {person.email && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onCopyEmail(
                                                            person.email!,
                                                            `tbl-${person.id}`,
                                                            person.email!
                                                        )
                                                    }
                                                    title="Copy email"
                                                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                                                >
                                                    {isCopied ? (
                                                        <Check className="h-3 w-3 text-emerald-500" />
                                                    ) : (
                                                        <Copy className="h-3 w-3 text-slate-400" />
                                                    )}
                                                    <span className="hidden sm:inline">
                                                        {isCopied ? "Copied" : "Copy"}
                                                    </span>
                                                </button>

                                                <a
                                                    href={`mailto:${encodeURIComponent(person.email)}`}
                                                    title="Send email"
                                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                                                >
                                                    <Mail className="h-3 w-3" />
                                                </a>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

/* ─────────────── Invite Modal ─────────────── */
function InviteModal({
    courseName,
    courseId,
    onClose,
    onCopyLink,
    isCopied,
}: {
    courseName: string;
    courseId?: number;
    onClose: () => void;
    onCopyLink: (link: string) => void;
    isCopied: boolean;
}) {
    const inviteUrl =
        typeof window !== "undefined"
            ? `${window.location.origin}/course/${courseId || ""}`
            : `/course/${courseId || ""}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
            <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                            <Share2 className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                Invite Members
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {courseName}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="mt-6 space-y-4">
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Course Link
                        </label>
                        <div className="mt-1.5 flex items-center gap-2">
                            <input
                                type="text"
                                readOnly
                                value={inviteUrl}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono text-slate-700 select-all outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                            />
                            <button
                                type="button"
                                onClick={() => onCopyLink(inviteUrl)}
                                className="inline-flex cursor-pointer items-center gap-1.5 shrink-0 rounded-xl bg-[#1a73e8] px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-600 transition-colors"
                            >
                                {isCopied ? (
                                    <>
                                        <Check className="h-3.5 w-3.5" />
                                        <span>Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-3.5 w-3.5" />
                                        <span>Copy Link</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200">
                        <p className="font-semibold">Enrollment Information</p>
                        <p className="mt-1 leading-relaxed text-blue-700/90 dark:text-blue-300/80">
                            Learners and instructors can join through this course link or can be enrolled by an administrator through the CourseDesk management panel.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}