"use client";

import { useEffect, useState } from "react";
import { Pin, X } from "lucide-react";

interface AnnouncementFormModalProps {
    open: boolean;
    initialData?: {
        id?: number;
        title: string;
        body: string;
        isPinned: boolean;
    } | null;
    onClose: () => void;
    onSubmit: (data: { title: string; body: string; isPinned: boolean }) => void;
}

export function AnnouncementFormModal({
    open,
    initialData,
    onClose,
    onSubmit,
}: AnnouncementFormModalProps) {
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [isPinned, setIsPinned] = useState(false);

    useEffect(() => {
        if (open) {
            setTitle(initialData?.title ?? "");
            setBody(initialData?.body ?? "");
            setIsPinned(initialData?.isPinned ?? false);
        }
    }, [open, initialData]);

    if (!open) return null;

    const handleSubmit = () => {
        if (!body.trim() && !title.trim()) return;
        onSubmit({ title: title.trim(), body: body.trim(), isPinned });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {initialData ? "Edit Announcement" : "New Announcement"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-full p-2 text-gray-600 hover:bg-gray-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mt-5 space-y-4">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Title (optional)"
                        className="w-full rounded-md border border-gray-400/80 px-3.5 py-2.5 text-sm focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                    />
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Write your announcement…"
                        rows={5}
                        className="w-full rounded-md border border-gray-400/80 px-3.5 py-2.5 text-sm focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                    />
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={isPinned}
                            onChange={(e) => setIsPinned(e.target.checked)}
                            className="h-4 w-4 accent-[#1a73e8]"
                        />
                        <Pin className="h-3.5 w-3.5 text-gray-500" />
                        Pin to top
                    </label>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-full border border-gray-400 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="cursor-pointer rounded-full bg-[#1a63d8] px-7 py-2.5 text-sm font-medium text-white hover:bg-[#1554b5]"
                    >
                        {initialData ? "Save" : "Post"}
                    </button>
                </div>
            </div>
        </div>
    );
}