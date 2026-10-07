"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
    Save,
    RotateCcw,
    Building2,
    Database,
    AlertCircle,
    CheckCircle2,
    Download,
    FileSpreadsheet,
    GraduationCap,
    BookOpen,
    ClipboardCheck,
    HardDrive,
    Server,
    Activity,
    Search,
    RefreshCw,
    ShieldAlert,
    Eye,
    Globe,
    Layers,
    Sun,
    Moon,
    Clock,
    ArrowDown,
    Loader2,
    Upload,
    Trash2,
    Check,
    ExternalLink,
    X,
} from "lucide-react";
import {
    getAppSettingsRequest,
    batchUpsertAppSettingsRequest,
    getSystemHealthRequest,
    getSystemActivitiesRequest,
    uploadBrandingAssetRequest,
    type AppSettingDto,
    type SystemHealthDto,
    type SystemActivityDto,
} from "@/lib/api/appSettings";
import { getUsersRequest } from "@/lib/api/users";
import { getCoursesRequest } from "@/lib/api/courses";
import { getSubmissionsRequest } from "@/lib/api/submissions";
import { useAppSettings, applyFavicon } from "@/context";
import { resolveBrandAssetUrl } from "@/lib/utils/format";

type SettingsTab = "branding" | "health";

interface AssetFieldProps {
    id: string;
    label: string;
    description: string;
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
    onUpload: (file: File) => Promise<void>;
    isUploading: boolean;
    presets: { label: string; value: string }[];
    previewTheme?: "light" | "dark";
    isSquare?: boolean;
}

