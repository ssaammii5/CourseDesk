export interface AssignmentAttachment {
    id: number;
    title: string;
    fileType: string;
    thumbClass: string;
    /** Object URL (uploaded file) or external URL (link) */
    url?: string;
    kind?: "file" | "link";
}

export interface AssignmentSubmission {
    id?: number;
    status: "Assigned" | "Submitted" | "Turned in" | "Graded";
    attachments: AssignmentAttachment[];
}

export interface AssignmentDetail {
    id: number;
    title: string;
    teacherName: string;
    postedDate: string;
    points: number;
    dueLabel: string;
    description: string;
    attachments: AssignmentAttachment[];
    submission: AssignmentSubmission;
    privateCommentTarget: string;
}
