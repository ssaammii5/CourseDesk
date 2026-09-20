"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar, TopBar } from "@/components/layout";
import { useAuth } from "@/hooks";
import { LoginView } from "@/features/auth";

const DESKTOP_QUERY = "(min-width: 1024px)";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { status } = useAuth();
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
        if (pathname === "/") {
            return <LoginView />;
        }
        return null;
    }

    return (
        <div className="min-h-screen bg-[#eef1f4] text-gray-900">
            <TopBar onMenuClick={() => setSidebarOpen((v) => !v)} />
            <div className="flex items-start">
                <Sidebar
                    open={sidebarOpen}
                    mobileReady={mobileReady}
                    onExpand={() => setSidebarOpen(true)}
                    onClose={() => setSidebarOpen(false)}
                />
                <main className="min-w-0 flex-1">{children}</main>
            </div>
        </div>
    );
}