function AssetField({
    id,
    label,
    description,
    value,
    onChange,
    placeholder,
    onUpload,
    isUploading,
    presets,
    previewTheme = "light",
    isSquare = false,
}: AssetFieldProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imgStatus, setImgStatus] = useState<"loading" | "valid" | "error" | "empty">("empty");

    const trimmed = value.trim();
    const resolvedUrl = trimmed ? resolveBrandAssetUrl(trimmed) : "";

    useEffect(() => {
        if (!resolvedUrl) {
            setImgStatus("empty");
        } else {
            setImgStatus("loading");
        }
    }, [resolvedUrl]);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-1">
                <label
                    htmlFor={id}
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                >
                    {label}
                </label>
                {presets.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span className="text-[10px] text-slate-400">Presets:</span>
                        {presets.map((p) => (
                            <button
                                key={p.label}
                                type="button"
                                onClick={() => onChange(p.value)}
                                className="cursor-pointer text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2 transition-colors"
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                    <input
                        id={id}
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    {trimmed && (
                        <button
                            type="button"
                            onClick={() => onChange("")}
                            title="Clear input"
                            className="cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors p-1"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon,.ico"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            void onUpload(file);
                            e.target.value = "";
                        }
                    }}
                />

                <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer shrink-0 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors disabled:opacity-50"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                            <span>Uploading...</span>
                        </>
                    ) : (
                        <>
                            <Upload className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Upload File</span>
                        </>
                    )}
                </button>
            </div>

            <p className="text-[11px] text-slate-400">
                {description}
            </p>

            {/* Inline Mini Preview & Verification */}
            {resolvedUrl && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
                    <div
                        className={`flex items-center justify-center p-2 rounded-lg border ${
                            previewTheme === "dark"
                                ? "bg-slate-900 border-slate-800 text-white"
                                : "bg-white border-slate-200 text-slate-900"
                        } ${isSquare ? "h-11 w-11" : "h-11 min-w-[100px] max-w-[150px]"}`}
                    >
                        <img
                            src={resolvedUrl}
                            alt={label}
                            onLoad={() => setImgStatus("valid")}
                            onError={() => setImgStatus("error")}
                            className={`${isSquare ? "h-6 w-6" : "h-7 max-w-[130px]"} object-contain`}
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        {imgStatus === "valid" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Image loaded successfully
                            </span>
                        )}
                        {imgStatus === "error" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Unable to load image (file not found or invalid URL)
                            </span>
                        )}
                        {imgStatus === "loading" && (
                            <span className="text-[11px] text-slate-400 font-medium">
                                Verifying image...
                            </span>
                        )}
                        <p className="text-[10px] text-slate-400 truncate mt-0.5" title={resolvedUrl}>
                            Source: {resolvedUrl}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export function AdminSettingsView() {
    const { refreshSettings } = useAppSettings();
    const [activeTab, setActiveTab] = useState<SettingsTab>("branding");
    const [settings, setSettings] = useState<AppSettingDto[]>([]);
    const [systemHealth, setSystemHealth] = useState<SystemHealthDto | null>(null);

    // 30-Day Activity Logs with Lazy Loading
    const [activities, setActivities] = useState<SystemActivityDto[]>([]);
    const [totalActivities, setTotalActivities] = useState(0);
    const [hasMoreActivities, setHasMoreActivities] = useState(false);
    const [loadingMoreActivities, setLoadingMoreActivities] = useState(false);
    const [activitySearch, setActivitySearch] = useState("");
    const [refreshingActivities, setRefreshingActivities] = useState(false);
    const isInitialSearchMount = useRef(true);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [exportingType, setExportingType] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Form fields for Platform & Branding
    const [platformName, setPlatformName] = useState("CourseDesk");
    const [platformTagline, setPlatformTagline] = useState("Modern Learning & Assessment Management Platform");
    const [brandLogoLight, setBrandLogoLight] = useState("");
    const [brandLogoDark, setBrandLogoDark] = useState("");
    const [brandFavicon, setBrandFavicon] = useState("/favicon.ico");
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [maintenanceBannerMessage, setMaintenanceBannerMessage] = useState(
        "CourseDesk is currently undergoing scheduled maintenance. Normal access will resume shortly."
    );

    // Live preview theme toggle
    const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("light");
    const [uploadingField, setUploadingField] = useState<"logoLight" | "logoDark" | "favicon" | null>(null);

    const flashSuccess = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(null), 3500);
    };

    const handleFileUpload = async (
        field: "logoLight" | "logoDark" | "favicon",
        file: File
    ) => {
        try {
            setUploadingField(field);
            setError(null);
            const res = await uploadBrandingAssetRequest(file);
            if (field === "logoLight") setBrandLogoLight(res.url);
            else if (field === "logoDark") setBrandLogoDark(res.url);
            else if (field === "favicon") setBrandFavicon(res.url);
            flashSuccess("Asset uploaded successfully! Remember to click 'Save Settings' to apply.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to upload branding asset.");
        } finally {
            setUploadingField(null);
        }
    };


    // Load all data
    const loadAll = useCallback(async () => {
        try {
            setError(null);
            const [settingsData, healthData, activitiesData] = await Promise.all([
                getAppSettingsRequest(),
                getSystemHealthRequest().catch(() => null),
                getSystemActivitiesRequest({ limit: 15, offset: 0 }).catch(() => ({
                    items: [],
                    total: 0,
                    hasMore: false,
                    offset: 0,
                    limit: 15,
                    retentionDays: 30,
                })),
            ]);

            setSettings(settingsData);
            if (healthData) setSystemHealth(healthData);
            setActivities(activitiesData.items);
            setTotalActivities(activitiesData.total);
            setHasMoreActivities(activitiesData.hasMore);

            // Populate form fields from settings key-value store
            const getVal = (key: string, fallback: string) => {
                const found = settingsData.find((s) => s.key === key);
                return found !== undefined && found.value !== null ? found.value : fallback;
            };

            const nameVal = getVal("platform_name", getVal("site_name", "CourseDesk"));
            setPlatformName(nameVal);
            setPlatformTagline(getVal("platform_tagline", "Modern Learning & Assessment Management Platform"));
            setBrandLogoLight(getVal("brand_logo_light", ""));
            setBrandLogoDark(getVal("brand_logo_dark", ""));
            setBrandFavicon(getVal("brand_favicon", "/favicon.ico"));
            setMaintenanceMode(getVal("maintenance_mode", "false") === "true");
            setMaintenanceBannerMessage(
                getVal(
                    "maintenance_banner_message",
                    "CourseDesk is currently undergoing scheduled maintenance. Normal access will resume shortly."
                )
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load application settings.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadAll();
    }, [loadAll]);

    // Save Platform & Branding Settings
    const handleSaveBranding = async () => {
        try {
            setSaving(true);
            setError(null);

            const payload = [
                {
                    key: "platform_name",
                    value: platformName.trim(),
                    description: "The primary brand displayed across headers, emails, and browser titles",
                    category: "General",
                },
                {
                    key: "site_name",
                    value: platformName.trim(),
                    description: "Display name alias for backward compatibility",
                    category: "General",
                },
                {
                    key: "platform_tagline",
                    value: platformTagline.trim(),
                    description: "Brand tagline or institutional subtitle",
                    category: "General",
                },
                {
                    key: "brand_logo_light",
                    value: brandLogoLight.trim(),
                    description: "Custom branding logo URL for light mode interface",
                    category: "General",
                },
                {
                    key: "brand_logo_dark",
                    value: brandLogoDark.trim(),
                    description: "Custom branding logo URL for dark mode interface",
                    category: "General",
                },
                {
                    key: "brand_favicon",
                    value: brandFavicon.trim(),
                    description: "Custom favicon URL for browser tabs",
                    category: "General",
                },
                {
                    key: "maintenance_mode",
                    value: maintenanceMode ? "true" : "false",
                    description: "Temporary system lockdown for maintenance",
                    category: "General",
                },
                {
                    key: "maintenance_banner_message",
                    value: maintenanceBannerMessage.trim(),
                    description: "Announcement message displayed to users during maintenance",
                    category: "General",
                },
            ];

            await batchUpsertAppSettingsRequest(payload);
            await refreshSettings();
            applyFavicon(brandFavicon.trim());
            if (typeof document !== "undefined") {
                const brand = platformName.trim() || "CourseDesk";
                const tagline = platformTagline.trim() ? ` - ${platformTagline.trim()}` : " - Course & Assignment Management";
                document.title = `${brand}${tagline}`;
            }
            flashSuccess("Platform & Branding settings saved successfully.");
            await loadAll();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    // Helper: CSV Download generator
    const triggerCsvDownload = (filename: string, headers: string[], rows: (string | number)[][]) => {
        const escapeCell = (val: string | number) => `"${String(val ?? "").replace(/"/g, '""')}"`;
        const csvContent = [
            headers.map(escapeCell).join(","),
            ...rows.map((row) => row.map(escapeCell).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Export 1: Learners Roster
    const handleExportLearners = async () => {
        try {
            setExportingType("learners");
            const users = await getUsersRequest();
            const learners = users.filter((u) => u.role === "Learner" || u.role === "Student");

            const headers = [
                "ID",
                "Full Name",
                "Email",
                "Learner ID / Code",
                "Organization / Group",
                "Joined Date",
                "Active Status",
            ];

            const rows = learners.map((l) => [
                l.id,
                l.name,
                l.email,
                l.learnerDetails?.learnerId || l.studentDetails?.studentId || l.learnerDetails?.studentId || "N/A",
                l.learnerDetails?.organization || "General",
                l.createdAtUtc ? l.createdAtUtc.split("T")[0] : "N/A",
                l.isActive ? "Active" : "Archived",
            ]);

            const dateStr = new Date().toISOString().split("T")[0];
            triggerCsvDownload(`coursedesk_learners_roster_${dateStr}.csv`, headers, rows);
            flashSuccess(`Exported ${learners.length} learners to CSV.`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to export learners roster.");
        } finally {
            setExportingType(null);
        }
    };

    // Export 2: Course Catalog
    const handleExportCourses = async () => {
        try {
            setExportingType("courses");
            const courses = await getCoursesRequest();

            const headers = [
                "ID",
                "Course Name",
                "Category",
                "Tags",
                "Instructors Count",
                "Learners Count",
                "Status",
            ];

            const rows = courses.map((c) => [
                c.id,
                c.name,
                c.department || "General",
                (c.tags || []).join("; "),
                (c.instructorIds || c.teacherIds || []).length,
                (c.learnerIds || c.studentIds || []).length,
                c.isActive ? "Active" : "Archived",
            ]);

            const dateStr = new Date().toISOString().split("T")[0];
            triggerCsvDownload(`coursedesk_course_catalog_${dateStr}.csv`, headers, rows);
            flashSuccess(`Exported ${courses.length} courses to CSV.`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to export course catalog.");
        } finally {
            setExportingType(null);
        }
    };

    // Export 3: Gradebook & Submissions Summary
    const handleExportGradebook = async () => {
        try {
            setExportingType("gradebook");
            const subs = await getSubmissionsRequest().catch(() => []);

            const headers = [
                "Submission ID",
                "Course Name",
                "Assignment Title",
                "Learner Name",
                "Learner Email",
                "Learner ID",
                "Marks Awarded",
                "Max Marks",
                "Submission Status",
                "Late Submission",
                "Submitted At",
            ];

            const rows = subs.map((s) => [
                s.id,
                s.courseName || `Course #${s.courseId}`,
                s.assignmentTitle || `Assignment #${s.assignmentId}`,
                s.learnerName || s.studentName || "N/A",
                s.learnerEmail || s.studentEmail || "N/A",
                s.learnerAcademicId || s.studentAcademicId || "N/A",
                s.marks !== null ? s.marks : "Not Graded",
                s.maxMarks || 100,
                s.status,
                s.isLate ? "Yes (Late)" : "On Time",
                s.submittedAtUtc ? new Date(s.submittedAtUtc).toLocaleString() : "N/A",
            ]);

            const dateStr = new Date().toISOString().split("T")[0];
            triggerCsvDownload(`coursedesk_gradebook_submissions_${dateStr}.csv`, headers, rows);
            flashSuccess(`Exported ${subs.length} gradebook submissions to CSV.`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to export gradebook summary.");
        } finally {
            setExportingType(null);
        }
    };

    // Debounced Search for 30-Day Activities
    useEffect(() => {
        if (isInitialSearchMount.current) {
            isInitialSearchMount.current = false;
            return;
        }
        const timer = setTimeout(() => {
            void (async () => {
                try {
                    const data = await getSystemActivitiesRequest({
                        limit: 15,
                        offset: 0,
                        search: activitySearch.trim(),
                    });
                    setActivities(data.items);
                    setTotalActivities(data.total);
                    setHasMoreActivities(data.hasMore);
                } catch {
                    // search error caught
                }
            })();
        }, 300);
        return () => clearTimeout(timer);
    }, [activitySearch]);

    // Refresh Activity Logs
    const handleRefreshActivities = async () => {
        try {
            setRefreshingActivities(true);
            const data = await getSystemActivitiesRequest({
                limit: 15,
                offset: 0,
                search: activitySearch.trim(),
            });
            setActivities(data.items);
            setTotalActivities(data.total);
            setHasMoreActivities(data.hasMore);
            flashSuccess("System activity log refreshed.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to refresh activities.");
        } finally {
            setRefreshingActivities(false);
        }
    };

    // Lazy Load More Activities
    const handleLoadMoreActivities = async () => {
        if (loadingMoreActivities || !hasMoreActivities) return;
        try {
            setLoadingMoreActivities(true);
            const data = await getSystemActivitiesRequest({
                limit: 15,
                offset: activities.length,
                search: activitySearch.trim(),
            });
            setActivities((prev) => [...prev, ...data.items]);
            setTotalActivities(data.total);
            setHasMoreActivities(data.hasMore);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load more activities.");
        } finally {
            setLoadingMoreActivities(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-9 w-9 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
                    <p className="text-sm font-medium text-slate-500">Loading application settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-8 space-y-6">
            {/* Feedback Notifications */}
            {error && (
                <div className="flex items-center gap-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-5 py-3.5 text-sm text-red-700 dark:text-red-300 shadow-sm animate-in fade-in">
                    <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                    <span className="font-medium">{error}</span>
                </div>
            )}
            {successMessage && (
                <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-5 py-3.5 text-sm text-emerald-700 dark:text-emerald-300 shadow-sm animate-in fade-in">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                    <span className="font-medium">{successMessage}</span>
                </div>
            )}

            {/* Header & Controls */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Application Settings
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Configure platform branding, identity, and system data governance.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => void loadAll()}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Reset
                    </button>
                    {activeTab === "branding" && (
                        <button
                            type="button"
                            onClick={() => void handleSaveBranding()}
                            disabled={saving}
                            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {saving ? "Saving..." : "Save Settings"}
                        </button>
                    )}
                </div>
            </div>

            {/* Segmented Navigation Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-800">
                <nav className="flex items-center gap-6 sm:gap-8">
                    <button
                        type="button"
                        onClick={() => setActiveTab("branding")}
                        className={`group relative flex cursor-pointer items-center gap-2.5 pb-3.5 pt-1 text-sm font-semibold transition-all ${
                            activeTab === "branding"
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                        }`}
                    >
                        <span
                            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                                activeTab === "branding"
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                            }`}
                        >
                            <Building2 className="h-3.5 w-3.5" />
                        </span>
                        <span>Platform &amp; Branding</span>
                        {activeTab === "branding" && (
                            <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-t-full bg-blue-600 dark:bg-blue-500" />
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("health")}
                        className={`group relative flex cursor-pointer items-center gap-2.5 pb-3.5 pt-1 text-sm font-semibold transition-all ${
                            activeTab === "health"
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                        }`}
                    >
                        <span
                            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                                activeTab === "health"
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                            }`}
                        >
                            <Database className="h-3.5 w-3.5" />
                        </span>
                        <span>Data, Exports &amp; System Health</span>
                        {activeTab === "health" && (
                            <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-t-full bg-blue-600 dark:bg-blue-500" />
                        )}
                    </button>
                </nav>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* TAB 1: PLATFORM & BRANDING                                          */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === "branding" && (
                <div className="space-y-8 animate-in fade-in duration-200">
                    {/* Identity & White-Labeling Card */}
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                <Globe className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                    Identity &amp; White-Labeling
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Controls how your platform appears to learners, clients, and partner organizations.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-6 md:grid-cols-2">
                            {/* Platform Name */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Platform / Organization Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={platformName}
                                    onChange={(e) => setPlatformName(e.target.value)}
                                    placeholder="e.g. CourseDesk, Acme Academy, TechTrain"
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                                <p className="text-[11px] text-slate-400">
                                    The primary brand displayed across headers, emails, and browser titles.
                                </p>
                            </div>

                            {/* Tagline */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Platform Tagline
                                </label>
                                <input
                                    type="text"
                                    value={platformTagline}
                                    onChange={(e) => setPlatformTagline(e.target.value)}
                                    placeholder="e.g. Modern Learning & Assessment Management Platform"
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                                <p className="text-[11px] text-slate-400">
                                    A concise brand slogan or institutional subtitle.
                                </p>
                            </div>

                            {/* Light Mode Logo */}
                            <AssetField
                                id="brand-logo-light"
                                label="Brand Logo (Light Mode URL)"
                                description="Logo displayed on white and light backgrounds (e.g. headers, sidebars)."
                                value={brandLogoLight}
                                onChange={setBrandLogoLight}
                                placeholder="e.g. /brand/logo-light.svg or https://..."
                                onUpload={(file) => handleFileUpload("logoLight", file)}
                                isUploading={uploadingField === "logoLight"}
                                presets={[
                                    { label: "Default SVG", value: "/brand/logo-light.svg" },
                                ]}
                                previewTheme="light"
                            />

                            {/* Dark Mode Logo */}
                            <AssetField
                                id="brand-logo-dark"
                                label="Brand Logo (Dark Mode URL)"
                                description="Logo displayed when users enable dark theme."
                                value={brandLogoDark}
                                onChange={setBrandLogoDark}
                                placeholder="e.g. /brand/logo-dark.svg or https://..."
                                onUpload={(file) => handleFileUpload("logoDark", file)}
                                isUploading={uploadingField === "logoDark"}
                                presets={[
                                    { label: "Default SVG", value: "/brand/logo-dark.svg" },
                                ]}
                                previewTheme="dark"
                            />

                            {/* Favicon URL */}
                            <div className="md:col-span-2">
                                <AssetField
                                    id="brand-favicon"
                                    label="Favicon URL"
                                    description="Icon displayed in browser tabs and bookmarks (supports .ico, .svg, .png)."
                                    value={brandFavicon}
                                    onChange={setBrandFavicon}
                                    placeholder="e.g. /favicon.ico or /brand/favicon.svg"
                                    onUpload={(file) => handleFileUpload("favicon", file)}
                                    isUploading={uploadingField === "favicon"}
                                    presets={[
                                        { label: "Default ICO", value: "/favicon.ico" },
                                        { label: "Brand SVG", value: "/brand/favicon.svg" },
                                    ]}
                                    previewTheme={previewTheme}
                                    isSquare={true}
                                />
                            </div>
                        </div>

                        {/* Live Branding Preview */}
                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                        Live Branding Preview
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Interactive appearance in navigation bar and browser tab.
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setPreviewTheme("light")}
                                        className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                            previewTheme === "light"
                                                ? "bg-white text-slate-900 shadow-xs"
                                                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                                        }`}
                                    >
                                        <Sun className="h-3.5 w-3.5 text-amber-500" />
                                        Light
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewTheme("dark")}
                                        className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                            previewTheme === "dark"
                                                ? "bg-slate-900 text-white shadow-xs"
                                                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                                        }`}
                                    >
                                        <Moon className="h-3.5 w-3.5 text-indigo-400" />
                                        Dark
                                    </button>
                                </div>
                            </div>

                            {/* Navigation Bar Simulation */}
                            <div
                                className={`rounded-2xl border p-5 transition-colors shadow-xs ${
                                    previewTheme === "dark"
                                        ? "bg-slate-950 border-slate-800 text-white"
                                        : "bg-white border-slate-200 text-slate-900"
                                }`}
                            >
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                                    <Eye className="h-3 w-3" /> Navigation Bar Simulation ({previewTheme === "dark" ? "Dark Theme" : "Light Theme"})
                                </div>
                                <div className="flex items-center gap-3">
                                    {(() => {
                                        const logoToPreview = previewTheme === "dark"
                                            ? (brandLogoDark.trim() || brandLogoLight.trim())
                                            : (brandLogoLight.trim() || brandLogoDark.trim());
                                        const resolved = logoToPreview ? resolveBrandAssetUrl(logoToPreview) : "";
                                        return resolved ? (
                                            <div className="flex items-center">
                                                <img
                                                    src={resolved}
                                                    alt={platformName || "Logo"}
                                                    className="h-9 max-w-[190px] object-contain transition-transform"
                                                    onError={(e) => {
                                                        (e.currentTarget as HTMLElement).style.display = "none";
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div
                                                className={`flex h-10 w-10 items-center justify-center rounded-xl font-black text-lg ${
                                                    previewTheme === "dark"
                                                        ? "bg-blue-600 text-white shadow-xs"
                                                        : "bg-blue-50 text-blue-600 border border-blue-200 shadow-xs"
                                                }`}
                                            >
                                                {platformName ? platformName.charAt(0).toUpperCase() : "C"}
                                            </div>
                                        );
                                    })()}
                                    <div className="min-w-0">
                                        <p className="font-bold text-base leading-tight truncate">
                                            {platformName || "CourseDesk"}
                                        </p>
                                        <p
                                            className={`text-xs truncate ${
                                                previewTheme === "dark" ? "text-slate-400" : "text-slate-500"
                                            }`}
                                        >
                                            {platformTagline || "Modern Learning & Assessment Management Platform"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Browser Tab Simulation */}
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 p-4">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                                    <Globe className="h-3 w-3" /> Browser Tab Simulation
                                </div>
                                <div className="flex items-center">
                                    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-t-xl bg-white dark:bg-slate-900 border-t border-x border-slate-200 dark:border-slate-800 shadow-xs max-w-md">
                                        <img
                                            src={resolveBrandAssetUrl(brandFavicon.trim() || "/favicon.ico")}
                                            alt="Favicon"
                                            className="h-4 w-4 shrink-0 object-contain rounded-xs"
                                            onError={(e) => {
                                                (e.currentTarget as HTMLElement).style.display = "none";
                                            }}
                                        />
                                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                            {platformName.trim() || "CourseDesk"} - {platformTagline.trim() || "Course & Assignment Management"}
                                        </span>
                                        <X className="h-3 w-3 text-slate-400 ml-auto shrink-0" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Maintenance Mode & Banner Card */}
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                                <ShieldAlert className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                    Maintenance &amp; Maintenance Banner
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Temporary system lockdown with a customizable banner message for planned upgrades or maintenance.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 space-y-6">
                            {/* Maintenance Mode Toggle Switch */}
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        Maintenance Mode
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        {maintenanceMode
                                            ? "Active: LMS is locked for standard users. Only Admins can navigate courses."
                                            : "Disabled: Platform is online and fully accessible to all learners and instructors."}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={maintenanceMode}
                                    onClick={() => setMaintenanceMode((prev) => !prev)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                                        maintenanceMode
                                            ? "bg-amber-500 dark:bg-amber-600"
                                            : "bg-slate-300 dark:bg-slate-700"
                                    }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                            maintenanceMode ? "translate-x-5" : "translate-x-0"
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* Maintenance Banner Message Input */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Maintenance Banner Message
                                </label>
                                <textarea
                                    value={maintenanceBannerMessage}
                                    onChange={(e) => setMaintenanceBannerMessage(e.target.value)}
                                    placeholder="Enter announcement message for users during maintenance..."
                                    rows={3}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                                />
                                <p className="text-[11px] text-slate-400">
                                    Broadcast message displayed on the user lockdown screen or top banner.
                                </p>
                            </div>

                            {/* Live Banner Preview */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                    Banner Live Preview
                                </h3>
                                <div className="flex items-center gap-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-4 text-xs sm:text-sm text-amber-800 dark:text-amber-300">
                                    <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                                    <div>
                                        <p className="font-bold">System Maintenance Notice</p>
                                        <p className="mt-0.5 text-amber-700 dark:text-amber-400 font-medium">
                                            {maintenanceBannerMessage || "System is undergoing planned maintenance."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* TAB 2: DATA, EXPORTS & SYSTEM HEALTH                               */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === "health" && (
                <div className="space-y-8 animate-in fade-in duration-200">
                    {/* 1. Data Export Center */}
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                <Download className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                    Data Export Center
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    One-click export of learner rosters, course catalogs, and gradebook summaries in CSV format.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {/* Card 1: Learner Rosters */}
                            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-5 hover:border-blue-300 dark:hover:border-blue-800 transition-all">
                                <div>
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300">
                                        <GraduationCap className="h-4.5 w-4.5" />
                                    </div>
                                    <h3 className="mt-3.5 text-base font-bold text-slate-900 dark:text-slate-100">
                                        Learner Rosters
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        Directory of all registered learners with names, emails, academic IDs, and status.
                                    </p>
                                </div>
                                <div className="mt-5 pt-3.5 border-t border-slate-200/60 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => void handleExportLearners()}
                                        disabled={exportingType === "learners"}
                                        className="w-full cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/60 dark:hover:text-blue-300 transition-all shadow-2xs disabled:opacity-50"
                                    >
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                        <span>{exportingType === "learners" ? "Generating CSV..." : "Export Learners (CSV)"}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Card 2: Course Catalogs */}
                            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-5 hover:border-blue-300 dark:hover:border-blue-800 transition-all">
                                <div>
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                                        <BookOpen className="h-4.5 w-4.5" />
                                    </div>
                                    <h3 className="mt-3.5 text-base font-bold text-slate-900 dark:text-slate-100">
                                        Course Catalogs
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        Complete curriculum inventory with titles, categories, tags, and enrolled counts.
                                    </p>
                                </div>
                                <div className="mt-5 pt-3.5 border-t border-slate-200/60 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => void handleExportCourses()}
                                        disabled={exportingType === "courses"}
                                        className="w-full cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/60 dark:hover:text-blue-300 transition-all shadow-2xs disabled:opacity-50"
                                    >
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                        <span>{exportingType === "courses" ? "Generating CSV..." : "Export Courses (CSV)"}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Card 3: Gradebook & Submissions Summary */}
                            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-5 hover:border-blue-300 dark:hover:border-blue-800 transition-all">
                                <div>
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                        <ClipboardCheck className="h-4.5 w-4.5" />
                                    </div>
                                    <h3 className="mt-3.5 text-base font-bold text-slate-900 dark:text-slate-100">
                                        Gradebook &amp; Submissions
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        Consolidated record of learner submissions, scores, status, and completion times.
                                    </p>
                                </div>
                                <div className="mt-5 pt-3.5 border-t border-slate-200/60 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => void handleExportGradebook()}
                                        disabled={exportingType === "gradebook"}
                                        className="w-full cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/60 dark:hover:text-blue-300 transition-all shadow-2xs disabled:opacity-50"
                                    >
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                        <span>{exportingType === "gradebook" ? "Generating CSV..." : "Export Gradebook (CSV)"}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Storage & Asset Overview */}
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                    <HardDrive className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                        Storage &amp; Asset Overview
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Visibility into total storage consumed by assignment files, course materials, and attachments.
                                    </p>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                Healthy • Operational
                            </span>
                        </div>

                        {/* Metric Counters Grid */}
                        <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Total Courses
                                </p>
                                <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">
                                    {systemHealth?.totalCourses ?? 0}
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Assignments
                                </p>
                                <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">
                                    {systemHealth?.totalAssignments ?? 0}
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Submissions
                                </p>
                                <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">
                                    {systemHealth?.totalSubmissions ?? 0}
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Learners
                                </p>
                                <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">
                                    {systemHealth?.totalLearners ?? 0}
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 col-span-2 sm:col-span-1">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Instructors
                                </p>
                                <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">
                                    {systemHealth?.totalInstructors ?? 0}
                                </p>
                            </div>
                        </div>

                        {/* Storage Consumption Bar */}
                        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    Estimated Storage Footprint
                                </span>
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                    {systemHealth?.estimatedStorageMb ?? 14.5} MB / 50.0 GB (0.03%)
                                </span>
                            </div>
                            <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                                    style={{
                                        width: `${Math.max(
                                            1,
                                            Math.min(
                                                100,
                                                ((systemHealth?.estimatedStorageMb ?? 14.5) /
                                                    (systemHealth?.storageQuotaMb ?? 51200)) *
                                                    100
                                            )
                                        )}%`,
                                    }}
                                />
                            </div>
                            <p className="text-[11px] text-slate-400">
                                Storage covers coursework attachments, student code and PDF submissions, and system media.
                            </p>
                        </div>
                    </div>

                    {/* 3. System Activity Log */}
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                    <Activity className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                            System Activity Log
                                        </h2>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/80 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                                            <Clock className="h-3 w-3" />
                                            30-Day Window
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Audit trails of key administrative actions from the past 30 days, loaded lazily on demand.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => void handleRefreshActivities()}
                                disabled={refreshingActivities}
                                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors self-start sm:self-auto"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${refreshingActivities ? "animate-spin" : ""}`} />
                                Refresh Log
                            </button>
                        </div>

                        {/* Search Toolbar & Counter */}
                        <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="relative w-full sm:max-w-sm">
                                <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={activitySearch}
                                    onChange={(e) => setActivitySearch(e.target.value)}
                                    placeholder="Search 30-day audit trail..."
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Showing <span className="font-bold text-slate-900 dark:text-slate-100">{activities.length}</span> of{" "}
                                <span className="font-bold text-slate-900 dark:text-slate-100">{totalActivities}</span> 30-day events
                            </p>
                        </div>

                        {/* Activities List */}
                        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                            {activities.length > 0 ? (
                                <>
                                    {activities.map((act) => (
                                        <div
                                            key={act.id}
                                            className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                                        >
                                            <div className="flex items-start gap-3 min-w-0 pr-3">
                                                <span className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                                                <div className="min-w-0">
                                                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                        {act.action}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                        {act.details}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 sm:shrink-0 text-xs text-slate-400 pl-5 sm:pl-0">
                                                <span className="inline-block rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-medium text-slate-600 dark:text-slate-300">
                                                    {act.actor}
                                                </span>
                                                <time className="whitespace-nowrap">
                                                    {act.timestamp
                                                        ? new Date(act.timestamp).toLocaleDateString(undefined, {
                                                              month: "short",
                                                              day: "numeric",
                                                              hour: "2-digit",
                                                              minute: "2-digit",
                                                          })
                                                        : "Recent"}
                                                </time>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Lazy Loading Action Bar */}
                                    {hasMoreActivities ? (
                                        <div className="p-4 bg-slate-50/60 dark:bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {totalActivities - activities.length} more event{totalActivities - activities.length === 1 ? "" : "s"} available
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => void handleLoadMoreActivities()}
                                                disabled={loadingMoreActivities}
                                                className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
                                            >
                                                {loadingMoreActivities ? (
                                                    <>
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        Loading next batch...
                                                    </>
                                                ) : (
                                                    <>
                                                        <ArrowDown className="h-3.5 w-3.5" />
                                                        Load More Logs ({Math.min(15, totalActivities - activities.length)} more)
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-3 text-center bg-slate-50/40 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                                            All {totalActivities} events from the last 30 days are loaded.
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="py-12 text-center text-xs text-slate-400">
                                    <Activity className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-600 mb-1.5" />
                                    {activitySearch
                                        ? "No activity logs match your search in the past 30 days."
                                        : "No activity logs recorded in the past 30 days."}
                                </div>
                            )}
                        </div>

                        {/* Retention & Compliance Note */}
                        <div className="mt-3.5 flex items-start sm:items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                            <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5 sm:mt-0 text-slate-400" />
                            <span>
                                Hot database audit records are automatically retained for a rolling <strong>30-day window</strong> to optimize database performance and comply with data privacy policies.
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}