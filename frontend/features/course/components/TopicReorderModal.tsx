"use client";

import React, { useEffect, useState } from "react";
import {
    Check,
    ChevronDown,
    ChevronUp,
    GripVertical,
    Layers,
    Loader2,
    RefreshCw,
    X,
} from "lucide-react";
import { reorderCourseTopicsRequest } from "@/lib/api/sessions";
import type { SessionDto } from "@/types/session";

export interface TopicItem {
    id: string;
    title: string;
    count: number;
}

interface TopicReorderModalProps {
    open: boolean;
    courseId?: number;
    initialTopics: TopicItem[];
    onClose: () => void;
    onSuccess: (updatedSessions: SessionDto[]) => void;
}

export function TopicReorderModal({
    open,
    courseId,
    initialTopics,
    onClose,
    onSuccess,
}: TopicReorderModalProps) {
    const [topicList, setTopicList] = useState<TopicItem[]>(initialTopics);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [draggingTopicId, setDraggingTopicId] = useState<string | null>(null);
    const [dragOverTopicId, setDragOverTopicId] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setTopicList(initialTopics);
            setStatusMessage(null);
        }
    }, [open, initialTopics]);

    if (!open) return null;

    const moveTopic = (index: number, direction: "up" | "down") => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= topicList.length) return;

        const next = [...topicList];
        const [moved] = next.splice(index, 1);
        next.splice(targetIndex, 0, moved);
        setTopicList(next);
        setStatusMessage(null);
    };

    const handleDragStart = (e: React.DragEvent, topicId: string) => {
        e.dataTransfer.setData("text/plain", topicId);
        e.dataTransfer.effectAllowed = "move";
        setDraggingTopicId(topicId);
    };

    const handleDragOver = (e: React.DragEvent, topicId: string) => {
        e.preventDefault();
        if (!draggingTopicId || draggingTopicId === topicId) return;
        e.dataTransfer.dropEffect = "move";
        setDragOverTopicId(topicId);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        const related = e.relatedTarget as Node | null;
        if (!e.currentTarget.contains(related)) {
            setDragOverTopicId(null);
        }
    };

    const handleDrop = (e: React.DragEvent, targetTopicId: string) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData("text/plain") || draggingTopicId;
        setDraggingTopicId(null);
        setDragOverTopicId(null);

        if (!draggedId || draggedId === targetTopicId) return;

        const fromIdx = topicList.findIndex((t) => t.id === draggedId);
        const toIdx = topicList.findIndex((t) => t.id === targetTopicId);
        if (fromIdx === -1 || toIdx === -1) return;

        const next = [...topicList];
        const [moved] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, moved);
        setTopicList(next);
        setStatusMessage(null);
    };

    const handleReset = () => {
        setTopicList(initialTopics);
        setStatusMessage(null);
    };

    const handleSave = async () => {
        if (!courseId) return;
        try {
            setIsSaving(true);
            setStatusMessage(null);
            const topicTitles = topicList.map((t) => t.title);
            const updatedSessions = await reorderCourseTopicsRequest(courseId, {
                topics: topicTitles,
            });
            setStatusMessage("Saved topic order to database!");
            setTimeout(() => {
                onSuccess(updatedSessions);
                onClose();
            }, 800);
        } catch (err) {
            console.error("Failed to reorder topics in database", err);
            setStatusMessage("Failed to save topic order to database.");
        } finally {
            setIsSaving(false);
        }
    };

    const hasOrderChanged =
        topicList.map((t) => t.id).join(",") !== initialTopics.map((t) => t.id).join(",");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div
                className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl transition-all overflow-hidden flex flex-col max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                            <Layers className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                Reorder Course Topics
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Rearrange topics sequence in this course. Saved to database.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {topicList.length <= 1 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                            <p className="font-medium text-slate-700 dark:text-slate-300">
                                {topicList.length === 1
                                    ? `Only 1 topic found: "${topicList[0].title}"`
                                    : "No topics currently available in this course."}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                                Add or edit videos with different topic names to create multiple topic sections.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Drag or use arrows to change sequence:
                            </p>
                            <div className="space-y-2">
                                {topicList.map((topic, index) => {
                                    const isDragging = draggingTopicId === topic.id;
                                    const isDragOver = dragOverTopicId === topic.id;

                                    return (
                                        <div
                                            key={topic.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, topic.id)}
                                            onDragOver={(e) => handleDragOver(e, topic.id)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, topic.id)}
                                            className={`flex items-center gap-3 rounded-xl border p-3 transition-all select-none ${
                                                isDragging
                                                    ? "opacity-30 border-dashed border-indigo-400 bg-indigo-50/20"
                                                    : isDragOver
                                                    ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-xs"
                                                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700"
                                            }`}
                                        >
                                            {/* Drag handle */}
                                            <div
                                                className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                                title="Drag to rearrange topic"
                                            >
                                                <GripVertical className="h-4 w-4" />
                                            </div>

                                            {/* Number badge */}
                                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-100/80 dark:bg-indigo-950 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                                {index + 1}
                                            </div>

                                            {/* Topic Title & Video Count */}
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                    {topic.title}
                                                </h4>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    {topic.count} {topic.count === 1 ? "video" : "videos"}
                                                </p>
                                            </div>

                                            {/* Up / Down Action buttons */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    type="button"
                                                    disabled={index === 0 || isSaving}
                                                    onClick={() => moveTopic(index, "up")}
                                                    title="Move up"
                                                    className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                                                >
                                                    <ChevronUp className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={index === topicList.length - 1 || isSaving}
                                                    onClick={() => moveTopic(index, "down")}
                                                    title="Move down"
                                                    className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                                                >
                                                    <ChevronDown className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {statusMessage && (
                        <div
                            className={`rounded-xl px-3.5 py-2.5 text-xs font-medium ${
                                statusMessage.includes("Failed")
                                    ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                                    : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            }`}
                        >
                            {statusMessage}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={!hasOrderChanged || isSaving}
                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Reset Order</span>
                    </button>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!hasOrderChanged || isSaving}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span>Saving to DB...</span>
                                </>
                            ) : (
                                <>
                                    <Check className="h-3.5 w-3.5" />
                                    <span>Save Topic Order</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
