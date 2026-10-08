"use client";

import { useState, useEffect, useRef } from "react";
import type { AdminUser, CoordinatorDetails } from "@/types";
import type { InstructorLink } from "@/lib/api/users";
import { uploadAvatarRequest } from "@/lib/api/users";
import { Field, ModernDropdown } from "@/components/ui";
import { X, Upload, Trash2, Plus, Globe, ExternalLink, Loader2 } from "lucide-react";
import { initialOf } from "@/lib/utils/format";
import { COMMON_TIMEZONES } from "@/lib/constants/timezones";

export interface CoordinatorFormModalProps {
    open: boolean;
    user: AdminUser | null;
    readOnly?: boolean;
    onSave: (data: Omit<AdminUser, "id" | "createdAt">) => void;
    onClose: () => void;
}

export function CoordinatorFormModal({
    open,
    user,
    readOnly = false,
    onSave,
    onClose,
}: CoordinatorFormModalProps) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [avatar, setAvatar] = useState("");
    const [timezone, setTimezone] = useState("UTC");
    const [links, setLinks] = useState<InstructorLink[]>([]);
    const [isActive, setIsActive] = useState(true);
    const [coordinatorId, setCoordinatorId] = useState("");

    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarError, setAvatarError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            const userDetails = user?.coordinatorDetails;
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
            setTimezone(userDetails?.timezone || "UTC");
            setLinks(userDetails?.links || []);
            setIsActive(user?.isActive ?? true);
            setCoordinatorId(userDetails?.coordinatorId || "");
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
        if (readOnly) return;
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
            const reader = new FileReader();
            reader.onload = (event) => {
                setAvatar(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const addLink = () => {
        if (readOnly) return;
        setLinks((prev) => [...prev, { title: "", url: "" }]);
    };

    const updateLink = (index: number, field: "title" | "url", val: string) => {
        if (readOnly) return;
        setLinks((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: val };
            return next;
        });
    };

    const removeLink = (index: number) => {
        if (readOnly) return;
        setLinks((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (readOnly) {
            onClose();
            return;
        }

        const newErrors: Record<string, string> = {};
        if (!firstName.trim()) newErrors.firstName = "First name is required.";
        if (!lastName.trim()) newErrors.lastName = "Last name is required.";
        if (!email.trim()) newErrors.email = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            newErrors.email = "Please enter a valid email address.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        const details: CoordinatorDetails = {
            coordinatorId,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            avatar: avatar.trim() || undefined,
            timezone,
            links: links.filter((l) => l.url.trim() !== ""),
        };

        onSave({
            name: fullName,
            email: email.trim(),
            role: "Coordinator",
            isActive,
            coordinatorDetails: details,
        });
    };

    if (!open) return null;

    const initials = initialOf(
        `${firstName} ${lastName}`.trim() || user?.name || "Co-ordinator"
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
            <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl border border-gray-200 dark:border-slate-800 dark:bg-slate-900">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-slate-800">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                            {readOnly
                                ? "Co-ordinator Details"
                                : user
                                ? "Edit Co-ordinator"
                                : "Add Co-ordinator"}
                        </h2>
                        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                            {readOnly
                                ? "View coordinator profile information"
                                : "Manage personal details, links, and account status."}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                    {/* ID Badge */}
                    {coordinatorId && (
                        <div className="flex items-center justify-between rounded-xl bg-blue-50/70 border border-blue-200/70 px-4 py-2.5 dark:bg-blue-950/40 dark:border-blue-800/40">
                            <span className="text-xs font-medium text-blue-800 dark:text-blue-300">
                                Co-ordinator ID
                            </span>
                            <span className="font-mono text-xs font-semibold text-blue-950 dark:text-blue-200">
                                {coordinatorId}
                            </span>
                        </div>
                    )}

                    {/* Section 1: Identity & Avatar */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                            Basic Profile
                        </h3>

                        {/* Avatar */}
                        <div className="flex items-center gap-4">
                            <div className="relative h-16 w-16 shrink-0">
                                {avatar ? (
                                    <img
                                        src={avatar}
                                        alt="Avatar"
                                        className="h-16 w-16 rounded-full object-cover ring-2 ring-blue-600/20 shadow-sm"
                                    />
                                ) : (
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-lg font-bold text-white shadow-sm">
                                        {initials}
                                    </div>
                                )}
                                {uploadingAvatar && (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                                    </div>
                                )}
                            </div>

                            {!readOnly && (
                                <div className="flex flex-col gap-1.5">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/png, image/jpeg, image/webp"
                                        onChange={handleAvatarFile}
                                        className="hidden"
                                    />
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={uploadingAvatar}
                                            onClick={() => fileInputRef.current?.click()}
                                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                                        >
                                            <Upload className="h-3.5 w-3.5" />
                                            {avatar ? "Change Photo" : "Upload Photo"}
                                        </button>
                                        {avatar && (
                                            <button
                                                type="button"
                                                onClick={() => setAvatar("")}
                                                className="cursor-pointer rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 transition"
                                                title="Remove photo"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <span className="text-[11px] text-gray-400 dark:text-slate-500">
                                        Max 2MB. JPG, PNG or WEBP.
                                    </span>
                                    {avatarError && (
                                        <span className="text-[11px] text-red-500">{avatarError}</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* First & Last Name */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field
                                label="First Name"
                                value={firstName}
                                disabled={readOnly}
                                required={!readOnly}
                                onChange={(v) => {
                                    setFirstName(v);
                                    clearError("firstName");
                                }}
                                placeholder="Enter first name"
                                error={errors.firstName}
                            />

                            <Field
                                label="Last Name"
                                value={lastName}
                                disabled={readOnly}
                                required={!readOnly}
                                onChange={(v) => {
                                    setLastName(v);
                                    clearError("lastName");
                                }}
                                placeholder="Enter last name"
                                error={errors.lastName}
                            />
                        </div>

                        {/* Email */}
                        <Field
                            label="Email Address"
                            type="email"
                            value={email}
                            disabled={readOnly}
                            required={!readOnly}
                            onChange={(v) => {
                                setEmail(v);
                                clearError("email");
                            }}
                            placeholder="Enter email"
                            error={errors.email}
                        />
                    </section>

                    {/* Section 2: Timezone */}
                    <section className="space-y-4 pt-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                            Preferences & Regional Settings
                        </h3>

                        <div>
                            <span className="mb-1.5 block text-sm text-gray-800 dark:text-slate-200">
                                Timezone
                            </span>
                            <ModernDropdown
                                value={timezone}
                                onChange={setTimezone}
                                options={COMMON_TIMEZONES}
                                searchable
                                size="md"
                                placeholder="Select timezone"
                                buttonClassName="w-full justify-between"
                                disabled={readOnly}
                            />
                        </div>
                    </section>

                    {/* Section 3: Professional Links */}
                    <section className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                External Links
                            </h3>
                            {!readOnly && (
                                <button
                                    type="button"
                                    onClick={addLink}
                                    className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Link
                                </button>
                            )}
                        </div>

                        {links.length === 0 ? (
                            <p className="text-xs italic text-gray-400 dark:text-slate-500">
                                No links added yet.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {links.map((link, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={link.title}
                                            readOnly={readOnly}
                                            onChange={(e) => updateLink(idx, "title", e.target.value)}
                                            placeholder="Label (e.g. LinkedIn)"
                                            className="w-1/3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-gray-900 dark:text-slate-100 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none"
                                        />
                                        <input
                                            type="url"
                                            value={link.url}
                                            readOnly={readOnly}
                                            onChange={(e) => updateLink(idx, "url", e.target.value)}
                                            placeholder="https://..."
                                            className="flex-1 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-gray-900 dark:text-slate-100 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none"
                                        />
                                        {readOnly && link.url ? (
                                            <a
                                                href={link.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-1.5 text-gray-400 hover:text-blue-600 transition"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </a>
                                        ) : !readOnly ? (
                                            <button
                                                type="button"
                                                onClick={() => removeLink(idx)}
                                                className="cursor-pointer rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 transition"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Section 4: Account Status */}
                    {!readOnly && (
                        <section className="pt-2 border-t border-gray-100 dark:border-slate-800">
                            <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 dark:border-slate-800 bg-white dark:bg-slate-900">
                                <div className="flex flex-col">
                                    <span className="text-xs sm:text-sm font-medium text-gray-800 dark:text-slate-200">
                                        Active Account
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-slate-400">
                                        Allow coordinator to sign in and manage course rosters
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={isActive}
                                    onClick={() => setIsActive((v) => !v)}
                                    className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
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
                        </section>
                    )}
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
                            {user ? "Save Changes" : "Create Co-ordinator"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
