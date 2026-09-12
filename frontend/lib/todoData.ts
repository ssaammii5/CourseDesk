export interface TodoTask {
    id: number;
    title: string;
    courseName: string;
    dueLabel?: string;
    dueTone?: "green" | "red" | "gray";
    note?: string;
    iconTone?: "gray" | "blue" | "green";
}

export interface TodoSectionData {
    id: string;
    label: string;
    tasks: TodoTask[];
}

export type TodoTabId = "assigned" | "missing" | "done";

export const todoTabs: { id: TodoTabId; label: string }[] = [
    { id: "assigned", label: "Assigned" },
    { id: "missing", label: "Missing" },
    { id: "done", label: "Done" },
];

export const todoData: Record<TodoTabId, TodoSectionData[]> = {
    assigned: [
        {
            id: "no-due",
            label: "No due date",
            tasks: [
                { id: 1, title: "Exam", courseName: "CSE 17 CCE 416 January June 2023" },
                { id: 2, title: "Project Upload 10 Marks", courseName: "CSE 17 CCE 416 January June 2023", iconTone: "blue" },
                { id: 3, title: "Reading list - Week 1", courseName: "CIT-5103: Symbolic Machine Learning" },
                { id: 4, title: "Quiz 2 - Hashing", courseName: "CIT-6102: Advanced Algorithms" },
                { id: 5, title: "Lab 0 - Environment Setup", courseName: "CIT-5109 Natural Language Processing" },
            ],
        },
        { id: "this-week", label: "This week", tasks: [] },
        {
            id: "next-week",
            label: "Next week",
            tasks: [
                {
                    id: 6,
                    title: "Lab 2 - Substitution Cipher",
                    courseName: "M. Sc in CSIT: CIT 6105; Information Security and Cryptography",
                    dueLabel: "Monday, Sep 21",
                    dueTone: "green",
                    iconTone: "blue",
                },
            ],
        },
        {
            id: "later",
            label: "Later",
            tasks: [
                {
                    id: 7,
                    title: "CIT-6105 Research Assignment",
                    courseName: "M. Sc in CSIT: CIT 6105; Information Security and Cryptography",
                    dueLabel: "Wednesday, Sep 16",
                    dueTone: "green",
                },
            ],
        },
    ],
    missing: [
        { id: "this-week", label: "This week", tasks: [] },
        { id: "last-week", label: "Last week", tasks: [] },
        {
            id: "earlier",
            label: "Earlier",
            tasks: [
                {
                    id: 1,
                    title: "Assignment for CIT 6103: Symbolic Machine Learning",
                    courseName: "CIT-5103: Symbolic Machine Learning",
                    dueLabel: "Friday, Nov 28, 2025",
                    dueTone: "gray",
                    note: "Not accepting work",
                    iconTone: "blue",
                },
                {
                    id: 2,
                    title: "Presentation on network routing and switching",
                    courseName: "CSE 17 CCE 415 January June 2023",
                    dueLabel: "Wednesday, Sep 10, 2025",
                    dueTone: "gray",
                    note: "Not accepting work",
                    iconTone: "blue",
                },
                {
                    id: 3,
                    title: "Assignment of Symbolic Machine Learning",
                    courseName: "CIT-5103: Symbolic Machine Learning",
                    dueLabel: "Wednesday, Dec 25, 2024",
                    dueTone: "red",
                    iconTone: "blue",
                },
                {
                    id: 4,
                    title: "Assignment of Symbolic Machine Learning",
                    courseName: "CIT-5103: Symbolic Machine Learning",
                    dueLabel: "Friday, Oct 20, 2023",
                    dueTone: "red",
                    iconTone: "blue",
                },
                {
                    id: 5,
                    title: "MS word Assignment",
                    courseName: "CCE112 17th Batch",
                    dueLabel: "Thursday, Jul 16, 2020",
                    dueTone: "red",
                    iconTone: "green",
                },
            ],
        },
    ],
    done: [
        {
            id: "no-due",
            label: "No due date",
            tasks: [
                { id: 1, title: "Exam", courseName: "CSE 17 CCE 416 January June 2023", dueLabel: "Turned in" },
                { id: 2, title: "Project Upload 10 Marks", courseName: "CSE 17 CCE 416 January June 2023", dueLabel: "Turned in", iconTone: "blue" },
                { id: 3, title: "Quiz 0 - Course Intro", courseName: "CIT-5109 Natural Language Processing", dueLabel: "Turned in" },
                { id: 4, title: "Lab 16", courseName: "CSE 17 CCE 416 January June 2023", dueLabel: "Turned in" },
                { id: 5, title: "Problem 02", courseName: "CSE 17 CCE 416 January June 2023", dueLabel: "Turned in" },
            ],
        },
        { id: "done-early", label: "Done early", tasks: [] },
        { id: "this-week", label: "This week", tasks: [] },
        {
            id: "last-week",
            label: "Last week",
            tasks: [
                {
                    id: 6,
                    title: "CIT-6101 Research Review Paper Writing",
                    courseName: "M.Sc in CSIT: CIT 5101; Computer Arithmetic",
                    dueLabel: "Turned in",
                },
            ],
        },
        {
            id: "earlier",
            label: "Earlier",
            tasks: [
                { id: 7, title: "Lab 1 - Substitution Cipher", courseName: "M. Sc in CSIT: CIT 6105; Information Security and Cryptography", dueLabel: "Turned in", iconTone: "blue" },
                { id: 8, title: "Quiz 1 - Classical Ciphers", courseName: "M. Sc in CSIT: CIT 6105; Information Security and Cryptography", dueLabel: "Graded", iconTone: "green" },
                { id: 9, title: "Problem 01", courseName: "CSE 17 CCE 416 January June 2023", dueLabel: "Turned in" },
            ],
        },
    ],
};