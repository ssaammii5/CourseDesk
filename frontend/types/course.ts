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
    instructorIds: z.array(z.number().int()).optional(),
    instructorNames: z.array(z.string()).optional(),
    learnerCount: z.number().int().nonnegative().optional(),
    teacherId: z.number().int().nullable().optional(),
    teacherName: z.string().nullable().optional(),
    teacherIds: z.array(z.number().int()).optional(),
    teacherNames: z.array(z.string()).optional(),
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

export const CourseworkEntrySchema = z.object({
    id: z.number().int(),
    title: z.string(),
    topic: z.string(),
    dueLabel: z.string(),
    postedLabel: z.string(),
    status: z.enum(["Assigned", "Submitted", "Graded", "Draft"]),
    description: z.string(),
    kind: z.enum(["assignment", "material", "quiz"]).optional(),
    deadlineUtc: z.string().optional(),
    maxMarks: z.number().optional(),
    submissionCount: z.number().optional(),
    turnedInCount: z.number().optional(),
    gradedCount: z.number().optional(),
    assignedCount: z.number().optional(),
});

export type CourseworkEntry = z.infer<typeof CourseworkEntrySchema>;
export const ClassworkEntrySchema = CourseworkEntrySchema;
export type ClassworkEntry = CourseworkEntry;

export const CoursePersonSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    role: RoleSchema,
    avatarClass: z.string(),
});
export type CoursePerson = z.infer<typeof CoursePersonSchema>;
export const ClassPersonSchema = CoursePersonSchema;
export type ClassPerson = CoursePerson;

export const CourseDetailsSchema = z.object({
    courseId: z.number().int(),
    session: z.string().optional(),
    bannerColor: z.string(),
    bannerEmoji: z.string(),
    announcements: z.array(AnnouncementSchema),
    classwork: z.array(CourseworkEntrySchema),
    coursework: z.array(CourseworkEntrySchema).optional(),
    people: z.array(CoursePersonSchema),
});
export type CourseDetails = z.infer<typeof CourseDetailsSchema>;
export const ClassDetailsSchema = CourseDetailsSchema;
export type ClassDetails = CourseDetails;

export const HomeCourseSchema = CourseSchema.extend({
    headerColor: z.string(),
    emoji: z.string(),
    instructorAvatarClass: z.string().optional(),
    teacherAvatarClass: z.string().optional(),
});
export type HomeCourse = z.infer<typeof HomeCourseSchema>;
export const HomeClassSchema = HomeCourseSchema;
export type HomeClass = HomeCourse;

export const SidebarCourseSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    sub: z.string().optional(),
    letter: z.string().length(1),
    avatarClass: z.string(),
});
export type SidebarCourse = z.infer<typeof SidebarCourseSchema>;
export const SidebarClassSchema = SidebarCourseSchema;
export type SidebarClass = SidebarCourse;

export const DueAssignmentSchema = z.object({
    id: z.number().int(),
    title: z.string(),
    courseName: z.string(),
    dueDate: z.string(),
    dueTime: z.string(),
});
export type DueAssignment = z.infer<typeof DueAssignmentSchema>;
