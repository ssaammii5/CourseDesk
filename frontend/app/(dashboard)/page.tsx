"use client";

import { useAuth } from "@/hooks";
import { AdminDashboardView } from "@/features/admin";
import { HomeDashboardView } from "@/features/home";

export default function DashboardHomePage() {
    const { user } = useAuth();
    const isAdmin = user?.role === "Admin";

    if (isAdmin) {
        return <AdminDashboardView />;
    }

    return <HomeDashboardView />;
}