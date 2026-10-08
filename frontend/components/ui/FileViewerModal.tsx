"use client";

import { useEffect, useRef, useState } from "react";
import {
    Download,
    ExternalLink,
    FileArchive,
    FileAudio,
    FileCode,
    FileSpreadsheet,
    FileText,
    FileVideo,
    Globe,
    Image as ImageIcon,
    Paperclip,
    X,
} from "lucide-react";
import { API_URL } from "@/lib/api/client";

export interface PreviewableAttachment {
    id?: number | string;
    title: string;
    fileType?: string;
    fileSize?: string;
    url?: string | null;
    kind?: "file" | "link";
}

interface FileViewerModalProps {
    attachment: PreviewableAttachment;
    onClose: () => void;
}

const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "avif"];
const TEXT_EXTS = ["txt", "md", "csv", "json", "log", "js", "ts", "jsx", "tsx", "html", "css", "xml", "yml", "yaml", "py", "sql", "sh", "env", "toml"];
const DOC_EXTS = ["doc", "docx", "odt", "rtf"];
const SHEET_EXTS = ["xls", "xlsx", "ods"];
const ARCHIVE_EXTS = ["zip", "rar", "7z", "tar", "gz"];
const VIDEO_EXTS = ["mp4", "webm", "ogg", "mov", "mkv"];
const AUDIO_EXTS = ["mp3", "wav", "m4a", "flac", "aac"];

