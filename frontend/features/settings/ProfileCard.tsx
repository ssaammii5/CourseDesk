"use client";

import { useRef, useState, useEffect } from "react";
import { Lock } from "lucide-react";
import type {
    CurrentUser,
    StudentProfile,
    Address,
    ProgramType,
} from "@/types";
import { getMeRequest, type MeResponse } from "@/lib/api/auth";
import { initialOf } from "@/lib/utils/format";
import { COUNTRIES, PROGRAM_TYPES, MAX_AVATAR_SIZE } from "./constants";
import { Field, SelectField } from "@/components/ui/FormFields";

interface ProfileCardProps {
    user?: CurrentUser | null;
    userName?: string;
    readOnly: boolean;
}

function buildStudentProfile(user?: CurrentUser | null, meDto?: MeResponse | null): StudentProfile {
    const name = meDto?.name ?? user?.name ?? "";
    const sd = meDto?.studentDetails ?? user?.studentDetails;
    const addr = sd?.address;
    return {
        fullName: name,
        fathersName: sd?.fathersName ?? "",
        mothersName: sd?.mothersName ?? "",
        dateOfBirth: sd?.dateOfBirth ?? "",
        mobile: sd?.mobile ?? "",
        nationality: sd?.nationality ?? "",
        studentId: sd?.studentId ?? "",
        regNo: sd?.regNo ?? "",
        department: sd?.department ?? "",
        currentProgram: (sd?.currentProgram ?? "Undergraduate") as ProgramType,
        session: sd?.session ?? "",
        semesterSession: sd?.semesterSession ?? "",
        level: 1,
        semester: 1,
        permanentAddress: {
            street: addr?.street ?? "",
            city: addr?.city ?? "",
            state: addr?.state ?? "",
            zip: addr?.zip ?? "",
            country: addr?.country ?? "",
        },
    };
}

