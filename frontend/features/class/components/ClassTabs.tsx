"use client";

import {
    Award,
    Calendar,
    ClipboardList,
    Layers,
    Users,
    type LucideIcon,
} from "lucide-react";

export const CLASS_TABS: { id: ClassTab; label: string; icon: LucideIcon }[] = [
    { id: "stream", label: "Stream", icon: Layers },
    { id: "curriculum", label: "Curriculum & Sessions", icon: Calendar },
    { id: "classwork", label: "Coursework", icon: ClipboardList },
    { id: "people", label: "People", icon: Users },
];

export type ClassTab = "stream" | "curriculum" | "classwork" | "people" | "grades";

interface ClassTabsProps {
    tab: ClassTab;
    onTabChange: (tab: ClassTab) => void;
    isTeacher?: boolean;
}

export function ClassTabs({ tab, onTabChange, isTeacher = false }: ClassTabsProps) {
    const tabs: { id: ClassTab; label: string; icon: LucideIcon }[] = isTeacher
        ? [...CLASS_TABS, { id: "grades", label: "Grades", icon: Award }]
        : [...CLASS_TABS];

    return (
        <div className="sticky top-16 z-30 border-b border-gray-200 bg-white">
            <nav className="no-scrollbar flex gap-2 overflow-x-auto px-4 sm:gap-6 sm:overflow-x-visible sm:px-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {tabs.map((t) => {
                    const Icon = t.icon;
                    const isActive = tab === t.id;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => onTabChange(t.id)}
                            className={`relative inline-flex cursor-pointer items-center gap-2 whitespace-nowrap py-3.5 sm:py-4 text-sm font-medium transition-colors ${isActive
                                ? "text-[#1a73e8]"
                                : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            <Icon className={`h-4 w-4 ${isActive ? "text-[#1a73e8]" : "text-gray-400"}`} />
                            <span>{t.label}</span>
                            {isActive && (
                                <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-t-full bg-[#1a73e8]" />
                            )}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}