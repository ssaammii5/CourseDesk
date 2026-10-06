"use client";

import { useState, useEffect, useRef } from "react";
import type { AdminUser, InstructorDetails } from "@/types";
import type { InstructorLink } from "@/lib/api/users";
import { uploadAvatarRequest } from "@/lib/api/users";
import { Field, ModernDropdown } from "@/components/ui";
import { X, Upload, Trash2, Plus, Globe, ExternalLink, Loader2 } from "lucide-react";
import { initialOf } from "@/lib/utils/format";

import { COMMON_TIMEZONES } from "@/lib/constants/timezones";
export { COMMON_TIMEZONES };


export interface InstructorFormModalProps {
    open: boolean;
    user: AdminUser | null;
    readOnly?: boolean;
    onSave?: (data: Omit<AdminUser, "id" | "createdAt">) => void;
    onClose: () => void;
}

export function InstructorFormModal({ open, user, readOnly = false, onSave, onClose }: InstructorFormModalProps) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [avatar, setAvatar] = useState("");
    const [headline, setHeadline] = useState("");
    const [timezone, setTimezone] = useState("UTC");
    const [links, setLinks] = useState<InstructorLink[]>([]);
    const [isActive, setIsActive] = useState(true);
    const [instructorId, setInstructorId] = useState("");

    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarError, setAvatarError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            const userDetails = user?.instructorDetails ?? user?.teacherDetails;
            let fName = userDetails?.firstName || "";
            let lName = userDetails?.lastName || "";
            if (!fName && !lName && user?.name) {
                const parts = user.name.trim().split(" ");
                fName = parts[0] || "";
                lName = parts.slice(1).join(" ") || "";
            }

            setFirstName(fName);
            setLastName(lName);
            setEmail(user?.email ?? "");
            setAvatar(userDetails?.avatar ?? "");
            setHeadline(userDetails?.professionalHeadline || userDetails?.headline || "");
            setTimezone(userDetails?.timezone || "UTC");
            setLinks(userDetails?.links || []);
            setIsActive(user?.isActive ?? true);
            setInstructorId(userDetails?.instructorId || userDetails?.teacherId || "");
            setErrors({});
            setAvatarError(null);
        }
    }, [open, user]);

    const clearError = (key: string) =>
        setErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });

    const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAvatarError(null);
        if (!file.type.startsWith("image/")) {
            setAvatarError("Only image files (.jpg, .jpeg, .png, .webp) are allowed.");
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setAvatarError("Image must be smaller than 2 MB.");
            return;
        }

        setUploadingAvatar(true);
        try {
            const res = await uploadAvatarRequest(file);
            setAvatar(res.url);
        } catch {
            // Fallback to base64 data URL for offline/preview
            const reader = new FileReader();
            reader.onload = (event) => {
                setAvatar(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleRemoveAvatar = () => {
        setAvatar("");
        setAvatarError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleAddLink = () => {
        setLinks((prev) => [...prev, { title: "", url: "" }]);
    };

    const handleUpdateLink = (index: number, field: "title" | "url", value: string) => {
        setLinks((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
        clearError(`link_${index}`);
    };

    const handleRemoveLink = (index: number) => {
        setLinks((prev) => prev.filter((_, i) => i !== index));
    };

    const validate = () => {
        const next: Record<string, string> = {};
        if (!firstName.trim()) next.firstName = "First name is required.";
        if (!lastName.trim()) next.lastName = "Last name is required.";
        if (!email.trim()) next.email = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email.";

        // Validate URLs in links
        links.forEach((link, idx) => {
            if (link.url.trim()) {
                const url = link.url.trim();
                if (!/^https?:\/\/.+/i.test(url)) {
                    next[`link_${idx}`] = "URL must start with http:// or https://";
                }
            }
        });

        return next;
    };

    const handleSubmit = () => {
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();
        const cleanFullName = `${cleanFirstName} ${cleanLastName}`.trim();
        const cleanEmail = email.trim();
        const cleanHeadline = headline.trim();
        const cleanId = (instructorId || (user ? "" : "")).trim();

        // Filter out empty links and ensure clean protocol
        const cleanLinks = links
            .filter((l) => l.url.trim())
            .map((l) => ({
                title: l.title.trim() || "Link",
                url: l.url.trim(),
            }));

        const mergedDetails: InstructorDetails = {
            instructorId: cleanId,
            teacherId: cleanId,
            firstName: cleanFirstName,
            lastName: cleanLastName,
            email: cleanEmail,
            avatar,
            professionalHeadline: cleanHeadline,
            headline: cleanHeadline,
            timezone,
            links: cleanLinks,
        };

        if (readOnly) {
            onClose();
            return;
        }

        if (onSave) {
            onSave({
                name: cleanFullName,
                email: cleanEmail,
                role: "Instructor",
                isActive,
                instructorDetails: mergedDetails,
                teacherDetails: mergedDetails,
            });
        }
    };

    if (!open) return null;

    const fullNameDisplay = `${firstName} ${lastName}`.trim() || "Instructor";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl dark:border dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-slate-800">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                            {readOnly ? "Instructor Details" : user ? "Edit Instructor" : "Add New Instructor"}
                        </h2>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                            {readOnly ? "View instructor profile, credentials, and contact details" : "Configure instructor profile, credentials, and contact details"}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                        title="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6 custom-scrollbar">
                    {/* 1. Avatar Section */}
                    <section className="rounded-xl border border-gray-200/90 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-900/60 p-4">
                        <span className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-3">
                            4. Profile Avatar
                        </span>
                        <div className="flex items-center gap-5">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={handleAvatarFile}
                            />

                            <div className="relative group shrink-0">
                                {avatar ? (
                                    <img
                                        src={avatar}
                                        alt={fullNameDisplay}
                                        className="h-20 w-20 rounded-2xl object-cover ring-2 ring-blue-500/30 shadow-md"
                                    />
                                ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-2xl font-bold text-white shadow-md">
                                        {initialOf(fullNameDisplay)}
                                    </div>
                                )}
                                {uploadingAvatar && (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 text-white">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 space-y-2">
                                {!readOnly ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={uploadingAvatar}
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex items-center gap-1.5 cursor-pointer rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/15 dark:hover:bg-blue-500/25 text-blue-600 dark:text-blue-400 px-3.5 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
                                        >
                                            <Upload className="h-3.5 w-3.5" />
                                            {avatar ? "Change Photo" : "Upload Photo"}
                                        </button>
                                        {avatar && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveAvatar}
                                                className="flex items-center gap-1 cursor-pointer rounded-lg border border-gray-300 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 px-3 py-2 text-xs font-medium transition-colors"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-xs text-gray-500 dark:text-slate-400">
                                        Avatar photo
                                    </span>
                                )}
                                {!readOnly && (
                                    <p className="text-xs text-gray-500 dark:text-slate-400">
                                        Recommended: JPG, PNG or WebP under 2 MB. Square aspect ratio.
                                    </p>
                                )}
                                {avatarError && (
                                    <p className="text-xs text-[#c5221f] dark:text-red-400 font-medium">{avatarError}</p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* 2. Names & Email Section */}
                    <section className="space-y-4">
                        <span className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-400">
                            Personal & Contact Details
                        </span>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field
                                label="1. First Name"
                                required={!readOnly}
                                disabled={readOnly}
                                value={firstName}
                                onChange={(v) => { setFirstName(v); clearError("firstName"); }}
                                placeholder="Enter first name"
                                error={errors.firstName}
                            />
                            <Field
                                label="2. Last Name"
                                required={!readOnly}
                                disabled={readOnly}
                                value={lastName}
                                onChange={(v) => { setLastName(v); clearError("lastName"); }}
                                placeholder="Enter last name"
                                error={errors.lastName}
                            />
                        </div>

                        <Field
                            label="3. Email Address"
                            required={!readOnly}
                            disabled={readOnly}
                            type="email"
                            value={email}
                            onChange={(v) => { setEmail(v); clearError("email"); }}
                            placeholder="Enter email address"
                            error={errors.email}
                        />
                    </section>

                    {/* 3. Professional Headline & Timezone */}
                    <section className="space-y-4">
                        <span className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-400">
                            Professional Overview
                        </span>

                        <Field
                            label="5. Professional Headline"
                            value={headline}
                            disabled={readOnly}
                            onChange={setHeadline}
                            placeholder="Enter professional headline"
                        />

                        <div>
                            <span className="mb-1.5 block text-xs sm:text-sm font-medium text-gray-800 dark:text-slate-200">
                                6. Timezone
                            </span>
                            <ModernDropdown
                                value={timezone}
                                onChange={setTimezone}
                                options={COMMON_TIMEZONES}
                                placeholder="Select timezone"
                                size="md"
                                searchable
                                disabled={readOnly}
                            />
                        </div>
                    </section>

                    {/* 4. Optional Links */}
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-400">
                                    7. (Optional) Links
                                </span>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    Add websites, portfolio, LinkedIn, GitHub, or social profiles
                                </p>
                            </div>
                            {!readOnly && (
                                <button
                                    type="button"
                                    onClick={handleAddLink}
                                    className="flex items-center gap-1.5 cursor-pointer rounded-lg bg-blue-50 dark:bg-blue-500/15 hover:bg-blue-100 dark:hover:bg-blue-500/25 text-blue-600 dark:text-blue-400 px-3 py-1.5 text-xs font-semibold transition-colors"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Link
                                </button>
                            )}
                        </div>

                        {links.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-300 dark:border-slate-800 p-4 text-center">
                                <Globe className="mx-auto h-6 w-6 text-gray-400 dark:text-slate-600 mb-1" />
                                <p className="text-xs text-gray-500 dark:text-slate-400">No links added yet.</p>
                                {!readOnly && (
                                    <button
                                        type="button"
                                        onClick={handleAddLink}
                                        className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        + Add your first link
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {links.map((link, idx) => (
                                    <div
                                        key={idx}
                                        className="flex flex-col sm:flex-row items-start sm:items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 p-2.5"
                                    >
                                        <div className="w-full sm:w-1/3">
                                            <input
                                                type="text"
                                                value={link.title}
                                                readOnly={readOnly}
                                                onChange={(e) => handleUpdateLink(idx, "title", e.target.value)}
                                                placeholder="Enter link title (e.g. LinkedIn)"
                                                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                                            />
                                        </div>
                                        <div className="flex-1 w-full relative">
                                            <ExternalLink className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                                            <input
                                                type="url"
                                                value={link.url}
                                                readOnly={readOnly}
                                                onChange={(e) => handleUpdateLink(idx, "url", e.target.value)}
                                                placeholder="Enter link URL (e.g. https://...)"
                                                className={`w-full rounded-lg border pl-8 pr-3 py-2 text-xs text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 disabled:opacity-60 ${
                                                    errors[`link_${idx}`]
                                                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                                        : "border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 focus:ring-blue-500"
                                                }`}
                                            />
                                            {errors[`link_${idx}`] && (
                                                <span className="mt-1 block text-[11px] text-[#c5221f] dark:text-red-400">
                                                    {errors[`link_${idx}`]}
                                                </span>
                                            )}
                                        </div>
                                        {!readOnly ? (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveLink(idx)}
                                                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                                                title="Delete link"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        ) : link.url ? (
                                            <a
                                                href={link.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2 text-gray-400 hover:text-blue-600 transition"
                                                title="Open link"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* 5. System & Status Details */}
                    <section className="space-y-4 pt-2 border-t border-gray-100 dark:border-slate-800">
                        <div className={`grid gap-4 ${user && instructorId ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                            {user && instructorId ? (
                                <Field
                                    label="Instructor ID"
                                    value={instructorId}
                                    onChange={() => {}}
                                    disabled
                                />
                            ) : null}

                            <div className="flex flex-col justify-end">
                                <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-2.5 dark:border-slate-800 bg-white dark:bg-slate-900">
                                    <div className="flex flex-col">
                                        <span className="text-xs sm:text-sm font-medium text-gray-800 dark:text-slate-200">
                                            Active Account
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-slate-400">
                                            Allow instructor to log in and manage courses
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={isActive}
                                        disabled={readOnly}
                                        onClick={() => !readOnly && setIsActive((v) => !v)}
                                        className={`relative h-6 w-11 shrink-0 ${readOnly ? "cursor-default opacity-80" : "cursor-pointer"} rounded-full transition-colors ${
                                            isActive ? "bg-blue-600" : "bg-gray-300 dark:bg-slate-700"
                                        }`}
                                    >
                                        <span
                                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                                                isActive ? "left-5.5" : "left-0.5"
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-xl border border-gray-300 dark:border-slate-700 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                    >
                        {readOnly ? "Close" : "Cancel"}
                    </button>
                    {!readOnly && (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="cursor-pointer rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all duration-150 active:scale-95"
                        >
                            {user ? "Save Changes" : "Create Instructor"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export const TeacherFormModal = InstructorFormModal;
