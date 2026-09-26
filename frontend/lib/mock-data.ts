import { z } from "zod";
import {
    ClassDetailsSchema,
    DueAssignmentSchema,
    HomeClassSchema,
    SidebarClassSchema,
    type ClassDetails,
} from "./schemas";

/* ------------------------------------------------------------------ */
/* Sidebar enrolled classes                                            */
/* ------------------------------------------------------------------ */

export const sidebarClasses = z.array(SidebarClassSchema).parse([
    { id: 1, name: "CIT-6102: Advanced Algorithms", sub: "MS", letter: "C", avatarClass: "bg-[#d7e3fd] text-[#174ea6]" },
    { id: 2, name: "CIT-5103: Symbolic Machines", sub: "MS", letter: "C", avatarClass: "bg-[#d7e3fd] text-[#174ea6]" },
    { id: 3, name: "CIT-5109 Natural Language Processing", letter: "C", avatarClass: "bg-[#d7e3fd] text-[#174ea6]" },
    { id: 4, name: "M. Sc in CSIT: CIT 6109 Natural Language Processing", sub: "Session: January-June-2025", letter: "M", avatarClass: "bg-[#ceead6] text-[#137333]" },
    { id: 5, name: "M. Sc in CSIT: CIT 6105; Information Security", sub: "Session: January-June-2024", letter: "M", avatarClass: "bg-[#e8eaed] text-[#3c4043]" },
    { id: 6, name: "M.Sc in CSIT: CIT 5101; Computer Networks", sub: "Session: January-June - 2023", letter: "M", avatarClass: "bg-[#e8eaed] text-[#3c4043]" },
    { id: 7, name: "Cryptography and Network Security", letter: "C", avatarClass: "bg-[#d7e3fd] text-[#174ea6]" },
    { id: 8, name: "CCE 423 17th Batch", sub: "2019-2020", letter: "C", avatarClass: "bg-[#d7e3fd] text-[#174ea6]" },
    { id: 9, name: "CIT-411 Compiler Design and Construction", sub: "A", letter: "C", avatarClass: "bg-[#d7e3fd] text-[#174ea6]" },
    { id: 10, name: "CSE 17 CCE 415 January June 2019", letter: "C", avatarClass: "bg-[#d7e3fd] text-[#174ea6]" },
]);

/* ------------------------------------------------------------------ */
/* Home page class cards                                               */
/* ------------------------------------------------------------------ */

export const homeClasses = z.array(HomeClassSchema).parse([
    {
        id: 1,
        name: "CIT-6102: Advanced Algorithms",
        subject: "MS",
        teacherId: 101,
        teacherName: "Prof. Dr. Abdul Masud",
        studentCount: 32,
        headerColor: "#546e7a",
        emoji: "📕",
        teacherAvatarClass: "bg-[#57a05a]",
    },
    {
        id: 2,
        name: "CIT-5103: Symbolic Machines",
        subject: "MS",
        teacherId: 101,
        teacherName: "Prof. Dr. Abdul Masud",
        studentCount: 28,
        headerColor: "#0277bd",
        emoji: "📘",
        teacherAvatarClass: "bg-[#57a05a]",
    },
    {
        id: 3,
        name: "CIT-5109 Natural Language Processing",
        subject: "M. Sc in CSIT",
        teacherId: 102,
        teacherName: "Farjana Sultana Mim",
        studentCount: 25,
        headerColor: "#3f51b5",
        emoji: "📐",
        teacherAvatarClass: "bg-[#1e8e3e]",
    },
]);

/* ------------------------------------------------------------------ */
/* Home page "Due soon"                                                */
/* ------------------------------------------------------------------ */

export const dueSoonAssignments = z.array(DueAssignmentSchema).parse([
    {
        id: 1,
        title: "CIT-6109 Research Work",
        courseName: "M. Sc in CSIT: CIT 6109 Natural Language Processing",
        dueDate: "Sun, Aug 16",
        dueTime: "11:59 PM",
    },
]);

/* ------------------------------------------------------------------ */
/* Class details (Stream / Classwork / People)                         */
/* ------------------------------------------------------------------ */

const classDetailsList = z.array(ClassDetailsSchema).parse([
    {
        courseId: 5,
        session: "Session: January-June-2024",
        bannerColor: "#5f6c72",
        bannerEmoji: "🔐",
        announcements: [
            {
                id: 1,
                author: "Md. Mahbubur Rahman",
                avatarClass: "bg-amber-800",
                date: "Jul 20",
                text: "Software Security",
                attachments: [
                    { id: 1, title: "Lecture 1 - Introduction to Software Security", fileType: "PDF", thumbClass: "bg-lime-100" },
                    { id: 2, title: "Lecture 5 Mobile Application Security", fileType: "PDF", thumbClass: "bg-red-100" },
                ],
            },
        ],
        classwork: [
            {
                id: 1,
                title: "CIT-6105 Research Assignment",
                topic: "CIT 6105 Research Assignment",
                dueLabel: "Due Sep 16, 11:59 PM",
                postedLabel: "Posted Oct 4, 2025 (Edited Jul 11)",
                status: "Assigned",
                description:
                    "Follow IEEE Conference Paper format\nPlagiarism Similarity less than 10%, AI less than 15%\nUpload code in a Zip file",
            },
            {
                id: 2,
                title: "Lab 1 - Substitution Cipher",
                topic: "Software Security",
                dueLabel: "Due Jul 30, 11:59 PM",
                postedLabel: "Posted Jul 20, 2025",
                status: "Submitted",
                description: "Implement Caesar and Vigenère ciphers.\nSubmit a short report with test cases.",
            },
            {
                id: 3,
                title: "Assignment 1 - Classical Ciphers",
                topic: "Software Security",
                dueLabel: "Due Jul 12, 11:59 PM",
                postedLabel: "Posted Jul 5, 2025",
                status: "Graded",
                description: "10 practice problems and questions on classical cryptography.",
            },
        ],
        people: [
            { id: 101, name: "Md. Mahbubur Rahman", role: "Instructor", avatarClass: "bg-amber-800 text-white" },
            { id: 102, name: "Chinmay Bepery", role: "Instructor", avatarClass: "bg-sky-800 text-white" },
            { id: 201, name: "Habibur Rhaman Khan Ratin", role: "Learner", avatarClass: "bg-emerald-700 text-white" },
            { id: 202, name: "Iffat Ara Babli", role: "Learner", avatarClass: "bg-rose-700 text-white" },
            { id: 203, name: "Partha Bhakta", role: "Learner", avatarClass: "bg-indigo-700 text-white" },
            { id: 204, name: "Md. Kaium Al Sifat Bhuiyan", role: "Learner", avatarClass: "bg-fuchsia-700 text-white" },
            { id: 205, name: "Demo Learner", role: "Learner", avatarClass: "bg-purple-800 text-white" },
        ],
    },
]);

/** Rich details if known, otherwise a generated fallback so every class page looks alive. */
export function getClassDetails(courseId: number): ClassDetails | null {
    const found = classDetailsList.find((d) => d.courseId === courseId);
    if (found) return found;

    const course =
        homeClasses.find((c) => c.id === courseId) ??
        sidebarClasses.find((c) => c.id === courseId);
    if (!course) return null;

    return {
        courseId,
        session: "subject" in course ? course.subject : course.sub,
        bannerColor: "headerColor" in course ? course.headerColor : "#0277bd",
        bannerEmoji: "emoji" in course ? course.emoji : "📘",
        announcements: [],
        classwork: [],
        people: [],
    };
}