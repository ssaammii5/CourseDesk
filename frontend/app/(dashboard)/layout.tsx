"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Sidebar, TopBar } from "@/components/layout";
import { RequireAuth } from "@/context";

const DESKTOP_QUERY = "(min-width: 1024px)";

export default function DashboardLayout({ children }: { children: ReactNode }) {
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

    return (
        <RequireAuth>
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
        </RequireAuth>
    );
}