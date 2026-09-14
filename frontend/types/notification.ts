export type NotificationKind =
    | "assignment"
    | "grade"
    | "announcement"
    | "submission"
    | "due"
    | "session"
    | "system";

export interface NotificationItem {
    id: number;
    userId: number;
    title: string;
    message: string;
    kind: NotificationKind;
    link: string | null;
    isRead: boolean;
    createdAtUtc: string;
}

export interface NotificationListResponse {
    items: NotificationItem[];
    unreadCount: number;
}

export interface NotificationPreferences {
    emailNotifications: boolean;
    assignmentNotifications: boolean;
    gradeNotifications: boolean;
    announcementNotifications: boolean;
    dueDateReminders: boolean;
}
