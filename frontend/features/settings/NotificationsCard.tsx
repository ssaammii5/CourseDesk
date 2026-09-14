"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
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
            // Revert on error
            setPrefs(prefs);
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900">Notifications</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage your notification preferences and email delivery settings.
                    </p>
                </div>
                <div className="flex items-center text-xs text-gray-500 min-h-5">
                    {saving && (
                        <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Saving...
                        </span>
                    )}
                    {savedNotice && !saving && (
                        <span className="flex items-center gap-1.5 text-green-600 font-medium animate-fade-in">
                            <Check className="h-3.5 w-3.5" />
                            Saved
                        </span>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12 text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            ) : (
                <>
                    {/* Email settings */}
                    <div className="mt-8 border-t border-gray-100 pt-6">
                        <h3 className="text-base font-semibold text-gray-900">Email Notifications</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Control whether CourseDesk sends summary and alert emails to your registered address.
                        </p>
                        <div className="mt-4">
                            <ToggleRow
                                label="Allow email notifications"
                                description="Receive email alerts for important class activity and deadlines."
                                enabled={prefs.emailNotifications}
                                onChange={(val) => updateField("emailNotifications", val)}
                            />
                        </div>
                    </div>

                    {/* In-app event preferences */}
                    <div className="mt-8 border-t border-gray-100 pt-6">
                        <h3 className="text-base font-semibold text-gray-900">Activity & Alerts</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Choose which types of activities trigger notifications in your dashboard header and feed.
                        </p>
                        <div className="mt-4 space-y-1">
                            <ToggleRow
                                label="Assignments & Classwork"
                                description="Get notified when new assignments or materials are published in your courses."
                                enabled={prefs.assignmentNotifications}
                                onChange={(val) => updateField("assignmentNotifications", val)}
                            />
                            <ToggleRow
                                label="Submissions & Grading"
                                description="Get notified when your work is graded, or when students submit assignments to your course."
                                enabled={prefs.gradeNotifications}
                                onChange={(val) => updateField("gradeNotifications", val)}
                            />
                            <ToggleRow
                                label="Announcements & Notices"
                                description="Get notified when instructors post new announcements or class notices."
                                enabled={prefs.announcementNotifications}
                                onChange={(val) => updateField("announcementNotifications", val)}
                            />
                            <ToggleRow
                                label="Due Date Reminders"
                                description="Get proactive reminders for upcoming assignment deadlines."
                                enabled={prefs.dueDateReminders}
                                onChange={(val) => updateField("dueDateReminders", val)}
                            />
                        </div>
                    </div>
                </>
            )}
        </section>
    );
}