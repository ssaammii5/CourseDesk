"use client";

import React, { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
    AlertCircle,
    Check,
    Clock,
    FileText,
    FolderPlus,
    Loader2,
    Play,
    Tag,
    UploadCloud,
    Video,
    X,
} from "lucide-react";
import type { SessionDto } from "@/types/session";
import { extractYouTubeId, parseVideoUrl } from "@/lib/utils/video";
import { createVideoSessionRequest, updateVideoSessionRequest } from "@/lib/api/sessions";


interface VideoFormModalProps {
    open: boolean;
    courseId: number;
    initialData?: SessionDto | null;
    existingTopics?: string[];
    onClose: () => void;
    onSuccess: (session: SessionDto) => void;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function VideoFormModal({
    open,
    courseId,
    initialData,
    existingTopics = [],
    onClose,
    onSuccess,
}: VideoFormModalProps) {
    const isEditing = Boolean(initialData);

    const [videoUrl, setVideoUrl] = useState("");
    const [title, setTitle] = useState("");
    const [topic, setTopic] = useState("");
    const [customTopic, setCustomTopic] = useState("");
    const [description, setDescription] = useState("");
    const [durationMinutes, setDurationMinutes] = useState(45);
    const [file, setFile] = useState<File | null>(null);
    const [existingFile, setExistingFile] = useState<{
        name: string;
        size?: string | null;
        url?: string | null;
    } | null>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setErrorMessage(null);
            setIsSubmitting(false);
            if (initialData) {
                setVideoUrl(initialData.videoUrl || "");
                setTitle(initialData.title || "");
                const currentTopic = initialData.topic || "General Videos";
                if (existingTopics.includes(currentTopic)) {
                    setTopic(currentTopic);
                    setCustomTopic("");
                } else {
                    setTopic("__custom__");
                    setCustomTopic(currentTopic);
                }
                setDescription(initialData.description || "");
                setDurationMinutes(initialData.durationMinutes || 45);
                setFile(null);
                if (initialData.fileName || initialData.fileUrl) {
                    setExistingFile({
                        name: initialData.fileName || "Attached file",
                        size: initialData.fileSize,
                        url: initialData.fileUrl,
                    });
                } else if (initialData.materials && initialData.materials.length > 0) {
                    const firstMat = initialData.materials[0];
                    setExistingFile({
                        name: firstMat.fileName || firstMat.title,
                        size: firstMat.fileSize,
                        url: firstMat.url,
                    });
                } else {
                    setExistingFile(null);
                }
            } else {
                setVideoUrl("");
                setTitle("");
                setTopic(existingTopics[0] || "General Videos");
                setCustomTopic("");
                setDescription("");
                setDurationMinutes(45);
                setFile(null);
                setExistingFile(null);
            }
        }
    }, [open, initialData, existingTopics]);

    if (!open) return null;

    const ytId = extractYouTubeId(videoUrl);
    const parsed = videoUrl ? parseVideoUrl(videoUrl) : null;

    const handleFileSelect = (selectedFile: File) => {
        if (selectedFile.size > 50 * 1024 * 1024) {
            setErrorMessage("File exceeds the maximum limit of 50 MB.");
            return;
        }
        setErrorMessage(null);
        setFile(selectedFile);
    };

    const onDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!title.trim()) {
            setErrorMessage("Please enter a video title.");
            return;
        }

        if (!videoUrl.trim()) {
            setErrorMessage("Please enter a valid video URL.");
            return;
        }

        const resolvedTopic =
            topic === "__custom__"
                ? customTopic.trim() || "General Videos"
                : topic.trim() || "General Videos";

        try {
            setIsSubmitting(true);
            const formData = new FormData();
            formData.append("course_id", String(courseId));
            formData.append("title", title.trim());
            formData.append("video_url", videoUrl.trim());
            formData.append("description", description.trim());
            formData.append("topic", resolvedTopic);
            formData.append("duration_minutes", String(durationMinutes || 45));

            if (file) {
                formData.append("file", file);
            }

            let result: SessionDto;
            if (isEditing && initialData?.id) {
                result = await updateVideoSessionRequest(initialData.id, formData);
            } else {
                result = await createVideoSessionRequest(formData);
            }

            onSuccess(result);
            onClose();
        } catch (err: unknown) {
            const msg =
                err instanceof Error
                    ? err.message
                    : "Failed to save video. Please verify inputs and try again.";
            setErrorMessage(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                            <Video className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                {isEditing ? "Edit Lecture Video" : "Add Lecture Video"}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Setup video recording, lecture handouts, and description
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(85vh-7rem)] overflow-y-auto">
                    {errorMessage && (
                        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Video URL Input */}
                    <div className="space-y-1.5">
                        <label className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                            <span className="flex items-center gap-1.5">
                                <Video className="h-4 w-4 text-[#1a73e8]" />
                                Video URL *
                            </span>
                            {videoUrl.trim() && (
                                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <Check className="h-3 w-3" /> Valid Video Link
                                </span>
                            )}
                        </label>
                        <input
                            type="url"
                            required
                            placeholder="e.g. https://domain.com/video/lecture-1 or direct link"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none transition-all"
                        />
                    </div>

                    {/* Video Preview Card */}
                    {ytId && (
                        <div className="flex items-center gap-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3">
                            <div className="relative shrink-0 w-28 aspect-video rounded-lg overflow-hidden bg-black shadow-xs">
                                <img
                                    src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                                    alt="Video Preview"
                                    className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <Play className="h-4 w-4 text-white fill-white" />
                                </div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="inline-block rounded-md bg-blue-100 dark:bg-blue-950/70 px-1.5 py-0.5 text-[10px] font-semibold text-[#1a73e8] dark:text-blue-400">
                                    Video Lesson
                                </span>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 truncate">
                                    Ready to attach to lecture
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Video Title */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            Video Title *
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Lecture 01: Introduction to Network Security"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none transition-all"
                        />
                    </div>

                    {/* Topic / Module Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Tag className="h-3.5 w-3.5 text-[#1a73e8]" />
                                Topic / Module
                            </label>
                            <select
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none transition-all cursor-pointer"
                            >
                                <option value="General Videos">General Videos</option>
                                {existingTopics
                                    .filter((t) => t !== "General Videos")
                                    .map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                <option value="__custom__">+ Create New Topic...</option>
                            </select>
                        </div>

                        {/* Duration (Minutes) */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                Duration (Minutes)
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={480}
                                value={durationMinutes}
                                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Custom Topic Input if selected */}
                    {topic === "__custom__" && (
                        <div className="space-y-1.5 animate-in fade-in duration-150">
                            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <FolderPlus className="h-3.5 w-3.5 text-[#1a73e8]" />
                                New Topic Name *
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Module 2: Symmetric & Asymmetric Encryption"
                                value={customTopic}
                                onChange={(e) => setCustomTopic(e.target.value)}
                                className="w-full rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-950/20 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none transition-all"
                            />
                        </div>
                    )}

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            Description &amp; Key Highlights
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Detailed overview of what is covered in this video lecture, reading materials, key points..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none transition-all resize-y"
                        />
                    </div>

                    {/* Lecture File / Handout Attachment */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            Lecture Handout / File (PDF, Slides, Code, Notes)
                        </label>

                        {/* Existing Attached File in Edit Mode */}
                        {existingFile && !file && (
                            <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3 mb-2">
                                <div className="flex items-center gap-2.5 truncate">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div className="truncate">
                                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                            {existingFile.name}
                                        </p>
                                        {existingFile.size && (
                                            <span className="text-[11px] text-slate-400">
                                                {existingFile.size} • Existing file
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-xs text-[#1a73e8] dark:text-blue-400 hover:underline font-medium cursor-pointer"
                                >
                                    Replace
                                </button>
                            </div>
                        )}

                        {/* Newly Selected File */}
                        {file ? (
                            <div className="flex items-center justify-between rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 p-3">
                                <div className="flex items-center gap-2.5 truncate">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div className="truncate">
                                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                            {file.name}
                                        </p>
                                        <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                                            {formatBytes(file.size)} • Ready to upload
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFile(null)}
                                    className="rounded-full p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            /* Dropzone */
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={onDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all ${
                                    isDragging
                                        ? "border-[#1a73e8] bg-blue-50/50 dark:bg-blue-950/40"
                                        : "border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/50 dark:bg-slate-850/50"
                                }`}
                            >
                                <UploadCloud className="h-7 w-7 text-slate-400 dark:text-slate-500 mb-1" />
                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    Click or drag &amp; drop lecture file here
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    PDF, PPTX, DOCX, ZIP, or code handouts up to 50 MB
                                </p>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={onFileChange}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,.png,.jpg,.jpeg"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#1a73e8] hover:bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span>Saving Video...</span>
                                </>
                            ) : (
                                <span>{isEditing ? "Save Changes" : "Add Video"}</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
