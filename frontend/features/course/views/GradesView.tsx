import type { ClassPerson, ClassworkEntry } from "@/types";
import type { SubmissionDto } from "@/lib/api/submissions";
import { initialOf } from "@/lib/utils/format";

interface GradesViewProps {
    people: ClassPerson[];
    items: ClassworkEntry[];
    submissions?: SubmissionDto[];
}

export function GradesView({ people, items, submissions = [] }: GradesViewProps) {
    const learners = people.filter((p) => p.role === "Learner" || (p.role as string) === "Student");
    const columns = items.filter(
        (i) => i.status !== "Draft" && i.kind !== "material",
    );

    const getSubmissionFor = (learnerId: number, assignmentId: number) =>
        submissions.find(
            (s) => (s.learnerId === learnerId || s.studentId === learnerId) && s.assignmentId === assignmentId,
        );

    return (
        <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Grades &amp; Performance</h2>

            {columns.length === 0 || learners.length === 0 ? (
                <p className="mt-6 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-16 text-center text-sm text-gray-600 dark:text-slate-400">
                    {columns.length === 0
                        ? "No graded work yet. Create an assignment to start tracking grades."
                        : "No learners enrolled yet."}
                </p>
            ) : (
                <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <table className="w-full min-w-[720px] text-left">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-slate-800 bg-[#f8f9fa] dark:bg-slate-800/60">
                                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-slate-300">
                                    Learner
                                </th>
                                <th className="hidden"></th>
                                {columns.map((c) => (
                                    <th
                                        key={c.id}
                                        className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-slate-300"
                                    >
                                        <div className="truncate" title={c.title}>
                                            {c.title}
                                        </div>
                                    </th>
                                ))}
                                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-slate-300">
                                    Average
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {learners.map((s) => {
                                const grades = columns.map((c) => {
                                    const sub = getSubmissionFor(s.id, c.id);
                                    return sub?.marks ?? null;
                                });
                                const gradedValues = grades.filter(
                                    (g): g is number => g !== null,
                                );
                                const avg =
                                    gradedValues.length > 0
                                        ? Math.round(
                                            gradedValues.reduce((a, b) => a + b, 0) /
                                            gradedValues.length,
                                        )
                                        : null;

                                return (
                                    <tr key={s.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/40">
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${s.avatarClass}`}
                                                >
                                                    {initialOf(s.name)}
                                                </span>
                                                <span className="truncate text-sm text-gray-900 dark:text-slate-200">
                                                    {s.name}
                                                </span>
                                            </div>
                                        </td>
                                        {grades.map((g, i) => (
                                            <td key={columns[i].id} className="px-4 py-3.5 text-sm">
                                                {g !== null ? (
                                                    <span className="font-medium text-gray-900 dark:text-slate-200">{g}</span>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-slate-600">—</span>
                                                )}
                                            </td>
                                        ))}
                                        <td className="px-4 py-3.5 text-sm">
                                            {avg !== null ? (
                                                <span className="font-semibold text-[#1a73e8] dark:text-blue-400">{avg}</span>
                                            ) : (
                                                <span className="text-gray-400 dark:text-slate-600">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}