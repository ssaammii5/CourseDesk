"use client";

import { useAuth } from "@/hooks";
import { AdminDashboardView } from "@/features/admin";
import { HomeDashboardView } from "@/features/home";

export default function DashboardHomePage() {
    const { user } = useAuth();
    const isStaff =
        user?.role === "Admin" ||
        user?.role === "Coordinator" ||
        (user?.role as string) === "Co-ordinator";

    if (isStaff) {
        return <AdminDashboardView />;
    }

    return <HomeDashboardView />;
}