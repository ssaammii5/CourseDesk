"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";

export interface DropdownOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
    badge?: string;
    badgeColor?: string;
    description?: string;
    disabled?: boolean;
}

export type OptionType = string | DropdownOption;

export interface ModernDropdownProps {
    value: string;
    onChange: (value: string) => void;
    options: OptionType[];
    placeholder?: string;
    label?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    size?: "sm" | "md" | "lg";
    icon?: React.ReactNode;
    searchable?: boolean;
    clearable?: boolean;
    onClear?: () => void;
    className?: string;
    buttonClassName?: string;
    menuClassName?: string;
    align?: "left" | "right";
    showStatusDot?: boolean;
    id?: string;
}

function normalizeOption(option: OptionType): DropdownOption {
    if (typeof option === "string") {
        return { value: option, label: option };
    }
    return option;
}

// Helper to provide a subtle status dot for common status values
function getStatusDot(value: string, label: string) {
    const val = (value || label || "").toLowerCase();
    if (["active", "published", "graded", "completed", "approved"].includes(val)) {
        return <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0 shadow-xs shadow-emerald-500/30" />;
    }
    if (["inactive", "draft", "rejected", "archived"].includes(val)) {
        return <span className="inline-block h-2 w-2 rounded-full bg-gray-400 dark:bg-slate-500 shrink-0" />;
    }
    if (["pending", "submitted", "in_review", "in_progress"].includes(val)) {
        return <span className="inline-block h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400 shrink-0 shadow-xs shadow-amber-500/30" />;
    }
    return null;
}

