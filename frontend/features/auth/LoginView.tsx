"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    KeyRound,
    Layers,
    Loader2,
    Lock,
    Mail,
    Send,
    Sparkles,
    X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { resendVerificationRequest, verifyEmailRequest } from "@/lib/api/auth";
import { useAppSettings } from "@/context";
import { resolveBrandAssetUrl } from "@/lib/utils/format";

export function LoginView() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const verifiedParam = searchParams.get("verified") === "true";

    const { login } = useAuth();
    const { platformName, platformTagline, brandLogoDark, brandLogoLight } = useAppSettings();
    const logoUrl = brandLogoDark || brandLogoLight ? resolveBrandAssetUrl(brandLogoDark || brandLogoLight) : "";
    const [logoError, setLogoError] = useState(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // 6-digit OTP Verification state on Login screen
    const [showOtpSection, setShowOtpSection] = useState(false);
    const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
    const [otpError, setOtpError] = useState<string | null>(null);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [otpSuccessMessage, setOtpSuccessMessage] = useState<string | null>(null);
    const [resending, setResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState<string | null>(null);
    const [resendCooldown, setResendCooldown] = useState(0);

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
        if (!email.trim()) next.email = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
            next.email = "Enter a valid email address.";
        if (!password) next.password = "Password is required.";
        return next;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const next = validate();
        setErrors(next);
        if (Object.keys(next).length > 0) return;
        setLoading(true);
        setFormError(null);
        try {
            await login(email.trim(), password);
            router.push("/");
        } catch (err) {
            const msg =
                err instanceof Error && err.message
                    ? err.message
                    : "Sign in failed. Please try again.";
            setFormError(msg);
            setLoading(false);

            // If unverified, automatically show the OTP input card
            if (msg.toLowerCase().includes("verify")) {
                setShowOtpSection(true);
                setOtp(["", "", "", "", "", ""]);
                setOtpError(null);
                setResendSuccess(null);
                setTimeout(() => {
                    inputRefs.current[0]?.focus();
                }, 100);
            }
        }
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

        // Auto-verify if 6 digits entered
        const fullCode = newOtp.join("");
        if (fullCode.length === 6 && !newOtp.includes("")) {
            void handleVerifyOtp(fullCode);
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

        const nextFocus = Math.min(pasted.length, 5);
        inputRefs.current[nextFocus]?.focus();

        if (pasted.length === 6) {
            void handleVerifyOtp(pasted);
        }
    };

    const handleVerifyOtp = async (codeToVerify?: string) => {
        const fullCode = codeToVerify || otp.join("");
        if (!email.trim() || fullCode.length !== 6 || verifyingOtp) return;

        setVerifyingOtp(true);
        setOtpError(null);
        try {
            await verifyEmailRequest(fullCode, email.trim());

            // If user already typed password in login form, seamlessly log them in!
            if (password) {
                setOtpSuccessMessage("Email verified! Signing you in...");
                await login(email.trim(), password);
                router.push("/");
            } else {
                // Otherwise close OTP box and display verified banner
                setOtpSuccessMessage("Email verified successfully! You can now sign in.");
                setShowOtpSection(false);
                setFormError(null);
            }
        } catch (err) {
            setOtpError(
                err instanceof Error && err.message
                    ? err.message
                    : "Invalid verification code. Please check your code or request a new one."
            );
        } finally {
            setVerifyingOtp(false);
        }
    };

    const handleResendOtp = async () => {
        if (!email.trim() || resending || resendCooldown > 0) return;
        setResending(true);
        setResendSuccess(null);
        setOtpError(null);
        try {
            const res = await resendVerificationRequest(email.trim());
            setResendSuccess(res.message || "A new 6-digit code has been sent to your email!");
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
        } catch {
            setResendSuccess("A new 6-digit code has been sent if an unverified account exists.");
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="flex min-h-dvh flex-col bg-white lg:flex-row dark:bg-slate-950">
            {/* ---------- Left: full-height brand panel (stacks on top on mobile) ---------- */}
            <div className="relative overflow-hidden bg-[linear-gradient(135deg,#1a73e8,#0d47a1)] px-8 py-12 text-white sm:px-12 lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:px-16 lg:py-16 xl:px-24">
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
                    <div className="flex items-center gap-3">
                        {logoUrl && !logoError ? (
                            <img
                                src={logoUrl}
                                alt={platformName || "CourseDesk"}
                                onError={() => setLogoError(true)}
                                className="h-9 max-w-[180px] object-contain"
                            />
                        ) : (
                            <>
                                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
                                    <Layers className="h-6 w-6" />
                                </span>
                                <span className="text-xl font-semibold tracking-tight">{platformName || "CourseDesk"}</span>
                            </>
                        )}
                    </div>
                    <h1 className="mt-10 text-4xl font-bold tracking-[0.06em] sm:text-5xl">WELCOME</h1>
                    <p className="mt-4 text-sm font-semibold uppercase tracking-[0.24em] text-white/90">
                        {platformTagline || "Modern Course & Assignment Platform"}
                    </p>
                    <p className="mt-6 max-w-md text-sm leading-6 text-white/80">
                        Universal workspace for instructors, learners, and program managers.
                        Manage cohorts, organize learning tracks, deliver assignments, and review
                        submissions seamlessly in one place.
                    </p>
                </div>
            </div>

            {/* ---------- Right: full-height form panel ---------- */}
            <div className="relative flex flex-1 flex-col justify-center overflow-hidden bg-white px-6 py-12 sm:px-12 lg:px-16 xl:px-24 dark:bg-slate-900">
                <span
                    aria-hidden
                    className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_35%_30%,#7db2ff,#0a3d8f_72%)]"
                />
                <div className="relative mx-auto w-full max-w-md">
                    <h2 className="text-3xl font-semibold text-gray-900 dark:text-slate-100">Sign in</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">to continue to {platformName || "CourseDesk"}</p>

                    {(verifiedParam || otpSuccessMessage) && (
                        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 animate-in fade-in">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span>{otpSuccessMessage || "Your email has been verified! You can now sign in with your credentials."}</span>
                        </div>
                    )}

                    {/* =========================================================================
                        🚀 DISPOSABLE PORTFOLIO CODE: Demo Role Quick Switcher
                        Purpose: 1-click user switch between Admin, Coordinator, Instructor, Learner
                        To remove later: Simply delete this entire demarcated block
                        ========================================================================= */}
                    <div className="mt-5 rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/60 to-slate-50/60 p-3 sm:p-3.5 dark:border-slate-800 dark:from-slate-800/60 dark:to-slate-900/70">
                        <div className="flex items-center justify-between pb-2.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                                Demo Accounts
                            </span>
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                Click to fill credentials
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {[
                                {
                                    role: "Admin",
                                    name: "Mostafa Kamal",
                                    email: "admin@coursedesk.com",
                                    password: "Admin@123",
                                    badgeBg: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border dark:border-indigo-800/50",
                                    icon: (
                                        <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                            <path d="m9 12 2 2 4-4" />
                                        </svg>
                                    ),
                                },
                                {
                                    role: "Coordinator",
                                    name: "Dr. Shamsul Huda",
                                    email: "shamsul.huda@coursedesk.com",
                                    password: "Coordinator@123",
                                    badgeBg: "bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 dark:border dark:border-sky-800/50",
                                    icon: (
                                        <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <polyline points="16 11 18 13 22 9" />
                                        </svg>
                                    ),
                                },
                                {
                                    role: "Instructor",
                                    name: "Dr. Asaduzzaman",
                                    email: "asaduzzaman.nur@coursedesk.com",
                                    password: "Instructor@123",
                                    badgeBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border dark:border-emerald-800/50",
                                    icon: (
                                        <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
                                            <path d="M22 10v6" />
                                            <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
                                        </svg>
                                    ),
                                },
                                {
                                    role: "Learner",
                                    name: "Shakil Mahmud",
                                    email: "shakil.mahmud@coursedesk.com",
                                    password: "Learner@123",
                                    badgeBg: "bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 dark:border dark:border-amber-800/50",
                                    icon: (
                                        <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                        </svg>
                                    ),
                                },
                            ].map((demoUser) => {
                                const isSelected = email === demoUser.email;
                                return (
                                    <div
                                        key={demoUser.role}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => {
                                            setEmail(demoUser.email);
                                            setPassword(demoUser.password);
                                            setErrors({});
                                            setFormError(null);
                                            setShowOtpSection(false);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                setEmail(demoUser.email);
                                                setPassword(demoUser.password);
                                                setErrors({});
                                                setFormError(null);
                                                setShowOtpSection(false);
                                            }
                                        }}
                                        className={`group relative flex items-center justify-between rounded-xl border p-2 text-left transition-all cursor-pointer ${
                                            isSelected
                                                ? "border-blue-600 bg-white shadow-sm ring-2 ring-blue-500/25 dark:border-blue-500 dark:bg-slate-800 dark:ring-blue-500/30 dark:shadow-sm dark:shadow-blue-500/10"
                                                : "border-slate-200/90 bg-white/80 hover:border-blue-400 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-blue-500/60 dark:hover:bg-slate-800 dark:hover:shadow-sm"
                                        }`}
                                        title={`Select ${demoUser.role} (${demoUser.name})`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0 pr-1">
                                            <div
                                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105 ${demoUser.badgeBg}`}
                                            >
                                                {demoUser.icon}
                                            </div>
                                            <div className="min-w-0">
                                                <span className="block text-xs font-semibold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400 truncate">
                                                    {demoUser.role}
                                                </span>
                                                <span className="block text-[10px] text-slate-500 transition-colors group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200 truncate">
                                                    {demoUser.name}
                                                </span>
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    {/* =========================================================================
                        🚀 END DISPOSABLE PORTFOLIO CODE
                        ========================================================================= */}

                    {/* ---------- Integrated 6-Digit OTP Verification Section ---------- */}
                    {showOtpSection ? (
                        <div className="mt-6 rounded-2xl border-2 border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900/60 dark:bg-blue-950/20 animate-in fade-in zoom-in-95 space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/30">
                                        <KeyRound className="h-4.5 w-4.5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">
                                            Enter 6-Digit Code
                                        </h3>
                                        <p className="text-xs text-gray-600 dark:text-slate-400">
                                            Sent to <span className="font-semibold text-gray-900 dark:text-slate-200">{email}</span>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowOtpSection(false)}
                                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
                                    title="Close verification box"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* 6 OTP Cells */}
                            <div
                                className="flex items-center justify-center gap-2 pt-1"
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
                                        className={`h-12 w-10 sm:h-13 sm:w-11 rounded-xl border text-center text-xl font-bold font-mono transition-all outline-none caret-blue-600 dark:caret-blue-400 ${
                                            otpError
                                                ? "border-red-400 bg-red-50 text-red-700 ring-2 ring-red-500/20 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400 dark:focus:bg-slate-800 dark:focus:border-red-500 dark:focus:ring-red-500/25"
                                                : digit
                                                ? "border-blue-600 bg-white text-blue-700 shadow-sm ring-2 ring-blue-500/20 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/25 dark:border-blue-500 dark:bg-slate-800 dark:text-blue-300 dark:ring-blue-500/30 dark:focus:bg-slate-800 dark:focus:border-blue-400 dark:focus:ring-blue-500/40"
                                                : "border-gray-300 bg-white text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-800 dark:focus:border-blue-500 dark:focus:ring-blue-500/30"
                                        }`}
                                    />
                                ))}
                            </div>

                            {otpError && (
                                <div className="rounded-xl bg-red-50 p-2.5 text-xs font-medium text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900 animate-in fade-in flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>{otpError}</span>
                                </div>
                            )}

                            {resendSuccess && (
                                <div className="rounded-xl bg-emerald-50 p-2.5 text-xs font-medium text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 animate-in fade-in flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" />
                                    <span>{resendSuccess}</span>
                                </div>
                            )}

                            <div className="space-y-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => handleVerifyOtp()}
                                    disabled={verifyingOtp || otp.join("").length !== 6}
                                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {verifyingOtp ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Verifying Code...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Verify &amp; Continue</span>
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </button>

                                <div className="flex items-center justify-between text-xs pt-1 px-1">
                                    <span className="text-gray-500 dark:text-slate-400">
                                        Valid for 15m
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={resending || resendCooldown > 0}
                                        className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                                    >
                                        {resending
                                            ? "Sending..."
                                            : resendCooldown > 0
                                            ? `Resend in ${resendCooldown}s`
                                            : "Resend 6-Digit Code"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* Regular Login Form */}
                    <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
                        {/* Email */}
                        <div>
                            <label
                                className={`group flex cursor-text items-center gap-3 rounded-lg border border-transparent bg-[#e8eaed] px-4 py-3 transition-all hover:border-gray-300 hover:bg-[#dfe1e5] focus-within:!border-[#1a73e8] focus-within:!bg-[#e8eaed] focus-within:ring-2 focus-within:ring-[#1a73e8]/20 dark:border-slate-700/60 dark:bg-slate-800 dark:hover:border-slate-600 dark:hover:bg-slate-700/70 dark:focus-within:!border-blue-500 dark:focus-within:!bg-slate-800 dark:focus-within:ring-2 dark:focus-within:ring-blue-500/30 ${
                                    errors.email ? "!border-[#c5221f] !ring-2 !ring-[#c5221f]/20" : ""
                                }`}
                            >
                                <Mail className="h-5 w-5 shrink-0 text-gray-600 transition-colors group-hover:text-gray-900 group-focus-within:text-[#1a73e8] dark:text-slate-400 dark:group-hover:text-slate-200 dark:group-focus-within:text-blue-400" />
                                <input
                                    type="email"
                                    value={email}
                                    autoComplete="email"
                                    placeholder="Email address"
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        clearError("email");
                                    }}
                                    className="w-full bg-transparent text-[15px] text-gray-900 placeholder:text-gray-600 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500 [color-scheme:light] dark:[color-scheme:dark]"
                                />
                            </label>
                            {errors.email && (
                                <span className="mt-1 block text-sm text-[#c5221f]">{errors.email}</span>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                className={`group flex cursor-text items-center gap-3 rounded-lg border border-transparent bg-[#e8eaed] py-3 pl-4 pr-2 transition-all hover:border-gray-300 hover:bg-[#dfe1e5] focus-within:!border-[#1a73e8] focus-within:!bg-[#e8eaed] focus-within:ring-2 focus-within:ring-[#1a73e8]/20 dark:border-slate-700/60 dark:bg-slate-800 dark:hover:border-slate-600 dark:hover:bg-slate-700/70 dark:focus-within:!border-blue-500 dark:focus-within:!bg-slate-800 dark:focus-within:ring-2 dark:focus-within:ring-blue-500/30 ${
                                    errors.password ? "!border-[#c5221f] !ring-2 !ring-[#c5221f]/20" : ""
                                }`}
                            >
                                <Lock className="h-5 w-5 shrink-0 text-gray-600 transition-colors group-hover:text-gray-900 group-focus-within:text-[#1a73e8] dark:text-slate-400 dark:group-hover:text-slate-200 dark:group-focus-within:text-blue-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        clearError("password");
                                    }}
                                    className="w-full bg-transparent text-[15px] text-gray-900 placeholder:text-gray-600 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500 [color-scheme:light] dark:[color-scheme:dark]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="shrink-0 cursor-pointer px-2 text-xs font-semibold tracking-wider text-[#1a73e8] transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                    {showPassword ? "HIDE" : "SHOW"}
                                </button>
                            </label>
                            {errors.password && (
                                <span className="mt-1 block text-sm text-[#c5221f]">{errors.password}</span>
                            )}
                        </div>

                        {/* Form-level error if NOT already showing OTP section */}
                        {formError && !showOtpSection && (
                            <div className="rounded-xl bg-[#fce8e6] p-4 text-xs text-[#c5221f] dark:border dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400 space-y-2.5">
                                <p className="font-medium">{formError}</p>
                                {formError.toLowerCase().includes("verify") && (
                                    <div className="pt-2 border-t border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowOtpSection(true);
                                                setTimeout(() => {
                                                    inputRefs.current[0]?.focus();
                                                }, 100);
                                            }}
                                            className="cursor-pointer inline-flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-400 hover:underline"
                                        >
                                            <KeyRound className="h-3.5 w-3.5" />
                                            <span>Enter 6-digit code</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={resending || !email.trim() || resendCooldown > 0}
                                            className="cursor-pointer inline-flex items-center gap-1 font-semibold text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-50"
                                        >
                                            <Send className="h-3 w-3" />
                                            <span>
                                                {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend code"}
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Remember / forgot */}
                        <div className="flex items-center justify-between">
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800 transition-colors hover:text-gray-900 dark:text-slate-300 dark:hover:text-slate-100">
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    className="h-4 w-4 rounded accent-[#1a73e8] dark:accent-blue-500"
                                />
                                Remember me
                            </label>
                            <Link
                                href="/forgot-password"
                                className="text-sm font-medium text-[#1a73e8] transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                Forgot Password?
                            </Link>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1a63d8] py-3 text-sm font-semibold text-white transition-all hover:bg-[#1554b5] hover:shadow-lg hover:shadow-blue-600/25 active:scale-[0.99] disabled:cursor-default disabled:opacity-70 dark:bg-blue-600 dark:hover:bg-blue-500 dark:hover:shadow-blue-500/25"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {loading ? "Signing in…" : "Sign in"}
                        </button>
                    </form>

                    {/* Sign up link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600 dark:text-slate-400">
                            Don&apos;t have an account?{" "}
                            <Link href="/signup" className="font-medium text-[#1a73e8] transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
                                Create account
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