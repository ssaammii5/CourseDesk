import type { AdminAssignment, AdminSubmission } from "./adminData";
import { adminAssignments, adminSubmissions } from "./adminData";

export interface SubmissionAttachment {
    id: number;
    fileName: string;
    fileType: string;
    fileSize: string;
    uploadedAt: string;
    kind: "file" | "link";
    url?: string;
}

export interface SubmissionActivityEvent {
    id: number;
    action: string;
    actor: string;
    timestamp: string;
}

export interface SubmissionDetail {
    submissionId: number;
    submittedAtTime: string;
    gradedBy: string | null;
    gradedAt: string | null;
    isLate: boolean;
    answer: string;
    attachments: SubmissionAttachment[];
    activity: SubmissionActivityEvent[];
}

export const submissionDetails: SubmissionDetail[] = [
    {
        submissionId: 1,
        submittedAtTime: "11:42 PM",
        gradedBy: "Md. Mahbubur Rahman",
        gradedAt: "2025-07-29",
        isLate: false,
        answer:
            "Implemented both Caesar and Vigenère ciphers in Python. Each cipher supports encryption and decryption, and I included a small CLI harness plus unit tests covering edge cases such as empty input and non-alphabetic characters.",
        attachments: [
            { id: 1, fileName: "caesar_cipher.py", fileType: "Python", fileSize: "4.2 KB", uploadedAt: "2025-07-28", kind: "file" },
            { id: 2, fileName: "vigenere_cipher.py", fileType: "Python", fileSize: "6.1 KB", uploadedAt: "2025-07-28", kind: "file" },
            { id: 3, fileName: "lab1_report.pdf", fileType: "PDF", fileSize: "1.8 MB", uploadedAt: "2025-07-28", kind: "file" },
        ],
        activity: [
            { id: 1, action: "Started submission", actor: "Md. Samiur Rahman", timestamp: "2025-07-27 8:15 PM" },
            { id: 2, action: "Uploaded 3 files", actor: "Md. Samiur Rahman", timestamp: "2025-07-28 11:30 PM" },
            { id: 3, action: "Submitted assignment", actor: "Md. Samiur Rahman", timestamp: "2025-07-28 11:42 PM" },
            { id: 4, action: "Graded — 45/50", actor: "Md. Mahbubur Rahman", timestamp: "2025-07-29 10:05 AM" },
        ],
    },
    {
        submissionId: 2,
        submittedAtTime: "9:18 PM",
        gradedBy: "Md. Mahbubur Rahman",
        gradedAt: "2025-07-31",
        isLate: false,
        answer:
            "Completed the substitution cipher lab. I wrapped both ciphers in a reusable module and added a brute-force helper for the Caesar cipher to demonstrate key recovery.",
        attachments: [
            { id: 1, fileName: "lab1_ratin.zip", fileType: "ZIP", fileSize: "2.3 MB", uploadedAt: "2025-07-29", kind: "file" },
            { id: 2, fileName: "README.md", fileType: "Markdown", fileSize: "3.1 KB", uploadedAt: "2025-07-29", kind: "file" },
            { id: 3, fileName: "cipher-demo (GitHub)", fileType: "Link", fileSize: "—", uploadedAt: "2025-07-29", kind: "link", url: "https://github.com/ratin/cipher-demo" },
        ],
        activity: [
            { id: 1, action: "Uploaded 2 files and 1 link", actor: "Habibur Rahman Khan Ratin", timestamp: "2025-07-29 9:05 PM" },
            { id: 2, action: "Submitted assignment", actor: "Habibur Rahman Khan Ratin", timestamp: "2025-07-29 9:18 PM" },
            { id: 3, action: "Graded — 42/50", actor: "Md. Mahbubur Rahman", timestamp: "2025-07-31 2:40 PM" },
        ],
    },
    {
        submissionId: 3,
        submittedAtTime: "11:57 PM",
        gradedBy: null,
        gradedAt: null,
        isLate: true,
        answer:
            "Attached my implementation of the Caesar and Vigenère ciphers along with a short report describing the test cases I ran.",
        attachments: [
            { id: 1, fileName: "substitution_cipher.py", fileType: "Python", fileSize: "5.4 KB", uploadedAt: "2025-07-30", kind: "file" },
            { id: 2, fileName: "lab1_report_iffat.docx", fileType: "Word", fileSize: "820 KB", uploadedAt: "2025-07-30", kind: "file" },
        ],
        activity: [
            { id: 1, action: "Uploaded 2 files", actor: "Iffat Ara Babli", timestamp: "2025-07-30 11:50 PM" },
            { id: 2, action: "Submitted assignment", actor: "Iffat Ara Babli", timestamp: "2025-07-30 11:57 PM" },
        ],
    },
    {
        submissionId: 4,
        submittedAtTime: "10:22 PM",
        gradedBy: "Md. Mahbubur Rahman",
        gradedAt: "2025-07-12",
        isLate: false,
        answer:
            "Answered all 10 multiple-choice questions on classical ciphers. I focused on Playfair, Hill, and polyalphabetic substitution concepts.",
        attachments: [
            { id: 1, fileName: "quiz1_answers.pdf", fileType: "PDF", fileSize: "310 KB", uploadedAt: "2025-07-11", kind: "file" },
        ],
        activity: [
            { id: 1, action: "Submitted assignment", actor: "Md. Samiur Rahman", timestamp: "2025-07-11 10:22 PM" },
            { id: 2, action: "Graded — 9/10", actor: "Md. Mahbubur Rahman", timestamp: "2025-07-12 9:30 AM" },
        ],
    },
    {
        submissionId: 5,
        submittedAtTime: "",
        gradedBy: null,
        gradedAt: null,
        isLate: false,
        answer: "",
        attachments: [],
        activity: [
            { id: 1, action: "Assignment published", actor: "Md. Mahbubur Rahman", timestamp: "2025-10-04 9:00 AM" },
        ],
    },
    {
        submissionId: 6,
        submittedAtTime: "8:03 PM",
        gradedBy: null,
        gradedAt: null,
        isLate: false,
        answer:
            "Completed the hashing quiz covering hash functions, collision resolution strategies (chaining and open addressing), and a short comparison of MD5 vs SHA-256.",
        attachments: [
            { id: 1, fileName: "quiz2_hashing.pdf", fileType: "PDF", fileSize: "540 KB", uploadedAt: "2025-08-19", kind: "file" },
            { id: 2, fileName: "hashing_notes.md", fileType: "Markdown", fileSize: "2.7 KB", uploadedAt: "2025-08-19", kind: "file" },
        ],
        activity: [
            { id: 1, action: "Uploaded 2 files", actor: "Md. Samiur Rahman", timestamp: "2025-08-19 7:55 PM" },
            { id: 2, action: "Submitted assignment", actor: "Md. Samiur Rahman", timestamp: "2025-08-19 8:03 PM" },
        ],
    },
    {
        submissionId: 7,
        submittedAtTime: "11:48 PM",
        gradedBy: "Farjana Sultana Mim",
        gradedAt: "2025-08-16",
        isLate: true,
        answer:
            "Submitted a research paper analysing transformer-based NLP models for low-resource languages, including a literature review, methodology, and results. A reference list and slide deck are also attached.",
        attachments: [
            { id: 1, fileName: "nlp_research_paper.pdf", fileType: "PDF", fileSize: "3.6 MB", uploadedAt: "2025-08-14", kind: "file" },
            { id: 2, fileName: "references.bib", fileType: "BibTeX", fileSize: "12 KB", uploadedAt: "2025-08-14", kind: "file" },
            { id: 3, fileName: "presentation.pptx", fileType: "PowerPoint", fileSize: "5.1 MB", uploadedAt: "2025-08-14", kind: "file" },
            { id: 4, fileName: "dataset (Kaggle)", fileType: "Link", fileSize: "—", uploadedAt: "2025-08-14", kind: "link", url: "https://www.kaggle.com/datasets/nlp-lowresource" },
        ],
        activity: [
            { id: 1, action: "Uploaded 3 files and 1 link", actor: "Partha Bhakta", timestamp: "2025-08-14 11:30 PM" },
            { id: 2, action: "Submitted assignment", actor: "Partha Bhakta", timestamp: "2025-08-14 11:48 PM" },
            { id: 3, action: "Graded — 88/100", actor: "Farjana Sultana Mim", timestamp: "2025-08-16 3:15 PM" },
        ],
    },
];

export function getAdminSubmission(id: number): AdminSubmission | undefined {
    return adminSubmissions.find((s) => s.id === id);
}

export function getSubmissionDetail(submissionId: number): SubmissionDetail | undefined {
    return submissionDetails.find((d) => d.submissionId === submissionId);
}

export function getAssignmentForSubmission(submission: AdminSubmission): AdminAssignment | undefined {
    return adminAssignments.find((a) => a.id === submission.assignmentId);
}