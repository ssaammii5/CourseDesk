export interface TodoCourse {
    id: string;
    name: string;
}

export interface TodoTask {
    id: string;
    courseId: string;
    courseName: string;
    title: string;
    dueDate: string;
    dueTime: string;
    status: "assigned" | "missing" | "done";
    timeCategory: "no-due-date" | "this-week" | "next-week" | "later" | "earlier";
}
