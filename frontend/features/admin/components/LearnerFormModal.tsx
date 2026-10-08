"use client";

import { useState, useEffect, useRef } from "react";
import type { AdminUser, LearnerDetails } from "@/types";
import type { InstructorLink } from "@/lib/api/users";
import { uploadAvatarRequest } from "@/lib/api/users";
import { Field, ModernDropdown } from "@/components/ui";
import { X, Upload, Trash2, Plus, Globe, ExternalLink, Loader2 } from "lucide-react";
import { initialOf } from "@/lib/utils/format";
import { COMMON_TIMEZONES } from "@/lib/constants/timezones";

export interface LearnerFormModalProps {
    open: boolean;
    user: AdminUser | null;
    readOnly?: boolean;
    onSave?: (data: Omit<AdminUser, "id" | "createdAt">) => void | Promise<void>;
    onClose: () => void;
}

export function LearnerFormModal({ open, user, readOnly = false, onSave, onClose }: LearnerFormModalProps) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [avatar, setAvatar] = useState("");
    const [shortBio, setShortBio] = useState("");
    const [timezone, setTimezone] = useState("UTC");
    const [links, setLinks] = useState<InstructorLink[]>([]);
    const [isActive, setIsActive] = useState(true);
    const [learnerId, setLearnerId] = useState("");

    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarError, setAvatarError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            const userDetails = user?.learnerDetails ?? user?.studentDetails;
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
            setShortBio(userDetails?.shortBio || userDetails?.bio || "");
            setTimezone(userDetails?.timezone || "UTC");
            setLinks(userDetails?.links || []);
            setIsActive(user?.isActive ?? true);
            setLearnerId(userDetails?.learnerId || userDetails?.studentId || "");
            setErrors({});
            setAvatarError(null);
            setSaveError(null);
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

        try {
            setUploadingAvatar(true);
            const res = await uploadAvatarRequest(file);
            setAvatar(res.url);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to upload avatar.";
            setAvatarError(msg);
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleRemoveAvatar = () => {
        setAvatar("");
        setAvatarError(null);
    };

    const handleAddLink = () => {
        setLinks((prev) => [...prev, { title: "", url: "" }]);
    };

    const handleLinkChange = (index: number, key: "title" | "url", value: string) => {
        setLinks((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [key]: value };
            return updated;
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

    const handleSubmit = async () => {
        setSaveError(null);
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();
        const cleanFullName = `${cleanFirstName} ${cleanLastName}`.trim();
        const cleanEmail = email.trim();
        const cleanBio = shortBio.trim();
        const cleanId = (learnerId || "").trim();

        const cleanLinks = links
            .filter((l) => l.url.trim())
            .map((l) => ({
                title: l.title.trim() || "Link",
                url: l.url.trim(),
            }));

        const existingDetails = user?.learnerDetails ?? user?.studentDetails;
        const mergedDetails: LearnerDetails = {
            ...existingDetails,
            learnerId: cleanId,
            studentId: cleanId,
            firstName: cleanFirstName,
            lastName: cleanLastName,
            email: cleanEmail,
            avatar,
            shortBio: cleanBio,
            bio: cleanBio,
            timezone,
            links: cleanLinks,
        };

        if (readOnly) {
            onClose();
            return;
        }

        try {
            setIsSaving(true);
            if (onSave) {
                await onSave({
                    name: cleanFullName,
                    email: cleanEmail,
                    role: "Learner",
                    isActive,
                    learnerDetails: mergedDetails,
                    studentDetails: mergedDetails,
                });
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to save learner details.";
            setSaveError(msg);
        } finally {
            setIsSaving(false);
        }
    };

    if (!open) return null;

    const fullNameDisplay = `${firstName} ${lastName}`.trim() || "Learner";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl dark:border dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-slate-800">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                            {readOnly ? "Learner Details" : user ? "Edit Learner" : "Add New Learner"}
                        </h2>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                            {readOnly ? "View learner profile, credentials, and contact details" : "Configure learner profile, credentials, and contact details"}
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
                            Profile Avatar
                        </span>
                        <div className="flex items-center gap-4">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-blue-500/20 bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-xl font-bold text-blue-700 dark:text-blue-300">
                                {avatar ? (
                                    <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
                                ) : (
                                    initialOf(fullNameDisplay)
                                )}
                                {uploadingAvatar && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                {!readOnly ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp,image/jpg"
                                            className="hidden"
                                            onChange={handleAvatarFile}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingAvatar}
                                            className="flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/80 transition"
                                        >
                                            <Upload className="h-3.5 w-3.5" />
                                            Upload Photo
                                        </button>

                                        {avatar && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveAvatar}
                                                className="flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 transition"
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
                                    <span className="text-[11px] text-gray-500 dark:text-slate-400">
                                        Recommended square image (.jpg, .png, .webp). Max 2MB.
                                    </span>
                                )}
                            </div>
                        </div>
                        {avatarError && <p className="mt-2 text-xs text-red-500">{avatarError}</p>}
                    </section>

                    {/* 2. Personal Information */}
                    <section className="space-y-4">
                        <span className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-400">
                            Personal Information
                        </span>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field
                                label="First Name"
                                required={!readOnly}
                                disabled={readOnly}
                                value={firstName}
                                onChange={(val) => {
                                    setFirstName(val);
                                    clearError("firstName");
                                }}
                                error={errors.firstName}
                                placeholder="Enter first name"
                            />
                            <Field
                                label="Last Name"
                                required={!readOnly}
                                disabled={readOnly}
                                value={lastName}
                                onChange={(val) => {
                                    setLastName(val);
                                    clearError("lastName");
                                }}
                                error={errors.lastName}
                                placeholder="Enter last name"
                            />
                        </div>

                        <Field
                            label="Email Address"
                            type="email"
                            required={!readOnly}
                            disabled={readOnly}
                            value={email}
                            onChange={(val) => {
                                setEmail(val);
                                clearError("email");
                            }}
                            error={errors.email}
                            placeholder="Enter email"
                        />

                        {/* Short Bio */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                Short Bio
                            </label>
                            <textarea
                                rows={2}
                                value={shortBio}
                                readOnly={readOnly}
                                onChange={(e) => setShortBio(e.target.value)}
                                placeholder="Brief background or bio"
                                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 resize-none disabled:opacity-60"
                            />
                        </div>

                        {/* Timezone */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                Timezone {!readOnly && <span className="text-red-500">*</span>}
                            </label>
                            <ModernDropdown
                                value={timezone}
                                onChange={setTimezone}
                                options={COMMON_TIMEZONES}
                                searchable
                                size="md"
                                placeholder="Select Timezone"
                                buttonClassName="w-full justify-between"
                                disabled={readOnly}
                            />
                        </div>
                    </section>

                    {/* 3. Links Section */}
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-400">
                                Social & Portfolio Links
                            </span>
                            {!readOnly && (
                                <button
                                    type="button"
                                    onClick={handleAddLink}
                                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Link
                                </button>
                            )}
                        </div>

                        {links.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-200 dark:border-slate-800 p-4 text-center">
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    No profile links added yet.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {links.map((link, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={link.title}
                                                readOnly={readOnly}
                                                onChange={(e) => handleLinkChange(idx, "title", e.target.value)}
                                                placeholder="Title (e.g. GitHub)"
                                                className="w-1/3 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 disabled:opacity-60"
                                            />
                                            <input
                                                type="url"
                                                value={link.url}
                                                readOnly={readOnly}
                                                onChange={(e) => handleLinkChange(idx, "url", e.target.value)}
                                                placeholder="https://..."
                                                className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 disabled:opacity-60"
                                            />
                                            {link.url && /^https?:\/\/.+/i.test(link.url) && (
                                                <a
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                                    title="Open link"
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                </a>
                                            )}
                                            {!readOnly && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveLink(idx)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                                                    title="Remove link"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                        {errors[`link_${idx}`] && (
                                            <p className="text-[11px] text-red-500 pl-1">{errors[`link_${idx}`]}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* 4. System & Status */}
                    <section className="rounded-xl border border-gray-200/90 dark:border-slate-800 p-4 space-y-4">
                        <span className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-400">
                            System & Status
                        </span>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                                    Learner ID
                                </label>
                                <input
                                    type="text"
                                    disabled
                                    value={learnerId || "Auto-generated by system"}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3.5 py-2 text-xs font-mono text-gray-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400 cursor-not-allowed"
                                />
                                <span className="mt-1 block text-[10px] text-gray-500 dark:text-slate-400">
                                    Unique 6-character Base32 identifier (e.g. LRN-XXXXXX)
                                </span>
                            </div>

                            <div className="flex flex-col justify-center">
                                <label className="flex items-center gap-2 cursor-pointer mt-3">
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        disabled={readOnly}
                                        onChange={(e) => !readOnly && setIsActive(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 cursor-pointer disabled:cursor-default"
                                    />
                                    <span className="text-xs font-medium text-gray-700 dark:text-slate-300">
                                        Account is Active
                                    </span>
                                </label>
                                <span className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">
                                    Inactive learners cannot sign in or access course materials.
                                </span>
                            </div>
                        </div>
                    </section>

                    {saveError && (
                        <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900">
                            {saveError}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                    >
                        {readOnly ? "Close" : "Cancel"}
                    </button>
                    {!readOnly && (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="cursor-pointer flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <span>{user ? "Save Changes" : "Create Learner"}</span>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
