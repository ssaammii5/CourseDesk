"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface FieldProps {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
}

export function Field({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    required = false,
    disabled = false,
    error,
}: FieldProps) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm text-gray-800">
                {label}
                {required && !disabled && <span className="ml-0.5 text-[#c5221f]">*</span>}
            </span>
            <input
                type={type}
                value={value}
                placeholder={placeholder}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full rounded-md border px-3.5 py-2.5 text-[15px] focus:outline-none ${disabled
                        ? "cursor-not-allowed border-gray-300 bg-gray-100 text-gray-700"
                        : error
                            ? "border-[#c5221f] bg-white text-gray-900 placeholder:text-gray-600 focus:border-[#c5221f] focus:ring-1 focus:ring-[#c5221f]"
                            : "border-gray-400/80 bg-white text-gray-900 placeholder:text-gray-600 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                    }`}
            />
            {error && !disabled && <span className="mt-1 block text-sm text-[#c5221f]">{error}</span>}
        </label>
    );
}

export function SelectField({
    label,
    value,
    onChange,
    options,
    required = false,
    disabled = false,
    error,
    placeholder = "Select an option",
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: string[];
    required?: boolean;
    disabled?: boolean;
    error?: string;
    placeholder?: string;
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm text-gray-800">
                {label}
                {required && !disabled && <span className="ml-0.5 text-[#c5221f]">*</span>}
            </span>
            <span className="relative block">
                <select
                    value={value}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full appearance-none rounded-md border px-3.5 py-2.5 pr-10 text-[15px] focus:outline-none ${disabled
                            ? "cursor-not-allowed border-gray-300 bg-gray-100 text-gray-700"
                            : `${error
                                ? "border-[#c5221f] focus:border-[#c5221f] focus:ring-1 focus:ring-[#c5221f]"
                                : "border-gray-400/80 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                            } bg-white ${value ? "text-gray-900" : "text-gray-600"}`
                        }`}
                >
                    <option value="" disabled>
                        {placeholder}
                    </option>
                    {options.map((o) => (
                        <option key={o} value={o}>
                            {o}
                        </option>
                    ))}
                </select>
                <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 ${disabled ? "text-gray-500" : "text-gray-700"}`}
                >
                    <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                    />
                </svg>
            </span>
            {error && !disabled && <span className="mt-1 block text-sm text-[#c5221f]">{error}</span>}
        </label>
    );
}

export function PasswordField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
}) {
    const [show, setShow] = useState(false);

    return (
        <label className="block">
            <span className="mb-1.5 block text-sm text-gray-800">{label}</span>
            <span className="relative block">
                <input
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full rounded-md border border-gray-400/80 bg-white px-3.5 py-2.5 pr-11 text-[15px] text-gray-900 focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                />
                <button
                    type="button"
                    aria-label={show ? "Hide password" : "Show password"}
                    onClick={() => setShow((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1.5 text-gray-600 hover:bg-gray-900/5"
                >
                    {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
            </span>
        </label>
    );
}

export function ToggleRow({
    label,
    enabled,
    onChange,
}: {
    label: string;
    enabled: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between border-b border-gray-100 py-5 last:border-b-0">
            <span className="text-sm text-gray-900">{label}</span>
            <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label={label}
                onClick={() => onChange(!enabled)}
                className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors ${enabled ? "bg-[#1a73e8]" : "bg-gray-300"
                    }`}
            >
                <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${enabled ? "left-6" : "left-1"
                        }`}
                />
            </button>
        </div>
    );
}
