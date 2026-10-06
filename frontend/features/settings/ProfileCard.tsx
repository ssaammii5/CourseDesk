"use client";

import { useRef, useState, useEffect } from "react";
import {
    Briefcase,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock,
    Copy,
    ExternalLink,
    GraduationCap,
    HelpCircle,
    Loader2,
    Mail,
    MapPin,
    Plus,
    Shield,
    Sparkles,
    Trash2,
    Upload,
    User,
    UserCheck,
    X,
} from "lucide-react";
import type { CurrentUser } from "@/types";
import { getMeRequest, type MeResponse } from "@/lib/api/auth";
import {
    uploadAvatarRequest,
    updateProfileRequest,
    type InstructorLink,
    type UserAddress,
} from "@/lib/api/users";
import { initialOf, resolveAvatarUrl } from "@/lib/utils/format";
import { COUNTRIES, MAX_AVATAR_SIZE, TIMEZONES } from "./constants";
import { Field, SelectField } from "@/components/ui/FormFields";
import { useAuth } from "@/hooks/useAuth";

interface ProfileCardProps {
    user?: CurrentUser | null;
    userName?: string;
    readOnly?: boolean;
}

interface ProfileFormState {
    firstName: string;
    lastName: string;
    avatar: string;
    timezone: string;
    // Instructor specific
    professionalHeadline: string;
    // Learner & Instructor shared bio
    shortBio: string;
    links: InstructorLink[];
    // Learner specific
    mobile: string;
    dateOfBirth: string;
    nationality: string;
    fathersName: string;
    mothersName: string;
    regNo: string;
    address: UserAddress;
}

const emptyFormState: ProfileFormState = {
    firstName: "",
    lastName: "",
    avatar: "",
    timezone: "UTC",
    professionalHeadline: "",
    shortBio: "",
    links: [],
    mobile: "",
    dateOfBirth: "",
    nationality: "",
    fathersName: "",
    mothersName: "",
    regNo: "",
    address: {
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "",
    },
};

