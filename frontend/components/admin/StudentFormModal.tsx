"use client";
import { useState, useEffect } from "react";
import type { AdminUser, StudentDetails, StudentProgramType } from "@/lib/adminData";
import { academicSemesters } from "@/lib/adminData";
import { COUNTRIES } from "@/components/settings/constants";
import { Field, SelectField } from "@/components/settings/FormFields";
import { X } from "lucide-react";

const PROGRAM_TYPES: StudentProgramType[] = [
    "Undergraduate",
    "Postgraduate",
    "Post Graduate Diploma",
    "M.Phil",
    "PhD",
];

const SEMESTER_OPTIONS = academicSemesters
    .slice()
    .sort((a, b) => {
        const rankOf = (name: string) => {
            const [period, yearStr] = name.split("/");
            const year = Number(yearStr);
            if (!Number.isFinite(year)) return 0;
            const periodIndex = period === "July-December" ? 1 : 0;
            return year * 2 + periodIndex;
        };
        return rankOf(b.name) - rankOf(a.name);
    })
    .map((s) => s.name);

const EMPTY_DETAILS: StudentDetails = {
    fathersName: "",
    mothersName: "",
    dateOfBirth: "",
    mobile: "",
    nationality: "",
    studentId: "",
    regNo: "",
    department: "",
    currentProgram: "Undergraduate",
    session: "",
    semesterSession: "",
    address: { street: "", city: "", state: "", zip: "", country: "" },
};

interface StudentFormModalProps {
    open: boolean;
    user: AdminUser | null;
    onSave: (data: Omit<AdminUser, "id" | "createdAt">) => void;
    onClose: () => void;
}

export function StudentFormModal({ open, user, onSave, onClose }: StudentFormModalProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [details, setDetails] = useState<StudentDetails>(EMPTY_DETAILS);
    const [isActive, setIsActive] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            setName(user?.name ?? "");
            setEmail(user?.email ?? "");
            setIsActive(user?.isActive ?? true);
            setErrors({});
            if (user?.studentDetails) {
                setDetails(user.studentDetails);
            } else {
                setDetails(EMPTY_DETAILS);
            }
        }
    }, [open, user]);

    const clearError = (key: string) =>
        setErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });

    const setField = <K extends keyof StudentDetails>(key: K, value: StudentDetails[K]) => {
        setDetails((prev) => ({ ...prev, [key]: value }));
        clearError(key as string);
    };

    const setAddressField = <K extends keyof StudentDetails["address"]>(
        key: K,
        value: StudentDetails["address"][K]
    ) => {
        setDetails((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }));
        clearError(key as string);
    };

    const validate = () => {
        const next: Record<string, string> = {};
        if (!name.trim()) next.name = "Full name is required.";
        if (!email.trim()) next.email = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email.";
        if (!details.studentId.trim()) next.studentId = "Student ID is required.";
        if (!details.address.country) next.country = "Country is required.";
        if (!details.semesterSession) next.semesterSession = "Semester is required.";
        return next;
    };

    const handleSubmit = () => {
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        onSave({
            name: name.trim(),
            email: email.trim(),
            role: "Student",
            isActive,
            studentDetails: { ...details },
        });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {user ? "Edit Student" : "Add New Student"}
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
                    {/* Account */}
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

                    {/* Personal Information */}
                    <section>
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">Personal Information</h3>
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field label="Father's Name" value={details.fathersName} onChange={(v) => setField("fathersName", v)} />
                            <Field label="Mother's Name" value={details.mothersName} onChange={(v) => setField("mothersName", v)} />
                            <Field label="Date of Birth" type="date" value={details.dateOfBirth} onChange={(v) => setField("dateOfBirth", v)} />
                            <Field label="Mobile Number" type="tel" value={details.mobile} onChange={(v) => setField("mobile", v)} />
                            <Field label="Nationality" value={details.nationality} onChange={(v) => setField("nationality", v)} />
                        </div>
                    </section>

                    {/* Academic Details */}
                    <section>
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">Academic Details</h3>
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field
                                label="Student ID"
                                required
                                value={details.studentId}
                                onChange={(v) => setField("studentId", v)}
                                error={errors.studentId}
                            />
                            <Field label="Registration No" value={details.regNo} onChange={(v) => setField("regNo", v)} />
                            <Field label="Department" value={details.department} onChange={(v) => setField("department", v)} />
                            <SelectField
                                label="Current Program"
                                value={details.currentProgram}
                                onChange={(v) => setField("currentProgram", v as StudentProgramType)}
                                options={PROGRAM_TYPES}
                                placeholder="Select program type"
                            />
                            <Field label="Session" value={details.session} onChange={(v) => setField("session", v)} />
                            <SelectField
                                label="Semester"
                                required
                                value={details.semesterSession}
                                onChange={(v) => setField("semesterSession", v)}
                                options={SEMESTER_OPTIONS}
                                error={errors.semesterSession}
                                placeholder="Select semester"
                            />
                        </div>
                    </section>

                    {/* Location */}
                    <section>
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">Location</h3>
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field
                                label="Street Address"
                                value={details.address.street}
                                onChange={(v) => setAddressField("street", v)}
                                placeholder="House, Road, Area"
                            />
                            <Field label="City" value={details.address.city} onChange={(v) => setAddressField("city", v)} />
                            <Field label="State / Province" value={details.address.state} onChange={(v) => setAddressField("state", v)} />
                            <Field label="ZIP / Postal Code" value={details.address.zip} onChange={(v) => setAddressField("zip", v)} />
                            <SelectField
                                label="Country"
                                required
                                value={details.address.country}
                                onChange={(v) => setAddressField("country", v)}
                                options={COUNTRIES}
                                error={errors.country}
                                placeholder="Select your country"
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
                        {user ? "Save Changes" : "Create Student"}
                    </button>
                </div>
            </div>
        </div>
    );
}