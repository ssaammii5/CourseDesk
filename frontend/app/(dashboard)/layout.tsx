"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Sidebar, TopBar } from "@/components/layout";
import { useAuth } from "@/hooks";
import { useAppSettings } from "@/context";
import { LoginView } from "@/features/auth";

const DESKTOP_QUERY = "(min-width: 1024px)";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { status, user } = useAuth();
    const { maintenanceMode, maintenanceBannerMessage, platformName } = useAppSettings();
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileReady, setMobileReady] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia(DESKTOP_QUERY);
        setSidebarOpen(mq.matches);
        setMobileReady(true);
        const handleChange = (e: MediaQueryListEvent) => setSidebarOpen(e.matches);
        mq.addEventListener("change", handleChange);
        return () => mq.removeEventListener("change", handleChange);
    }, []);

    useEffect(() => {
        if (status === "unauthenticated" && pathname !== "/") {
            router.replace("/");
        }
    }, [status, pathname, router]);

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-[#1a73e8]" />
            </div>
        );
    }

    if (status === "unauthenticated") {
        return <LoginView />;
    }

    const isAdmin = user?.role === "Admin";

    return (
        <div className="min-h-screen bg-[#eef1f4] text-gray-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
            {/* Global Maintenance Mode Broadcast Banner */}
            {maintenanceMode && (
                <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-amber-500 px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-md">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-slate-950" />
                        <span>
                            {maintenanceBannerMessage ||
                                `${platformName || "CourseDesk"} is currently undergoing scheduled maintenance. Normal access will resume shortly.`}
                        </span>
                    </div>
                    {isAdmin ? (
                        <span className="rounded-md bg-amber-950/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            Admin Maintenance Bypass
                        </span>
                    ) : (
                        <span className="rounded-md bg-amber-950/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            Maintenance Window
                        </span>
                    )}
                </div>
            )}

            <TopBar onMenuClick={() => setSidebarOpen((v) => !v)} />

            {/* If maintenance mode is active and user is not Admin, lock down general LMS operations */}
            {maintenanceMode && !isAdmin ? (
                <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-6 text-center">
                    <div className="max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mb-4">
                            <AlertTriangle className="h-7 w-7" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            System Maintenance in Progress
                        </h2>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {maintenanceBannerMessage ||
                                `${platformName || "CourseDesk"} is currently undergoing planned upgrades. Normal operations and submission access will resume shortly.`}
                        </p>
                        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                className="cursor-pointer inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
                            >
                                Check System Status
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-start">
                    <Sidebar
                        open={sidebarOpen}
                        mobileReady={mobileReady}
                        onExpand={() => setSidebarOpen(true)}
                        onClose={() => setSidebarOpen(false)}
                    />
                    <main className="min-w-0 flex-1">{children}</main>
                </div>
            )}
        </div>
    );
}