function extOf(name: string): string {
    const i = name.lastIndexOf(".");
    return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

function getFileVisual(fileName: string, kind?: "file" | "link") {
    if (kind === "link") {
        return {
            icon: Globe,
            bgClass: "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400",
            label: "LINK",
        };
    }
    const ext = extOf(fileName);
    if (ext === "pdf") {
        return {
            icon: FileText,
            bgClass: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400",
            label: "PDF",
        };
    }
    if (DOC_EXTS.includes(ext)) {
        return {
            icon: FileText,
            bgClass: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400",
            label: ext.toUpperCase(),
        };
    }
    if (SHEET_EXTS.includes(ext)) {
        return {
            icon: FileSpreadsheet,
            bgClass: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400",
            label: ext.toUpperCase(),
        };
    }
    if (ARCHIVE_EXTS.includes(ext)) {
        return {
            icon: FileArchive,
            bgClass: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400",
            label: ext.toUpperCase(),
        };
    }
    if (IMAGE_EXTS.includes(ext)) {
        return {
            icon: ImageIcon,
            bgClass: "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400",
            label: ext.toUpperCase(),
        };
    }
    if (VIDEO_EXTS.includes(ext)) {
        return {
            icon: FileVideo,
            bgClass: "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400",
            label: ext.toUpperCase(),
        };
    }
    if (AUDIO_EXTS.includes(ext)) {
        return {
            icon: FileAudio,
            bgClass: "bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400",
            label: ext.toUpperCase(),
        };
    }
    if (["js", "ts", "jsx", "tsx", "py", "json", "html", "css", "sql", "sh"].includes(ext)) {
        return {
            icon: FileCode,
            bgClass: "bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400",
            label: ext.toUpperCase(),
        };
    }
    return {
        icon: FileText,
        bgClass: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
        label: (ext || "FILE").toUpperCase(),
    };
}

export function FileViewerModal({ attachment, onClose }: FileViewerModalProps) {
    const ext = extOf(attachment.title);
    const rawUrl = attachment.url;
    const url = rawUrl?.startsWith("http")
        ? rawUrl
        : rawUrl
        ? `${API_URL}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`
        : undefined;

    const visual = getFileVisual(attachment.title, attachment.kind);
    const HeaderIcon = visual.icon;

    const isImage = IMAGE_EXTS.includes(ext);
    const isPdf = ext === "pdf";
    const isText = TEXT_EXTS.includes(ext);
    const isDocx = ext === "docx";
    const isZip = ext === "zip";
    const isVideo = VIDEO_EXTS.includes(ext);
    const isAudio = AUDIO_EXTS.includes(ext);

    const [text, setText] = useState<string | null>(null);
    const [zipEntries, setZipEntries] = useState<string[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const docxRef = useRef<HTMLDivElement>(null);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        let cancelled = false;
        setText(null);
        setZipEntries(null);
        setError(null);
        if (!url) return;

        if (isText) {
            fetch(url)
                .then((r) => r.text())
                .then((t) => !cancelled && setText(t))
                .catch(() => !cancelled && setError("Could not read text content from this file."));
        } else if (isDocx) {
            (async () => {
                try {
                    const buf = await (await fetch(url)).arrayBuffer();
                    const { renderAsync } = await import("docx-preview");
                    if (cancelled || !docxRef.current) return;
                    docxRef.current.innerHTML = "";
                    await renderAsync(buf, docxRef.current);
                } catch {
                    if (!cancelled) setError("Could not render this Word document in browser.");
                }
            })();
        } else if (isZip) {
            (async () => {
                try {
                    const JSZip = (await import("jszip")).default;
                    const buf = await (await fetch(url)).arrayBuffer();
                    const zip = await JSZip.loadAsync(buf);
                    const names = Object.values(zip.files)
                        .filter((f) => !f.dir)
                        .map((f) => f.name);
                    if (!cancelled) setZipEntries(names);
                } catch {
                    if (!cancelled) setError("Could not read this ZIP archive contents.");
                }
            })();
        }

        return () => {
            cancelled = true;
        };
    }, [url, isText, isDocx, isZip]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-150"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${visual.bgClass}`}>
                            <HeaderIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 truncate">
                            <span className="truncate text-sm font-bold text-slate-900 dark:text-slate-100 block">
                                {attachment.title}
                            </span>
                            {attachment.fileSize && attachment.fileSize !== "—" && (
                                <span className="text-[11px] text-slate-400">{attachment.fileSize}</span>
                            )}
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        {url && (
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-colors dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Open in new tab</span>
                            </a>
                        )}
                        {url && (
                            <a
                                href={url}
                                download={attachment.title}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
                            >
                                <Download className="h-3.5 w-3.5" />
                                <span>Download</span>
                            </a>
                        )}
                        <button
                            type="button"
                            aria-label="Close preview"
                            onClick={onClose}
                            className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors ml-1"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="min-h-0 flex-1 overflow-auto bg-slate-100/70 dark:bg-slate-950/70">
                    {!url ? (
                        <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-500 dark:text-slate-400">
                            <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                No preview URL is available for this attachment.
                            </p>
                        </div>
                    ) : isImage ? (
                        <div className="flex min-h-full items-center justify-center p-6">
                            <img
                                src={url}
                                alt={attachment.title}
                                className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-md"
                            />
                        </div>
                    ) : isPdf ? (
                        <iframe src={url} title={attachment.title} className="h-full w-full border-0" />
                    ) : isVideo ? (
                        <div className="flex min-h-full items-center justify-center p-6">
                            <video src={url} controls className="max-h-[75vh] max-w-full rounded-xl shadow-md">
                                Your browser does not support video playback.
                            </video>
                        </div>
                    ) : isAudio ? (
                        <div className="flex min-h-full flex-col items-center justify-center gap-4 p-6">
                            <FileAudio className="h-16 w-16 text-pink-500" />
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{attachment.title}</p>
                            <audio src={url} controls className="w-full max-w-md">
                                Your browser does not support audio playback.
                            </audio>
                        </div>
                    ) : isText ? (
                        error ? (
                            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-500 dark:text-slate-400">
                                <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
                            </div>
                        ) : text === null ? (
                            <div className="flex h-full items-center justify-center p-8 text-slate-500 dark:text-slate-400 text-sm">
                                Loading preview…
                            </div>
                        ) : (
                            <pre className="font-mono text-xs leading-relaxed text-slate-800 p-6 whitespace-pre-wrap dark:text-slate-200">
                                {text}
                            </pre>
                        )
                    ) : isDocx ? (
                        error ? (
                            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-500 dark:text-slate-400">
                                <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
                            </div>
                        ) : (
                            <div ref={docxRef} className="mx-auto min-h-full max-w-3xl bg-white p-8 shadow-sm dark:bg-slate-900 dark:text-slate-100" />
                        )
                    ) : isZip ? (
                        error ? (
                            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-500 dark:text-slate-400">
                                <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
                            </div>
                        ) : zipEntries === null ? (
                            <div className="flex h-full items-center justify-center p-8 text-slate-500 dark:text-slate-400 text-sm">
                                Loading archive contents…
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-200 bg-white p-4 dark:divide-slate-800 dark:bg-slate-900">
                                {zipEntries.length === 0 && (
                                    <li className="p-4 text-xs text-slate-500 dark:text-slate-400">This archive is empty.</li>
                                )}
                                {zipEntries.map((name) => (
                                    <li key={name} className="flex items-center gap-3 p-3 text-xs text-slate-800 dark:text-slate-200">
                                        <Paperclip className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                                        <span className="truncate">{name}</span>
                                    </li>
                                ))}
                            </ul>
                        )
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                            <FileText className="h-12 w-12 text-slate-400 dark:text-slate-600" />
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                In-browser preview is not available for this file format.
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                                Click &quot;Download&quot; or &quot;Open in new tab&quot; above to view this file on your device.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
