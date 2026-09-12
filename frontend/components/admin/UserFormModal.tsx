"use client";

import { useState, useEffect } from "react";
import type { AdminUser } from "@/lib/adminData";
import { X } from "lucide-react";

interface UserFormModalProps {
    open: boolean;
    user: AdminUser | null;
    defaultRole?: "Admin" | "Teacher" | "Student";
    onSave: (data: Omit<AdminUser, "id" | "createdAt">) => void;
    onClose: () => void;
}

export function UserFormModal({ open, user, defaultRole = "Student", onSave, onClose }: UserFormModalProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"Admin" | "Teacher" | "Student">(defaultRole);
    const [isActive, setIsActive] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            setName(user?.name ?? "");
            setEmail(user?.email ?? "");
            setRole(user?.role ?? defaultRole);
            setIsActive(user?.isActive ?? true);
            setErrors({});
        }
    }, [open, user, defaultRole]);

    const validate = () => {
        const next: Record<string, string> = {};
        if (!name.trim()) next.name = "Name is required.";
        if (!email.trim()) next.email = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email.";
        return next;
    };

    const handleSubmit = () => {
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;
        onSave({ name: name.trim(), email: email.trim(), role, isActive });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {user ? "Edit User" : `Add New ${defaultRole}`}
                    </h2>
                    <button type="button" onClick={onClose} className="cursor-pointer rounded-full p-2 text-gray-600 hover:bg-gray-100">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mt-6 space-y-5">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-800">Full Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
                            className={`w-full rounded-md border px-3.5 py-2.5 text-[15px] focus:outline-none ${errors.name ? "border-[#c5221f] focus:ring-1 focus:ring-[#c5221f]" : "border-gray-400/80 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"}`}
                            placeholder="Enter full name"
                        />
                        {errors.name && <span className="mt-1 block text-sm text-[#c5221f]">{errors.name}</span>}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-800">Email *</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); }}
                            className={`w-full rounded-md border px-3.5 py-2.5 text-[15px] focus:outline-none ${errors.email ? "border-[#c5221f] focus:ring-1 focus:ring-[#c5221f]" : "border-gray-400/80 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"}`}
                            placeholder="Enter email address"
                        />
                        {errors.email && <span className="mt-1 block text-sm text-[#c5221f]">{errors.email}</span>}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-800">Role *</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as typeof role)}
                            className="w-full appearance-none rounded-md border border-gray-400/80 bg-white px-3.5 py-2.5 text-[15px] text-gray-900 focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                        >
                            <option value="Student">Student</option>
                            <option value="Teacher">Teacher</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-3">
                        <span className="text-sm text-gray-800">Active Account</span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={isActive}
                            onClick={() => setIsActive((v) => !v)}
                            className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors ${isActive ? "bg-[#1a73e8]" : "bg-gray-300"}`}
                        >
                            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${isActive ? "left-6" : "left-1"}`} />
                        </button>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-full border border-gray-400 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="cursor-pointer rounded-full bg-[#1a63d8] px-7 py-2.5 text-sm font-medium text-white hover:bg-[#1554b5]"
                    >
                        {user ? "Save Changes" : `Create ${defaultRole}`}
                    </button>
                </div>
            </div>
        </div>
    );
}