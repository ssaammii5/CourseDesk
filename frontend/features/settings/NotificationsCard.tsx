"use client";

import { useEffect, useState } from "react";
import {
    Award,
    Bell,
    BookOpen,
    Check,
    CheckCircle2,
    Clock,
    Loader2,
    Mail,
    Megaphone,
    Sparkles,
} from "lucide-react";
import { ToggleRow } from "@/components/ui";
import {
    getNotificationPreferencesRequest,
    updateNotificationPreferencesRequest,
} from "@/lib/api";
import type { NotificationPreferences } from "@/types";

export function NotificationsCard() {
    const [prefs, setPrefs] = useState<NotificationPreferences>({
        emailNotifications: true,
        assignmentNotifications: true,
        gradeNotifications: true,
        announcementNotifications: true,
        dueDateReminders: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedNotice, setSavedNotice] = useState(false);

    useEffect(() => {
        let isMounted = true;
        getNotificationPreferencesRequest()
            .then((data) => {
                if (isMounted) {
                    setPrefs(data);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (isMounted) setLoading(false);
            });
        return () => {
            isMounted = false;
        };
    }, []);

    const updateField = async (field: keyof NotificationPreferences, value: boolean) => {
        const next = { ...prefs, [field]: value };
        setPrefs(next);
        setSaving(true);
        setSavedNotice(false);
        try {
            await updateNotificationPreferencesRequest(next);
            setSavedNotice(true);
            setTimeout(() => setSavedNotice(false), 2500);
        } catch {
            setPrefs(prefs);
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                        <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span>Notification Preferences</span>
                    </h2>
                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                        Choose which events send alerts to your dashboard feed and registered email address.
                    </p>
                </div>
                <div className="flex items-center text-xs min-h-6">
                    {saving && (
                        <span className="flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Saving preferences...</span>
                        </span>
                    )}
                    {savedNotice && !saving && (
                        <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                            <Check className="h-3.5 w-3.5" />
                            <span>Saved</span>
                        </span>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 text-gray-400 dark:text-slate-500">
                    <Loader2 className="h-7 w-7 animate-spin text-blue-600 dark:text-blue-400" />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Email Settings */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 dark:border-slate-800 dark:bg-slate-800/40">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                <Mail className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">
                                    Email Delivery
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    Summary digests and critical notifications sent directly to your inbox.
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200/80 dark:border-slate-800">
                            <ToggleRow
                                label="Allow email notifications"
                                description="Receive email alerts for important course announcements, assignment deadlines, and system notices."
                                enabled={prefs.emailNotifications}
                                onChange={(val) => updateField("emailNotifications", val)}
                            />
                        </div>
                    </div>

                    {/* Activity & Alerts */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 dark:border-slate-800 dark:bg-slate-800/40 space-y-4">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">
                                    Course Activities
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    Trigger notifications in your dashboard header bell and activity stream.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 pt-3 border-t border-gray-200/80 dark:border-slate-800">
                            <ToggleRow
                                label="Assignments & Course Materials"
                                description="Notify when new assignments, modules, or lecture resources are published."
                                enabled={prefs.assignmentNotifications}
                                onChange={(val) => updateField("assignmentNotifications", val)}
                            />
                            <ToggleRow
                                label="Submissions & Grading"
                                description="Notify when student submissions arrive or when grades and instructor feedback are posted."
                                enabled={prefs.gradeNotifications}
                                onChange={(val) => updateField("gradeNotifications", val)}
                            />
                            <ToggleRow
                                label="Announcements & Bulletins"
                                description="Notify when instructors or program admins post important class announcements."
                                enabled={prefs.announcementNotifications}
                                onChange={(val) => updateField("announcementNotifications", val)}
                            />
                            <ToggleRow
                                label="Due Date Reminders"
                                description="Receive proactive reminders 24-48 hours before assignment deadlines."
                                enabled={prefs.dueDateReminders}
                                onChange={(val) => updateField("dueDateReminders", val)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}