export interface CalendarEvent {
    id: number;
    title: string;
    courseName: string;
    time: string;
    date: Date;
    color: string;
}

function dayAt(offset: number): Date {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(0, 0, 0, 0);
    return d;
}

export const calendarEvents: CalendarEvent[] = [
    {
        id: 1,
        title: "Assignment: CIT-6109 Research Work",
        courseName: "M. Sc in CSIT: CIT 6109 Natural Language Processing",
        time: "11:59 PM",
        date: dayAt(0),
        color: "bg-[#188038]",
    },
    {
        id: 2,
        title: "Quiz 2 - Hashing",
        courseName: "CIT-6102: Advanced Algorithms",
        time: "9:00 AM",
        date: dayAt(0),
        color: "bg-[#1967d2]",
    },
    {
        id: 3,
        title: "Lab 1 - Substitution Cipher",
        courseName: "M. Sc in CSIT: CIT 6105; Information Security",
        time: "11:59 PM",
        date: dayAt(2),
        color: "bg-[#188038]",
    },
    {
        id: 4,
        title: "Presentation on network routing",
        courseName: "M.Sc in CSIT: CIT 5101; Computer Networks",
        time: "2:00 PM",
        date: dayAt(4),
        color: "bg-[#3f51b5]",
    },
    {
        id: 5,
        title: "Problem 04",
        courseName: "CCE 423 17th Batch",
        time: "11:59 PM",
        date: dayAt(-1),
        color: "bg-[#0277bd]",
    },
    {
        id: 6,
        title: "Lab 17",
        courseName: "CSE 17 CCE 415 January June 2019",
        time: "11:59 PM",
        date: dayAt(7),
        color: "bg-[#188038]",
    },
    {
        id: 7,
        title: "Quiz 1 - Classical Ciphers",
        courseName: "M. Sc in CSIT: CIT 6105; Information Security",
        time: "10:00 AM",
        date: dayAt(9),
        color: "bg-[#1967d2]",
    },
];