"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Laptop, Moon, Sun } from "lucide-react";
import { useTheme, type ThemeMode } from "@/hooks/useTheme";

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
    { mode: "light", label: "Light", icon: Sun },
    { mode: "dark", label: "Dark", icon: Moon },
    { mode: "system", label: "System", icon: Laptop },
];

export function ThemeToggle() {
    const { theme, resolvedTheme, setTheme } = useTheme();
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent | TouchEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }

        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    const CurrentIcon = theme === "system" ? Laptop : resolvedTheme === "dark" ? Moon : Sun;

    return (
        <div ref={menuRef} className="relative">
            <button
                type="button"
                aria-label={`Current theme: ${theme}. Click to switch theme`}
                title={`Theme: ${theme === "system" ? `System (${resolvedTheme})` : theme}`}
                onClick={() => setOpen((v) => !v)}
                className={`relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 transition-all duration-150 ${
                    open
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white ring-1 ring-slate-200 dark:ring-slate-700"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
            >
                <CurrentIcon className="h-4.5 w-4.5 transition-transform duration-200" />
            </button>

            {open && (
                <div className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/90 dark:border-slate-800 ring-1 ring-black/5 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Theme
                    </div>
                    {THEME_OPTIONS.map(({ mode, label, icon: Icon }) => {
                        const isSelected = theme === mode;
                        return (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => {
                                    setTheme(mode);
                                    setOpen(false);
                                }}
                                className={`flex w-full items-center justify-between gap-2.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                    isSelected
                                        ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-semibold"
                                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    {label}
                                </span>
                                {isSelected && (
                                    <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
