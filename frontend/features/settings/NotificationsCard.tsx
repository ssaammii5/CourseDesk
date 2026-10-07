"use client";

import { useEffect, useState } from "react";
import {
    AlertCircle,
    Bell,
    Briefcase,
    Check,
    GraduationCap,
    Loader2,
    Mail,
    Shield,
    Sparkles,
} from "lucide-react";
import { ToggleRow } from "@/components/ui";
import {
    getNotificationPreferencesRequest,
    updateNotificationPreferencesRequest,
} from "@/lib/api";
import type { NotificationPreferences } from "@/types";

interface NotificationsCardProps {
    role?: string;
}

export function NotificationsCard({ role = "Learner" }: NotificationsCardProps) {
    const isInstructor = role === "Instructor";
    const isCoordinator = role === "Coordinator";
    const isAdmin = role === "Admin";
    const isLearner = !isInstructor && !isAdmin && !isCoordinator;

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
    const [errorNotice, setErrorNotice] = useState<string | null>(null);

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
        const previous = { ...prefs };
        const next = { ...prefs, [field]: value };
        setPrefs(next);
        setSaving(true);
        setSavedNotice(false);
        setErrorNotice(null);

        try {
            await updateNotificationPreferencesRequest(next);
            setSavedNotice(true);
            setTimeout(() => setSavedNotice(false), 2500);
        } catch (err: any) {
            setPrefs(previous);
            setErrorNotice(err?.message || "Failed to update preference. Please try again.");
            setTimeout(() => setErrorNotice(null), 3500);
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <span>Notification Preferences</span>
                        </h2>
                        <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                isAdmin
                                    ? "bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300"
                                    : isCoordinator || isInstructor
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300"
                                    : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300"
                            }`}
                        >
                            {isAdmin ? (
                                <Shield className="h-3 w-3" />
                            ) : isCoordinator || isInstructor ? (
                                <Briefcase className="h-3 w-3" />
                            ) : (
                                <GraduationCap className="h-3 w-3" />
                            )}
                            <span>{isCoordinator ? "Co-ordinator" : role} Preferences</span>
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                        {isAdmin
                            ? "Configure platform-level alert triggers, automated email digests, and administrative notices."
                            : isInstructor
                            ? "Customize real-time student submission alerts, grading reminders, and course communications."
                            : isCoordinator
                            ? "Manage cohort announcements, enrollment updates, and course milestone alerts."
                            : "Choose which events send alerts to your dashboard feed and registered email address."}
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
                    {errorNotice && !saving && (
                        <span className="flex items-center gap-1.5 font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-lg">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span>{errorNotice}</span>
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
                                    {isAdmin
                                        ? "Administrative digest updates and critical platform notices sent to your inbox."
                                        : isInstructor
                                        ? "Course digests, learner submission notifications, and important notices sent to your inbox."
                                        : isCoordinator
                                        ? "Cohort status updates and program announcements sent directly to your inbox."
                                        : "Summary digests and critical notifications sent directly to your inbox."}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200/80 dark:border-slate-800">
                            <ToggleRow
                                label="Allow email notifications"
                                description={
                                    isAdmin
                                        ? "Receive email digests for platform updates, user registrations, and system notices."
                                        : isInstructor
                                        ? "Receive email alerts for student submissions, student questions, and scheduled due dates."
                                        : isCoordinator
                                        ? "Receive email updates for cohort milestones, course additions, and program alerts."
                                        : "Receive email alerts for important course announcements, assignment deadlines, and system notices."
                                }
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
                                    {isAdmin
                                        ? "Platform & Course Activity"
                                        : isInstructor
                                        ? "Teaching & Cohort Activity"
                                        : isCoordinator
                                        ? "Program & Academic Activity"
                                        : "Course Activities"}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    Trigger notifications in your dashboard header bell and live activity stream.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 pt-3 border-t border-gray-200/80 dark:border-slate-800">
                            <ToggleRow
                                label={
                                    isAdmin
                                        ? "Course Content & Modules"
                                        : isInstructor
                                        ? "Course Materials & Syllabi"
                                        : "Assignments & Course Materials"
                                }
                                description={
                                    isAdmin
                                        ? "Notify when new assignments, modules, or lecture resources are published across courses."
                                        : isInstructor
                                        ? "Notify when course modules, assignments, or syllabus resources are published or modified."
                                        : isCoordinator
                                        ? "Notify when courses, coursework modules, or learning resources are published."
                                        : "Notify when new assignments, modules, or lecture resources are published."
                                }
                                enabled={prefs.assignmentNotifications}
                                onChange={(val) => updateField("assignmentNotifications", val)}
                            />
                            <ToggleRow
                                label={
                                    isAdmin
                                        ? "Submissions & Evaluations"
                                        : isInstructor
                                        ? "Student Submissions & Grading"
                                        : "Submissions & Grading"
                                }
                                description={
                                    isAdmin
                                        ? "Notify when student submissions arrive or grading evaluations are completed."
                                        : isInstructor
                                        ? "Notify when learners submit coursework, turn in assignments, or when grading is pending."
                                        : isCoordinator
                                        ? "Notify when assignment submissions and score evaluations are finalized."
                                        : "Notify when your assignments are evaluated or when grades and instructor feedback are posted."
                                }
                                enabled={prefs.gradeNotifications}
                                onChange={(val) => updateField("gradeNotifications", val)}
                            />
                            <ToggleRow
                                label={
                                    isAdmin
                                        ? "Announcements & System Bulletins"
                                        : isInstructor
                                        ? "Class Bulletins & Announcements"
                                        : "Announcements & Bulletins"
                                }
                                description={
                                    isAdmin
                                        ? "Notify when platform-wide announcements, program updates, or system bulletins are broadcast."
                                        : isInstructor
                                        ? "Notify when announcements or course-wide bulletins are posted in your cohorts."
                                        : isCoordinator
                                        ? "Notify when program updates or coordinator bulletins are published."
                                        : "Notify when instructors or program admins post important class announcements."
                                }
                                enabled={prefs.announcementNotifications}
                                onChange={(val) => updateField("announcementNotifications", val)}
                            />
                            <ToggleRow
                                label={
                                    isAdmin
                                        ? "Milestone & Schedule Reminders"
                                        : isInstructor
                                        ? "Due Date & Submission Windows"
                                        : "Due Date Reminders"
                                }
                                description={
                                    isAdmin
                                        ? "Receive proactive schedule reminders for course milestones and deadline cutoffs."
                                        : isInstructor
                                        ? "Receive alerts when assignment deadlines approach and submission cutoffs are near."
                                        : isCoordinator
                                        ? "Receive reminders for upcoming term milestones and scheduled assignment deadlines."
                                        : "Receive proactive reminders 24-48 hours before assignment deadlines."
                                }
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