export function ProfileCard({ user, userName, readOnly }: ProfileCardProps) {
    const [freshMe, setFreshMe] = useState<MeResponse | null>(null);
    const [form, setForm] = useState<StudentProfile>(() => buildStudentProfile(user));
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [flash, setFlash] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarError, setAvatarError] = useState<string | null>(null);

    // Re-sync whenever user prop updates
    useEffect(() => {
        setForm(buildStudentProfile(user, freshMe));
    }, [user]);

    // Fetch fresh profile from backend on mount
    useEffect(() => {
        let cancelled = false;
        getMeRequest()
            .then((me) => {
                if (!cancelled) {
                    setFreshMe(me);
                    setForm(buildStudentProfile(user, me));
                }
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, []);

    const setField = <K extends keyof StudentProfile>(key: K, value: StudentProfile[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((p) => {
            if (!p[key as string]) return p;
            const next = { ...p };
            delete next[key as string];
            return next;
        });
    };

    const setAddressField = <K extends keyof Address>(key: K, value: Address[K]) => {
        setForm((prev) => ({
            ...prev,
            permanentAddress: { ...prev.permanentAddress, [key]: value },
        }));
        setErrors((p) => {
            if (!p[key as string]) return p;
            const next = { ...p };
            delete next[key as string];
            return next;
        });
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        const validType = file.type === "image/jpeg" || file.type === "image/png";
        const validExt = /\.(jpe?g|png)$/i.test(file.name);
        if (!validType || !validExt) {
            setAvatarError("Only .jpg, .jpeg or .png files are allowed.");
            return;
        }
        if (file.size >= MAX_AVATAR_SIZE) {
            setAvatarError("Image must be smaller than 2 MB.");
            return;
        }

        setAvatarError(null);
        setAvatarUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(file);
        });
    };

    const validate = () => {
        const next: Record<string, string> = {};
        if (!form.fullName.trim()) next.fullName = "Full name is required.";
        if (!form.studentId.trim()) next.studentId = "Student ID is required.";
        if (!form.permanentAddress.country) next.country = "Country is required.";
        return next;
    };

    const save = () => {
        if (readOnly) return;
        const next = validate();
        setErrors(next);
        if (Object.keys(next).length > 0) return;
        setFlash(true);
        window.setTimeout(() => setFlash(false), 2000);
    };

    const displayName = userName || form.fullName || user?.name || "Student";

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
            <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
                <div>
                    <h2 className="text-2xl text-gray-900">Profile</h2>
                    <p className="mt-3 text-sm font-semibold text-gray-900">Student Information</p>
                    <p className="mt-1 text-sm text-gray-700">View your personal, academic, and contact details.</p>
                    {readOnly && (
                        <p className="mt-4 flex items-start gap-2 rounded-md bg-[#fef7e0] px-3 py-2.5 text-sm text-[#b06000]">
                            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                            These details are managed by the admin and cannot be edited. You can still update your avatar.
                        </p>
                    )}
                </div>

                <div>
                    <div className="flex flex-wrap items-center gap-5">
                        <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" className="hidden" onChange={handleAvatarChange} />
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Profile avatar" className="h-20 w-20 rounded-lg object-cover" />
                        ) : (
                            <span className="flex h-20 w-20 items-center justify-center rounded-lg bg-purple-800 text-3xl text-white">
                                {initialOf(displayName)}
                            </span>
                        )}
                        <div>
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="cursor-pointer rounded-md bg-[#cdd7ea] px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-[#bcc9e2]">
                                Change avatar
                            </button>
                            <p className="mt-2 text-sm text-gray-700">JPG, JPEG or PNG. Less than 2 MB.</p>
                            {avatarError && <p className="mt-1 text-sm text-[#c5221f]">{avatarError}</p>}
                        </div>
                    </div>

                    <div className="mt-8 space-y-8">
                        <div>
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">Personal Information</h3>
                            <div className="grid gap-5 md:grid-cols-2">
                                <Field label="Full Name" value={form.fullName} onChange={(v) => setField("fullName", v)} required disabled={readOnly} error={errors.fullName} />
                                <Field label="Father's Name" value={form.fathersName} onChange={(v) => setField("fathersName", v)} disabled={readOnly} />
                                <Field label="Mother's Name" value={form.mothersName} onChange={(v) => setField("mothersName", v)} disabled={readOnly} />
                                <Field label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(v) => setField("dateOfBirth", v)} disabled={readOnly} />
                                <Field label="Mobile Number" type="tel" value={form.mobile} onChange={(v) => setField("mobile", v)} disabled={readOnly} />
                                <Field label="Nationality" value={form.nationality} onChange={(v) => setField("nationality", v)} disabled={readOnly} />
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">Academic Details</h3>
                            <div className="grid gap-5 md:grid-cols-2">
                                <Field label="Student ID" value={form.studentId} onChange={(v) => setField("studentId", v)} required disabled={readOnly} error={errors.studentId} />
                                <Field label="Registration No" value={form.regNo} onChange={(v) => setField("regNo", v)} disabled={readOnly} />
                                <Field label="Department" value={form.department} onChange={(v) => setField("department", v)} disabled={readOnly} />
                                <SelectField label="Current Program" value={form.currentProgram} onChange={(v) => setField("currentProgram", v as ProgramType)} options={PROGRAM_TYPES} disabled={readOnly} placeholder="Select program type" />
                                <Field label="Session" value={form.session} onChange={(v) => setField("session", v)} disabled={readOnly} />
                                <Field label="Semester" value={form.semesterSession || (form.semester ? `Semester ${form.semester}` : "")} onChange={(v) => setField("semesterSession", v)} disabled={readOnly} />
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">Location</h3>
                            <div className="grid gap-5 md:grid-cols-2">
                                <Field label="Street Address" value={form.permanentAddress.street} onChange={(v) => setAddressField("street", v)} disabled={readOnly} />
                                <Field label="City" value={form.permanentAddress.city} onChange={(v) => setAddressField("city", v)} disabled={readOnly} />
                                <Field label="State / Province" value={form.permanentAddress.state} onChange={(v) => setAddressField("state", v)} disabled={readOnly} />
                                <Field label="ZIP / Postal Code" value={form.permanentAddress.zip} onChange={(v) => setAddressField("zip", v)} disabled={readOnly} />
                                <SelectField label="Country" value={form.permanentAddress.country} onChange={(v) => setAddressField("country", v)} options={COUNTRIES} required disabled={readOnly} error={errors.country} placeholder="Select your country" />
                            </div>
                        </div>
                    </div>

                    {!readOnly && (
                        <div className="mt-8 flex items-center justify-end gap-3">
                            {flash && <span className="text-sm font-medium text-[#188038]">Changes saved</span>}
                            <button type="button" onClick={() => { setForm(buildStudentProfile(user, freshMe)); setErrors({}); }} className="cursor-pointer rounded-full bg-[#cdd7ea] px-6 py-2.5 text-sm font-medium text-gray-900 hover:bg-[#bcc9e2]">
                                Discard
                            </button>
                            <button type="button" onClick={save} className="cursor-pointer rounded-full bg-[#1a63d8] px-7 py-2.5 text-sm font-medium text-white hover:bg-[#1554b5]">
                                Save
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}