"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { ClipboardEvent, FormEvent, KeyboardEvent } from "react";
import {
    ArrowLeft,
    Check,
    Eye,
    EyeOff,
    GraduationCap,
    Loader2,
    Lock,
    Mail,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Step = 1 | 2 | 3 | 4;

const STEPS = [
    { id: 1, label: "Email" },
    { id: 2, label: "Verify" },
    { id: 3, label: "Reset" },
] as const;

const RESEND_SECONDS = 30;
const REDIRECT_SECONDS = 10;

const PRIMARY_BTN =
    "flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1a63d8] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1554b5] disabled:cursor-default disabled:opacity-70";

export function ForgotPasswordView() {
    const router = useRouter();

    const [step, setStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);

    // Step 1 — email
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState<string | null>(null);

    // Step 2 — verification code
    const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
    const [otpError, setOtpError] = useState<string | null>(null);
    const [sentCode, setSentCode] = useState("");
    const [resendIn, setResendIn] = useState(RESEND_SECONDS);
    const [resent, setResent] = useState(false);
    const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

    // Step 3 — new password
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [passError, setPassError] = useState<string | null>(null);

    // Step 4 — success + auto return
    const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

    // Resend countdown (step 2)
    useEffect(() => {
        if (step !== 2 || resendIn <= 0) return;
        const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
        return () => window.clearTimeout(t);
    }, [step, resendIn]);

    // Auto-return to sign-in after success (step 4)
    useEffect(() => {
        if (step !== 4) return;
        if (countdown <= 0) {
            router.push("/login");
            return;
        }
        const t = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => window.clearTimeout(t);
    }, [step, countdown, router]);

    const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));

    /* ---------- Step 1 ---------- */
    const submitEmail = (e: FormEvent) => {
        e.preventDefault();
        const trimmed = email.trim();
        if (!trimmed) return setEmailError("Email is required.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
            return setEmailError("Enter a valid email address.");
        setEmailError(null);
        setLoading(true);
        window.setTimeout(() => {
            setSentCode(generateCode());
            setOtp(Array(6).fill(""));
            setOtpError(null);
            setResendIn(RESEND_SECONDS);
            setResent(false);
            setLoading(false);
            setStep(2);
        }, 800);
    };

    /* ---------- Step 2 ---------- */
    const handleOtpChange = (index: number, value: string) => {
        const digit = value.replace(/\D/g, "").slice(-1);
        setOtp((prev) => {
            const next = [...prev];
            next[index] = digit;
            return next;
        });
        setOtpError(null);
        if (digit && index < 5) otpRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const text = (e.clipboardData.getData("text") || "")
            .replace(/\D/g, "")
            .slice(0, 6);
        if (!text) return;
        setOtp((prev) => {
            const next = [...prev];
            for (let i = 0; i < 6; i += 1) next[i] = text[i] ?? "";
            return next;
        });
        setOtpError(null);
        otpRefs.current[Math.min(text.length, 5)]?.focus();
    };

    const submitOtp = (e: FormEvent) => {
        e.preventDefault();
        const entered = otp.join("");
        if (entered.length < 6) return setOtpError("Enter the 6-digit code.");
        setLoading(true);
        window.setTimeout(() => {
            setLoading(false);
            if (entered === sentCode) setStep(3);
            else setOtpError("That code doesn't match. Check the email and try again.");
        }, 700);
    };

    const resend = () => {
        setSentCode(generateCode());
        setOtp(Array(6).fill(""));
        setOtpError(null);
        setResendIn(RESEND_SECONDS);
        setResent(true);
        otpRefs.current[0]?.focus();
    };

    /* ---------- Step 3 ---------- */
    const requirements = [
        { label: "At least 8 characters", ok: newPassword.length >= 8 },
        { label: "At least one uppercase letter", ok: /[A-Z]/.test(newPassword) },
        { label: "At least one number", ok: /\d/.test(newPassword) },
    ];
    const allRequirementsMet = requirements.every((r) => r.ok);

    const submitReset = (e: FormEvent) => {
        e.preventDefault();
        if (!allRequirementsMet)
            return setPassError("Password doesn't meet all requirements yet.");
        if (newPassword !== confirmPassword) return setPassError("Passwords don't match.");
        setPassError(null);
        setLoading(true);
        window.setTimeout(() => {
            setLoading(false);
            setCountdown(REDIRECT_SECONDS);
            setStep(4);
        }, 800);
    };

    return (
        <div className="flex min-h-dvh flex-col bg-white lg:flex-row">
            {/* ---------- Left: full-height brand panel ---------- */}
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
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
                            <GraduationCap className="h-6 w-6" />
                        </span>
                        <span className="text-xl font-medium">eClassroomPro</span>
                    </div>

                    <h1 className="mt-10 text-4xl font-bold tracking-[0.06em] sm:text-5xl">
                        RESET PASSWORD
                    </h1>
                    <p className="mt-4 text-sm font-semibold uppercase tracking-[0.28em] text-white/90">
                        No worries — it happens to everyone
                    </p>
                    <p className="mt-6 max-w-md text-sm leading-6 text-white/80">
                        Verify your email with a one-time code, choose a new password, and
                        you&apos;ll be back in your classroom in minutes.
                    </p>
                </div>
            </div>

            {/* ---------- Right: step panel ---------- */}
            <div className="relative flex flex-1 flex-col justify-center overflow-hidden bg-white px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
                <span
                    aria-hidden
                    className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_35%_30%,#7db2ff,#0a3d8f_72%)]"
                />

                <div className="relative mx-auto w-full max-w-md">
                    {step !== 4 && (
                        <button
                            type="button"
                            onClick={() => router.push("/login")}
                            className="mb-6 flex cursor-pointer items-center gap-2 text-sm font-medium text-[#1a73e8] hover:underline"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to sign in
                        </button>
                    )}

                    {/* Stepper */}
                    {step !== 4 && (
                        <div className="flex items-center">
                            {STEPS.map((s, i) => {
                                const done = step > s.id;
                                const current = step === s.id;
                                return (
                                    <Fragment key={s.id}>
                                        {i > 0 && (
                                            <span
                                                className={`mx-3 h-px flex-1 ${step >= s.id ? "bg-[#1a73e8]" : "bg-gray-300"}`}
                                            />
                                        )}
                                        <span className="flex items-center gap-2">
                                            <span
                                                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${done
                                                        ? "bg-[#1a73e8] text-white"
                                                        : current
                                                            ? "border-2 border-[#1a73e8] text-[#1a73e8]"
                                                            : "border border-gray-300 text-gray-500"
                                                    }`}
                                            >
                                                {done ? <Check className="h-4 w-4" /> : s.id}
                                            </span>
                                            <span
                                                className={`text-sm font-medium ${current || done ? "text-gray-900" : "text-gray-500"}`}
                                            >
                                                {s.label}
                                            </span>
                                        </span>
                                    </Fragment>
                                );
                            })}
                        </div>
                    )}

                    {/* ---------- STEP 1: email ---------- */}
                    {step === 1 && (
                        <form onSubmit={submitEmail} noValidate className="mt-8 space-y-5">
                            <div>
                                <h2 className="text-3xl font-semibold text-gray-900">Forgot password?</h2>
                                <p className="mt-2 text-sm text-gray-600">
                                    Enter your account email and we&apos;ll send you a 6-digit reset code.
                                </p>
                            </div>

                            <div>
                                <label
                                    className={`flex items-center gap-3 rounded-lg bg-[#e8eaed] px-4 py-3 transition-shadow focus-within:ring-2 focus-within:ring-[#1a73e8] ${emailError ? "ring-2 ring-[#c5221f]" : ""
                                        }`}
                                >
                                    <Mail className="h-5 w-5 shrink-0 text-gray-700" />
                                    <input
                                        type="email"
                                        value={email}
                                        autoComplete="email"
                                        placeholder="Email address"
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setEmailError(null);
                                        }}
                                        className="w-full bg-transparent text-[15px] text-gray-900 placeholder:text-gray-600 focus:outline-none"
                                    />
                                </label>
                                {emailError && (
                                    <span className="mt-1 block text-sm text-[#c5221f]">{emailError}</span>
                                )}
                            </div>

                            <button type="submit" disabled={loading} className={PRIMARY_BTN}>
                                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                {loading ? "Sending code…" : "Send reset code"}
                            </button>
                        </form>
                    )}

                    {/* ---------- STEP 2: verify code ---------- */}
                    {step === 2 && (
                        <form onSubmit={submitOtp} noValidate className="mt-8 space-y-5">
                            <div>
                                <h2 className="text-3xl font-semibold text-gray-900">Check your email</h2>
                                <p className="mt-2 text-sm text-gray-600">
                                    We sent a 6-digit code to{" "}
                                    <span className="font-medium text-gray-900">{email.trim()}</span>.
                                </p>
                            </div>

                            {/* Demo inbox (mock era) */}
                            <p className="rounded-lg bg-[#e8f0fe] px-4 py-2.5 text-sm text-[#174ea6]">
                                Demo inbox — your code is{" "}
                                <span className="font-semibold tracking-widest">{sentCode}</span>
                            </p>

                            <div>
                                <div className="flex justify-between gap-2 sm:gap-3">
                                    {otp.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={(el) => {
                                                otpRefs.current[i] = el;
                                            }}
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            value={digit}
                                            aria-label={`Digit ${i + 1}`}
                                            onChange={(e) => handleOtpChange(i, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                            onPaste={handleOtpPaste}
                                            className={`h-12 w-full max-w-12 rounded-lg border bg-[#e8eaed] text-center text-xl font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1a73e8] ${otpError ? "border-[#c5221f]" : "border-transparent"
                                                }`}
                                        />
                                    ))}
                                </div>
                                {otpError && (
                                    <span className="mt-2 block text-sm text-[#c5221f]">{otpError}</span>
                                )}
                            </div>

                            <button type="submit" disabled={loading} className={PRIMARY_BTN}>
                                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                {loading ? "Verifying…" : "Verify code"}
                            </button>

                            <div className="flex items-center justify-between text-sm">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="cursor-pointer font-medium text-[#1a73e8] hover:underline"
                                >
                                    Use a different email
                                </button>
                                {resendIn > 0 ? (
                                    <span className="text-gray-600">
                                        Resend code in 0:{String(resendIn).padStart(2, "0")}
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={resend}
                                        className="cursor-pointer font-medium text-[#1a73e8] hover:underline"
                                    >
                                        Resend code
                                    </button>
                                )}
                            </div>
                            {resent && resendIn > 0 && (
                                <p className="text-sm text-[#188038]">A new code has been sent.</p>
                            )}
                        </form>
                    )}

                    {/* ---------- STEP 3: new password ---------- */}
                    {step === 3 && (
                        <form onSubmit={submitReset} noValidate className="mt-8 space-y-5">
                            <div>
                                <h2 className="text-3xl font-semibold text-gray-900">
                                    Create a new password
                                </h2>
                                <p className="mt-2 text-sm text-gray-600">
                                    Choose a strong password you haven&apos;t used before.
                                </p>
                            </div>

                            {/* New password */}
                            <div>
                                <label
                                    className={`flex items-center gap-3 rounded-lg bg-[#e8eaed] py-3 pl-4 pr-2 transition-shadow focus-within:ring-2 focus-within:ring-[#1a73e8] ${passError ? "ring-2 ring-[#c5221f]" : ""
                                        }`}
                                >
                                    <Lock className="h-5 w-5 shrink-0 text-gray-700" />
                                    <input
                                        type={showNew ? "text" : "password"}
                                        value={newPassword}
                                        autoComplete="new-password"
                                        placeholder="New password"
                                        onChange={(e) => {
                                            setNewPassword(e.target.value);
                                            setPassError(null);
                                        }}
                                        className="w-full bg-transparent text-[15px] text-gray-900 placeholder:text-gray-600 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        aria-label={showNew ? "Hide password" : "Show password"}
                                        onClick={() => setShowNew((v) => !v)}
                                        className="shrink-0 cursor-pointer px-2 text-xs font-semibold tracking-wider text-[#1a73e8] hover:underline"
                                    >
                                        {showNew ? "HIDE" : "SHOW"}
                                    </button>
                                </label>
                            </div>

                            {/* Confirm password */}
                            <div>
                                <label
                                    className={`flex items-center gap-3 rounded-lg bg-[#e8eaed] py-3 pl-4 pr-2 transition-shadow focus-within:ring-2 focus-within:ring-[#1a73e8] ${passError ? "ring-2 ring-[#c5221f]" : ""
                                        }`}
                                >
                                    <Lock className="h-5 w-5 shrink-0 text-gray-700" />
                                    <input
                                        type={showConfirm ? "text" : "password"}
                                        value={confirmPassword}
                                        autoComplete="new-password"
                                        placeholder="Repeat new password"
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value);
                                            setPassError(null);
                                        }}
                                        className="w-full bg-transparent text-[15px] text-gray-900 placeholder:text-gray-600 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        aria-label={showConfirm ? "Hide password" : "Show password"}
                                        onClick={() => setShowConfirm((v) => !v)}
                                        className="shrink-0 cursor-pointer px-2 text-xs font-semibold tracking-wider text-[#1a73e8] hover:underline"
                                    >
                                        {showConfirm ? "HIDE" : "SHOW"}
                                    </button>
                                </label>
                            </div>

                            {/* Live requirements checklist */}
                            <ul className="space-y-2 rounded-lg bg-[#e8eaed]/60 px-4 py-3">
                                {requirements.map((r) => (
                                    <li
                                        key={r.label}
                                        className={`flex items-center gap-2 text-sm ${r.ok ? "text-[#137333]" : "text-gray-600"}`}
                                    >
                                        <Check className={`h-4 w-4 ${r.ok ? "text-[#188038]" : "text-gray-400"}`} />
                                        {r.label}
                                    </li>
                                ))}
                            </ul>

                            {passError && <p className="text-sm text-[#c5221f]">{passError}</p>}

                            <button type="submit" disabled={loading} className={PRIMARY_BTN}>
                                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                {loading ? "Updating…" : "Update password"}
                            </button>
                        </form>
                    )}

                    {/* ---------- STEP 4: success → back to start ---------- */}
                    {step === 4 && (
                        <div className="flex flex-col items-center py-6 text-center">
                            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#e6f4ea]">
                                <Check className="h-10 w-10 text-[#188038]" />
                            </span>
                            <h2 className="mt-6 text-3xl font-semibold text-gray-900">Password updated</h2>
                            <p className="mt-3 max-w-sm text-sm leading-6 text-gray-600">
                                Your password has been changed successfully. Use your new password
                                to sign in to eClassroomPro.
                            </p>
                            <button
                                type="button"
                                onClick={() => router.push("/login")}
                                className={`${PRIMARY_BTN} mt-8`}
                            >
                                Back to sign in
                            </button>
                            <p className="mt-4 text-xs text-gray-600">
                                Returning to sign in automatically in {countdown}s…
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}