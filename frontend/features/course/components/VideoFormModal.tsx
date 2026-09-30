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
    Plus,
    Tag,
    Trash2,
    UploadCloud,
    Video,
    X,
} from "lucide-react";
import type { SessionDto } from "@/types/session";
import { extractYouTubeId, parseVideoUrl } from "@/lib/utils/video";
import {
    createVideoSessionRequest,
    deleteSessionRequest,
    updateVideoSessionRequest,
} from "@/lib/api/sessions";


interface VideoFormModalProps {
    open: boolean;
    courseId: number;
    initialData?: SessionDto | null;
    existingTopics?: string[];
    onClose: () => void;
    onSuccess: (session: SessionDto) => void;
    onDelete?: (sessionId: number) => void;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

interface ExistingFileItem {
    id: number;
    name: string;
    size?: string | null;
    url?: string | null;
}

export function VideoFormModal({
    open,
    courseId,
    initialData,
    existingTopics = [],
    onClose,
    onSuccess,
    onDelete,
}: VideoFormModalProps) {
    const isEditing = Boolean(initialData);

    const [videoUrl, setVideoUrl] = useState("");
    const [title, setTitle] = useState("");
    const [topic, setTopic] = useState("");
    const [customTopic, setCustomTopic] = useState("");
    const [description, setDescription] = useState("");
    const [durationMinutes, setDurationMinutes] = useState(45);
    const [existingFiles, setExistingFiles] = useState<ExistingFileItem[]>([]);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [removedMaterialIds, setRemovedMaterialIds] = useState<number[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isDragging, setIsDragging] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setErrorMessage(null);
            setIsSubmitting(false);
            setShowDeleteConfirm(false);
            setIsDeleting(false);
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
                setNewFiles([]);
                setRemovedMaterialIds([]);

                const existingList: ExistingFileItem[] = [];
                if (initialData.materials && initialData.materials.length > 0) {
                    initialData.materials.forEach((m) => {
                        existingList.push({
                            id: m.id,
                            name: m.fileName || m.title,
                            size: m.fileSize,
                            url: m.url,
                        });
                    });
                }
                if (
                    initialData.fileUrl &&
                    !existingList.some((m) => m.url === initialData.fileUrl)
                ) {
                    existingList.unshift({
                        id: 9999000 + initialData.id,
                        name: initialData.fileName || "Attached file",
                        size: initialData.fileSize,
                        url: initialData.fileUrl,
                    });
                }
                setExistingFiles(existingList);
            } else {
                setVideoUrl("");
                setTitle("");
                setTopic(existingTopics[0] || "General Videos");
                setCustomTopic("");
                setDescription("");
                setDurationMinutes(45);
                setExistingFiles([]);
                setNewFiles([]);
                setRemovedMaterialIds([]);
            }
        }
    }, [open, initialData, existingTopics]);

    if (!open) return null;

    const ytId = extractYouTubeId(videoUrl);
    const parsed = videoUrl ? parseVideoUrl(videoUrl) : null;

    const handleFilesSelect = (selectedFiles: FileList | File[]) => {
        const valid: File[] = [];
        let oversized = false;
        Array.from(selectedFiles).forEach((f) => {
            if (f.size > 50 * 1024 * 1024) {
                oversized = true;
            } else {
                if (!newFiles.some((nf) => nf.name === f.name && nf.size === f.size)) {
                    valid.push(f);
                }
            }
        });

        if (oversized) {
            setErrorMessage("One or more files exceed the 50 MB limit and were skipped.");
        } else {
            setErrorMessage(null);
        }

        if (valid.length > 0) {
            setNewFiles((prev) => [...prev, ...valid]);
        }
    };

    const handleRemoveNewFile = (index: number) => {
        setNewFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleRemoveExistingFile = (item: ExistingFileItem) => {
        setExistingFiles((prev) => prev.filter((f) => f.id !== item.id));
        setRemovedMaterialIds((prev) => [...prev, item.id]);
    };

    const handleUndoRemoveExisting = () => {
        if (initialData) {
            const existingList: ExistingFileItem[] = [];
            if (initialData.materials && initialData.materials.length > 0) {
                initialData.materials.forEach((m) => {
                    existingList.push({
                        id: m.id,
                        name: m.fileName || m.title,
                        size: m.fileSize,
                        url: m.url,
                    });
                });
            }
            if (
                initialData.fileUrl &&
                !existingList.some((m) => m.url === initialData.fileUrl)
            ) {
                existingList.unshift({
                    id: 9999000 + initialData.id,
                    name: initialData.fileName || "Attached file",
                    size: initialData.fileSize,
                    url: initialData.fileUrl,
                });
            }
            setExistingFiles(existingList);
            setRemovedMaterialIds([]);
        }
    };

    const onDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFilesSelect(e.dataTransfer.files);
        }
    };

    const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFilesSelect(e.target.files);
            e.target.value = "";
        }
    };

    const handleDeleteVideo = async () => {
        if (!initialData?.id) return;
        try {
            setIsDeleting(true);
            await deleteSessionRequest(initialData.id);
            if (onDelete) {
                onDelete(initialData.id);
            }
            onClose();
        } catch (err: unknown) {
            const msg =
                err instanceof Error ? err.message : "Failed to delete video. Please try again.";
            setErrorMessage(msg);
            setShowDeleteConfirm(false);
        } finally {
            setIsDeleting(false);
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

            newFiles.forEach((f) => {
                formData.append("files", f);
            });

            if (isEditing) {
                if (removedMaterialIds.length > 0) {
                    formData.append("remove_material_ids", removedMaterialIds.join(","));
                }
                if (existingFiles.length === 0 && initialData?.fileUrl && newFiles.length === 0) {
                    formData.append("remove_file", "true");
                }
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

                    {/* Lecture Files & Handouts Attachment */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                Lecture Handouts &amp; Files (PDF, Slides, Code, Notes)
                            </label>
                            <span className="text-[11px] font-medium text-slate-400">
                                {existingFiles.length + newFiles.length > 0
                                    ? `${existingFiles.length + newFiles.length} ${
                                          existingFiles.length + newFiles.length === 1 ? "file" : "files"
                                      }`
                                    : "Optional"}
                            </span>
                        </div>

                        {/* Existing Files List */}
                        {existingFiles.length > 0 && (
                            <div className="space-y-1.5">
                                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                    Current Handouts ({existingFiles.length})
                                </p>
                                {existingFiles.map((ef) => (
                                    <div
                                        key={ef.id}
                                        className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-2.5 transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5 truncate">
                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                                <FileText className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="truncate">
                                                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                    {ef.name}
                                                </p>
                                                {ef.size && (
                                                    <span className="text-[10px] text-slate-400">
                                                        {ef.size} • Attached handout
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveExistingFile(ef)}
                                            className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium px-2 py-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                                            title="Remove this file"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            <span>Remove</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Undo removed materials notice */}
                        {removedMaterialIds.length > 0 && (
                            <div className="flex items-center justify-between rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-2.5 text-xs text-amber-800 dark:text-amber-300">
                                <span>
                                    {removedMaterialIds.length}{" "}
                                    {removedMaterialIds.length === 1 ? "file" : "files"} will be removed on save.
                                </span>
                                <button
                                    type="button"
                                    onClick={handleUndoRemoveExisting}
                                    className="font-semibold underline hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer ml-2"
                                >
                                    Undo
                                </button>
                            </div>
                        )}

                        {/* Newly Selected Files List */}
                        {newFiles.length > 0 && (
                            <div className="space-y-1.5">
                                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                                    New Files to Upload ({newFiles.length})
                                </p>
                                {newFiles.map((nf, idx) => (
                                    <div
                                        key={`${nf.name}-${idx}`}
                                        className="flex items-center justify-between rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 p-2.5"
                                    >
                                        <div className="flex items-center gap-2.5 truncate">
                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400">
                                                <FileText className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="truncate">
                                                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                    {nf.name}
                                                </p>
                                                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">
                                                    {formatBytes(nf.size)} • Ready to upload
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveNewFile(idx)}
                                            className="rounded-full p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                            title="Cancel file"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Dropzone & "Add More Files" Area */}
                        {existingFiles.length === 0 && newFiles.length === 0 ? (
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
                                    Click or drag &amp; drop files here (multiple files supported)
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    PDF, PPTX, DOCX, ZIP, or code handouts up to 50 MB each
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-blue-400 dark:border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 px-3 py-1.5 text-xs font-semibold text-[#1a73e8] dark:text-blue-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>Add More Files</span>
                                </button>
                                <span className="text-[11px] text-slate-400">
                                    Select or drop multiple files (PDF, PPTX, ZIP, Code)
                                </span>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={onFileChange}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,.png,.jpg,.jpeg"
                        />
                    </div>

                    {/* Action Buttons & Delete Confirmation */}
                    {showDeleteConfirm ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/80 bg-rose-50/90 dark:bg-rose-950/50">
                            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span className="text-xs font-semibold">
                                    Delete this entire video lecture permanently?
                                </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isDeleting}
                                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteVideo}
                                    disabled={isDeleting}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-3.5 w-3.5" />
                                            <span>Confirm Delete</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            {isEditing ? (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={isSubmitting || isDeleting}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100/80 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                                    title="Delete this video lecture"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Delete Video</span>
                                </button>
                            ) : (
                                <div />
                            )}

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSubmitting || isDeleting}
                                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || isDeleting}
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
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
