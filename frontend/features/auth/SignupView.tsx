"use client";
import { useState } from "react";
import type { FormEvent } from "react";
import { Check, Clock, Layers, Loader2, Lock, Mail, RefreshCw, Send, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resendVerificationRequest, signupRequest } from "@/lib/api/auth";

export function SignupView() {
    const router = useRouter();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendStatus, setResendStatus] = useState<string | null>(null);
    const [resendCooldown, setResendCooldown] = useState(0);

    const clearError = (key: string) =>
        setErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });

    const validate = () => {
        const next: Record<string, string> = {};
        if (!firstName.trim()) next.firstName = "First name is required.";
        if (!lastName.trim()) next.lastName = "Last name is required.";
        if (!email.trim()) next.email = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
            next.email = "Enter a valid email address.";
        if (!password) next.password = "Password is required.";
        else if (password.length < 8) next.password = "Password must be at least 8 characters.";
        else if (!/[A-Z]/.test(password)) next.password = "Password must contain at least one uppercase letter.";
        else if (!/\d/.test(password)) next.password = "Password must contain at least one number.";
        if (!confirmPassword) next.confirmPassword = "Please confirm your password.";
        else if (password !== confirmPassword) next.confirmPassword = "Passwords don't match.";
        return next;
    };

    const handleResend = async () => {
        if (!email.trim() || resending || resendCooldown > 0) return;
        setResending(true);
        setResendStatus(null);
        try {
            const res = await resendVerificationRequest(email.trim());
            setResendStatus(res.message || "Verification link sent! Check your inbox.");
            setResendCooldown(60);
            const interval = setInterval(() => {
                setResendCooldown((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (err) {
            setResendStatus(
                err instanceof Error && err.message
                    ? err.message
                    : "Failed to resend verification link. Please try again."
            );
        } finally {
            setResending(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const next = validate();
        setErrors(next);
        if (Object.keys(next).length > 0) return;
        setLoading(true);
        setFormError(null);
        try {
            await signupRequest(firstName.trim(), lastName.trim(), email.trim(), password);
            setSuccess(true);
        } catch (err) {
            setFormError(
                err instanceof Error && err.message
                    ? err.message
                    : "Sign up failed. Please try again.",
            );
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex min-h-dvh items-center justify-center bg-white px-4 py-12 dark:bg-slate-950">
                <div className="flex flex-col items-center text-center max-w-lg w-full rounded-3xl border border-gray-100 bg-white p-8 sm:p-10 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in">
                    <div className="relative mb-6">
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shadow-inner">
                            <Mail className="h-10 w-10" />
                        </div>
                        <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white ring-4 ring-white dark:ring-slate-900">
                            <Clock className="h-4 w-4" />
                        </span>
                    </div>

                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100 sm:text-3xl">
                        Verify your email address
                    </h2>
                    
                    <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-slate-400">
                        We&apos;ve sent a verification link to{" "}
                        <strong className="font-semibold text-gray-900 dark:text-slate-200">
                            {email}
                        </strong>
                        . Please open the link in your email to activate your account before signing in.
                    </p>

                    <div className="mt-6 w-full rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-left dark:border-blue-900/40 dark:bg-blue-950/30">
                        <p className="text-xs text-blue-900 dark:text-blue-200">
                            <strong className="font-semibold">Important:</strong> The verification link is valid for <strong>24 hours</strong>. If you don&apos;t see the email, please check your spam or junk folder.
                        </p>
                    </div>

                    {resendStatus && (
                        <div className="mt-4 w-full rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 animate-in fade-in">
                            {resendStatus}
                        </div>
                    )}

                    <div className="mt-8 flex w-full flex-col gap-3">
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={resending || resendCooldown > 0}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {resending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Sending Link...</span>
                                </>
                            ) : resendCooldown > 0 ? (
                                <>
                                    <Clock className="h-4 w-4" />
                                    <span>Resend in {resendCooldown}s</span>
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    <span>Resend Verification Email</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => router.push("/")}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            Back to Sign In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-dvh flex-col bg-white lg:flex-row dark:bg-slate-950">
            {/* ---------- Left: full-height brand panel ---------- */}
            <div className="relative overflow-hidden bg-[linear-gradient(135deg,#1a73e8,#0d47a1)] px-8 py-12 text-white sm:px-12 lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:px-16 lg:py-16 xl:px-24">
                {/* Decorative circles / spheres */}
                <span
                    aria-hidden
                    className="pointer-events-none absolute -left-40 -top-80 h-[560px] w-[560px] rounded-full bg-white/10"
                />
                <span
                    aria-hidden
                    className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10"
                />
                <span
                    aria-hidden
                    className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_32%_30%,#7db2ff,#0a3d8f_72%)]"
                />
                <span
                    aria-hidden
                    className="pointer-events-none absolute -bottom-20 left-[42%] h-56 w-56 rounded-full bg-[radial-gradient(circle_at_32%_30%,#7db2ff,#0a3d8f_72%)]"
                />
                <div className="relative">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
                            <Layers className="h-6 w-6" />
                        </span>
                        <span className="text-xl font-semibold tracking-tight">CourseDesk</span>
                    </div>
                    <h1 className="mt-10 text-4xl font-bold tracking-[0.06em] sm:text-5xl">JOIN US</h1>
                    <p className="mt-4 text-sm font-semibold uppercase tracking-[0.24em] text-white/90">
                        Start Your Learning Journey
                    </p>
                    <p className="mt-6 max-w-md text-sm leading-6 text-white/80">
                        Create your account to access courses, track assignments, collaborate with instructors, and manage your academic progress seamlessly in one place.
                    </p>
                </div>
            </div>
            {/* ---------- Right: full-height form panel ---------- */}
            <div className="relative flex flex-1 flex-col justify-center overflow-hidden bg-white px-6 py-12 sm:px-12 lg:px-16 xl:px-24 dark:bg-slate-900">
                {/* Decorative corner sphere */}
                <span
                    aria-hidden
                    className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_35%_30%,#7db2ff,#0a3d8f_72%)]"
                />
                <div className="relative mx-auto w-full max-w-md">
                    <h2 className="text-3xl font-semibold text-gray-900 dark:text-slate-100">Create account</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">to get started with CourseDesk</p>
                    <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
                        {/* First & Last Name */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <label
                                    className={`flex items-center gap-3 rounded-lg bg-[#e8eaed] px-4 py-3 transition-shadow focus-within:ring-2 focus-within:ring-[#1a73e8] dark:bg-slate-800 ${
                                        errors.firstName ? "ring-2 ring-[#c5221f]" : ""
                                    }`}
                                >
                                    <User className="h-5 w-5 shrink-0 text-gray-700 dark:text-slate-400" />
                                    <input
                                        type="text"
                                        value={firstName}
                                        autoComplete="given-name"
                                        placeholder="First name"
                                        onChange={(e) => {
                                            setFirstName(e.target.value);
                                            clearError("firstName");
                                        }}
                                        className="w-full bg-transparent text-[15px] text-gray-900 placeholder:text-gray-600 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                                    />
                                </label>
                                {errors.firstName && (
                                    <span className="mt-1 block text-xs text-[#c5221f]">{errors.firstName}</span>
                                )}
                            </div>
                            <div>
                                <label
                                    className={`flex items-center gap-3 rounded-lg bg-[#e8eaed] px-4 py-3 transition-shadow focus-within:ring-2 focus-within:ring-[#1a73e8] dark:bg-slate-800 ${
                                        errors.lastName ? "ring-2 ring-[#c5221f]" : ""
                                    }`}
                                >
                                    <User className="h-5 w-5 shrink-0 text-gray-700 dark:text-slate-400" />
                                    <input
                                        type="text"
                                        value={lastName}
                                        autoComplete="family-name"
                                        placeholder="Last name"
                                        onChange={(e) => {
                                            setLastName(e.target.value);
                                            clearError("lastName");
                                        }}
                                        className="w-full bg-transparent text-[15px] text-gray-900 placeholder:text-gray-600 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                                    />
                                </label>
                                {errors.lastName && (
                                    <span className="mt-1 block text-xs text-[#c5221f]">{errors.lastName}</span>
                                )}
                            </div>
                        </div>
                        {/* Email */}
                        <div>
                            <label
                                className={`flex items-center gap-3 rounded-lg bg-[#e8eaed] px-4 py-3 transition-shadow focus-within:ring-2 focus-within:ring-[#1a73e8] dark:bg-slate-800 ${errors.email ? "ring-2 ring-[#c5221f]" : ""
                                    }`}
                            >
                                <Mail className="h-5 w-5 shrink-0 text-gray-700 dark:text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    autoComplete="email"
                                    placeholder="Email address"
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        clearError("email");
                                    }}
                                    className="w-full bg-transparent text-[15px] text-gray-900 placeholder:text-gray-600 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                                />
                            </label>
                            {errors.email && (
                                <span className="mt-1 block text-sm text-[#c5221f]">{errors.email}</span>
                            )}
                        </div>
                        {/* Password */}
                        <div>
                            <label
                                className={`flex items-center gap-3 rounded-lg bg-[#e8eaed] py-3 pl-4 pr-2 transition-shadow focus-within:ring-2 focus-within:ring-[#1a73e8] dark:bg-slate-800 ${errors.password ? "ring-2 ring-[#c5221f]" : ""
                                    }`}
                            >
                                <Lock className="h-5 w-5 shrink-0 text-gray-700 dark:text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    autoComplete="new-password"
                                    placeholder="Password"
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        clearError("password");
                                    }}
                                    className="w-full bg-transparent text-[15px] text-gray-900 placeholder:text-gray-600 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                                />
                                <button
                                    type="button"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="shrink-0 cursor-pointer px-2 text-xs font-semibold tracking-wider text-[#1a73e8] hover:underline dark:text-blue-400"
                                >
                                    {showPassword ? "HIDE" : "SHOW"}
                                </button>
                            </label>
                            {errors.password && (
                                <span className="mt-1 block text-sm text-[#c5221f]">{errors.password}</span>
                            )}
                        </div>
                        {/* Confirm Password */}
                        <div>
                            <label
                                className={`flex items-center gap-3 rounded-lg bg-[#e8eaed] py-3 pl-4 pr-2 transition-shadow focus-within:ring-2 focus-within:ring-[#1a73e8] dark:bg-slate-800 ${errors.confirmPassword ? "ring-2 ring-[#c5221f]" : ""
                                    }`}
                            >
                                <Lock className="h-5 w-5 shrink-0 text-gray-700 dark:text-slate-400" />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    autoComplete="new-password"
                                    placeholder="Confirm password"
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        clearError("confirmPassword");
                                    }}
                                    className="w-full bg-transparent text-[15px] text-gray-900 placeholder:text-gray-600 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                                />
                                <button
                                    type="button"
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                    onClick={() => setShowConfirmPassword((v) => !v)}
                                    className="shrink-0 cursor-pointer px-2 text-xs font-semibold tracking-wider text-[#1a73e8] hover:underline dark:text-blue-400"
                                >
                                    {showConfirmPassword ? "HIDE" : "SHOW"}
                                </button>
                            </label>
                            {errors.confirmPassword && (
                                <span className="mt-1 block text-sm text-[#c5221f]">{errors.confirmPassword}</span>
                            )}
                        </div>
                        {/* Form-level error */}
                        {formError && (
                            <p className="rounded-md bg-[#fce8e6] px-4 py-2.5 text-sm text-[#c5221f] dark:border dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
                                {formError}
                            </p>
                        )}
                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1a63d8] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1554b5] disabled:cursor-default disabled:opacity-70 dark:bg-blue-600 dark:hover:bg-blue-500"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {loading ? "Creating account…" : "Create account"}
                        </button>
                    </form>
                    {/* Sign in link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600 dark:text-slate-400">
                            Already have an account?{" "}
                            <Link href="/" className="font-medium text-[#1a73e8] hover:underline dark:text-blue-400">
                                Sign in
                            </Link>
                        </p>
                    </div>
                    {/* Legal */}
                    <div className="mt-10 flex items-center justify-center gap-2 text-xs text-gray-700 dark:text-slate-500">
                        <a href="#" className="hover:underline">
                            Privacy Policy
                        </a>
                        <span>•</span>
                        <a href="#" className="hover:underline">
                            Terms of Service
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}