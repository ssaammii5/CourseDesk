"use client";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Check, CheckCircle2, Clock, KeyRound, Layers, Loader2, Lock, Mail, RefreshCw, Send, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resendVerificationRequest, signupRequest, verifyEmailRequest } from "@/lib/api/auth";

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

    // 6-digit OTP states
    const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
    const [otpError, setOtpError] = useState<string | null>(null);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

    const handleOtpChange = (index: number, val: string) => {
        const cleanVal = val.replace(/\D/g, "");
        if (!cleanVal && val) return;

        const newOtp = [...otp];
        newOtp[index] = cleanVal.slice(-1);
        setOtp(newOtp);
        setOtpError(null);

        // Auto-advance to next input
        if (cleanVal && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit if all 6 digits entered
        const fullCode = newOtp.join("");
        if (fullCode.length === 6 && !newOtp.includes("")) {
            void verifyOtpCode(fullCode);
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === "ArrowRight" && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (!pasted) return;

        const newOtp = ["", "", "", "", "", ""];
        for (let i = 0; i < pasted.length; i++) {
            newOtp[i] = pasted[i];
        }
        setOtp(newOtp);
        setOtpError(null);

        const nextFocusIndex = Math.min(pasted.length, 5);
        inputRefs.current[nextFocusIndex]?.focus();

        if (pasted.length === 6) {
            void verifyOtpCode(pasted);
        }
    };

    const verifyOtpCode = async (codeToVerify: string) => {
        if (verifyingOtp || codeToVerify.length !== 6) return;
        setVerifyingOtp(true);
        setOtpError(null);
        try {
            await verifyEmailRequest(codeToVerify, email.trim());
            setOtpVerified(true);
            setTimeout(() => {
                router.push("/?verified=true");
            }, 1200);
        } catch (err) {
            setOtpError(
                err instanceof Error && err.message
                    ? err.message
                    : "Invalid verification code. Please try again."
            );
        } finally {
            setVerifyingOtp(false);
        }
    };

    const handleResend = async () => {
        if (!email.trim() || resending || resendCooldown > 0) return;
        setResending(true);
        setResendStatus(null);
        setOtpError(null);
        try {
            const res = await resendVerificationRequest(email.trim());
            setResendStatus(res.message || "A new 6-digit code has been sent to your email!");
            setOtp(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
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
                    : "Failed to resend code. Please try again."
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
        if (otpVerified) {
            return (
                <div className="flex min-h-dvh items-center justify-center bg-white px-4 py-12 dark:bg-slate-950">
                    <div className="flex flex-col items-center text-center max-w-md w-full rounded-3xl border border-gray-100 bg-white p-8 sm:p-10 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 shadow-inner mb-6">
                            <CheckCircle2 className="h-10 w-10 animate-in zoom-in" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 sm:text-3xl">
                            Email Verified!
                        </h2>
                        <p className="mt-3 text-sm text-gray-600 dark:text-slate-400">
                            Your account has been verified and activated. Redirecting you to sign in...
                        </p>
                        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading sign in page...</span>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex min-h-dvh items-center justify-center bg-white px-4 py-12 dark:bg-slate-950">
                <div className="relative flex flex-col items-center text-center max-w-lg w-full rounded-3xl border border-gray-100 bg-white p-8 sm:p-10 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in">
                    {/* Top change email button */}
                    <button
                        type="button"
                        onClick={() => {
                            setSuccess(false);
                            setOtp(["", "", "", "", "", ""]);
                            setOtpError(null);
                        }}
                        className="absolute left-6 top-6 flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200 transition"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Edit Details</span>
                    </button>

                    <div className="relative mb-5 mt-2">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shadow-inner">
                            <KeyRound className="h-8 w-8" />
                        </div>
                        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-slate-900">
                            <Sparkles className="h-3.5 w-3.5" />
                        </span>
                    </div>

                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100 sm:text-3xl">
                        Enter 6-Digit Code
                    </h2>
                    
                    <p className="mt-2.5 text-sm text-gray-600 dark:text-slate-400 max-w-sm">
                        We sent a 6-digit confirmation code to{" "}
                        <strong className="font-semibold text-gray-900 dark:text-slate-200">
                            {email}
                        </strong>
                        .
                    </p>

                    {/* 6 OTP Cells */}
                    <div
                        className="flex items-center justify-center gap-2 sm:gap-3 my-6"
                        onPaste={handleOtpPaste}
                    >
                        {otp.map((digit, idx) => (
                            <input
                                key={idx}
                                ref={(el) => {
                                    inputRefs.current[idx] = el;
                                }}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={1}
                                autoComplete={idx === 0 ? "one-time-code" : "off"}
                                value={digit}
                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                autoFocus={idx === 0}
                                className={`h-13 w-11 sm:h-16 sm:w-13 rounded-2xl border text-center text-2xl font-bold font-mono transition-all outline-none caret-blue-600 dark:caret-blue-400 ${
                                    otpError
                                        ? "border-red-400 bg-red-50/60 text-red-700 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/15 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400 dark:focus:bg-slate-800 dark:focus:border-red-500 dark:focus:ring-red-500/25"
                                        : digit
                                        ? "border-blue-600 bg-white text-blue-700 shadow-sm ring-2 ring-blue-500/20 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/25 dark:border-blue-500 dark:bg-slate-800 dark:text-blue-300 dark:ring-blue-500/30 dark:focus:bg-slate-800 dark:focus:border-blue-400 dark:focus:ring-blue-500/40"
                                        : "border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-850 dark:bg-slate-800/60 dark:text-slate-100 dark:focus:bg-slate-800 dark:focus:border-blue-500 dark:focus:ring-blue-500/30"
                                }`}
                            />
                        ))}
                    </div>

                    {otpError && (
                        <div className="mb-4 w-full rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900 animate-in fade-in">
                            {otpError}
                        </div>
                    )}

                    {resendStatus && (
                        <div className="mb-4 w-full rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 animate-in fade-in">
                            {resendStatus}
                        </div>
                    )}

                    <div className="w-full space-y-3">
                        <button
                            type="button"
                            onClick={() => verifyOtpCode(otp.join(""))}
                            disabled={verifyingOtp || otp.join("").length !== 6}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/25 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                        >
                            {verifyingOtp ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Verifying Code...</span>
                                </>
                            ) : (
                                <span>Verify &amp; Activate Account</span>
                            )}
                        </button>

                        <div className="flex items-center justify-between pt-2 text-xs">
                            <span className="text-gray-500 dark:text-slate-400">
                                Valid for 15 minutes
                            </span>
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resending || resendCooldown > 0}
                                className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:no-underline"
                            >
                                {resending
                                    ? "Sending code..."
                                    : resendCooldown > 0
                                    ? `Resend code in ${resendCooldown}s`
                                    : "Resend Code"}
                            </button>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-slate-800 text-center">
                            <button
                                type="button"
                                onClick={() => router.push("/")}
                                className="text-xs font-medium text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200 transition"
                            >
                                Already verified? Sign in here
                            </button>
                        </div>
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
                        <Link href="/privacy" className="transition-colors hover:text-blue-600 hover:underline dark:hover:text-blue-400">
                            Privacy Policy
                        </Link>
                        <span>•</span>
                        <Link href="/terms" className="transition-colors hover:text-blue-600 hover:underline dark:hover:text-blue-400">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}