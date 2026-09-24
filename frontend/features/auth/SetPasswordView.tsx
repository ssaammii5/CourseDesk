"use client";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Check, Eye, EyeOff, Layers, Loader2, Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { setPasswordRequest } from "@/lib/api/users";

function SetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") ?? "";
    const email = searchParams.get("email") ?? "";

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [passError, setPassError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [countdown, setCountdown] = useState(5);

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

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!token) {
            return setPassError("Missing invitation token. Please check your invitation link.");
        }
        if (!allRequirementsMet) {
            return setPassError("Password doesn't meet all requirements yet.");
        }
        if (newPassword !== confirmPassword) {
            return setPassError("Passwords don't match.");
        }
        setPassError(null);
        setLoading(true);
        try {
            await setPasswordRequest(token, newPassword);
            setSuccess(true);
        } catch (err) {
            setPassError(
                err instanceof Error
                    ? err.message
                    : "Failed to set password. The link may have expired or is invalid."
            );
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex min-h-dvh items-center justify-center bg-white px-4 dark:bg-slate-950">
                <div className="flex flex-col items-center text-center">
                    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#e6f4ea] dark:border dark:border-emerald-800/40 dark:bg-emerald-950/60">
                        <Check className="h-10 w-10 text-[#188038] dark:text-emerald-400" />
                    </span>
                    <h2 className="mt-6 text-3xl font-semibold text-gray-900 dark:text-slate-100">Password set successfully</h2>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-gray-600 dark:text-slate-400">
                        Your password has been created. You can now sign in to CourseDesk with your email and new password.
                    </p>
                    <button
                        type="button"
                        onClick={() => router.push("/")}
                        className="mt-8 flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1a63d8] px-8 py-3 text-sm font-semibold text-white hover:bg-[#1554b5] dark:bg-blue-600 dark:hover:bg-blue-500"
                    >
                        Go to Sign In
                    </button>
                    <p className="mt-4 text-xs text-gray-600 dark:text-slate-400">
                        Redirecting automatically in {countdown}s…
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-dvh flex-col bg-white lg:flex-row dark:bg-slate-950">
            {/* Left Panel */}
            <div className="relative overflow-hidden bg-[linear-gradient(135deg,#1a73e8,#0d47a1)] px-8 py-12 text-white sm:px-12 lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:px-16 lg:py-16 xl:px-24">
                <span aria-hidden className="pointer-events-none absolute -left-40 -top-80 h-[560px] w-[560px] rounded-full bg-white/10" />
                <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10" />
                <span aria-hidden className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_32%_30%,#7db2ff,#0a3d8f_72%)]" />
                <div className="relative">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
                            <Layers className="h-6 w-6" />
                        </span>
                        <span className="text-xl font-semibold tracking-tight">CourseDesk</span>
                    </div>
                    <h1 className="mt-10 text-4xl font-bold tracking-[0.06em] sm:text-5xl">SET PASSWORD</h1>
                    <p className="mt-4 text-sm font-semibold uppercase tracking-[0.28em] text-white/90">
                        Secure your account
                    </p>
                    <p className="mt-6 max-w-md text-sm leading-6 text-white/80">
                        An administrator has created your account. Set a strong password below to activate your access to the CourseDesk platform.
                    </p>
                </div>
            </div>

            {/* Right Panel */}
            <div className="relative flex flex-1 flex-col justify-center overflow-hidden bg-white px-6 py-12 sm:px-12 lg:px-16 xl:px-24 dark:bg-slate-900">
                <span aria-hidden className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_35%_30%,#7db2ff,#0a3d8f_72%)]" />
                <div className="relative mx-auto w-full max-w-md">
                    <h2 className="text-3xl font-semibold text-gray-900 dark:text-slate-100">Create your password</h2>
                    {email && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                            Account: <span className="font-medium text-gray-900 dark:text-slate-200">{email}</span>
                        </p>
                    )}

                    {!token && (
                        <div className="mt-4 rounded-lg bg-[#fce8e6] px-4 py-3 text-sm text-[#c5221f] dark:border dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
                            Missing invitation token. Please make sure you used the full link provided in your invitation.
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
                        {/* New Password */}
                        <div>
                            <label
                                className={`flex items-center gap-3 rounded-lg bg-[#e8eaed] py-3 pl-4 pr-2 transition-shadow focus-within:ring-2 focus-within:ring-[#1a73e8] dark:bg-slate-800 ${passError ? "ring-2 ring-[#c5221f]" : ""}`}
                            >
                                <Lock className="h-5 w-5 shrink-0 text-gray-700 dark:text-slate-400" />
                                <input
                                    type={showNew ? "text" : "password"}
                                    value={newPassword}
                                    autoComplete="new-password"
                                    placeholder="New password"
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        setPassError(null);
                                    }}
                                    className="w-full bg-transparent text-[15px] text-gray-900 placeholder:text-gray-600 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                                />
                                <button
                                    type="button"
                                    aria-label={showNew ? "Hide password" : "Show password"}
                                    onClick={() => setShowNew((v) => !v)}
                                    className="shrink-0 cursor-pointer p-1 text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
                                >
                                    {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </label>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label
                                className={`flex items-center gap-3 rounded-lg bg-[#e8eaed] py-3 pl-4 pr-2 transition-shadow focus-within:ring-2 focus-within:ring-[#1a73e8] dark:bg-slate-800 ${passError ? "ring-2 ring-[#c5221f]" : ""}`}
                            >
                                <Lock className="h-5 w-5 shrink-0 text-gray-700 dark:text-slate-400" />
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    value={confirmPassword}
                                    autoComplete="new-password"
                                    placeholder="Confirm new password"
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        setPassError(null);
                                    }}
                                    className="w-full bg-transparent text-[15px] text-gray-900 placeholder:text-gray-600 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                                />
                                <button
                                    type="button"
                                    aria-label={showConfirm ? "Hide password" : "Show password"}
                                    onClick={() => setShowConfirm((v) => !v)}
                                    className="shrink-0 cursor-pointer p-1 text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
                                >
                                    {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </label>
                        </div>

                        {/* Requirements */}
                        <ul className="space-y-2 rounded-lg bg-[#e8eaed]/60 px-4 py-3 dark:bg-slate-850/60 dark:bg-slate-800/60">
                            {requirements.map((r) => (
                                <li
                                    key={r.label}
                                    className={`flex items-center gap-2 text-sm ${r.ok ? "text-[#137333] dark:text-emerald-400" : "text-gray-600 dark:text-slate-400"}`}
                                >
                                    <Check className={`h-4 w-4 ${r.ok ? "text-[#188038] dark:text-emerald-400" : "text-gray-400 dark:text-slate-500"}`} />
                                    {r.label}
                                </li>
                            ))}
                        </ul>

                        {passError && <p className="text-sm text-[#c5221f]">{passError}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1a63d8] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1554b5] disabled:cursor-default disabled:opacity-70 dark:bg-blue-600 dark:hover:bg-blue-500"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {loading ? "Setting password…" : "Set Password"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-xs text-gray-500 dark:text-slate-400">
                        If you didn't expect this email, please contact your administrator.
                    </p>
                </div>
            </div>
        </div>
    );
}

export function SetPasswordView() {
    return (
        <Suspense>
            <SetPasswordForm />
        </Suspense>
    );
}