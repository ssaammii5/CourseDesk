"use client";

export const CLASS_TABS = [
    { id: "stream", label: "Stream" },
    { id: "classwork", label: "Coursework" },
    { id: "people", label: "People" },
] as const;

export type ClassTab = "stream" | "classwork" | "people" | "grades";

interface ClassTabsProps {
    tab: ClassTab;
    onTabChange: (tab: ClassTab) => void;
    isTeacher?: boolean;
}

export function ClassTabs({ tab, onTabChange, isTeacher = false }: ClassTabsProps) {
    const tabs: { id: ClassTab; label: string }[] = isTeacher
        ? [...CLASS_TABS, { id: "grades", label: "Grades" }]
        : [...CLASS_TABS];
    return (
        <div className="sticky top-16 z-30 border-b border-gray-200 bg-white">
            <nav className="flex gap-8 px-4 sm:gap-12 sm:px-8">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => onTabChange(t.id)}
                        className={`relative cursor-pointer py-4 text-sm font-medium transition-colors ${tab === t.id ? "text-[#1a73e8]" : "text-gray-600 hover:text-gray-900"
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
    );
}