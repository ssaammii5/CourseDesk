"use client";
import { useState, useEffect, useMemo } from "react";
import type { AdminUser, LearnerDetails, LearnerProgramType } from "@/types";
import { academicSemesters as staticSemesters, INSTRUCTOR_DEPARTMENTS } from "@/lib/adminData";
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

const EMPTY_DETAILS: LearnerDetails = {
    fathersName: "",
    mothersName: "",
    dateOfBirth: "",
    mobile: "",
    nationality: "",
    learnerId: "",
    studentId: "",
    regNo: "",
    department: "",
    currentProgram: "Undergraduate",
    session: "",
    semesterSession: "",
    address: { street: "", city: "", state: "", zip: "", country: "" },
};

export interface LearnerFormModalProps {
    open: boolean;
    user: AdminUser | null;
    onSave: (data: Omit<AdminUser, "id" | "createdAt">) => void | Promise<void>;
    onClose: () => void;
}

export function LearnerFormModal({ open, user, onSave, onClose }: LearnerFormModalProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [details, setDetails] = useState<LearnerDetails>(EMPTY_DETAILS);
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
        const set = new Set([...fromDb, ...INSTRUCTOR_DEPARTMENTS]);
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
            const userDetails = user?.learnerDetails ?? user?.studentDetails;
            if (userDetails) {
                const addr = userDetails.address;
                const idVal = userDetails.learnerId || userDetails.studentId || "";
                setDetails({
                    fathersName: userDetails.fathersName ?? "",
                    mothersName: userDetails.mothersName ?? "",
                    dateOfBirth: userDetails.dateOfBirth ?? "",
                    mobile: userDetails.mobile ?? "",
                    nationality: userDetails.nationality ?? "",
                    learnerId: idVal,
                    studentId: idVal,
                    regNo: userDetails.regNo ?? "",
                    department: userDetails.department ?? "",
                    currentProgram: (userDetails.currentProgram ?? "Undergraduate") as LearnerProgramType,
                    session: userDetails.session ?? "",
                    semesterSession: userDetails.semesterSession ?? "",
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

    const setField = <K extends keyof LearnerDetails>(key: K, value: LearnerDetails[K]) => {
        setDetails((prev) => ({
            ...prev,
            [key]: value,
            ...(key === "learnerId" ? { studentId: value as string } : {}),
            ...(key === "studentId" ? { learnerId: value as string } : {}),
        }));
        clearError(key as string);
    };

    const setAddressField = (key: "street" | "city" | "state" | "zip" | "country", value?: string) => {
        setDetails((prev) => ({ ...prev, address: { ...(prev.address ?? {}), [key]: value ?? "" } }));
        clearError(key);
    };

    const validate = () => {
        const next: Record<string, string> = {};
        if (!name.trim()) next.name = "Full name is required.";
        if (!email.trim()) next.email = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email.";
        const lid = details.learnerId || details.studentId;
        if (!lid?.trim()) next.learnerId = "Learner ID is required.";
        return next;
    };

    const handleSubmit = async () => {
        setSaveError(null);
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) {
            setSaveError("Please fill in all required fields (Name, Email, and Learner ID).");
            return;
        }

        try {
            setIsSaving(true);
            const cleanId = (details.learnerId || details.studentId || "").trim();
            const mergedDetails: LearnerDetails = {
                ...details,
                learnerId: cleanId,
                studentId: cleanId,
            };
            await onSave({
                name: name.trim(),
                email: email.trim(),
                role: "Learner",
                isActive,
                learnerDetails: mergedDetails,
                studentDetails: mergedDetails,
            });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to save learner details.";
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
                        {user ? "Edit Learner" : "Add New Learner"}
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

                    {/* Learner Profile */}
                    <section>
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">Learner Profile</h3>
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field
                                label="Learner ID"
                                required
                                value={details.learnerId ?? details.studentId ?? ""}
                                onChange={(v) => setField("learnerId", v)}
                                placeholder="e.g., LRN-2001"
                                error={errors.learnerId}
                            />
                            <Field
                                label="Organization / Company"
                                value={details.organization ?? ""}
                                onChange={(v) => setField("organization", v)}
                                placeholder="e.g., Acme Tech, Independent"
                            />
                            <Field
                                label="Professional Role / Headline"
                                value={details.headline ?? ""}
                                onChange={(v) => setField("headline", v)}
                                placeholder="e.g., Aspiring Full-Stack Developer"
                            />
                            <SelectField
                                label="Primary Domain / Category"
                                value={details.department ?? ""}
                                onChange={(v) => setField("department", v)}
                                options={departmentOptions}
                                placeholder="Select category"
                            />
                            <SelectField
                                label="Learning Track / Level"
                                value={details.currentProgram ?? "Professional Track"}
                                onChange={(v) => setField("currentProgram", v as LearnerProgramType)}
                                options={programOptions}
                                placeholder="Select track or level"
                            />
                            <SelectField
                                label="Cohort / Schedule"
                                value={details.semesterSession ?? ""}
                                onChange={(v) => setField("semesterSession", v)}
                                options={semesterOptions}
                                placeholder="Select cohort or self-paced"
                            />
                        </div>
                    </section>

                    {/* Contact & Location */}
                    <section>
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">Contact &amp; Location</h3>
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field
                                label="Mobile Number"
                                type="tel"
                                value={details.mobile ?? ""}
                                onChange={(v) => setField("mobile", v)}
                                placeholder="+1 (555) 000-0000"
                            />
                            <Field
                                label="City / Region"
                                value={details.address?.city ?? ""}
                                onChange={(v) => setAddressField("city", v)}
                                placeholder="e.g., San Francisco"
                            />
                            <div className="md:col-span-2">
                                <SelectField
                                    label="Country"
                                    value={details.address?.country ?? ""}
                                    onChange={(v) => setAddressField("country", v)}
                                    options={COUNTRIES}
                                    placeholder="Select your country"
                                />
                            </div>
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
                        {isSaving ? "Saving..." : user ? "Save Changes" : "Create Learner"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export const StudentFormModal = LearnerFormModal;
