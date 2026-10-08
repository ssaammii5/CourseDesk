"use client";

import { useState, useEffect } from "react";
import { X, Tag, Plus, Check } from "lucide-react";
import type { TagDto } from "@/lib/api/academics";

interface TagFormModalProps {
    open: boolean;
    item: TagDto | null;
    onSave: (data: { name: string; description?: string }) => void;
    onClose: () => void;
}

export function TagFormModal({ open, item, onSave, onClose }: TagFormModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            setName(item?.name ?? "");
            setDescription(item?.description ?? "");
            setErrors({});
        }
    }, [open, item]);

    const validate = () => {
        const next: Record<string, string> = {};
        const cleaned = name.trim().replace(/^#+/, "");
        if (!cleaned) {
            next.name = "Tag name is required.";
        }
        return next;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        const cleanedName = name.trim().replace(/^#+/, "");
        onSave({
            name: cleanedName,
            description: description.trim(),
        });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl transition-all"
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                            <Tag className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                {item ? "Edit Tag" : "Add New Tag"}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {item
                                    ? "Update details for this course tag."
                                    : "Create a new tag to classify and discover courses."}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Tag Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                            }}
                            placeholder="Enter tag name"
                            className={`mt-1.5 w-full rounded-xl border bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                                errors.name
                                    ? "border-red-400 dark:border-red-500"
                                    : "border-slate-200 dark:border-slate-800 focus:border-blue-500"
                            }`}
                        />
                        {errors.name ? (
                            <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                        ) : (
                            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                                Tags are clear type terms without any &quot;#&quot; symbol.
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Description <span className="text-slate-400 font-normal normal-case">(Optional)</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Briefly describe this tag..."
                            rows={3}
                            className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                        />
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            {item ? (
                                <Check className="h-4 w-4 stroke-[2.5]" />
                            ) : (
                                <Plus className="h-4 w-4 stroke-[2.5]" />
                            )}
                            {item ? "Update Tag" : "Save Tag"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
