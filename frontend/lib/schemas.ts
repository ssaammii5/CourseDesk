import { z } from "zod";

export const RoleSchema = z.enum(["Admin", "Instructor", "Learner", "Teacher", "Student"]);
export type Role = z.infer<typeof RoleSchema>;

export const AssignmentStatusSchema = z.enum(["Draft", "Published", "Archived"]);
export type AssignmentStatus = z.infer<typeof AssignmentStatusSchema>;

export const SubmissionStatusSchema = z.enum(["Draft", "Submitted", "Graded"]);
export type SubmissionStatus = z.infer<typeof SubmissionStatusSchema>;

export const CourseSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    subject: z.string(),
    instructorId: z.number().int().nullable().optional(),
    instructorName: z.string().nullable().optional(),
    learnerCount: z.number().int().nonnegative().optional(),
    teacherId: z.number().int().nullable().optional(),
    teacherName: z.string().nullable().optional(),
    studentCount: z.number().int().nonnegative().optional(),
});
export type Course = z.infer<typeof CourseSchema>;

export const AssignmentSchema = z.object({
    id: z.number().int(),
    courseId: z.number().int(),
    courseName: z.string().nullable(),
    subject: z.string().nullable(),
    title: z.string(),
    description: z.string(),
    deadlineUtc: z.iso.datetime(),
    maxMarks: z.number().int(),
    status: AssignmentStatusSchema,
    createdById: z.number().int(),
    createdAtUtc: z.iso.datetime(),
});
export type Assignment = z.infer<typeof AssignmentSchema>;

export const SubmissionSchema = z.object({
    id: z.number().int(),
    assignmentId: z.number().int(),
    assignmentTitle: z.string().nullable(),
    learnerId: z.number().int().optional(),
    learnerName: z.string().nullable().optional(),
    studentId: z.number().int().optional(),
    studentName: z.string().nullable().optional(),
    answer: z.string(),
    status: SubmissionStatusSchema,
    marks: z.number().nullable(),
    feedback: z.string().nullable(),
    submittedAtUtc: z.iso.datetime().nullable(),
    createdAtUtc: z.iso.datetime(),
});
export type Submission = z.infer<typeof SubmissionSchema>;

export const UserSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    email: z.string(),
    role: RoleSchema,
    isActive: z.boolean(),
    createdAtUtc: z.iso.datetime(),
});
export type User = z.infer<typeof UserSchema>;

export const AttachmentSchema = z.object({
    id: z.number().int(),
    title: z.string(),
    fileType: z.string(),
    thumbClass: z.string(),
});
export type Attachment = z.infer<typeof AttachmentSchema>;

export const AnnouncementSchema = z.object({
    id: z.number().int(),
    author: z.string(),
    avatarClass: z.string(),
    date: z.string(),
    text: z.string(),
    attachments: z.array(AttachmentSchema),
});
export type Announcement = z.infer<typeof AnnouncementSchema>;

export const ClassworkEntrySchema = z.object({
    id: z.number().int(),
    title: z.string(),
    topic: z.string(),
    dueLabel: z.string(),
    postedLabel: z.string(),
    status: z.enum(["Assigned", "Submitted", "Graded", "Draft"]),
    description: z.string(),
    kind: z.enum(["assignment", "material", "quiz"]).optional(),
});
export type ClassworkEntry = z.infer<typeof ClassworkEntrySchema>;

export const ClassPersonSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    role: RoleSchema,
    avatarClass: z.string(),
});
export type ClassPerson = z.infer<typeof ClassPersonSchema>;

export const ClassDetailsSchema = z.object({
    courseId: z.number().int(),
    session: z.string().optional(),
    bannerColor: z.string(),
    bannerEmoji: z.string(),
    announcements: z.array(AnnouncementSchema),
    classwork: z.array(ClassworkEntrySchema),
    people: z.array(ClassPersonSchema),
});
export type ClassDetails = z.infer<typeof ClassDetailsSchema>;

export const HomeClassSchema = CourseSchema.extend({
    headerColor: z.string(),
    emoji: z.string(),
    instructorAvatarClass: z.string().optional(),
    teacherAvatarClass: z.string().optional(),
});
export type HomeClass = z.infer<typeof HomeClassSchema>;

export const SidebarClassSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    sub: z.string().optional(),
    letter: z.string().length(1),
    avatarClass: z.string(),
});
export type SidebarClass = z.infer<typeof SidebarClassSchema>;

export const DueAssignmentSchema = z.object({
    id: z.number().int(),
    title: z.string(),
    courseName: z.string(),
    dueDate: z.string(),
    dueTime: z.string(),
});
export type DueAssignment = z.infer<typeof DueAssignmentSchema>;

export { initialOf } from "@/lib/utils/format";