export interface SessionMaterial {
    id: number;
    sessionId: number;
    title: string;
    kind: string;
    url: string | null;
    fileName: string;
    fileType: string;
    fileSize: string;
    description: string;
    sortOrder: number;
    createdAtUtc: string;
}

export interface VideoMarker {
    id: number;
    timestampSeconds: number;
    label: string;
}

export interface SessionDto {
    id: number;
    courseId: number;
    sessionNumber: number;
    title: string;
    topic: string;
    description: string;
    meetingUrl: string | null;
    meetingProvider: string;
    meetingId: string;
    meetingPasscode: string;
    scheduledAtUtc: string | null;
    durationMinutes: number;
    videoUrl: string | null;
    videoProvider: string;
    videoDurationMinutes: number | null;
    status: string;
    createdAtUtc: string;
    materials: SessionMaterial[];
    videoMarkers: VideoMarker[];
    assignmentIds: number[];
    assignmentTitles: string[];
}

export interface CreateSessionPayload {
    courseId: number;
    sessionNumber?: number;
    title: string;
    topic?: string;
    description?: string;
    meetingUrl?: string | null;
    meetingProvider?: string;
    meetingId?: string;
    meetingPasscode?: string;
    scheduledAtUtc?: string | null;
    durationMinutes?: number;
    videoUrl?: string | null;
    videoProvider?: string;
    videoDurationMinutes?: number | null;
    status?: string;
}

export interface UpdateSessionPayload {
    sessionNumber?: number;
    title?: string;
    topic?: string;
    description?: string;
    meetingUrl?: string | null;
    meetingProvider?: string;
    meetingId?: string;
    meetingPasscode?: string;
    scheduledAtUtc?: string | null;
    durationMinutes?: number;
    videoUrl?: string | null;
    videoProvider?: string;
    videoDurationMinutes?: number | null;
    status?: string;
}

export interface AnnouncementDto {
    id: number;
    courseId: number;
    authorId: number;
    authorName: string | null;
    title: string;
    body: string;
    isPinned: boolean;
    createdAtUtc: string;
}

export interface CreateAnnouncementPayload {
    courseId: number;
    title: string;
    body: string;
    isPinned?: boolean;
}

export interface UpdateAnnouncementPayload {
    title?: string;
    body?: string;
    isPinned?: boolean;
}

export type LiveClassState = "upcoming" | "live" | "post";

export function getLiveClassState(
    scheduledAtUtc: string | null,
    durationMinutes: number,
): LiveClassState {
    if (!scheduledAtUtc) return "upcoming";
    const now = Date.now();
    const start = new Date(scheduledAtUtc).getTime();
    const end = start + durationMinutes * 60_000;
    const liveWindowStart = start - 15 * 60_000;
    if (now >= liveWindowStart && now <= end) return "live";
    if (now > end) return "post";
    return "upcoming";
}

export function formatCountdown(targetUtc: string): string {
    const diff = new Date(targetUtc).getTime() - Date.now();
    if (diff <= 0) return "Starting now";
    const totalMinutes = Math.floor(diff / 60_000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours >= 24) {
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}