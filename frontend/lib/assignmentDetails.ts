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
    status: "Assigned" | "Submitted" | "Turned in" | "Graded";
    attachments: AssignmentAttachment[];
}

export interface AssignmentDetail {
    id: number;
    title: string;
    instructorName: string;
    teacherName?: string;
    postedDate: string;
    points: number;
    dueLabel: string;
    description: string;
    attachments: AssignmentAttachment[];
    submission: AssignmentSubmission;
    privateCommentTarget: string;
}

const assignmentDetails: AssignmentDetail[] = [
    {
        id: 1,
        title: "Final Lab Report make a single file word file",
        instructorName: "Dr. Md Samsuzzaman Sobuz",
        teacherName: "Dr. Md Samsuzzaman Sobuz",
        postedDate: "Jan 18, 2024",
        points: 100,
        dueLabel: "Due Jan 24, 2024, 11:59 PM",
        description: `1. Add a cover page
2. Add Index  as Lab problem 1 to lab problem N
3. Add all method, problem and solution with output
4. here I have added some sample of Lab manual`,
        attachments: [
            {
                id: 1,
                title: "nc-lab-manual-v-1.pdf",
                fileType: "PDF",
                thumbClass: "bg-gray-100",
            },
        ],
        submission: {
            status: "Assigned",
            attachments: [],
        },
        privateCommentTarget: "Dr. Md Samsuzzaman Sobuz",
    },
];

export function getAssignmentDetail(id: number): AssignmentDetail {
    return assignmentDetails.find((a) => a.id === id) ?? assignmentDetails[0];
}