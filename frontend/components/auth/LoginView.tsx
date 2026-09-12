"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { GraduationCap, Loader2, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";

export function LoginView() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

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
            setFormError(
                err instanceof Error && err.message
                    ? err.message
                    : "Sign in failed. Please try again.",
            );
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-dvh flex-col bg-white lg:flex-row">
            {/* ---------- Left: full-height brand panel (stacks on top on mobile) ---------- */}
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
                            <GraduationCap className="h-6 w-6" />
                        </span>
                        <span className="text-xl font-medium">eClassroomPro</span>
                    </div>
                    <h1 className="mt-10 text-4xl font-bold tracking-[0.06em] sm:text-5xl">WELCOME</h1>
                    <p className="mt-4 text-sm font-semibold uppercase tracking-[0.28em] text-white/90">
                        One classroom for every role
                    </p>
                    <p className="mt-6 max-w-md text-sm leading-6 text-white/80">
                        Role-based Assignment &amp; Submission Management System for admins,
                        teachers and students. Create assignments, collect submissions, grade
                        work and share feedback — all in one place.
                    </p>
                </div>
            </div>

            {/* ---------- Right: full-height form panel ---------- */}
            <div className="relative flex flex-1 flex-col justify-center overflow-hidden bg-white px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
                {/* Decorative corner sphere */}
                <span
                    aria-hidden
                    className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_35%_30%,#7db2ff,#0a3d8f_72%)]"
                />
                <div className="relative mx-auto w-full max-w-md">
                    <h2 className="text-3xl font-semibold text-gray-900">Sign in</h2>
                    <p className="mt-2 text-sm text-gray-600">to continue to eClassroomPro</p>

                    <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
                        {/* Email */}
                        <div>
                            <label
                                className={`flex items-center gap-3 rounded-lg bg-[#e8eaed] px-4 py-3 transition-shadow focus-within:ring-2 focus-within:ring-[#1a73e8] ${errors.email ? "ring-2 ring-[#c5221f]" : ""
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
                                        clearError("email");
                                    }}
                                    className="w-full bg-transparent text-[15px] text-gray-900 placeholder:text-gray-600 focus:outline-none"
                                />
                            </label>
                            {errors.email && (
                                <span className="mt-1 block text-sm text-[#c5221f]">{errors.email}</span>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                className={`flex items-center gap-3 rounded-lg bg-[#e8eaed] py-3 pl-4 pr-2 transition-shadow focus-within:ring-2 focus-within:ring-[#1a73e8] ${errors.password ? "ring-2 ring-[#c5221f]" : ""
                                    }`}
                            >
                                <Lock className="h-5 w-5 shrink-0 text-gray-700" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        clearError("password");
                                    }}
                                    className="w-full bg-transparent text-[15px] text-gray-900 placeholder:text-gray-600 focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="shrink-0 cursor-pointer px-2 text-xs font-semibold tracking-wider text-[#1a73e8] hover:underline"
                                >
                                    {showPassword ? "HIDE" : "SHOW"}
                                </button>
                            </label>
                            {errors.password && (
                                <span className="mt-1 block text-sm text-[#c5221f]">{errors.password}</span>
                            )}
                        </div>

                        {/* Form-level error (real auth) */}
                        {formError && (
                            <p className="rounded-md bg-[#fce8e6] px-4 py-2.5 text-sm text-[#c5221f]">
                                {formError}
                            </p>
                        )}

                        {/* Remember / forgot */}
                        <div className="flex items-center justify-between">
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    className="h-4 w-4 accent-[#1a73e8]"
                                />
                                Remember me
                            </label>
                            <Link
                                href="/forgot-password"
                                className="text-sm font-medium text-[#1a73e8] hover:underline"
                            >
                                Forgot Password?
                            </Link>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1a63d8] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1554b5] disabled:cursor-default disabled:opacity-70"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {loading ? "Signing in…" : "Sign in"}
                        </button>
                    </form>

                    {/* Legal */}
                    <div className="mt-10 flex items-center justify-center gap-2 text-xs text-gray-700">
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