"use client";

import { useEffect, useState, useRef } from "react";
import type { FormEvent } from "react";
import {
    Briefcase,
    Camera,
    Check,
    Clock,
    Eye,
    EyeOff,
    Globe,
    Layers,
    Loader2,
    Lock,
    Mail,
    Plus,
    Trash2,
    User,
    AlertCircle,
    X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { acceptInviteRequest, verifyInviteRequest } from "@/lib/api/auth";
import { setPasswordRequest, uploadAvatarRequest, type InstructorLink } from "@/lib/api/users";
import { setTokens } from "@/lib/auth/session";
import { COMMON_TIMEZONES } from "@/lib/constants/timezones";
import { ModernDropdown } from "@/components/ui/ModernDropdown";

function SetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") ?? "";

    // Verification state
    const [verifying, setVerifying] = useState(true);
    const [tokenValid, setTokenValid] = useState<boolean | null>(null);
    const [verifiedRole, setVerifiedRole] = useState<string>("Instructor");
    const [verifyError, setVerifyError] = useState<string | null>(null);

    // Form fields
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [headline, setHeadline] = useState("");
    const [timezone, setTimezone] = useState(() => {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        } catch {
            return "UTC";
        }
    });
    const [avatar, setAvatar] = useState("");
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [avatarError, setAvatarError] = useState<string | null>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const [links, setLinks] = useState<InstructorLink[]>([]);
    const [newLinkTitle, setNewLinkTitle] = useState("");
    const [newLinkUrl, setNewLinkUrl] = useState("");

    // Password fields
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Form feedback
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [countdown, setCountdown] = useState(4);

    // Verify token on mount
    useEffect(() => {
        let isMounted = true;
        if (!token) {
            setVerifying(false);
            setTokenValid(false);
            setVerifyError("No invitation token provided. Please check your invitation link.");
            return;
        }

        verifyInviteRequest(token)
            .then((res) => {
                if (!isMounted) return;
                setTokenValid(true);
                setVerifiedRole(res.role || "Instructor");
                setVerifying(false);
            })
            .catch((err) => {
                if (!isMounted) return;
                setTokenValid(false);
                setVerifyError(
                    err instanceof Error
                        ? err.message
                        : "This invitation link is invalid, expired, or has been revoked."
                );
                setVerifying(false);
            });

        return () => {
            isMounted = false;
        };
    }, [token]);

    // Automatic redirect countdown on success
    useEffect(() => {
        if (!success) return;
        if (countdown <= 0) {
            router.push("/");
            return;
        }
        const timer = window.setTimeout(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);
        return () => window.clearTimeout(timer);
    }, [success, countdown, router]);

    const requirements = [
        { label: "At least 8 characters", ok: newPassword.length >= 8 },
        { label: "At least one uppercase letter", ok: /[A-Z]/.test(newPassword) },
        { label: "At least one number", ok: /\d/.test(newPassword) },
        { label: "At least one special character", ok: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword) },
    ];
    const allRequirementsMet = requirements.every((r) => r.ok);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        const allowed = ["image/jpeg", "image/png", "image/webp"];
        if (!allowed.includes(file.type)) {
            setAvatarError("Only JPG, PNG, or WEBP images are allowed.");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setAvatarError("Image must be smaller than 2 MB.");
            return;
        }

        setAvatarError(null);
        setAvatarLoading(true);
        try {
            const res = await uploadAvatarRequest(file);
            setAvatar(res.url);
        } catch (err: any) {
            setAvatarError(err?.message || "Failed to upload avatar");
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleAddLink = () => {
        const title = newLinkTitle.trim();
        const url = newLinkUrl.trim();
        if (!url) return;

        let formattedUrl = url;
        if (!/^https?:\/\//i.test(formattedUrl)) {
            formattedUrl = `https://${formattedUrl}`;
        }

        setLinks((prev) => [...prev, { title: title || "Website", url: formattedUrl }]);
        setNewLinkTitle("");
        setNewLinkUrl("");
    };

    const handleRemoveLink = (idx: number) => {
        setLinks((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        const errs: Record<string, string> = {};

        const isInstructor = verifiedRole === "Instructor" || verifiedRole === "Teacher";
        const trimmedEmail = email.trim().toLowerCase();

        if (!trimmedEmail) {
            errs.email = "Email address is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            errs.email = "Please enter a valid email address.";
        }

        if (isInstructor) {
            if (!firstName.trim()) errs.firstName = "First name is required.";
            if (!lastName.trim()) errs.lastName = "Last name is required.";
        }

        if (!newPassword) {
            errs.password = "Password is required.";
        } else if (!allRequirementsMet) {
            errs.password = "Password doesn't meet all security requirements.";
        }

        if (newPassword !== confirmPassword) {
            errs.confirmPassword = "Passwords do not match.";
        }

        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        setErrors({});
        setLoading(true);

        try {
            if (isInstructor) {
                const res = await acceptInviteRequest({
                    token,
                    email: trimmedEmail,
                    password: newPassword,
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    professionalHeadline: headline.trim(),
                    timezone,
                    avatar: avatar || null,
                    links,
                });
                const tokenStr = res.accessToken || res.token;
                if (tokenStr) {
                    setTokens(tokenStr, res.refreshToken);
                }
            } else {
                await setPasswordRequest(token, newPassword, trimmedEmail);
            }
            setSuccess(true);
        } catch (err) {
            const msg =
                err instanceof Error
                    ? err.message
                    : "Failed to setup account. The link may have expired or been revoked.";
            setSubmitError(msg);
            if (msg.toLowerCase().includes("email")) {
                setErrors((prev) => ({ ...prev, email: msg }));
            }
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="flex min-h-dvh items-center justify-center bg-gray-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
                        Verifying invitation...
                    </p>
                </div>
            </div>
        );
    }

    if (tokenValid === false) {
        return (
            <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-4 dark:bg-slate-950">
                <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg dark:border-slate-800 dark:bg-slate-900">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                        <AlertCircle className="h-7 w-7" />
                    </div>
                    <h2 className="mt-5 text-xl font-bold text-gray-900 dark:text-slate-100">
                        Invalid or Expired Invitation
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                        {verifyError || "This invitation link is no longer valid, has expired, or was revoked by an administrator."}
                    </p>
                    <button
                        type="button"
                        onClick={() => router.push("/")}
                        className="mt-6 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
                    >
                        Return to Sign In
                    </button>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-4 dark:bg-slate-950">
                <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                        <Check className="h-8 w-8" />
                    </div>
                    <h2 className="mt-5 text-2xl font-bold text-gray-900 dark:text-slate-100">
                        Account Ready!
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                        Welcome to CourseDesk! Your profile credentials have been saved and your account is active.
                    </p>
                    <button
                        type="button"
                        onClick={() => router.push("/")}
                        className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition active:scale-95"
                    >
                        Enter CourseDesk Dashboard
                    </button>
                    <p className="mt-3 text-xs text-gray-400 dark:text-slate-500">
                        Redirecting automatically in {countdown}s…
                    </p>
                </div>
            </div>
        );
    }

    const isInstructor = verifiedRole === "Instructor" || verifiedRole === "Teacher";

    return (
        <div className="min-h-dvh bg-gray-50/70 dark:bg-slate-950 py-10 px-4 sm:px-6">
            <div className="mx-auto max-w-2xl">
                {/* Header branding */}
                <div className="mb-8 flex items-center justify-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                        <Layers className="h-6 w-6" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
                        CourseDesk
                    </span>
                </div>

                {/* Form Card */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                    {/* Top banner */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 text-white sm:px-8">
                        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                            {isInstructor ? "Instructor Onboarding" : "Account Setup"}
                        </span>
                        <h1 className="mt-3 text-2xl sm:text-3xl font-bold">
                            {isInstructor ? "Welcome! Complete your profile" : "Set your password"}
                        </h1>
                        <p className="mt-1 text-sm text-blue-100">
                            Please confirm your invited email address and complete your account setup.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate className="p-6 sm:p-8 space-y-8">
                        {submitError && (
                            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <span>{submitError}</span>
                            </div>
                        )}

                        {/* SECTION 1: Instructor Personal Profile (Mandatory) */}
                        {isInstructor && (
                            <div className="space-y-5">
                                <div className="border-b border-gray-100 pb-3 dark:border-slate-800">
                                    <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                                        <User className="h-4 w-4 text-blue-600" />
                                        1. Personal Information <span className="text-xs font-normal text-red-500">(Required)</span>
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">
                                        These will appear on your courses, syllabus, and student-facing profile.
                                    </p>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                            First Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => {
                                                setFirstName(e.target.value);
                                                setErrors((p) => ({ ...p, firstName: "" }));
                                            }}
                                            placeholder="Enter first name"
                                            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                                        />
                                        {errors.firstName && (
                                            <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                            Last Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => {
                                                setLastName(e.target.value);
                                                setErrors((p) => ({ ...p, lastName: "" }));
                                            }}
                                            placeholder="Enter last name"
                                            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                                        />
                                        {errors.lastName && (
                                            <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                setErrors((p) => ({ ...p, email: "" }));
                                            }}
                                            placeholder="Enter your email address"
                                            className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                                        />
                                    </div>
                                    <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
                                        Enter the email address this invitation was sent to.
                                    </p>
                                    {errors.email && (
                                        <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                        Professional Headline
                                    </label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={headline}
                                            onChange={(e) => {
                                                setHeadline(e.target.value);
                                                setErrors((p) => ({ ...p, headline: "" }));
                                            }}
                                            placeholder="Enter professional headline"
                                            className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                                        />
                                    </div>
                                    {errors.headline && (
                                        <p className="mt-1 text-xs text-red-500">{errors.headline}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                        Timezone <span className="text-red-500">*</span>
                                    </label>
                                    <ModernDropdown
                                        value={timezone}
                                        onChange={setTimezone}
                                        options={COMMON_TIMEZONES}
                                        searchable
                                        size="md"
                                        placeholder="Select your timezone"
                                        buttonClassName="w-full justify-between"
                                    />
                                    <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
                                        Used for scheduling live lectures, submissions, and assignment deadlines.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* SECTION 2: Security & Password (Mandatory) */}
                        <div className="space-y-5">
                            <div className="border-b border-gray-100 pb-3 dark:border-slate-800">
                                <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-blue-600" />
                                    {isInstructor ? "2. Account Password" : "1. Create Password"} <span className="text-xs font-normal text-red-500">(Required)</span>
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    Choose a strong password to protect your account.
                                </p>
                            </div>

                            {!isInstructor && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                setErrors((p) => ({ ...p, email: "" }));
                                            }}
                                            placeholder="Enter your email address"
                                            className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                                        />
                                    </div>
                                    <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
                                        Enter the email address this invitation was sent to.
                                    </p>
                                    {errors.email && (
                                        <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                                    )}
                                </div>
                            )}

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                        Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showNew ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => {
                                                setNewPassword(e.target.value);
                                                setErrors((p) => ({ ...p, password: "" }));
                                            }}
                                            placeholder="Enter password"
                                            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNew((v) => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                                        >
                                            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                        Confirm Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirm ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                setConfirmPassword(e.target.value);
                                                setErrors((p) => ({ ...p, confirmPassword: "" }));
                                            }}
                                            placeholder="Confirm password"
                                            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm((v) => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                                        >
                                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && (
                                        <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
                                    )}
                                </div>
                            </div>

                            {/* Password requirements checklist */}
                            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                                <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                    Password Requirements:
                                </p>
                                <div className="grid gap-1.5 sm:grid-cols-2 text-xs">
                                    {requirements.map((r, i) => (
                                        <div
                                            key={i}
                                            className={`flex items-center gap-2 ${
                                                r.ok ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-slate-500"
                                            }`}
                                        >
                                            <div
                                                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                                                    r.ok ? "bg-emerald-100 dark:bg-emerald-950 font-bold" : "bg-gray-200 dark:bg-slate-700"
                                                }`}
                                            >
                                                {r.ok ? "✓" : "•"}
                                            </div>
                                            <span>{r.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: Avatar & Links (Optional for instructor) */}
                        {isInstructor && (
                            <div className="space-y-5">
                                <div className="border-b border-gray-100 pb-3 dark:border-slate-800">
                                    <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-blue-600" />
                                        3. Avatar & Portfolio Links <span className="text-xs font-normal text-gray-400">(Optional)</span>
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">
                                        You can also add or change these anytime later in Account Settings.
                                    </p>
                                </div>

                                {/* Avatar Uploader */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                        Profile Avatar
                                    </label>
                                    <input
                                        ref={avatarInputRef}
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={handleAvatarUpload}
                                    />
                                    <div className="flex items-center gap-4">
                                        {avatar ? (
                                            <div className="relative h-16 w-16 rounded-xl overflow-hidden ring-2 ring-blue-500 shadow-sm">
                                                <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setAvatar("")}
                                                    className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                                                    title="Remove avatar"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500 border border-dashed border-gray-300 dark:border-slate-700">
                                                <Camera className="h-6 w-6" />
                                            </div>
                                        )}

                                        <div>
                                            <button
                                                type="button"
                                                disabled={avatarLoading}
                                                onClick={() => avatarInputRef.current?.click()}
                                                className="rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 transition"
                                            >
                                                {avatarLoading ? "Uploading..." : avatar ? "Change Photo" : "Upload Photo"}
                                            </button>
                                            <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
                                                JPG, PNG or WEBP under 2 MB.
                                            </p>
                                            {avatarError && (
                                                <p className="mt-1 text-xs text-red-500">{avatarError}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Links Builder */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                        Portfolio & Social Links
                                    </label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="text"
                                            value={newLinkTitle}
                                            onChange={(e) => setNewLinkTitle(e.target.value)}
                                            placeholder="Enter link title (e.g. LinkedIn)"
                                            className="sm:w-1/3 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                                        />
                                        <input
                                            type="url"
                                            value={newLinkUrl}
                                            onChange={(e) => setNewLinkUrl(e.target.value)}
                                            placeholder="Enter link URL (e.g. https://...)"
                                            className="flex-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddLink}
                                            disabled={!newLinkUrl.trim()}
                                            className="flex items-center justify-center gap-1.5 rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            <span>Add</span>
                                        </button>
                                    </div>

                                    {links.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {links.map((lnk, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/60 p-2.5 dark:border-slate-800 dark:bg-slate-800/40 text-xs"
                                                >
                                                    <div className="min-w-0 pr-2">
                                                        <span className="font-semibold text-gray-800 dark:text-slate-200">
                                                            {lnk.title || "Link"}:
                                                        </span>{" "}
                                                        <span className="text-blue-600 dark:text-blue-400 truncate">
                                                            {lnk.url}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveLink(idx)}
                                                        className="text-gray-400 hover:text-red-500 p-1"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 shadow-lg shadow-blue-600/25 transition active:scale-[0.99]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Setting Up Account...</span>
                                    </>
                                ) : (
                                    <span>
                                        {isInstructor ? "Complete Profile & Start Teaching" : "Set Password & Sign In"}
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export function SetPasswordView() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-dvh items-center justify-center bg-gray-50 dark:bg-slate-950">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            }
        >
            <SetPasswordForm />
        </Suspense>
    );
}