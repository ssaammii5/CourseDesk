"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2, GraduationCap, CalendarRange, Building2 } from "lucide-react";
import { DataTable } from "./DataTable";
import { AcademicFormModal } from "./AcademicFormModal";
import { ConfirmDialog } from "./ConfirmDialog";
import {
    getProgramsRequest, createProgramRequest, updateProgramRequest, deleteProgramRequest,
    getDepartmentsRequest, createDepartmentRequest, updateDepartmentRequest, deleteDepartmentRequest,
    getSemestersRequest, createSemesterRequest, updateSemesterRequest, deleteSemesterRequest,
    type AcademicProgramDto, type AcademicDepartmentDto, type AcademicSemesterDto,
} from "@/lib/api/academics";

type AcademicTab = "programs" | "departments" | "semesters";

const TABS: { id: AcademicTab; label: string; icon: React.ReactNode }[] = [
    { id: "programs", label: "Programs", icon: <GraduationCap className="h-4 w-4" /> },
    { id: "departments", label: "Departments", icon: <Building2 className="h-4 w-4" /> },
    { id: "semesters", label: "Semesters", icon: <CalendarRange className="h-4 w-4" /> },
];

type AcademicItem = { id: number; name: string; description?: string; code?: string };

export function AdminAcademicsView() {
    const [activeTab, setActiveTab] = useState<AcademicTab>("programs");
    const [programs, setPrograms] = useState<AcademicProgramDto[]>([]);
    const [departments, setDepartments] = useState<AcademicDepartmentDto[]>([]);
    const [semesters, setSemesters] = useState<AcademicSemesterDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [programSearch, setProgramSearch] = useState("");
    const [departmentSearch, setDepartmentSearch] = useState("");
    const [semesterSearch, setSemesterSearch] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<"program" | "semester" | "department">("program");
    const [editingItem, setEditingItem] = useState<AcademicItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: number; name: string } | null>(null);

    const loadAll = useCallback(async () => {
        try {
            setError(null);
            const [p, d, s] = await Promise.all([
                getProgramsRequest(),
                getDepartmentsRequest(),
                getSemestersRequest(),
            ]);
            setPrograms(p);
            setDepartments(d);
            setSemesters(s);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load academics.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadAll();
    }, [loadAll]);

    const filteredPrograms = useMemo(() => {
        return programs.filter((p) =>
            p.name.toLowerCase().includes(programSearch.toLowerCase()) ||
            p.description.toLowerCase().includes(programSearch.toLowerCase())
        );
    }, [programs, programSearch]);

    const filteredDepartments = useMemo(() => {
        return departments.filter((d) =>
            d.name.toLowerCase().includes(departmentSearch.toLowerCase()) ||
            d.code.toLowerCase().includes(departmentSearch.toLowerCase())
        );
    }, [departments, departmentSearch]);

    const filteredSemesters = useMemo(() => {
        return semesters.filter((s) => s.name.toLowerCase().includes(semesterSearch.toLowerCase()));
    }, [semesters, semesterSearch]);

    const openAddModal = (type: "program" | "semester" | "department") => {
        setModalType(type);
        setEditingItem(null);
        setModalOpen(true);
    };

    const openEditModal = (type: "program" | "semester" | "department", item: AcademicItem) => {
        setModalType(type);
        setEditingItem(item);
        setModalOpen(true);
    };

    const handleSave = async (data: { name: string; description?: string; code?: string }) => {
        try {
            setError(null);
            if (modalType === "program") {
                const payload = { name: data.name, description: data.description ?? "" };
                if (editingItem) await updateProgramRequest(editingItem.id, payload);
                else await createProgramRequest(payload);
            } else if (modalType === "department") {
                const payload = { name: data.name, code: data.code ?? "" };
                if (editingItem) await updateDepartmentRequest(editingItem.id, payload);
                else await createDepartmentRequest(payload);
            } else {
                const payload = { name: data.name };
                if (editingItem) await updateSemesterRequest(editingItem.id, payload);
                else await createSemesterRequest(payload);
            }
            setModalOpen(false);
            setEditingItem(null);
            await loadAll();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save.");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setError(null);
            if (deleteTarget.type === "program") await deleteProgramRequest(deleteTarget.id);
            else if (deleteTarget.type === "department") await deleteDepartmentRequest(deleteTarget.id);
            else await deleteSemesterRequest(deleteTarget.id);
            setDeleteTarget(null);
            await loadAll();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete.");
            setDeleteTarget(null);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-8">
            {error && (
                <div className="mb-4 rounded-lg bg-[#fce8e6] px-5 py-3.5 text-sm text-[#c5221f]">{error}</div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold text-gray-900">Academics</h1>
                    <p className="mt-1 text-sm text-gray-600">Manage programs, departments, and semesters for your institution</p>
                </div>
            </div>

            <div className="mt-6 border-b border-gray-200">
                <nav className="flex gap-8">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex cursor-pointer items-center gap-2 py-3.5 text-sm font-medium transition-colors ${activeTab === tab.id ? "text-[#1a73e8]" : "text-gray-600 hover:text-gray-900"}`}
                        >
                            {tab.icon}
                            {tab.label}
                            {activeTab === tab.id && (
                                <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-t-full bg-[#1a73e8]" />
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {activeTab === "programs" && (
                <div className="mt-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative max-w-sm flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                value={programSearch}
                                onChange={(e) => setProgramSearch(e.target.value)}
                                placeholder="Search programs..."
                                className="w-full rounded-md border border-gray-400/80 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => openAddModal("program")}
                            className="flex cursor-pointer items-center gap-2 self-start rounded-full bg-[#1a63d8] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1554b5] sm:self-auto"
                        >
                            <Plus className="h-4 w-4" />
                            Add Program
                        </button>
                    </div>
                    <div className="mt-6">
                        <DataTable
                            columns={[
                                { key: "name", header: "Program Name" },
                                { key: "description", header: "Description" },
                                {
                                    key: "actions",
                                    header: "Actions",
                                    width: "150px",
                                    className: "text-right",
                                    render: (p: AcademicProgramDto) => (
                                        <div className="flex items-center justify-end gap-1">
                                            <button type="button" title="Edit" onClick={() => openEditModal("program", p)} className="cursor-pointer rounded p-2 text-gray-600 hover:bg-gray-100">
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button type="button" title="Delete" onClick={() => setDeleteTarget({ type: "program", id: p.id, name: p.name })} className="cursor-pointer rounded p-2 text-[#c5221f] hover:bg-red-50">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ),
                                },
                            ]}
                            data={filteredPrograms}
                            keyExtractor={(p) => p.id}
                            emptyMessage="No programs found."
                        />
                    </div>
                </div>
            )}

            {activeTab === "departments" && (
                <div className="mt-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative max-w-sm flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                value={departmentSearch}
                                onChange={(e) => setDepartmentSearch(e.target.value)}
                                placeholder="Search departments..."
                                className="w-full rounded-md border border-gray-400/80 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => openAddModal("department")}
                            className="flex cursor-pointer items-center gap-2 self-start rounded-full bg-[#1a63d8] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1554b5] sm:self-auto"
                        >
                            <Plus className="h-4 w-4" />
                            Add Department
                        </button>
                    </div>
                    <div className="mt-6">
                        <DataTable
                            columns={[
                                { key: "code", header: "Code", width: "100px" },
                                { key: "name", header: "Department Name" },
                                {
                                    key: "actions",
                                    header: "Actions",
                                    width: "150px",
                                    className: "text-right",
                                    render: (d: AcademicDepartmentDto) => (
                                        <div className="flex items-center justify-end gap-1">
                                            <button type="button" title="Edit" onClick={() => openEditModal("department", d)} className="cursor-pointer rounded p-2 text-gray-600 hover:bg-gray-100">
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button type="button" title="Delete" onClick={() => setDeleteTarget({ type: "department", id: d.id, name: d.name })} className="cursor-pointer rounded p-2 text-[#c5221f] hover:bg-red-50">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ),
                                },
                            ]}
                            data={filteredDepartments}
                            keyExtractor={(d) => d.id}
                            emptyMessage="No departments found."
                        />
                    </div>
                </div>
            )}

            {activeTab === "semesters" && (
                <div className="mt-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative max-w-sm flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                value={semesterSearch}
                                onChange={(e) => setSemesterSearch(e.target.value)}
                                placeholder="Search semesters..."
                                className="w-full rounded-md border border-gray-400/80 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => openAddModal("semester")}
                            className="flex cursor-pointer items-center gap-2 self-start rounded-full bg-[#1a63d8] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1554b5] sm:self-auto"
                        >
                            <Plus className="h-4 w-4" />
                            Add Semester
                        </button>
                    </div>
                    <div className="mt-6">
                        <DataTable
                            columns={[
                                { key: "name", header: "Semester" },
                                {
                                    key: "actions",
                                    header: "Actions",
                                    width: "150px",
                                    className: "text-right",
                                    render: (s: AcademicSemesterDto) => (
                                        <div className="flex items-center justify-end gap-1">
                                            <button type="button" title="Edit" onClick={() => openEditModal("semester", s)} className="cursor-pointer rounded p-2 text-gray-600 hover:bg-gray-100">
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button type="button" title="Delete" onClick={() => setDeleteTarget({ type: "semester", id: s.id, name: s.name })} className="cursor-pointer rounded p-2 text-[#c5221f] hover:bg-red-50">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ),
                                },
                            ]}
                            data={filteredSemesters}
                            keyExtractor={(s) => s.id}
                            emptyMessage="No semesters found."
                        />
                    </div>
                </div>
            )}

            <AcademicFormModal
                open={modalOpen}
                type={modalType}
                item={editingItem}
                onSave={handleSave}
                onClose={() => { setModalOpen(false); setEditingItem(null); }}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                title={`Delete ${deleteTarget?.type === "program" ? "Program" : deleteTarget?.type === "semester" ? "Semester" : "Department"}`}
                message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}