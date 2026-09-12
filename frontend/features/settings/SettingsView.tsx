"use client";

import { useState } from "react";
import { currentUser, type CurrentUser } from "@/types";
import { SETTINGS_TABS, type SettingsTab } from "./constants";
import { ProfileCard } from "./ProfileCard";
import { SecurityCard } from "./SecurityCard";
import { NotificationsCard } from "./NotificationsCard";

export function SettingsView({
    user,
    userName = user?.name ?? currentUser.name,
    role = user?.role ?? currentUser.role,
}: {
    user?: CurrentUser | null;
    userName?: string;
    role?: CurrentUser["role"];
}) {
    const [tab, setTab] = useState<SettingsTab>("profile");
    const isProfileReadOnly = role !== "Admin";

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-white">
            <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-8">
                <h1 className="text-3xl text-gray-900">Account Settings</h1>
                <p className="mt-1 text-sm text-gray-700">In this section you can see all the information</p>

                <div className="mt-6 border-b border-gray-200">
                    <nav className="flex gap-8 sm:gap-12">
                        {SETTINGS_TABS.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setTab(t.id)}
                                className={`relative cursor-pointer py-3.5 text-sm font-medium transition-colors ${tab === t.id ? "text-[#1a73e8]" : "text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                {t.label}
                                {tab === t.id && (
                                    <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-t-full bg-[#1a73e8]" />
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-8">
                    {tab === "profile" && <ProfileCard user={user} userName={userName} readOnly={isProfileReadOnly} />}
                    {tab === "security" && <SecurityCard />}
                    {tab === "notifications" && <NotificationsCard />}
                </div>
            </div>
        </div>
    );
}