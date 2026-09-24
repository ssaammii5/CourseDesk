"use client";

import { useState, useEffect } from "react";
import type { AdminUser, InstructorDetails } from "@/types";
import { INSTRUCTOR_DEPARTMENTS } from "@/lib/adminData";
import { Field, SelectField } from "@/components/ui";
import { X } from "lucide-react";

const DESIGNATION_TYPES: string[] = [
    "Lead Instructor",
    "Senior Instructor",
    "Staff Engineer",
    "Principal Designer",
    "Course Creator",
    "Industry Mentor",
    "Workshop Lead",
    "Lecturer",
    "Professor",
];

const DEPARTMENT_OPTIONS: string[] = [...INSTRUCTOR_DEPARTMENTS];

const EMPTY_DETAILS: InstructorDetails = {
    instructorId: "",
    teacherId: "",
    designation: "Lead Instructor",
    department: "",
};

export interface InstructorFormModalProps {
    open: boolean;
    user: AdminUser | null;
    onSave: (data: Omit<AdminUser, "id" | "createdAt">) => void;
    onClose: () => void;
}

export function InstructorFormModal({ open, user, onSave, onClose }: InstructorFormModalProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [details, setDetails] = useState<InstructorDetails>(EMPTY_DETAILS);
    const [isActive, setIsActive] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            setName(user?.name ?? "");
            setEmail(user?.email ?? "");
            setIsActive(user?.isActive ?? true);
            setErrors({});
            const userDetails = user?.instructorDetails ?? user?.teacherDetails ?? EMPTY_DETAILS;
            setDetails({
                ...userDetails,
                instructorId: userDetails.instructorId || userDetails.teacherId || "",
                teacherId: userDetails.instructorId || userDetails.teacherId || "",
            });
        }
    }, [open, user]);

    const clearError = (key: string) =>
        setErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });

    const setField = <K extends keyof InstructorDetails>(key: K, value: InstructorDetails[K]) => {
        setDetails((prev) => ({
            ...prev,
            [key]: value,
            ...(key === "instructorId" ? { teacherId: value as string } : {}),
            ...(key === "teacherId" ? { instructorId: value as string } : {}),
        }));
        clearError(key as string);
    };

    const validate = () => {
        const next: Record<string, string> = {};
        if (!name.trim()) next.name = "Full name is required.";
        if (!email.trim()) next.email = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email.";
        const insId = details.instructorId || details.teacherId;
        if (!insId?.trim()) next.instructorId = "Instructor ID is required.";
        if (!details.department) next.department = "Domain / Category is required.";
        return next;
    };

    const handleSubmit = () => {
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        const cleanId = (details.instructorId || details.teacherId || "").trim();
        const mergedDetails: InstructorDetails = {
            ...details,
            instructorId: cleanId,
            teacherId: cleanId,
        };

        onSave({
            name: name.trim(),
            email: email.trim(),
            role: "Instructor",
            isActive,
            instructorDetails: mergedDetails,
            teacherDetails: mergedDetails,
        });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl dark:border dark:border-slate-800 dark:bg-slate-900">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-slate-800">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                        {user ? "Edit Instructor" : "Add New Instructor"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-full p-2 text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-6">
                    {/* Account Section */}
                    <section>
                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-slate-100">Account</h3>
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field
                                label="Full Name"
                                required
                                value={name}
                                onChange={(v) => { setName(v); clearError("name"); }}
                                placeholder="e.g., Sarah Jenkins"
                                error={errors.name}
                            />
                            <Field
                                label="Email"
                                required
                                type="email"
                                value={email}
                                onChange={(v) => { setEmail(v); clearError("email"); }}
                                placeholder="instructor@coursedesk.com"
                                error={errors.email}
                            />
                        </div>
                        <div className="mt-4 flex items-center justify-between rounded-md border border-gray-200 px-4 py-3 dark:border-slate-800">
                            <span className="text-sm text-gray-800 dark:text-slate-200">Active Account</span>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={isActive}
                                onClick={() => setIsActive((v) => !v)}
                                className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors ${isActive ? "bg-[#1a73e8]" : "bg-gray-300 dark:bg-slate-700"}`}
                            >
                                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${isActive ? "left-6" : "left-1"}`} />
                            </button>
                        </div>
                    </section>

                    {/* Professional Details Section */}
                    <section>
                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-slate-100">Professional Details</h3>
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field
                                label="Instructor ID"
                                required
                                value={details.instructorId ?? details.teacherId ?? ""}
                                onChange={(v) => setField("instructorId", v)}
                                placeholder="e.g., INS-101"
                                error={errors.instructorId}
                            />
                            <SelectField
                                label="Title / Role"
                                value={details.designation ?? "Lead Instructor"}
                                onChange={(v) => setField("designation", v as any)}
                                options={DESIGNATION_TYPES}
                                placeholder="Select title"
                            />
                            <SelectField
                                label="Primary Domain / Category"
                                required
                                value={details.department ?? ""}
                                onChange={(v) => setField("department", v)}
                                options={DEPARTMENT_OPTIONS}
                                error={errors.department}
                                placeholder="Select domain or category"
                            />
                            <Field
                                label="Organization / Institution"
                                value={details.organization ?? ""}
                                onChange={(v) => setField("organization", v)}
                                placeholder="e.g., Google, Stripe, Independent"
                            />
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-full border border-gray-400 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="cursor-pointer rounded-full bg-[#1a63d8] px-7 py-2.5 text-sm font-medium text-white hover:bg-[#1554b5] dark:bg-blue-600 dark:hover:bg-blue-500"
                    >
                        {user ? "Save Changes" : "Create Instructor"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export const TeacherFormModal = InstructorFormModal;
