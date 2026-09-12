"use client";
import { useState, useEffect, useMemo } from "react";
import type { AdminUser, StudentDetails, StudentProgramType } from "@/types";
import { academicSemesters as staticSemesters, TEACHER_DEPARTMENTS } from "@/lib/adminData";
import { COUNTRIES, PROGRAM_TYPES as STATIC_PROGRAM_TYPES } from "@/features/settings";
import { Field, SelectField } from "@/components/ui";
import {
    getProgramsRequest,
    getDepartmentsRequest,
    getSemestersRequest,
    type AcademicProgramDto,
    type AcademicDepartmentDto,
    type AcademicSemesterDto,
} from "@/lib/api/academics";
import { X } from "lucide-react";

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
    onSave: (data: Omit<AdminUser, "id" | "createdAt">) => void | Promise<void>;
    onClose: () => void;
}

export function StudentFormModal({ open, user, onSave, onClose }: StudentFormModalProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [details, setDetails] = useState<StudentDetails>(EMPTY_DETAILS);
    const [isActive, setIsActive] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const [academicPrograms, setAcademicPrograms] = useState<AcademicProgramDto[]>([]);
    const [academicDepartments, setAcademicDepartments] = useState<AcademicDepartmentDto[]>([]);
    const [academicSemesters, setAcademicSemesters] = useState<AcademicSemesterDto[]>([]);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        Promise.all([
            getProgramsRequest().catch(() => []),
            getDepartmentsRequest().catch(() => []),
            getSemestersRequest().catch(() => []),
        ]).then(([progs, depts, sems]) => {
            if (cancelled) return;
            setAcademicPrograms(progs);
            setAcademicDepartments(depts);
            setAcademicSemesters(sems);
        });
        return () => {
            cancelled = true;
        };
    }, [open]);

    // Compute dynamic dropdown options with static fallbacks
    const departmentOptions = useMemo(() => {
        const fromDb = academicDepartments.map((d) => d.name).filter(Boolean);
        const set = new Set([...fromDb, ...TEACHER_DEPARTMENTS]);
        if (details.department) set.add(details.department);
        return Array.from(set);
    }, [academicDepartments, details.department]);

    const programOptions = useMemo(() => {
        const fromDb = academicPrograms.map((p) => p.name).filter(Boolean);
        const set = new Set([...fromDb, ...STATIC_PROGRAM_TYPES]);
        if (details.currentProgram) set.add(details.currentProgram);
        return Array.from(set);
    }, [academicPrograms, details.currentProgram]);

    const semesterOptions = useMemo(() => {
        const fromDb = academicSemesters.map((s) => s.name).filter(Boolean);
        const fallback = staticSemesters.map((s) => s.name);
        const set = new Set([...fromDb, ...fallback]);
        if (details.semesterSession) set.add(details.semesterSession);
        return Array.from(set);
    }, [academicSemesters, details.semesterSession]);

    useEffect(() => {
        if (open) {
            setName(user?.name ?? "");
            setEmail(user?.email ?? "");
            setIsActive(user?.isActive ?? true);
            setErrors({});
            setSaveError(null);
            if (user?.studentDetails) {
                const addr = user.studentDetails.address;
                setDetails({
                    fathersName: user.studentDetails.fathersName ?? "",
                    mothersName: user.studentDetails.mothersName ?? "",
                    dateOfBirth: user.studentDetails.dateOfBirth ?? "",
                    mobile: user.studentDetails.mobile ?? "",
                    nationality: user.studentDetails.nationality ?? "",
                    studentId: user.studentDetails.studentId ?? "",
                    regNo: user.studentDetails.regNo ?? "",
                    department: user.studentDetails.department ?? "",
                    currentProgram: (user.studentDetails.currentProgram ?? "Undergraduate") as StudentProgramType,
                    session: user.studentDetails.session ?? "",
                    semesterSession: user.studentDetails.semesterSession ?? "",
                    address: {
                        street: addr?.street ?? "",
                        city: addr?.city ?? "",
                        state: addr?.state ?? "",
                        zip: addr?.zip ?? "",
                        country: addr?.country ?? "",
                    },
                });
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
        setDetails((prev) => ({ ...prev, address: { ...(prev.address ?? {}), [key]: value } }));
        clearError(key as string);
    };

    const validate = () => {
        const next: Record<string, string> = {};
        if (!name.trim()) next.name = "Full name is required.";
        if (!email.trim()) next.email = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email.";
        if (!details.studentId.trim()) next.studentId = "Student ID is required.";
        return next;
    };

    const handleSubmit = async () => {
        setSaveError(null);
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) {
            setSaveError("Please fill in all required fields (Name, Email, and Student ID).");
            return;
        }

        try {
            setIsSaving(true);
            await onSave({
                name: name.trim(),
                email: email.trim(),
                role: "Student",
                isActive,
                studentDetails: { ...details },
            });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to save student details.";
            setSaveError(msg);
        } finally {
            setIsSaving(false);
        }
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

                {/* Error Banner */}
                {saveError && (
                    <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {saveError}
                    </div>
                )}

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
                            <SelectField
                                label="Department"
                                value={details.department}
                                onChange={(v) => setField("department", v)}
                                options={departmentOptions}
                                placeholder="Select department"
                            />
                            <SelectField
                                label="Current Program"
                                value={details.currentProgram}
                                onChange={(v) => setField("currentProgram", v as StudentProgramType)}
                                options={programOptions}
                                placeholder="Select program type"
                            />
                            <Field label="Session" value={details.session} onChange={(v) => setField("session", v)} />
                            <SelectField
                                label="Semester"
                                value={details.semesterSession}
                                onChange={(v) => setField("semesterSession", v)}
                                options={semesterOptions}
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
                                value={details.address?.street ?? ""}
                                onChange={(v) => setAddressField("street", v)}
                                placeholder="House, Road, Area"
                            />
                            <Field label="City" value={details.address?.city ?? ""} onChange={(v) => setAddressField("city", v)} />
                            <Field label="State / Province" value={details.address?.state ?? ""} onChange={(v) => setAddressField("state", v)} />
                            <Field label="ZIP / Postal Code" value={details.address?.zip ?? ""} onChange={(v) => setAddressField("zip", v)} />
                            <SelectField
                                label="Country"
                                value={details.address?.country ?? ""}
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
                        disabled={isSaving}
                        className="cursor-pointer rounded-full border border-gray-400 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="cursor-pointer rounded-full bg-[#1a63d8] px-7 py-2.5 text-sm font-medium text-white hover:bg-[#1554b5] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? "Saving..." : user ? "Save Changes" : "Create Student"}
                    </button>
                </div>
            </div>
        </div>
    );
}