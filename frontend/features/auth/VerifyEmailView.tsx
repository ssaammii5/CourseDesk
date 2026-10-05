"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, Layers, Loader2, Mail, Send } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resendVerificationRequest, verifyEmailRequest } from "@/lib/api/auth";

export function VerifyEmailView() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";

    const [status, setStatus] = useState<"loading" | "success" | "error" | "prompt">(
        token ? "loading" : "prompt"
    );
    const [message, setMessage] = useState<string>("");
    const [resendEmail, setResendEmail] = useState("");
    const [resending, setResending] = useState(false);
    const [resendMessage, setResendMessage] = useState<string | null>(null);
    const [resendError, setResendError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;

        let active = true;
        const verify = async () => {
            try {
                const res = await verifyEmailRequest(token);
                if (active) {
                    setStatus("success");
                    setMessage(res.message || "Your email has been verified successfully!");
                }
            } catch (err) {
                if (active) {
                    setStatus("error");
                    setMessage(
                        err instanceof Error && err.message
                            ? err.message
                            : "This verification link is invalid or has expired."
                    );
                }
            }
        };

        void verify();

        return () => {
            active = false;
        };
    }, [token]);

    const handleResend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resendEmail.trim() || resending) return;

        setResending(true);
        setResendMessage(null);
        setResendError(null);

        try {
            const res = await resendVerificationRequest(resendEmail.trim());
            setResendMessage(res.message || "Verification email sent. Please check your inbox.");
        } catch (err) {
            setResendError(
                err instanceof Error && err.message
                    ? err.message
                    : "Failed to send verification email. Please try again."
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
                        Account Security & Confirmation
                    </p>
                    <p className="mt-6 max-w-md text-sm leading-6 text-white/80">
                        Email verification ensures all course notifications, grade alerts, and academic updates reach the genuine account owner securely.
                    </p>
                </div>
            </div>

            {/* Right content panel */}
            <div className="relative flex flex-1 flex-col justify-center overflow-hidden bg-white px-6 py-12 sm:px-12 lg:px-16 xl:px-24 dark:bg-slate-900">
                <div className="relative mx-auto w-full max-w-md">
                    {/* 1. Loading State */}
                    {status === "loading" && (
                        <div className="flex flex-col items-center text-center animate-in fade-in">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                            <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-slate-100">
                                Verifying your email...
                            </h2>
                            <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                                Please wait while we confirm your email token with the server.
                            </p>
                        </div>
                    )}

                    {/* 2. Success State */}
                    {status === "success" && (
                        <div className="flex flex-col items-center text-center animate-in fade-in">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 shadow-inner">
                                <CheckCircle2 className="h-10 w-10" />
                            </div>
                            <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-slate-100 sm:text-3xl">
                                Email Verified!
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-slate-400">
                                {message || "Your email address has been verified successfully. Your CourseDesk account is now active."}
                            </p>
                            <button
                                type="button"
                                onClick={() => router.push("/?verified=true")}
                                className="mt-8 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition"
                            >
                                Proceed to Sign In
                            </button>
                        </div>
                    )}

                    {/* 3. Error or Prompt State */}
                    {(status === "error" || status === "prompt") && (
                        <div className="animate-in fade-in space-y-6">
                            <div className="text-center">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                                    {status === "error" ? (
                                        <AlertCircle className="h-8 w-8" />
                                    ) : (
                                        <Mail className="h-8 w-8" />
                                    )}
                                </div>
                                <h2 className="mt-5 text-2xl font-bold text-gray-900 dark:text-slate-100">
                                    {status === "error"
                                        ? "Verification Link Expired"
                                        : "Resend Verification Link"}
                                </h2>
                                <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                                    {status === "error"
                                        ? message
                                        : "Enter your registered email address below to receive a new verification link."}
                                </p>
                            </div>

                            <form onSubmit={handleResend} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="email"
                                            required
                                            value={resendEmail}
                                            onChange={(e) => setResendEmail(e.target.value)}
                                            placeholder="learner@example.com"
                                            className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                                        />
                                    </div>
                                </div>

                                {resendMessage && (
                                    <div className="rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                                        {resendMessage}
                                    </div>
                                )}

                                {resendError && (
                                    <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900">
                                        {resendError}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={resending}
                                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {resending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Sending Link...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4" />
                                            <span>Send New Verification Link</span>
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="text-center pt-2">
                                <Link
                                    href="/"
                                    className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
                                >
                                    Back to Sign In
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