export function ModernDropdown({
    value,
    onChange,
    options,
    placeholder = "Select an option",
    label,
    required = false,
    disabled = false,
    error,
    size = "md",
    icon,
    searchable,
    clearable = false,
    onClear,
    className = "",
    buttonClassName = "",
    menuClassName = "",
    align = "left",
    showStatusDot = false,
    id,
}: ModernDropdownProps) {
    const autoId = useId();
    const dropdownId = id || autoId;
    const [isOpen, setIsOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const updatePlacement = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            if (spaceBelow < 280 && spaceAbove > spaceBelow) {
                setOpenUpward(true);
            } else {
                setOpenUpward(false);
            }
        }
    };

    const normalizedOptions = options.map(normalizeOption);
    const selectedOption = normalizedOptions.find((opt) => opt.value === value);

    // Auto-enable search if there are more than 7 options unless explicitly specified false
    const isSearchable = searchable !== undefined ? searchable : normalizedOptions.length > 7;

    const filteredOptions = normalizedOptions.filter((opt) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            opt.label.toLowerCase().includes(q) ||
            opt.value.toLowerCase().includes(q) ||
            (opt.description && opt.description.toLowerCase().includes(q))
        );
    });

    // Handle outside clicks
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearchQuery("");
                setHighlightedIndex(-1);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsOpen(false);
                setSearchQuery("");
                setHighlightedIndex(-1);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    // Focus search input when opened
    useEffect(() => {
        if (isOpen && isSearchable) {
            // Small timeout to allow popover animation / render
            const timer = setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isOpen, isSearchable]);

    const handleToggle = () => {
        if (disabled) return;
        if (!isOpen) {
            updatePlacement();
            setSearchQuery("");
            const idx = filteredOptions.findIndex((opt) => opt.value === value);
            setHighlightedIndex(idx >= 0 ? idx : 0);
        }
        setIsOpen((prev) => !prev);
    };

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
        setSearchQuery("");
        setHighlightedIndex(-1);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClear) {
            onClear();
        } else {
            onChange("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        if (!isOpen) {
            if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsOpen(true);
                const idx = filteredOptions.findIndex((opt) => opt.value === value);
                setHighlightedIndex(idx >= 0 ? idx : 0);
            }
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
                const opt = filteredOptions[highlightedIndex];
                if (!opt.disabled) {
                    handleSelect(opt.value);
                }
            }
        }
    };

    // Scroll highlighted item into view
    useEffect(() => {
        if (isOpen && listRef.current && highlightedIndex >= 0) {
            const items = listRef.current.querySelectorAll('[role="option"]');
            const target = items[highlightedIndex] as HTMLElement;
            if (target) {
                target.scrollIntoView({ block: "nearest" });
            }
        }
    }, [highlightedIndex, isOpen]);

    // Size variants
    const sizeClasses = {
        sm: "py-2 px-3 text-xs sm:text-[13px] rounded-lg min-h-[36px]",
        md: "py-2.5 px-3.5 text-sm rounded-xl min-h-[42px]",
        lg: "py-3 px-4 text-base rounded-xl min-h-[48px]",
    }[size];

    const currentStatusDot = showStatusDot && selectedOption ? (selectedOption.icon || getStatusDot(selectedOption.value, selectedOption.label)) : null;

    return (
        <div className={`relative ${className}`} ref={containerRef} id={`dropdown-container-${dropdownId}`}>
            {label && (
                <label htmlFor={dropdownId} className="mb-1.5 block text-xs sm:text-sm font-medium text-gray-800 dark:text-slate-200">
                    {label}
                    {required && !disabled && <span className="ml-1 text-[#c5221f] dark:text-red-400">*</span>}
                </label>
            )}

            <button
                type="button"
                id={dropdownId}
                disabled={disabled}
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-disabled={disabled}
                className={`group w-full flex items-center justify-between gap-2.5 text-left transition-all duration-200 border outline-none ${sizeClasses} ${
                    disabled
                        ? "cursor-not-allowed border-gray-200 bg-gray-100/80 text-gray-400 dark:border-slate-800/80 dark:bg-slate-900/40 dark:text-slate-600"
                        : error
                        ? "border-[#c5221f] bg-white text-gray-900 focus:ring-2 focus:ring-red-500/20 dark:border-red-500 dark:bg-slate-900 dark:text-slate-100"
                        : isOpen
                        ? "border-blue-600 dark:border-blue-500 bg-white dark:bg-slate-900 ring-2 ring-blue-500/20 shadow-xs dark:text-slate-100"
                        : "border-gray-300/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 hover:border-gray-400 dark:hover:border-slate-600 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 shadow-2xs"
                } ${buttonClassName}`}
            >
                <div className="flex items-center gap-2 min-w-0 truncate">
                    {icon && <span className="shrink-0 text-gray-500 dark:text-slate-400">{icon}</span>}
                    {currentStatusDot}
                    <span
                        className={`truncate ${
                            selectedOption
                                ? "text-gray-900 dark:text-slate-100 font-medium"
                                : "text-gray-400 dark:text-slate-500"
                        }`}
                    >
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    {selectedOption?.badge && (
                        <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
                                selectedOption.badgeColor || "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300"
                            }`}
                        >
                            {selectedOption.badge}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pl-1">
                    {clearable && selectedOption && !disabled && (
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={handleClear}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.stopPropagation();
                                    handleClear(e as unknown as React.MouseEvent);
                                }
                            }}
                            className="p-0.5 rounded-full text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                            title="Clear selection"
                        >
                            <X className="h-3.5 w-3.5" />
                        </span>
                    )}
                    <ChevronDown
                        className={`h-4 w-4 text-gray-400 dark:text-slate-400 transition-transform duration-200 ease-out ${
                            isOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : "group-hover:text-gray-600 dark:group-hover:text-slate-300"
                        }`}
                    />
                </div>
            </button>

            {/* Dropdown Menu Popover */}
            {isOpen && (
                <div
                    className={`absolute z-50 ${
                        openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
                    } min-w-[200px] w-full rounded-xl border border-gray-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-1.5 shadow-xl shadow-slate-900/10 dark:shadow-black/70 backdrop-blur-md transition-all duration-150 ease-out ${
                        align === "right" ? "right-0" : "left-0"
                    } ${menuClassName}`}
                >
                    {/* Search box if enabled */}
                    {isSearchable && (
                        <div className="p-1.5 pb-2 mb-1 border-b border-gray-100 dark:border-slate-800/80">
                            <div className="relative flex items-center">
                                <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-gray-400 dark:text-slate-500" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setHighlightedIndex(0);
                                    }}
                                    placeholder="Search..."
                                    className="w-full rounded-lg bg-gray-50/80 dark:bg-slate-800/80 border border-gray-200/70 dark:border-slate-700/70 py-1.5 pl-8 pr-7 text-xs text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSearchQuery("");
                                            searchInputRef.current?.focus();
                                        }}
                                        className="absolute right-2 p-0.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Options list */}
                    <div
                        ref={listRef}
                        role="listbox"
                        aria-activedescendant={
                            highlightedIndex >= 0 && filteredOptions[highlightedIndex]
                                ? `${dropdownId}-opt-${highlightedIndex}`
                                : undefined
                        }
                        className="max-h-60 overflow-y-auto custom-scrollbar space-y-0.5 p-0.5"
                    >
                        {filteredOptions.length === 0 ? (
                            <div className="py-6 px-3 text-center text-xs text-gray-400 dark:text-slate-500">
                                No matching options
                            </div>
                        ) : (
                            filteredOptions.map((opt, idx) => {
                                const isSelected = opt.value === value;
                                const isHighlighted = idx === highlightedIndex;
                                const optionDot = showStatusDot ? (opt.icon || getStatusDot(opt.value, opt.label)) : opt.icon;

                                return (
                                    <button
                                        key={opt.value}
                                        id={`${dropdownId}-opt-${idx}`}
                                        type="button"
                                        role="option"
                                        aria-selected={isSelected}
                                        disabled={opt.disabled}
                                        onMouseEnter={() => setHighlightedIndex(idx)}
                                        onClick={() => handleSelect(opt.value)}
                                        className={`w-full group flex items-center justify-between gap-2.5 px-3 py-2 text-xs sm:text-sm rounded-lg text-left transition-all duration-150 cursor-pointer ${
                                            opt.disabled
                                                ? "cursor-not-allowed opacity-40 text-gray-400 dark:text-slate-600"
                                                : isSelected
                                                ? "bg-blue-50/90 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-medium"
                                                : isHighlighted
                                                ? "bg-gray-100/90 dark:bg-slate-800/80 text-gray-900 dark:text-white"
                                                : "text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0 truncate">
                                            {optionDot}
                                            <span className="truncate">{opt.label}</span>
                                            {opt.description && (
                                                <span className="text-[11px] text-gray-400 dark:text-slate-500 truncate">
                                                    {opt.description}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {opt.badge && (
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                        opt.badgeColor || "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300"
                                                    }`}
                                                >
                                                    {opt.badge}
                                                </span>
                                            )}
                                            {isSelected && (
                                                <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {error && !disabled && (
                <span className="mt-1.5 block text-xs sm:text-sm text-[#c5221f] dark:text-red-400">{error}</span>
            )}
        </div>
    );
}

export const ModernSelect = ModernDropdown;
