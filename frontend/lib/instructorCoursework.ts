import type { CourseworkEntry } from "@/types";

const STORAGE_KEY = "coursedesk.instructor.coursework.v1";

type Store = Record<string, CourseworkEntry[]>;

function readStore(): Store {
    if (typeof window === "undefined") return {};
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw) as Store;
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

function writeStore(store: Store) {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
        /* storage unavailable — ignore */
    }
}

/** Returns the saved coursework list for a course, or the seed list on first visit. */
export function loadInstructorCoursework(
    courseId: number,
    seed: CourseworkEntry[],
): CourseworkEntry[] {
    const saved = readStore()[String(courseId)];
    return Array.isArray(saved) ? saved : seed;
}

export function saveInstructorCoursework(courseId: number, entries: CourseworkEntry[]) {
    const store = readStore();
    store[String(courseId)] = entries;
    writeStore(store);
}
