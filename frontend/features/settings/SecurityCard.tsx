"use client";

import { useState } from "react";
import {
    AlertCircle,
    Check,
    CheckCircle2,
    Eye,
    EyeOff,
    KeyRound,
    Lock,
    Shield,
    ShieldAlert,
    ShieldCheck,
} from "lucide-react";
import { changePasswordRequest } from "@/lib/api/users";
import { Loader2 } from "lucide-react";

export function SecurityCard() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Live validation rules
    const hasMinLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);

    const validRulesCount = [hasMinLength, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;
    const isStrong = validRulesCount === 4;
    const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage(null);
        setErrorMessage(null);

        if (!currentPassword) {
            setErrorMessage("Please enter your current password.");
            return;
        }

        if (!isStrong) {
            setErrorMessage(
                "New password must be at least 8 characters long, contain an uppercase letter, a number, and a special character."
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage("New passwords do not match. Please verify.");
            return;
        }

        if (currentPassword === newPassword) {
            setErrorMessage("New password must be different from your current password.");
            return;
        }

        setSaving(true);
        try {
            const res = await changePasswordRequest({
                currentPassword,
                newPassword,
            });
            setSuccessMessage(res.message || "Your password has been updated successfully.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            setErrorMessage(
                err?.message || "Failed to change password. Please check your current password."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleClear = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setErrorMessage(null);
    };

    return (
        <div className="grid gap-8 lg:grid-cols-3">
            {/* Left 2 Cols: Password Form */}
            <div className="lg:col-span-2 space-y-6">
                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6"
                >
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                            <KeyRound className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <span>Change Password</span>
                        </h2>
                        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                            Update your credentials to keep your academic profile and course content secure.
                        </p>
                    </div>

                    {successMessage && (
                        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 animate-in fade-in">
                            <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span>{successMessage}</span>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300 animate-in fade-in">
                            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-600 dark:text-red-400" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Current Password */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                                Current Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrent ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => {
                                        setCurrentPassword(e.target.value);
                                        setErrorMessage(null);
                                    }}
                                    placeholder="Enter current password"
                                    className="w-full rounded-xl border border-gray-300 bg-white pl-4 pr-11 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrent((p) => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition"
                                >
                                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showNew ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        setErrorMessage(null);
                                    }}
                                    placeholder="Enter new password"
                                    className="w-full rounded-xl border border-gray-300 bg-white pl-4 pr-11 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew((p) => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition"
                                >
                                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>

                            {/* Strength Indicator Bar */}
                            {newPassword.length > 0 && (
                                <div className="mt-2.5 space-y-1.5">
                                    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-800">
                                        <div
                                            className={`transition-all duration-300 ${
                                                validRulesCount <= 1
                                                    ? "w-1/4 bg-red-500"
                                                    : validRulesCount === 2
                                                    ? "w-2/4 bg-amber-500"
                                                    : validRulesCount === 3
                                                    ? "w-3/4 bg-blue-500"
                                                    : "w-full bg-emerald-500"
                                            }`}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400">
                                        <span>Strength</span>
                                        <span className="font-semibold">
                                            {validRulesCount <= 1
                                                ? "Weak"
                                                : validRulesCount === 2
                                                ? "Fair"
                                                : validRulesCount === 3
                                                ? "Good"
                                                : "Strong"}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        setErrorMessage(null);
                                    }}
                                    placeholder="Confirm new password"
                                    className={`w-full rounded-xl border bg-white pl-4 pr-11 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:bg-slate-900 dark:text-slate-100 ${
                                        confirmPassword && !passwordsMatch
                                            ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-red-800"
                                            : "border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700"
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm((p) => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition"
                                >
                                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>

                            {confirmPassword.length > 0 && (
                                <p className={`mt-1.5 text-xs font-medium flex items-center gap-1 ${
                                    passwordsMatch ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                                }`}>
                                    {passwordsMatch ? (
                                        <>
                                            <Check className="h-3.5 w-3.5" />
                                            <span>Passwords match</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            <span>Passwords do not match</span>
                                        </>
                                    )}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={handleClear}
                            disabled={saving || (!currentPassword && !newPassword && !confirmPassword)}
                            className="cursor-pointer rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
                        >
                            Discard
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !currentPassword || !isStrong || !passwordsMatch}
                            className="cursor-pointer flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span>Updating Password...</span>
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="h-4 w-4" />
                                    <span>Update Password</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Right 1 Col: Security Guidelines & Tips */}
            <div className="space-y-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span>Password Requirements</span>
                    </h3>

                    <ul className="space-y-2 text-xs">
                        <li className={`flex items-center gap-2 ${hasMinLength ? "text-emerald-600 font-semibold dark:text-emerald-400" : "text-gray-500 dark:text-slate-400"}`}>
                            <div className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${hasMinLength ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-gray-100 text-gray-400 dark:bg-slate-800"}`}>
                                <Check className="h-2.5 w-2.5" />
                            </div>
                            <span>At least 8 characters long</span>
                        </li>
                        <li className={`flex items-center gap-2 ${hasUppercase ? "text-emerald-600 font-semibold dark:text-emerald-400" : "text-gray-500 dark:text-slate-400"}`}>
                            <div className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${hasUppercase ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-gray-100 text-gray-400 dark:bg-slate-800"}`}>
                                <Check className="h-2.5 w-2.5" />
                            </div>
                            <span>One uppercase letter (A-Z)</span>
                        </li>
                        <li className={`flex items-center gap-2 ${hasNumber ? "text-emerald-600 font-semibold dark:text-emerald-400" : "text-gray-500 dark:text-slate-400"}`}>
                            <div className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${hasNumber ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-gray-100 text-gray-400 dark:bg-slate-800"}`}>
                                <Check className="h-2.5 w-2.5" />
                            </div>
                            <span>At least one number (0-9)</span>
                        </li>
                        <li className={`flex items-center gap-2 ${hasSpecial ? "text-emerald-600 font-semibold dark:text-emerald-400" : "text-gray-500 dark:text-slate-400"}`}>
                            <div className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${hasSpecial ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-gray-100 text-gray-400 dark:bg-slate-800"}`}>
                                <Check className="h-2.5 w-2.5" />
                            </div>
                            <span>One special character (!@#$%...)</span>
                        </li>
                    </ul>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6 dark:border-blue-900/40 dark:bg-blue-950/20 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5" />
                        <span>Security Best Practices</span>
                    </h4>
                    <p className="text-xs leading-relaxed text-blue-800/80 dark:text-blue-300/80">
                        Use a unique password for CourseDesk that you don't use on other websites. Do not share credentials with other students or team members.
                    </p>
                </div>
            </div>
        </div>
    );
}