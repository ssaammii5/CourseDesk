"use client";

import { useState, useEffect } from "react";
import type { AdminUser, TeacherDetails, TeacherDesignation } from "@/types";
import { TEACHER_DEPARTMENTS } from "@/lib/adminData";
import { Field, SelectField } from "@/components/ui";
import { X } from "lucide-react";

const DESIGNATION_TYPES: TeacherDesignation[] = [
    "Professor",
    "Associate Professor",
    "Assistant Professor",
    "Senior Lecturer",
    "Lecturer",
];

const DEPARTMENT_OPTIONS: string[] = [...TEACHER_DEPARTMENTS];

const EMPTY_DETAILS: TeacherDetails = {
    teacherId: "",
    designation: "Assistant Professor",
    department: "",
};

interface TeacherFormModalProps {
    open: boolean;
    user: AdminUser | null;
    onSave: (data: Omit<AdminUser, "id" | "createdAt">) => void;
    onClose: () => void;
}

export function TeacherFormModal({ open, user, onSave, onClose }: TeacherFormModalProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [details, setDetails] = useState<TeacherDetails>(EMPTY_DETAILS);
    const [isActive, setIsActive] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            setName(user?.name ?? "");
            setEmail(user?.email ?? "");
            setIsActive(user?.isActive ?? true);
            setErrors({});
            setDetails(user?.teacherDetails ?? EMPTY_DETAILS);
        }
    }, [open, user]);

    const clearError = (key: string) =>
        setErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });

    const setField = <K extends keyof TeacherDetails>(key: K, value: TeacherDetails[K]) => {
        setDetails((prev) => ({ ...prev, [key]: value }));
        clearError(key as string);
    };

    const validate = () => {
        const next: Record<string, string> = {};
        if (!name.trim()) next.name = "Full name is required.";
        if (!email.trim()) next.email = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email.";
        if (!details.teacherId.trim()) next.teacherId = "Teacher ID is required.";
        if (!details.department) next.department = "Department is required.";
        if (!details.designation) next.designation = "Designation is required.";
        return next;
    };

    const handleSubmit = () => {
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        onSave({
            name: name.trim(),
            email: email.trim(),
            role: "Teacher",
            isActive,
            teacherDetails: { ...details },
        });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {user ? "Edit Teacher" : "Add New Teacher"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-full p-2 text-gray-600 hover:bg-gray-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-6">
                    {/* Account Section */}
                    <section>
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">Account</h3>
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field
                                label="Full Name"
                                required
                                value={name}
                                onChange={(v) => { setName(v); clearError("name"); }}
                                placeholder="Enter full name"
                                error={errors.name}
                            />
                            <Field
                                label="Email"
                                required
                                type="email"
                                value={email}
                                onChange={(v) => { setEmail(v); clearError("email"); }}
                                placeholder="Enter email address"
                                error={errors.email}
                            />
                        </div>
                        <div className="mt-4 flex items-center justify-between rounded-md border border-gray-200 px-4 py-3">
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
                    </section>

                    {/* Professional Details Section */}
                    <section>
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">Professional Details</h3>
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field
                                label="Teacher ID"
                                required
                                value={details.teacherId}
                                onChange={(v) => setField("teacherId", v)}
                                placeholder="e.g., FAC-2001"
                                error={errors.teacherId}
                            />
                            <SelectField
                                label="Department"
                                required
                                value={details.department}
                                onChange={(v) => setField("department", v)}
                                options={DEPARTMENT_OPTIONS}
                                error={errors.department}
                                placeholder="Select department"
                            />
                            <SelectField
                                label="Designation"
                                required
                                value={details.designation}
                                onChange={(v) => setField("designation", v as TeacherDesignation)}
                                options={DESIGNATION_TYPES}
                                error={errors.designation}
                                placeholder="Select designation"
                            />
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
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
                        {user ? "Save Changes" : "Create Teacher"}
                    </button>
                </div>
            </div>
        </div>
    );
}