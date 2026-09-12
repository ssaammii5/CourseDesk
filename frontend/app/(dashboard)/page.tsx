"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import { AdminDashboardView } from "@/components/admin/AdminDashboardView";
import { ClassesSection } from "@/components/home/ClassesSection";
import { DueSoonCard } from "@/components/home/DueSoonCard";

export default function DashboardHomePage() {
    const { user } = useAuth();
    const isAdmin = user?.role === "Admin";

    if (isAdmin) {
        return <AdminDashboardView />;
    }

    return (
        <div className="mx-auto w-full max-w-[1080px] px-4 py-6 sm:px-8">
            <div className="flex flex-col gap-6">
                <DueSoonCard />
                <ClassesSection />
            </div>
        </div>
    );
}