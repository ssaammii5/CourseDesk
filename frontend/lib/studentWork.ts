export interface StudentWorkTask {
    id: number;
    title: string;
    attachmentCount: number;
    dueLabel: string;
    status: "Assigned" | "Turned in" | "Graded";
}

export interface StudentWorkData {
    studentName: string;
    avatarClass: string;
    tasks: StudentWorkTask[];
}

const studentWork: StudentWorkData = {
    studentName: "Md. Samiur Rahman",
    avatarClass: "bg-purple-800",
    tasks: [
        { id: 1, title: "Exam", attachmentCount: 0, dueLabel: "No due date", status: "Assigned" },
        { id: 2, title: "Project Upload 10 Marks", attachmentCount: 2, dueLabel: "No due date", status: "Turned in" },
        { id: 3, title: "Basic Router Setting", attachmentCount: 2, dueLabel: "Due Mar 31, 2025, 11:59 PM", status: "Turned in" },
        { id: 4, title: "Lab problem BGP", attachmentCount: 6, dueLabel: "Due Mar 31, 2025", status: "Turned in" },
        { id: 5, title: "Lab problem 20 OSPF Lab", attachmentCount: 2, dueLabel: "Due Mar 31, 2025", status: "Turned in" },
        { id: 6, title: "Lab Problem 19 EIGRP 02", attachmentCount: 4, dueLabel: "Due Mar 31, 2025", status: "Turned in" },
        { id: 7, title: "Lab Problem 19 EIGRP lab-1", attachmentCount: 5, dueLabel: "Due Mar 31, 2025", status: "Turned in" },
        { id: 8, title: "Lab 18 Dynamic Routing Protocol", attachmentCount: 4, dueLabel: "Due Mar 31, 2025", status: "Turned in" },
        { id: 9, title: "Lab 17", attachmentCount: 2, dueLabel: "Due Apr 5, 2025", status: "Turned in" },
        { id: 10, title: "Lab 16", attachmentCount: 1, dueLabel: "Due Apr 5, 2025", status: "Turned in" },
        { id: 11, title: "Lab 15", attachmentCount: 1, dueLabel: "Due Apr 5, 2025", status: "Turned in" },
        { id: 12, title: "Lab 14", attachmentCount: 2, dueLabel: "Due Apr 5, 2025", status: "Turned in" },
        { id: 13, title: "Lab 13", attachmentCount: 1, dueLabel: "Due Apr 5, 2025", status: "Turned in" },
        { id: 14, title: "Lab 12", attachmentCount: 1, dueLabel: "Due Apr 5, 2025", status: "Turned in" },
        { id: 15, title: "LAB 11", attachmentCount: 2, dueLabel: "Due Apr 5, 2025", status: "Turned in" },
        { id: 16, title: "Lab 10", attachmentCount: 2, dueLabel: "Due Apr 5, 2025", status: "Turned in" },
        { id: 17, title: "Lab 09", attachmentCount: 3, dueLabel: "Due Apr 5, 2025", status: "Turned in" },
        { id: 18, title: "LAB 07", attachmentCount: 2, dueLabel: "Due Apr 5, 2025", status: "Turned in" },
        { id: 19, title: "Lab problem 06", attachmentCount: 1, dueLabel: "Due Apr 5, 2025", status: "Turned in" },
        { id: 20, title: "Lab Problem 05", attachmentCount: 1, dueLabel: "Due Apr 5, 2025", status: "Turned in" },
        { id: 21, title: "Problem 04", attachmentCount: 2, dueLabel: "Due Apr 5, 2025", status: "Turned in" },
        { id: 22, title: "Problem 03", attachmentCount: 1, dueLabel: "Due Apr 5, 2025", status: "Turned in" },
        { id: 23, title: "Problem 02", attachmentCount: 2, dueLabel: "Due Apr 5, 2025", status: "Turned in" },
        { id: 24, title: "Problem 01", attachmentCount: 2, dueLabel: "Due Jan 31, 2025", status: "Turned in" },
    ],
};

export function getStudentWork(): StudentWorkData {
    return studentWork;
}