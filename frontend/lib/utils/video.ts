export type VideoProvider = "youtube" | "vimeo" | "zoom" | "direct" | "unknown";

export interface ParsedVideo {
    provider: VideoProvider;
    embedUrl: string;
    thumbnailUrl?: string;
}

export function detectVideoProvider(url: string): VideoProvider {
    if (!url) return "unknown";
    if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
    if (/vimeo\.com/i.test(url)) return "vimeo";
    if (/zoom\.us\/rec/i.test(url)) return "zoom";
    if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return "direct";
    return "unknown";
}

export function extractYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
    }
    return null;
}

export function extractVimeoId(url: string): string | null {
    const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return m ? m[1] : null;
}

export function parseVideoUrl(url: string): ParsedVideo {
    const provider = detectVideoProvider(url);

    if (provider === "youtube") {
        const id = extractYouTubeId(url);
        if (id) {
            return {
                provider,
                embedUrl: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`,
                thumbnailUrl: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
            };
        }
    }

    if (provider === "vimeo") {
        const id = extractVimeoId(url);
        if (id) {
            return {
                provider,
                embedUrl: `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`,
            };
        }
    }

    if (provider === "direct") {
        return { provider, embedUrl: url };
    }

    return { provider: "unknown", embedUrl: url };
}

export function formatTimestamp(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) {
        return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${m}:${String(s).padStart(2, "0")}`;
}

export const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;