"use client";
import { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";

interface AcademicFormModalProps {
    open: boolean;
    type: "program" | "semester" | "department";
    item: { id: number; name: string; description?: string; code?: string } | null;
    onSave: (data: { name: string; description?: string; code?: string }) => void;
    onClose: () => void;
}

const TYPE_LABELS: Record<string, string> = {
    program: "Program",
    semester: "Semester",
    department: "Department",
};

const SEMESTER_PERIODS = ["January-June", "July-December"];

export function AcademicFormModal({ open, type, item, onSave, onClose }: AcademicFormModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [code, setCode] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [semesterPeriod, setSemesterPeriod] = useState("");
    const [semesterYear, setSemesterYear] = useState("");

    useEffect(() => {
        if (open) {
            setName(item?.name ?? "");
            setDescription((item as any)?.description ?? "");
            setCode((item as any)?.code ?? "");
            setErrors({});

            if (type === "semester" && item?.name) {
                const parts = item.name.split("/");
                setSemesterPeriod(parts[0] ?? "");
                setSemesterYear(parts[1] ?? "");
            } else {
                setSemesterPeriod("");
                setSemesterYear("");
            }
        }
    }, [open, item, type]);

    const validate = () => {
        const next: Record<string, string> = {};
        if (type === "semester") {
            if (!semesterPeriod) next.semesterPeriod = "Semester period is required.";
            if (!semesterYear) next.semesterYear = "Year is required.";
        } else {
            if (!name.trim()) next.name = `${TYPE_LABELS[type]} name is required.`;
        }
        if (type === "department" && !code.trim()) next.code = "Department code is required.";
        return next;
    };

    const handleSubmit = () => {
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        const finalName = type === "semester"
            ? `${semesterPeriod}/${semesterYear}`
            : name.trim();

        onSave({
            name: finalName,
            description: description.trim(),
            code: code.trim(),
        });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {item ? `Edit ${TYPE_LABELS[type]}` : `Add New ${TYPE_LABELS[type]}`}
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
                <div className="mt-6 space-y-5">
                    {/* Semester: Two dropdowns instead of text input */}
                    {type === "semester" ? (
                        <div className="grid grid-cols-2 gap-4">
                            {/* Period dropdown */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                    Semester Period <span className="text-[#c5221f]">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={semesterPeriod}
                                        onChange={(e) => { setSemesterPeriod(e.target.value); setErrors((p) => ({ ...p, semesterPeriod: "" })); }}
                                        className={`w-full appearance-none rounded-md border px-3.5 py-2.5 pr-10 text-[15px] focus:outline-none ${errors.semesterPeriod
                                            ? "border-[#c5221f] focus:border-[#c5221f] focus:ring-1 focus:ring-[#c5221f]"
                                            : "border-gray-400/80 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                                            } ${semesterPeriod ? "text-gray-900" : "text-gray-600"}`}
                                    >
                                        <option value="" disabled>Select period</option>
                                        {SEMESTER_PERIODS.map((p) => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-700" />
                                </div>
                                {errors.semesterPeriod && <span className="mt-1 block text-sm text-[#c5221f]">{errors.semesterPeriod}</span>}
                            </div>

                            {/* Year: native number input */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                    Year <span className="text-[#c5221f]">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={semesterYear}
                                    onChange={(e) => { setSemesterYear(e.target.value); setErrors((p) => ({ ...p, semesterYear: "" })); }}
                                    placeholder="e.g., 2025"
                                    min={1900}
                                    max={2100}
                                    className={`w-full rounded-md border px-3.5 py-2.5 text-[15px] focus:outline-none ${errors.semesterYear
                                        ? "border-[#c5221f] focus:ring-1 focus:ring-[#c5221f]"
                                        : "border-gray-400/80 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                                        }`}
                                />
                                {errors.semesterYear && <span className="mt-1 block text-sm text-[#c5221f]">{errors.semesterYear}</span>}
                            </div>
                        </div>
                    ) : (
                        /* Name field for program/department */
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                {TYPE_LABELS[type]} Name <span className="text-[#c5221f]">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
                                placeholder={
                                    type === "program"
                                        ? "e.g., Undergraduate, Postgraduate, PhD"
                                        : "e.g., Computer Science and Engineering"
                                }
                                className={`w-full rounded-md border px-3.5 py-2.5 text-[15px] focus:outline-none ${errors.name
                                    ? "border-[#c5221f] focus:ring-1 focus:ring-[#c5221f]"
                                    : "border-gray-400/80 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                                    }`}
                            />
                            {errors.name && <span className="mt-1 block text-sm text-[#c5221f]">{errors.name}</span>}
                        </div>
                    )}

                    {/* Semester preview */}
                    {type === "semester" && semesterPeriod && semesterYear && (
                        <p className="text-xs text-gray-500">
                            Will be saved as: <span className="font-medium text-gray-800">{semesterPeriod}/{semesterYear}</span>
                        </p>
                    )}

                    {/* Department code field */}
                    {type === "department" && (
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                Department Code <span className="text-[#c5221f]">*</span>
                            </label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => { setCode(e.target.value); setErrors((p) => ({ ...p, code: "" })); }}
                                placeholder="e.g., CSE, BBA, EEE"
                                className={`w-full rounded-md border px-3.5 py-2.5 text-[15px] focus:outline-none ${errors.code
                                    ? "border-[#c5221f] focus:ring-1 focus:ring-[#c5221f]"
                                    : "border-gray-400/80 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                                    }`}
                            />
                            {errors.code && <span className="mt-1 block text-sm text-[#c5221f]">{errors.code}</span>}
                        </div>
                    )}

                    {/* Program description field */}
                    {type === "program" && (
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief description of the program..."
                                rows={3}
                                className="w-full rounded-md border border-gray-400/80 px-3.5 py-2.5 text-[15px] focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
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
                        {item ? "Save Changes" : `Create ${TYPE_LABELS[type]}`}
                    </button>
                </div>
            </div>
        </div>
    );
}