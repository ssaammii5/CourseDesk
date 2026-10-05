"use client";

import { useEffect, useRef, useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    KeyRound,
    Layers,
    Loader2,
    Mail,
    RefreshCw,
    Send,
    Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resendVerificationRequest, verifyEmailRequest } from "@/lib/api/auth";

export function VerifyEmailView() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const paramCode = searchParams.get("code") || searchParams.get("token") || "";
    const paramEmail = searchParams.get("email") || "";

    const [email, setEmail] = useState<string>(paramEmail);
    const [otp, setOtp] = useState<string[]>(() => {
        const cleanParam = paramCode.replace(/\D/g, "").slice(0, 6);
        if (cleanParam.length === 6) {
            return cleanParam.split("");
        }
        return ["", "", "", "", "", ""];
    });

    const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">(
        paramEmail && paramCode.replace(/\D/g, "").length === 6 ? "verifying" : "idle"
    );
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [resendStatus, setResendStatus] = useState<string | null>(null);
    const [resending, setResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // If query params contained both email and a 6-digit code, attempt automatic verification
    useEffect(() => {
        const cleanParam = paramCode.replace(/\D/g, "").slice(0, 6);
        if (paramEmail && cleanParam.length === 6) {
            let active = true;
            const autoVerify = async () => {
                try {
                    await verifyEmailRequest(cleanParam, paramEmail);
                    if (active) {
                        setStatus("success");
                    }
                } catch (err) {
                    if (active) {
                        setStatus("error");
                        setErrorMessage(
                            err instanceof Error && err.message
                                ? err.message
                                : "Invalid or expired verification code."
                        );
                    }
                }
            };
            void autoVerify();
            return () => {
                active = false;
            };
        }
    }, [paramCode, paramEmail]);

    const handleOtpChange = (index: number, val: string) => {
        const cleanVal = val.replace(/\D/g, "");
        if (!cleanVal && val) return;

        const newOtp = [...otp];
        newOtp[index] = cleanVal.slice(-1);
        setOtp(newOtp);
        setErrorMessage(null);

        // Auto-advance
        if (cleanVal && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-verify if all 6 digits entered
        const fullCode = newOtp.join("");
        if (fullCode.length === 6 && !newOtp.includes("")) {
            void handleVerify(fullCode);
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
        setErrorMessage(null);

        const nextFocus = Math.min(pasted.length, 5);
        inputRefs.current[nextFocus]?.focus();

        if (pasted.length === 6) {
            void handleVerify(pasted);
        }
    };

    const handleVerify = async (codeToVerify?: string) => {
        const fullCode = codeToVerify || otp.join("");
        if (fullCode.length !== 6 || status === "verifying") return;

        setStatus("verifying");
        setErrorMessage(null);

        try {
            await verifyEmailRequest(fullCode, email.trim() || undefined);
            setStatus("success");
        } catch (err) {
            setStatus("error");
            setErrorMessage(
                err instanceof Error && err.message
                    ? err.message
                    : "Invalid verification code. Please check your code or request a new one."
            );
        }
    };

    const handleResend = async () => {
        if (!email.trim() || resending || resendCooldown > 0) return;

        setResending(true);
        setResendStatus(null);
        setErrorMessage(null);

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
            setErrorMessage(
                err instanceof Error && err.message
                    ? err.message
                    : "Failed to resend code. Please try again."
            );
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="flex min-h-dvh flex-col bg-white lg:flex-row dark:bg-slate-950">
            {/* Left brand banner */}
            <div className="relative overflow-hidden bg-[linear-gradient(135deg,#1a73e8,#0d47a1)] px-8 py-12 text-white sm:px-12 lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:px-16 lg:py-16 xl:px-24">
                <span
                    aria-hidden
                    className="pointer-events-none absolute -left-40 -top-80 h-[560px] w-[560px] rounded-full bg-white/10"
                />
                <span
                    aria-hidden
                    className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10"
                />
                <div className="relative">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
                            <Layers className="h-6 w-6" />
                        </span>
                        <span className="text-xl font-semibold tracking-tight">CourseDesk</span>
                    </div>
                    <h1 className="mt-10 text-4xl font-bold tracking-[0.06em] sm:text-5xl">VERIFY ACCESS</h1>
                    <p className="mt-4 text-sm font-semibold uppercase tracking-[0.24em] text-white/90">
                        6-Digit Security Verification
                    </p>
                    <p className="mt-6 max-w-md text-sm leading-6 text-white/80">
                        Enter the 6-digit one-time code sent to your registered email to activate your learner account and protect your academic profile.
                    </p>
                </div>
            </div>

            {/* Right content panel */}
            <div className="relative flex flex-1 flex-col justify-center overflow-hidden bg-white px-6 py-12 sm:px-12 lg:px-16 xl:px-24 dark:bg-slate-900">
                <div className="relative mx-auto w-full max-w-md">
                    {/* Success State */}
                    {status === "success" ? (
                        <div className="flex flex-col items-center text-center animate-in fade-in zoom-in-95">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 shadow-inner mb-6">
                                <CheckCircle2 className="h-10 w-10 animate-in zoom-in" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 sm:text-3xl">
                                Email Verified!
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-slate-400">
                                Your email address has been verified successfully. Your CourseDesk account is now active and ready.
                            </p>
                            <button
                                type="button"
                                onClick={() => router.push("/?verified=true")}
                                className="mt-8 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition"
                            >
                                Proceed to Sign In
                            </button>
                        </div>
                    ) : (
                        <div className="animate-in fade-in space-y-6">
                            <div className="text-center">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shadow-inner">
                                    <KeyRound className="h-8 w-8" />
                                </div>
                                <h2 className="mt-5 text-2xl font-bold text-gray-900 dark:text-slate-100 sm:text-3xl">
                                    Enter 6-Digit Code
                                </h2>
                                <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                                    Please enter the confirmation code sent to your email.
                                </p>
                            </div>

                            {/* Email input field if not fixed */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                                    Account Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setErrorMessage(null);
                                        }}
                                        placeholder="learner@example.com"
                                        className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                                    />
                                </div>
                            </div>

                            {/* 6 OTP Cells */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2 text-center">
                                    Verification Code
                                </label>
                                <div
                                    className="flex items-center justify-center gap-2 sm:gap-2.5"
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
                                            autoFocus={idx === 0 && !paramEmail}
                                            className={`h-12 w-10 sm:h-14 sm:w-12 rounded-xl border text-center text-xl font-bold font-mono transition-all outline-none caret-blue-600 dark:caret-blue-400 ${
                                                errorMessage
                                                    ? "border-red-400 bg-red-50/60 text-red-700 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/15 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400 dark:focus:bg-slate-800 dark:focus:border-red-500 dark:focus:ring-red-500/25"
                                                    : digit
                                                    ? "border-blue-600 bg-white text-blue-700 shadow-sm ring-2 ring-blue-500/20 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/25 dark:border-blue-500 dark:bg-slate-800 dark:text-blue-300 dark:ring-blue-500/30 dark:focus:bg-slate-800 dark:focus:border-blue-400 dark:focus:ring-blue-500/40"
                                                    : "border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:focus:bg-slate-800 dark:focus:border-blue-500 dark:focus:ring-blue-500/30"
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Messages & Alerts */}
                            {errorMessage && (
                                <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900 animate-in fade-in flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {resendStatus && (
                                <div className="rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 animate-in fade-in flex items-start gap-2">
                                    <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
                                    <span>{resendStatus}</span>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={() => handleVerify()}
                                    disabled={status === "verifying" || otp.join("").length !== 6}
                                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {status === "verifying" ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Verifying Code...</span>
                                        </>
                                    ) : (
                                        <span>Verify &amp; Activate</span>
                                    )}
                                </button>

                                <div className="flex items-center justify-between text-xs pt-1">
                                    <span className="text-gray-500 dark:text-slate-400">
                                        Valid for 15 minutes
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={resending || resendCooldown > 0 || !email.trim()}
                                        className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                                    >
                                        {resending
                                            ? "Sending code..."
                                            : resendCooldown > 0
                                            ? `Resend in ${resendCooldown}s`
                                            : "Resend Code"}
                                    </button>
                                </div>
                            </div>

                            <div className="text-center pt-2 border-t border-gray-100 dark:border-slate-800">
                                <Link
                                    href="/"
                                    className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline inline-flex items-center gap-1.5"
                                >
                                    <ArrowLeft className="h-3 w-3" />
                                    <span>Back to Sign In</span>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
