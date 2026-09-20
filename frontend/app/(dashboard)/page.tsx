"use client";

import { useAuth } from "@/hooks";
import { AdminDashboardView } from "@/features/admin";
import { CoursesSection, DueSoonCard } from "@/features/home";

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
                <CoursesSection />
            </div>
        </div>
    );
}