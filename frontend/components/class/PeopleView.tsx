import { initialOf, type ClassPerson } from "@/lib/schemas";

export function PeopleView({ people }: { people: ClassPerson[] }) {
    const teachers = people.filter((p) => p.role === "Teacher");
    const students = people.filter((p) => p.role === "Student");

    return (
        <div className="mx-auto w-full max-w-[1100px] px-6 py-10 sm:px-10">
            {/* Teachers */}
            <section>
                <h2 className="text-3xl text-gray-900">Teachers</h2>
                {teachers.length === 0 ? (
                    <p className="mt-6 text-sm text-gray-600">No teachers assigned yet.</p>
                ) : (
                    <ul className="mt-5 divide-y divide-gray-300 border-y border-gray-300">
                        {teachers.map((p) => (
                            <PersonRow key={p.id} person={p} />
                        ))}
                    </ul>
                )}
            </section>

            {/* Classmates */}
            <section className="mt-14">
                <div className="flex items-end justify-between">
                    <h2 className="text-3xl text-gray-900">Classmates</h2>
                    <p className="text-sm font-medium text-gray-800">{students.length} students</p>
                </div>
                {students.length === 0 ? (
                    <p className="mt-6 text-sm text-gray-600">No students enrolled yet.</p>
                ) : (
                    <ul className="mt-5 divide-y divide-gray-300 border-y border-gray-300">
                        {students.map((p) => (
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