"use client";

import {
    Award,
    Calendar,
    ClipboardList,
    Layers,
    Users,
    type LucideIcon,
} from "lucide-react";

export type CourseTab = "stream" | "curriculum" | "coursework" | "classwork" | "people" | "grades";
export type ClassTab = CourseTab;

export const COURSE_TABS: { id: CourseTab; label: string; icon: LucideIcon }[] = [
    { id: "stream", label: "Stream", icon: Layers },
    { id: "curriculum", label: "Curriculum & Sessions", icon: Calendar },
    { id: "coursework", label: "Coursework", icon: ClipboardList },
    { id: "people", label: "People", icon: Users },
];
export const CLASS_TABS = COURSE_TABS;

interface CourseTabsProps {
    tab: CourseTab;
    onTabChange: (tab: CourseTab) => void;
    isInstructor?: boolean;
    isTeacher?: boolean;
}
export type ClassTabsProps = CourseTabsProps;

export function CourseTabs({ tab, onTabChange, isInstructor, isTeacher = false }: CourseTabsProps) {
    const showGrades = isInstructor ?? isTeacher;
    const activeTabKey = tab === "classwork" ? "coursework" : tab;
    const tabs: { id: CourseTab; label: string; icon: LucideIcon }[] = showGrades
        ? [...COURSE_TABS, { id: "grades", label: "Grades", icon: Award }]
        : [...COURSE_TABS];

    return (
        <div className="sticky top-16 z-30 border-b border-gray-200 bg-white">
            <nav className="no-scrollbar flex gap-2 overflow-x-auto px-4 sm:gap-6 sm:overflow-x-visible sm:px-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {tabs.map((t) => {
                    const Icon = t.icon;
                    const isActive = activeTabKey === t.id;
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

export const ClassTabs = CourseTabs;