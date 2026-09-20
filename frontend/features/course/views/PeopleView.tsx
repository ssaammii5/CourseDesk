import { initialOf } from "@/lib/utils/format";
import type { ClassPerson } from "@/types";

export function PeopleView({ people }: { people: ClassPerson[] }) {
    const instructors = people.filter((p) => p.role === "Instructor" || (p.role as string) === "Teacher");
    const learners = people.filter((p) => p.role === "Learner" || (p.role as string) === "Student");

    return (
        <div className="mx-auto w-full max-w-[1100px] px-6 py-10 sm:px-10">
            {/* Instructors */}
            <section>
                <h2 className="text-3xl text-gray-900">Instructors</h2>
                {instructors.length === 0 ? (
                    <p className="mt-6 text-sm text-gray-600">No instructors assigned yet.</p>
                ) : (
                    <ul className="mt-5 divide-y divide-gray-300 border-y border-gray-300">
                        {instructors.map((p) => (
                            <PersonRow key={p.id} person={p} />
                        ))}
                    </ul>
                )}
            </section>

            {/* Learners */}
            <section className="mt-14">
                <div className="flex items-end justify-between">
                    <h2 className="text-3xl text-gray-900">Learners</h2>
                    <p className="text-sm font-medium text-gray-800">
                        {learners.length} learner{learners.length === 1 ? "" : "s"}
                    </p>
                </div>
                {learners.length === 0 ? (
                    <p className="mt-6 text-sm text-gray-600">No learners enrolled yet.</p>
                ) : (
                    <ul className="mt-5 divide-y divide-gray-300 border-y border-gray-300">
                        {learners.map((p) => (
                            <PersonRow key={p.id} person={p} />
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

function PersonRow({ person }: { person: ClassPerson }) {
    return (
        <li className="flex items-center gap-6 py-4">
            <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium ${person.avatarClass}`}
            >
                {initialOf(person.name)}
            </span>
            <span className="truncate text-[15px] text-gray-900">{person.name}</span>
        </li>
    );
}