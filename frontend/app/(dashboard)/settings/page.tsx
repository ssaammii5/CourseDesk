"use client";

import { SettingsView } from "@/components/settings/SettingsView";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function SettingsPage() {
    const { user } = useAuth();

    return <SettingsView userName={user?.name} role={user?.role} />;
}