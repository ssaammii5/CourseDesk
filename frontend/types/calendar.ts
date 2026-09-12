export interface CalendarEvent {
    id: string;
    title: string;
    courseName: string;
    date: string; // YYYY-MM-DD
    time: string; // e.g. "11:59 PM"
    type: "assignment" | "quiz" | "reminder";
}
