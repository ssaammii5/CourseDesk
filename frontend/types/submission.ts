export interface SubmissionActivity {
    id: number;
    type: "submitted" | "turned_in" | "returned" | "comment" | "grade";
    timestamp: string;
    description: string;
    details?: string;
}

export interface SubmissionDetail {
    id: number;
    studentName: string;
    studentEmail: string;
    studentAvatarColor: string;
    assignmentTitle: string;
    courseName: string;
    courseId: number;
    assignmentId: number;
    submittedAt: string;
    dueDate: string;
    status: "Handed in" | "Turned in" | "Submitted" | "Graded" | "Missing" | "Assigned";
    isLate: boolean;
    marks: number | null;
    maxMarks: number;
    feedback: string | null;
    answer: string;
    attachments: {
        id: number;
        title: string;
        fileType: string;
        size: string;
        thumbClass: string;
        downloadUrl?: string;
    }[];
    activityLog: SubmissionActivity[];
}
