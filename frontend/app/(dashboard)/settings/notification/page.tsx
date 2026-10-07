"use client";

import { SettingsView } from "@/features/settings";
import { useAuth } from "@/hooks";

export default function SettingsNotificationPage() {
    const { user } = useAuth();
    return <SettingsView user={user} userName={user?.name} role={user?.role} initialTab="notifications" />;
}