export function ProfileCard({ user: initialUser, readOnly = false }: ProfileCardProps) {
    const { refreshUser } = useAuth();
    const [me, setMe] = useState<MeResponse | null>(null);
    const [form, setForm] = useState<ProfileFormState>(emptyFormState);
    const [initialState, setInitialState] = useState<ProfileFormState>(emptyFormState);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState(false);

    // Avatar state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const avatarMenuRef = useRef<HTMLDivElement>(null);
    const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
    const [avatarError, setAvatarError] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // Close avatar menu on click outside or escape key
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target as Node)) {
                setAvatarMenuOpen(false);
            }
        }
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setAvatarMenuOpen(false);
            }
        }
        if (avatarMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [avatarMenuOpen]);

    // Populate form from backend me or user prop
    const populateFromMe = (data: MeResponse) => {
        setMe(data);

        const isInst = data.role === "Instructor";
        const isCoord = data.role === "Coordinator";
        const inst = data.instructorDetails || (data as any).teacherDetails;
        const coord = (data as any).coordinatorDetails;
        const lrn = data.learnerDetails || (data as any).studentDetails;

        let fName = "";
        let lName = "";

        if (isInst && inst) {
            fName = inst.firstName || "";
            lName = inst.lastName || "";
        } else if (isCoord && coord) {
            fName = coord.firstName || "";
            lName = coord.lastName || "";
        } else if (lrn) {
            fName = lrn.firstName || "";
            lName = lrn.lastName || "";
        }

        if (!fName && !lName && data.name) {
            const parts = data.name.trim().split(" ");
            fName = parts[0] || "";
            lName = parts.slice(1).join(" ") || "";
        }

        const state: ProfileFormState = {
            firstName: fName,
            lastName: lName,
            avatar: isInst
                ? (inst?.avatar || data.avatar || "")
                : isCoord
                ? (coord?.avatar || data.avatar || "")
                : (lrn?.avatar || data.avatar || ""),
            timezone: (data as any)?.timezone || (isInst ? inst?.timezone : isCoord ? coord?.timezone : lrn?.timezone) || "UTC",
            professionalHeadline: inst?.professionalHeadline || (inst as any)?.headline || "",
            shortBio: isInst ? (inst?.shortBio || (inst as any)?.bio || "") : (lrn?.shortBio || (lrn as any)?.bio || ""),
            links: (isInst ? inst?.links : isCoord ? coord?.links : lrn?.links) || [],
            mobile: lrn?.mobile || "",
            dateOfBirth: lrn?.dateOfBirth || "",
            nationality: lrn?.nationality || "",
            fathersName: lrn?.fathersName || "",
            mothersName: lrn?.mothersName || "",
            regNo: lrn?.regNo || "",
            address: {
                street: lrn?.address?.street || "",
                city: lrn?.address?.city || "",
                state: lrn?.address?.state || "",
                zip: lrn?.address?.zip || "",
                country: lrn?.address?.country || "",
            },
        };

        setForm(state);
        setInitialState(state);
    };

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        getMeRequest()
            .then((data) => {
                if (isMounted) {
                    populateFromMe(data);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setLoading(false);
                }
            });
        return () => {
            isMounted = false;
        };
    }, []);

    const role = me?.role || initialUser?.role || "Learner";
    const isInstructor = role === "Instructor";
    const isAdmin = role === "Admin";
    const isCoordinator = role === "Coordinator";
    const isLearner = !isInstructor && !isAdmin && !isCoordinator;
    const systemId = isInstructor
        ? (me?.instructorDetails?.instructorId || (me?.instructorDetails as any)?.teacherId || "")
        : isCoordinator
        ? ((me as any)?.coordinatorDetails?.coordinatorId || "")
        : isLearner
        ? (me?.learnerDetails?.learnerId || (me?.learnerDetails as any)?.studentId || "")
        : "";

    const handleCopyId = () => {
        if (!systemId) return;
        navigator.clipboard.writeText(systemId);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
    };

    // Avatar upload handler
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        const validType = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
        const validExt = /\.(jpe?g|png|webp)$/i.test(file.name);
        if (!validType || !validExt) {
            setAvatarError("Only .jpg, .jpeg, .png, or .webp images are allowed.");
            return;
        }
        if (file.size > MAX_AVATAR_SIZE) {
            setAvatarError("Avatar image must be smaller than 2 MB.");
            return;
        }

        setAvatarError(null);
        setUploadingAvatar(true);
        const localPreview = URL.createObjectURL(file);
        setForm((prev) => ({ ...prev, avatar: localPreview }));
        try {
            const res = await uploadAvatarRequest(file);
            setForm((prev) => ({ ...prev, avatar: res.url }));
            // Also save immediately to backend for seamless experience
            await updateProfileRequest({ avatar: res.url });
            await refreshUser();
            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 2500);
        } catch (err: any) {
            setAvatarError(err?.message || "Failed to upload avatar");
            setForm((prev) => ({ ...prev, avatar: initialState.avatar }));
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleRemoveAvatar = async () => {
        setForm((prev) => ({ ...prev, avatar: "" }));
        try {
            await updateProfileRequest({ avatar: "" });
            await refreshUser();
            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 2000);
        } catch {}
    };

    // Links handlers
    const handleAddLink = (presetTitle = "", presetUrl = "") => {
        setForm((prev) => ({
            ...prev,
            links: [...prev.links, { title: presetTitle, url: presetUrl }],
        }));
    };

    const handleUpdateLink = (index: number, field: "title" | "url", value: string) => {
        setForm((prev) => {
            const updated = [...prev.links];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, links: updated };
        });
    };

    const handleRemoveLink = (index: number) => {
        setForm((prev) => ({
            ...prev,
            links: prev.links.filter((_, i) => i !== index),
        }));
    };

    // Save profile changes
    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (readOnly || saving) return;

        setErrorMsg(null);
        setSavedSuccess(false);

        if (!form.firstName.trim()) {
            setErrorMsg("First name is required.");
            return;
        }

        // Validate links
        for (const lnk of form.links) {
            if (lnk.url && !/^https?:\/\//i.test(lnk.url.trim())) {
                setErrorMsg(`Link URL "${lnk.url}" must start with http:// or https://`);
                return;
            }
        }

        setSaving(true);
        try {
            const payload = {
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                avatar: form.avatar,
                timezone: form.timezone,
                professionalHeadline: form.professionalHeadline.trim(),
                shortBio: form.shortBio.trim(),
                links: form.links.map((l) => ({ title: l.title.trim(), url: l.url.trim() })),
                mobile: form.mobile.trim(),
                dateOfBirth: form.dateOfBirth.trim(),
                nationality: form.nationality.trim(),
                fathersName: form.fathersName.trim(),
                mothersName: form.mothersName.trim(),
                regNo: form.regNo.trim(),
                address: {
                    street: form.address.street?.trim() || "",
                    city: form.address.city?.trim() || "",
                    state: form.address.state?.trim() || "",
                    zip: form.address.zip?.trim() || "",
                    country: form.address.country?.trim() || "",
                },
            };

            await updateProfileRequest(payload);
            const updatedMe = await refreshUser();
            if (updatedMe) {
                populateFromMe(updatedMe as any);
            } else {
                setInitialState({ ...form });
            }
            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 3000);
        } catch (err: any) {
            setErrorMsg(err?.message || "Failed to update profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = () => {
        setForm({ ...initialState });
        setErrorMsg(null);
    };

    const hasChanges = JSON.stringify(form) !== JSON.stringify(initialState);
    const fullNameDisplay = `${form.firstName} ${form.lastName}`.trim() || me?.name || initialUser?.name || "Your Profile";

    if (loading) {
        return (
            <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-gray-200 bg-white p-12 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium">Loading profile details...</span>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSave} className="space-y-6">
            {/* Top Notifications Banner */}
            {savedSuccess && (
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 animate-in fade-in">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>Your profile has been saved and updated successfully.</span>
                </div>
            )}

            {errorMsg && (
                <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300 animate-in fade-in">
                    <HelpCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Profile Overview & Avatar Header */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="relative group">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={handleAvatarChange}
                                disabled={readOnly || uploadingAvatar}
                            />
                            {form.avatar ? (
                                <img
                                    src={resolveAvatarUrl(form.avatar)}
                                    alt={fullNameDisplay}
                                    className="h-22 w-22 rounded-2xl object-cover border-2 border-gray-200 dark:border-slate-700 shadow-sm"
                                />
                            ) : (
                                <div className="flex h-22 w-22 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 text-3xl font-bold text-white shadow-md">
                                    {initialOf(fullNameDisplay)}
                                </div>
                            )}

                            {!readOnly && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingAvatar}
                                    className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/55 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                                >
                                    {uploadingAvatar ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                        <>
                                            <Upload className="h-5 w-5 mb-0.5" />
                                            <span className="text-[10px] font-semibold uppercase tracking-wider">Change</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                                    {fullNameDisplay}
                                </h2>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    isAdmin
                                        ? "bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300"
                                        : isCoordinator || isInstructor
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300"
                                        : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300"
                                }`}>
                                    {isAdmin ? (
                                        <Shield className="h-3 w-3" />
                                    ) : isCoordinator ? (
                                        <UserCheck className="h-3 w-3" />
                                    ) : isInstructor ? (
                                        <Briefcase className="h-3 w-3" />
                                    ) : (
                                        <GraduationCap className="h-3 w-3" />
                                    )}
                                    <span>{isCoordinator ? "Co-ordinator" : role}</span>
                                </span>
                            </div>

                            <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400">
                                <Mail className="h-3.5 w-3.5" />
                                <span>{me?.email || initialUser?.email}</span>
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                                    <Check className="h-3 w-3" /> Verified
                                </span>
                            </p>

                            {systemId && (
                                <div className="mt-2.5 flex items-center gap-2">
                                    <span className="text-xs font-mono font-medium text-gray-600 bg-gray-100 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-1 rounded-lg">
                                        ID: {systemId}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleCopyId}
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <Copy className="h-3 w-3" />
                                        <span>{copiedId ? "Copied!" : "Copy ID"}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {!readOnly && (
                        <div className="relative self-start sm:self-center" ref={avatarMenuRef}>
                            <button
                                type="button"
                                onClick={() => setAvatarMenuOpen((prev) => !prev)}
                                disabled={uploadingAvatar}
                                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
                            >
                                {uploadingAvatar ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                                        <span>Uploading...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-3.5 w-3.5 text-gray-500 dark:text-slate-400" />
                                        <span>Change</span>
                                        <ChevronDown
                                            className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${
                                                avatarMenuOpen ? "rotate-180" : ""
                                            }`}
                                        />
                                    </>
                                )}
                            </button>

                            {avatarMenuOpen && (
                                <div className="absolute right-0 z-30 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800 animate-in fade-in slide-in-from-top-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAvatarMenuOpen(false);
                                            fileInputRef.current?.click();
                                        }}
                                        className="cursor-pointer flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-700/70 transition"
                                    >
                                        <Upload className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                        <span>{form.avatar ? "Upload new photo" : "Upload photo"}</span>
                                    </button>

                                    <div className="my-1 border-t border-gray-100 dark:border-slate-700/60" />

                                    <button
                                        type="button"
                                        disabled={!form.avatar}
                                        onClick={() => {
                                            if (!form.avatar) return;
                                            handleRemoveAvatar();
                                        }}
                                        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition ${
                                            form.avatar
                                                ? "cursor-pointer text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                                                : "cursor-not-allowed opacity-40 text-gray-400 dark:text-slate-500"
                                        }`}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        <span>Remove photo</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {avatarError && (
                    <p className="mt-3 text-xs font-medium text-red-600 dark:text-red-400">{avatarError}</p>
                )}
            </div>

            {/* Basic Information Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <User className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                    <span>Basic Details</span>
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                    Your name and identity details displayed across courses and assignments.
                </p>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <Field
                        label="First Name"
                        value={form.firstName}
                        onChange={(val) => setForm((p) => ({ ...p, firstName: val }))}
                        placeholder="e.g. John"
                        required
                        disabled={readOnly}
                    />
                    <Field
                        label="Last Name"
                        value={form.lastName}
                        onChange={(val) => setForm((p) => ({ ...p, lastName: val }))}
                        placeholder="e.g. Doe"
                        disabled={readOnly}
                    />
                    <div>
                        <label className="block text-sm text-gray-800 dark:text-slate-200 mb-1.5 font-medium">
                            Email Address
                        </label>
                        <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-gray-100/80 px-3.5 py-2.5 text-[15px] text-gray-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                            <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                            <span className="flex-1 truncate">{me?.email || initialUser?.email}</span>
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                                Primary
                            </span>
                        </div>
                    </div>
                    <div>
                        <SelectField
                            label="Timezone"
                            value={form.timezone}
                            onChange={(val) => setForm((p) => ({ ...p, timezone: val }))}
                            options={TIMEZONES}
                            searchable
                            disabled={readOnly}
                            placeholder="Select timezone"
                        />
                    </div>
                </div>
            </div>

            {/* Role-Specific Sections: Instructor Headline & Bio */}
            {isInstructor ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                            <Briefcase className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                            <span>Professional Profile</span>
                        </h3>
                        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                            This headline and bio are presented to learners enrolled in your courses.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Field
                            label="Professional Headline"
                            value={form.professionalHeadline}
                            onChange={(val) => setForm((p) => ({ ...p, professionalHeadline: val }))}
                            placeholder="e.g. Lead Cloud Architect & Full-Stack Instructor"
                            disabled={readOnly}
                        />

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-sm font-medium text-gray-800 dark:text-slate-200">
                                    Instructor Bio
                                </label>
                                <span className="text-xs text-gray-400">
                                    {form.shortBio.length}/1000 characters
                                </span>
                            </div>
                            <textarea
                                rows={4}
                                maxLength={1000}
                                value={form.shortBio}
                                onChange={(e) => setForm((p) => ({ ...p, shortBio: e.target.value }))}
                                disabled={readOnly}
                                placeholder="Describe your background, teaching expertise, industry experience, and what learners can expect..."
                                className="w-full rounded-xl border border-gray-300 bg-white p-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                            />
                        </div>
                    </div>
                </div>
            ) : isLearner ? (
                /* Learner Specific Details: Bio, Academic & Address */
                <>
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
                        <div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                                <Sparkles className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                                <span>About You</span>
                            </h3>
                            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                Share a brief bio with your cohort peers and instructors.
                            </p>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-sm font-medium text-gray-800 dark:text-slate-200">
                                    Short Bio
                                </label>
                                <span className="text-xs text-gray-400">
                                    {form.shortBio.length}/600 characters
                                </span>
                            </div>
                            <textarea
                                rows={3}
                                maxLength={600}
                                value={form.shortBio}
                                onChange={(e) => setForm((p) => ({ ...p, shortBio: e.target.value }))}
                                disabled={readOnly}
                                placeholder="Tell us about your learning goals, interests, or background..."
                                className="w-full rounded-xl border border-gray-300 bg-white p-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                            />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
                        <div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                                <GraduationCap className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                                <span>Academic &amp; Personal Info</span>
                            </h3>
                            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                Additional record info for course enrollment and institutional verification.
                            </p>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field
                                label="Mobile Phone"
                                type="tel"
                                value={form.mobile}
                                onChange={(val) => setForm((p) => ({ ...p, mobile: val }))}
                                placeholder="+1 (555) 000-0000"
                                disabled={readOnly}
                            />
                            <Field
                                label="Date of Birth"
                                type="date"
                                value={form.dateOfBirth}
                                onChange={(val) => setForm((p) => ({ ...p, dateOfBirth: val }))}
                                disabled={readOnly}
                            />
                            <Field
                                label="Nationality"
                                value={form.nationality}
                                onChange={(val) => setForm((p) => ({ ...p, nationality: val }))}
                                placeholder="e.g. Canadian, American, etc."
                                disabled={readOnly}
                            />
                            <Field
                                label="Registration Number"
                                value={form.regNo}
                                onChange={(val) => setForm((p) => ({ ...p, regNo: val }))}
                                placeholder="Student/Reg Number"
                                disabled={readOnly}
                            />
                            <Field
                                label="Father's Name"
                                value={form.fathersName}
                                onChange={(val) => setForm((p) => ({ ...p, fathersName: val }))}
                                placeholder="Optional"
                                disabled={readOnly}
                            />
                            <Field
                                label="Mother's Name"
                                value={form.mothersName}
                                onChange={(val) => setForm((p) => ({ ...p, mothersName: val }))}
                                placeholder="Optional"
                                disabled={readOnly}
                            />
                        </div>
                    </div>

                    {/* Learner Address Card */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
                        <div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                                <MapPin className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                                <span>Address &amp; Location</span>
                            </h3>
                            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                Your physical location for regional academic scheduling and certificates.
                            </p>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <Field
                                    label="Street Address"
                                    value={form.address.street || ""}
                                    onChange={(val) =>
                                        setForm((p) => ({
                                            ...p,
                                            address: { ...p.address, street: val },
                                        }))
                                    }
                                    placeholder="123 Academic Way, Apt 4B"
                                    disabled={readOnly}
                                />
                            </div>
                            <Field
                                label="City"
                                value={form.address.city || ""}
                                onChange={(val) =>
                                    setForm((p) => ({
                                        ...p,
                                        address: { ...p.address, city: val },
                                    }))
                                }
                                placeholder="City"
                                disabled={readOnly}
                            />
                            <Field
                                label="State / Province"
                                value={form.address.state || ""}
                                onChange={(val) =>
                                    setForm((p) => ({
                                        ...p,
                                        address: { ...p.address, state: val },
                                    }))
                                }
                                placeholder="State / Province"
                                disabled={readOnly}
                            />
                            <Field
                                label="ZIP / Postal Code"
                                value={form.address.zip || ""}
                                onChange={(val) =>
                                    setForm((p) => ({
                                        ...p,
                                        address: { ...p.address, zip: val },
                                    }))
                                }
                                placeholder="Postal code"
                                disabled={readOnly}
                            />
                            <SelectField
                                label="Country"
                                value={form.address.country || ""}
                                onChange={(val) =>
                                    setForm((p) => ({
                                        ...p,
                                        address: { ...p.address, country: val },
                                    }))
                                }
                                options={COUNTRIES}
                                searchable
                                placeholder="Select country"
                                disabled={readOnly}
                            />
                        </div>
                    </div>
                </>
            ) : null}

            {/* Links Section (Instructor & Learner only, not Admin) */}
            {!isAdmin && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                            <ExternalLink className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                            <span>Social &amp; Portfolio Links</span>
                        </h3>
                        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                            Add links to your GitHub, LinkedIn, portfolio, or personal website.
                        </p>
                    </div>

                    {!readOnly && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={() => handleAddLink("GitHub", "https://github.com/")}
                                className="cursor-pointer text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                            >
                                + GitHub
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAddLink("LinkedIn", "https://linkedin.com/in/")}
                                className="cursor-pointer text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                            >
                                + LinkedIn
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAddLink("Website", "https://")}
                                className="cursor-pointer text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                            >
                                + Website
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAddLink("", "")}
                                className="cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1 shadow-sm transition"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Add Custom</span>
                            </button>
                        </div>
                    )}
                </div>

                {form.links.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center dark:border-slate-800 dark:bg-slate-800/30">
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                            No external links added yet. Click one of the presets above to add your profiles.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {form.links.map((link, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40"
                            >
                                <div className="w-1/3 min-w-[120px]">
                                    <input
                                        type="text"
                                        placeholder="Title (e.g. GitHub)"
                                        value={link.title}
                                        onChange={(e) => handleUpdateLink(idx, "title", e.target.value)}
                                        disabled={readOnly}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                    />
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="url"
                                        placeholder="https://..."
                                        value={link.url}
                                        onChange={(e) => handleUpdateLink(idx, "url", e.target.value)}
                                        disabled={readOnly}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                    />
                                </div>
                                {link.url && (
                                    <a
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                                        title="Open link in new tab"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                )}
                                {!readOnly && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveLink(idx)}
                                        className="cursor-pointer p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                                        title="Delete link"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            )}

            {/* Sticky Save Bar */}
            {!readOnly && (
                <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="text-xs text-gray-500 dark:text-slate-400">
                        {hasChanges ? (
                            <span className="font-semibold text-amber-600 dark:text-amber-400">
                                • You have unsaved changes
                            </span>
                        ) : (
                            <span>All changes saved to your profile</span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleDiscard}
                            disabled={!hasChanges || saving}
                            className="cursor-pointer rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
                        >
                            Discard
                        </button>
                        <button
                            type="submit"
                            disabled={!hasChanges || saving}
                            className="cursor-pointer flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Check className="h-3.5 w-3.5" />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </form>
    );
}