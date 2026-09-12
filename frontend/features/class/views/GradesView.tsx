import type { ClassPerson, ClassworkEntry } from "@/types";
import { initialOf } from "@/lib/utils/format";

interface GradesViewProps {
    people: ClassPerson[];
    items: ClassworkEntry[];
}

export function GradesView({ people, items }: GradesViewProps) {
    const students = people.filter((p) => p.role === "Student");
    const columns = items.filter((i) => i.status !== "Draft" && i.kind !== "material");

    return (
        <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-8">
            <h2 className="text-2xl text-gray-900">Grades</h2>
            {columns.length === 0 || students.length === 0 ? (
                <p className="mt-6 rounded-lg border border-gray-200 bg-white py-16 text-center text-sm text-gray-600">
                    {columns.length === 0
                        ? "No graded work yet. Create an assignment to start tracking grades."
                        : "No students enrolled yet."}
                </p>
            ) : (
                <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white">
                    <table className="w-full min-w-[720px] text-left">
                        <thead>
                            <tr className="border-b border-gray-200 bg-[#f8f9fa]">
                                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600">
                                    Student
                                </th>
                                {columns.map((c) => (
                                    <th
                                        key={c.id}
                                        className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600"
                                    >
                                        <div className="truncate" title={c.title}>
                                            {c.title}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {students.map((s) => (
                                <tr key={s.id} className="transition-colors hover:bg-gray-50">
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${s.avatarClass}`}
                                            >
                                                {initialOf(s.name)}
                                            </span>
                                            <span className="truncate text-sm text-gray-900">{s.name}</span>
                                        </div>
                                    </td>
                                    {columns.map((c) => (
                                        <td key={c.id} className="px-4 py-3.5 text-sm text-gray-500">
                                            —
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}