"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, RotateCcw } from "lucide-react";
import {
    getAppSettingsRequest,
    upsertAppSettingRequest,
    type AppSettingDto,
} from "@/lib/api/appSettings";

const CATEGORIES = ["General", "Notifications", "Grading", "Security"] as const;

export function AdminSettingsView() {
    const [settings, setSettings] = useState<AppSettingDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [flash, setFlash] = useState(false);

    const loadSettings = useCallback(async () => {
        try {
            setError(null);
            const data = await getAppSettingsRequest();
            setSettings(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load settings.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadSettings();
    }, [loadSettings]);

    const updateSetting = (key: string, value: string) => {
        setSettings((prev) =>
            prev.map((s) => (s.key === key ? { ...s, value } : s))
        );
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            await Promise.all(
                settings.map((s) =>
                    upsertAppSettingRequest({
                        key: s.key,
                        value: s.value,
                        description: s.description,
                        category: s.category,
                    })
                )
            );
            setFlash(true);
            window.setTimeout(() => setFlash(false), 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        await loadSettings();
    };

    if (loading) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-8">
            {error && (
                <div className="mb-4 rounded-lg bg-[#fce8e6] px-5 py-3.5 text-sm text-[#c5221f] dark:border dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">{error}</div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold text-gray-900 dark:text-slate-100">Application Settings</h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                        Configure system-wide settings for the classroom platform
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {flash && <span className="text-sm font-medium text-[#188038] dark:text-emerald-400">Settings saved</span>}
                    <button
                        type="button"
                        onClick={handleReset}
                        className="flex cursor-pointer items-center gap-2 rounded-full border border-gray-400 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Reset
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex cursor-pointer items-center gap-2 rounded-full bg-[#1a63d8] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1554b5] disabled:cursor-default disabled:opacity-70 dark:bg-blue-600 dark:hover:bg-blue-500"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? "Saving…" : "Save All"}
                    </button>
                </div>
            </div>

            <div className="mt-8 space-y-10">
                {CATEGORIES.map((category) => {
                    const categorySettings = settings.filter((s) => s.category === category);
                    if (categorySettings.length === 0) return null;
                    return (
                        <section key={category} className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                            <h2 className="text-xl font-medium text-gray-900 dark:text-slate-100">{category}</h2>
                            <div className="mt-5 grid gap-6 md:grid-cols-2">
                                {categorySettings.map((setting) => (
                                    <div key={setting.key}>
                                        <label className="mb-1.5 block text-sm font-medium text-gray-800 dark:text-slate-200">
                                            {setting.key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                                        </label>
                                        <p className="mb-2 text-xs text-gray-500 dark:text-slate-400">{setting.description}</p>
                                        {setting.value === "true" || setting.value === "false" ? (
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={setting.value === "true"}
                                                onClick={() => updateSetting(setting.key, setting.value === "true" ? "false" : "true")}
                                                className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors ${setting.value === "true" ? "bg-[#1a73e8]" : "bg-gray-300 dark:bg-slate-700"}`}
                                            >
                                                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${setting.value === "true" ? "left-6" : "left-1"}`} />
                                            </button>
                                        ) : (
                                            <input
                                                type="text"
                                                value={setting.value}
                                                onChange={(e) => updateSetting(setting.key, e.target.value)}
                                                className="w-full rounded-md border border-gray-400/80 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}