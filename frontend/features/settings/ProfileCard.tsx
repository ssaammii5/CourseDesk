"use client";

import { useRef, useState, useEffect } from "react";
import { Globe, Lock, ExternalLink, Clock, Briefcase } from "lucide-react";
import type {
    CurrentUser,
    StudentProfile,
    Address,
    ProgramType,
} from "@/types";
import { getMeRequest, type MeResponse } from "@/lib/api/auth";
import { uploadAvatarRequest } from "@/lib/api/users";
import { initialOf } from "@/lib/utils/format";
import { COUNTRIES, MAX_AVATAR_SIZE } from "./constants";
import { Field, SelectField } from "@/components/ui/FormFields";

interface ProfileCardProps {
    user?: CurrentUser | null;
    userName?: string;
    readOnly: boolean;
}

function buildStudentProfile(user?: CurrentUser | null, meDto?: MeResponse | null): StudentProfile {
    const name = meDto?.name ?? user?.name ?? "";
    const sd = (meDto as any)?.learnerDetails ?? meDto?.studentDetails ?? (user as any)?.learnerDetails ?? user?.studentDetails;
    const addr = sd?.address;
    const idVal = (sd as any)?.learnerId ?? sd?.studentId ?? "";
    return {
        fullName: name,
        fathersName: sd?.fathersName ?? "",
        mothersName: sd?.mothersName ?? "",
        dateOfBirth: sd?.dateOfBirth ?? "",
        mobile: sd?.mobile ?? "",
        nationality: sd?.nationality ?? "",
        learnerId: idVal,
        studentId: idVal,
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
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

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
                    const instAvatar = me.instructorDetails?.avatar;
                    if (instAvatar) {
                        setAvatarUrl(instAvatar);
                    }
                }
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, []);

    const isInstructor = (freshMe?.role ?? user?.role) === "Instructor";
    const instructorDetails = freshMe?.instructorDetails ?? (user as any)?.instructorDetails;

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

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        const validType = file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp";
        const validExt = /\.(jpe?g|png|webp)$/i.test(file.name);
        if (!validType || !validExt) {
            setAvatarError("Only .jpg, .jpeg, .png, or .webp files are allowed.");
            return;
        }
        if (file.size >= MAX_AVATAR_SIZE) {
            setAvatarError("Image must be smaller than 2 MB.");
            return;
        }

        setAvatarError(null);
        setUploadingAvatar(true);
        try {
            const res = await uploadAvatarRequest(file);
            setAvatarUrl(res.url);
        } catch (err: any) {
            setAvatarError(err?.message || "Failed to upload avatar");
        } finally {
            setUploadingAvatar(false);
        }
    };

    const validate = () => {
        const next: Record<string, string> = {};
        if (!form.fullName.trim()) next.fullName = "Full name is required.";
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

    const displayName = userName || (isInstructor ? `${instructorDetails?.firstName || ""} ${instructorDetails?.lastName || ""}`.trim() : form.fullName) || user?.name || "User";
    const displayEmail = freshMe?.email ?? user?.email ?? "";

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
            <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Profile</h2>
                    <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-slate-200">
                        {isInstructor ? "Instructor Profile" : "Account Details"}
                    </p>
                    <p className="mt-1 text-sm text-gray-700 dark:text-slate-400">
                        {isInstructor
                            ? "View your instructor credentials, headline, timezone, and portfolio links."
                            : "View your personal, program, and contact details."}
                    </p>
                    {readOnly && (
                        <p className="mt-4 flex items-start gap-2 rounded-md bg-[#fef7e0] px-3 py-2.5 text-sm text-[#b06000] dark:border dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-300">
                            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                            These details are managed by the admin.
                        </p>
                    )}
                </div>

                <div>
                    <div className="flex flex-wrap items-center gap-5">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Profile avatar" className="h-20 w-20 rounded-xl object-cover border border-gray-200 dark:border-slate-700 shadow-sm" />
                        ) : (
                            <span className="flex h-20 w-20 items-center justify-center rounded-xl bg-blue-700 text-3xl font-semibold text-white shadow-sm">
                                {initialOf(displayName)}
                            </span>
                        )}
                        <div>
                            <button
                                type="button"
                                disabled={uploadingAvatar}
                                onClick={() => fileInputRef.current?.click()}
                                className="cursor-pointer rounded-lg bg-[#cdd7ea] px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-[#bcc9e2] disabled:opacity-60 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
                            >
                                {uploadingAvatar ? "Uploading..." : "Change avatar"}
                            </button>
                            <p className="mt-2 text-sm text-gray-700 dark:text-slate-400">JPG, JPEG, PNG or WEBP. Less than 2 MB.</p>
                            {avatarError && <p className="mt-1 text-sm text-[#c5221f] dark:text-red-400">{avatarError}</p>}
                        </div>
                    </div>

                    {isInstructor ? (
                        <div className="mt-8 space-y-8">
                            <div>
                                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-slate-100">Personal Information</h3>
                                <div className="grid gap-5 md:grid-cols-2">
                                    <Field
                                        label="First Name"
                                        value={instructorDetails?.firstName || ""}
                                        onChange={() => {}}
                                        disabled
                                    />
                                    <Field
                                        label="Last Name"
                                        value={instructorDetails?.lastName || ""}
                                        onChange={() => {}}
                                        disabled
                                    />
                                    <Field
                                        label="Email"
                                        value={displayEmail}
                                        onChange={() => {}}
                                        disabled
                                    />
                                    <Field
                                        label="Instructor ID"
                                        value={instructorDetails?.instructorId || instructorDetails?.teacherId || "Auto-defined by system"}
                                        onChange={() => {}}
                                        disabled
                                    />
                                </div>
                            </div>

                            <div>
                                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-slate-100">Professional Details</h3>
                                <div className="grid gap-5 md:grid-cols-2">
                                    <div className="md:col-span-2">
                                        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
                                            <Briefcase className="h-4 w-4 text-gray-400" />
                                            Professional Headline
                                        </label>
                                        <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-3 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100">
                                            {instructorDetails?.professionalHeadline || <span className="text-gray-400 italic">No headline set</span>}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
                                            <Clock className="h-4 w-4 text-gray-400" />
                                            Timezone
                                        </label>
                                        <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-3 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100">
                                            {instructorDetails?.timezone || "UTC"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-gray-400" />
                                    Portfolio & Social Links
                                </h3>
                                {instructorDetails?.links && instructorDetails.links.length > 0 ? (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {instructorDetails.links.map((lnk: any, idx: number) => (
                                            <a
                                                key={idx}
                                                href={lnk.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 hover:border-blue-400 hover:bg-blue-50/30 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-blue-600 transition"
                                            >
                                                <div className="min-w-0 pr-2">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{lnk.title || "Link"}</p>
                                                    <p className="text-xs text-blue-600 dark:text-blue-400 truncate">{lnk.url}</p>
                                                </div>
                                                <ExternalLink className="h-4 w-4 shrink-0 text-gray-400" />
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-slate-400 italic">No links added yet.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="mt-8 space-y-8">
                            <div>
                                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-slate-100">Personal Information</h3>
                                <div className="grid gap-5 md:grid-cols-2">
                                    <Field label="Full Name" value={form.fullName} onChange={(v) => setField("fullName", v)} required disabled={readOnly} error={errors.fullName} />
                                    <Field label="Mobile Number" type="tel" value={form.mobile} onChange={(v) => setField("mobile", v)} disabled={readOnly} />
                                    <Field label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(v) => setField("dateOfBirth", v)} disabled={readOnly} />
                                    <Field label="Nationality" value={form.nationality} onChange={(v) => setField("nationality", v)} disabled={readOnly} />
                                </div>
                            </div>

                            <div>
                                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-slate-100">Learner Identification</h3>
                                <div className="grid gap-5 md:grid-cols-2">
                                    <Field
                                        label="Learner ID"
                                        value={form.learnerId || form.studentId || "Auto-defined by system"}
                                        onChange={() => {}}
                                        disabled
                                    />
                                </div>
                            </div>

                            <div>
                                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-slate-100">Location</h3>
                                <div className="grid gap-5 md:grid-cols-2">
                                    <Field label="Street Address" value={form.permanentAddress.street} onChange={(v) => setAddressField("street", v)} disabled={readOnly} />
                                    <Field label="City" value={form.permanentAddress.city} onChange={(v) => setAddressField("city", v)} disabled={readOnly} />
                                    <Field label="State / Province" value={form.permanentAddress.state} onChange={(v) => setAddressField("state", v)} disabled={readOnly} />
                                    <Field label="ZIP / Postal Code" value={form.permanentAddress.zip} onChange={(v) => setAddressField("zip", v)} disabled={readOnly} />
                                    <SelectField label="Country" value={form.permanentAddress.country} onChange={(v) => setAddressField("country", v)} options={COUNTRIES} required disabled={readOnly} error={errors.country} placeholder="Select your country" />
                                </div>
                            </div>

                            {!readOnly && (
                                <div className="mt-8 flex items-center justify-end gap-3">
                                    {flash && <span className="text-sm font-medium text-[#188038] dark:text-emerald-400">Changes saved</span>}
                                    <button type="button" onClick={() => { setForm(buildStudentProfile(user, freshMe)); setErrors({}); }} className="cursor-pointer rounded-full bg-[#cdd7ea] px-6 py-2.5 text-sm font-medium text-gray-900 hover:bg-[#bcc9e2] dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                                        Discard
                                    </button>
                                    <button type="button" onClick={save} className="cursor-pointer rounded-full bg-[#1a63d8] px-7 py-2.5 text-sm font-medium text-white hover:bg-[#1554b5]">
                                        Save
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}