"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import type { AdminCourse, AdminUser } from "@/types";
import { COURSE_CATALOG, AVAILABLE_SESSIONS, TEACHER_DEPARTMENTS } from "@/lib/adminData";
import { PROGRAM_TYPES } from "@/features/settings";
import { getUsersRequest, type UserDto } from "@/lib/api/users";
import {
    getProgramsRequest,
    getDepartmentsRequest,
    getSemestersRequest,
    type AcademicProgramDto,
    type AcademicDepartmentDto,
    type AcademicSemesterDto,
} from "@/lib/api/academics";
import { getCoursesRequest, type CourseDto } from "@/lib/api/courses";
import { X, ChevronDown, Search, UserPlus, Users } from "lucide-react";

interface EnrolledGroup {
    program: string;
    department: string;
    session: string;
    studentIds: number[];
}

interface CourseFormModalProps {
    open: boolean;
    course: AdminCourse | null;
    onSave: (data: Omit<AdminCourse, "id">) => void;
    onClose: () => void;
}

function mapUserDtoToAdminUser(dto: UserDto): AdminUser {
    return {
        id: dto.id,
        name: dto.name,
        email: dto.email,
        role: dto.role as AdminUser["role"],
        isActive: dto.isActive,
        createdAt: dto.createdAtUtc.split("T")[0],
        studentDetails: dto.studentDetails
            ? {
                fathersName: dto.studentDetails.fathersName ?? "",
                mothersName: dto.studentDetails.mothersName ?? "",
                dateOfBirth: dto.studentDetails.dateOfBirth ?? "",
                mobile: dto.studentDetails.mobile ?? "",
                nationality: dto.studentDetails.nationality ?? "",
                studentId: dto.studentDetails.studentId ?? "",
                regNo: dto.studentDetails.regNo ?? "",
                department: dto.studentDetails.department ?? "",
                currentProgram: (dto.studentDetails.currentProgram ?? "Undergraduate") as AdminUser["studentDetails"] extends infer S ? S extends { currentProgram: infer P } ? P : never : never,
                session: dto.studentDetails.session ?? "",
                semesterSession: dto.studentDetails.semesterSession ?? "",
                address: {
                    street: dto.studentDetails.address?.street ?? "",
                    city: dto.studentDetails.address?.city ?? "",
                    state: dto.studentDetails.address?.state ?? "",
                    zip: dto.studentDetails.address?.zip ?? "",
                    country: dto.studentDetails.address?.country ?? "",
                },
            }
            : undefined,
        teacherDetails: dto.teacherDetails
            ? {
                teacherId: dto.teacherDetails.teacherId ?? "",
                designation: (dto.teacherDetails.designation ?? "Assistant Professor") as AdminUser["teacherDetails"] extends infer T ? T extends { designation: infer D } ? D : never : never,
                department: dto.teacherDetails.department ?? "",
            }
            : undefined,
    };
}

export function CourseFormModal({ open, course, onSave, onClose }: CourseFormModalProps) {
    const [program, setProgram] = useState("");
    const [department, setDepartment] = useState("");
    const [session, setSession] = useState("");
    const [courseName, setCourseName] = useState("");
    const [isCustomCourse, setIsCustomCourse] = useState(false);
    const [isActive, setIsActive] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [teacherDeptFilter, setTeacherDeptFilter] = useState("");
    const [teacherIds, setTeacherIds] = useState<number[]>([]);
    const [studentProgram, setStudentProgram] = useState("");
    const [studentDept, setStudentDept] = useState("");
    const [studentSession, setStudentSession] = useState("");
    const [enrolledGroups, setEnrolledGroups] = useState<EnrolledGroup[]>([]);
    const [manualStudentIds, setManualStudentIds] = useState<number[]>([]);
    const [manualStudentSearch, setManualStudentSearch] = useState("");
    const [manualStudentResults, setManualStudentResults] = useState<AdminUser[]>([]);
    const [showManualResults, setShowManualResults] = useState(false);

    const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
    const [academicPrograms, setAcademicPrograms] = useState<AcademicProgramDto[]>([]);
    const [academicDepartments, setAcademicDepartments] = useState<AcademicDepartmentDto[]>([]);
    const [academicSemesters, setAcademicSemesters] = useState<AcademicSemesterDto[]>([]);
    const [existingCourses, setExistingCourses] = useState<CourseDto[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const lastAppliedGroupFilter = useRef<string>("");

    const [meetingProvider, setMeetingProvider] = useState("");
    const [meetingUrl, setMeetingUrl] = useState("");
    const [meetingId, setMeetingId] = useState("");
    const [meetingPasscode, setMeetingPasscode] = useState("");
    const [scheduleNotes, setScheduleNotes] = useState("");

    // Fetch teachers/students, programs, departments, semesters, and courses when modal opens.
    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        setLoadingData(true);
        Promise.all([
            getUsersRequest().catch(() => []),
            getProgramsRequest().catch(() => []),
            getDepartmentsRequest().catch(() => []),
            getSemestersRequest().catch(() => []),
            getCoursesRequest().catch(() => []),
        ])
            .then(([userDtos, progDtos, deptDtos, semDtos, courseDtos]) => {
                if (cancelled) return;
                setAllUsers(userDtos.map(mapUserDtoToAdminUser));
                setAcademicPrograms(progDtos);
                setAcademicDepartments(deptDtos);
                setAcademicSemesters(semDtos);
                setExistingCourses(courseDtos);
            })
            .finally(() => {
                if (!cancelled) setLoadingData(false);
            });
        return () => {
            cancelled = true;
        };
    }, [open]);

    const matchDept = (userOrCourseDept?: string, targetDept?: string): boolean => {
        if (!userOrCourseDept || !targetDept) return false;
        const u = userOrCourseDept.trim().toLowerCase();
        const t = targetDept.trim().toLowerCase();
        if (u === t) return true;
        const deptObj = academicDepartments.find(
            (d) => d.code?.toLowerCase() === t || d.name.toLowerCase() === t
        );
        if (deptObj) {
            return u === deptObj.name.toLowerCase() || u === deptObj.code?.toLowerCase();
        }
        return false;
    };

    const programOptions = useMemo(() => {
        if (academicPrograms.length > 0) {
            return academicPrograms.map((p) => p.name);
        }
        return [...PROGRAM_TYPES];
    }, [academicPrograms]);

    const departmentOptions = useMemo(() => {
        if (academicDepartments.length > 0) {
            return academicDepartments.map((d) => ({
                value: d.code || d.name,
                label: d.code ? `${d.name} (${d.code})` : d.name,
                code: d.code,
                name: d.name,
            }));
        }
        return TEACHER_DEPARTMENTS.map((d) => ({
            value: d,
            label: d,
            code: d,
            name: d,
        }));
    }, [academicDepartments]);

    const sessionOptions = useMemo(() => {
        if (academicSemesters.length > 0) {
            return academicSemesters.map((s) => s.name);
        }
        return [...AVAILABLE_SESSIONS];
    }, [academicSemesters]);

    const allTeachers = useMemo(
        () => allUsers.filter((u) => u.role === "Teacher" && u.isActive),
        [allUsers]
    );
    const allStudents = useMemo(
        () => allUsers.filter((u) => u.role === "Student"),
        [allUsers]
    );

    const availableCourses = useMemo(() => {
        const fromDb = existingCourses
            .filter(
                (c) =>
                    (!program || c.program === program) &&
                    (!department || matchDept(c.department, department))
            )
            .map((c) => c.name);

        const fromCatalog = COURSE_CATALOG.filter(
            (c) =>
                (!program || c.program === program) &&
                (!department || matchDept(c.department, department))
        ).map((c) => c.name);

        return Array.from(new Set([...fromDb, ...fromCatalog]));
    }, [program, department, existingCourses, academicDepartments]);

    const filteredTeachers = useMemo(() => {
        if (!teacherDeptFilter) return [];
        return allTeachers.filter((t) =>
            matchDept(t.teacherDetails?.department, teacherDeptFilter)
        );
    }, [allTeachers, teacherDeptFilter, academicDepartments]);

    const combinedStudentSessionOptions = useMemo(() => {
        const fromStudents = allStudents
            .map((s) => s.studentDetails?.semesterSession ?? "")
            .filter(Boolean);
        return Array.from(new Set([...sessionOptions, ...fromStudents])).sort();
    }, [sessionOptions, allStudents]);

    const totalEnrolledCount = useMemo(() => {
        const groupIds = new Set(enrolledGroups.flatMap((g) => g.studentIds));
        const manualIds = new Set(manualStudentIds);
        return new Set([...groupIds, ...manualIds]).size;
    }, [enrolledGroups, manualStudentIds]);

    const buildGroupsFromStudentIds = (ids: number[]): { groups: EnrolledGroup[]; manual: number[] } => {
        const groupMap = new Map<string, EnrolledGroup>();
        const manual: number[] = [];
        for (const id of ids) {
            const student = allStudents.find((s) => s.id === id);
            if (!student?.studentDetails) {
                manual.push(id);
                continue;
            }
            const d = student.studentDetails;
            const prog = d.currentProgram ?? "";
            const dept = d.department ?? "";
            const sess = d.semesterSession ?? "";
            if (!prog || !dept || !sess) {
                manual.push(id);
                continue;
            }
            const key = `${prog}|${dept}|${sess}`;
            if (!groupMap.has(key)) {
                groupMap.set(key, { program: prog, department: dept, session: sess, studentIds: [] });
            }
            groupMap.get(key)!.studentIds.push(id);
        }
        return { groups: Array.from(groupMap.values()), manual };
    };

    useEffect(() => {
        if (!studentProgram || !studentDept || !studentSession) {
            lastAppliedGroupFilter.current = "";
            return;
        }
        const filterKey = `${studentProgram}|${studentDept}|${studentSession}`;
        if (filterKey === lastAppliedGroupFilter.current) return;
        const matched = allStudents.filter((s) => {
            const d = s.studentDetails;
            return (
                d?.currentProgram === studentProgram &&
                matchDept(d?.department, studentDept) &&
                d?.semesterSession === studentSession
            );
        });
        if (matched.length > 0) {
            lastAppliedGroupFilter.current = filterKey;
            const groupIds = matched.map((s) => s.id);
            setEnrolledGroups((prev) => {
                const exists = prev.some(
                    (g) => g.program === studentProgram && g.department === studentDept && g.session === studentSession
                );
                if (exists) return prev;
                return [...prev, { program: studentProgram, department: studentDept, session: studentSession, studentIds: groupIds }];
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentProgram, studentDept, studentSession, allStudents, academicDepartments]);

    useEffect(() => {
        if (open) {
            setProgram(course?.program ?? "");
            setDepartment(course?.department ?? "");
            setSession(course?.session ?? "");
            const initialCourseName = course?.name ?? "";
            setCourseName(initialCourseName);
            setIsCustomCourse(Boolean(initialCourseName));
            setTeacherIds(course?.teacherIds ?? []);
            setIsActive(course?.isActive ?? true);
            setErrors({});
            setTeacherDeptFilter("");
            setStudentProgram("");
            setStudentDept("");
            setStudentSession("");
            setManualStudentSearch("");
            setManualStudentResults([]);
            setShowManualResults(false);

            setMeetingProvider(course?.meetingProvider ?? "");
            setMeetingUrl(course?.meetingUrl ?? "");
            setMeetingId(course?.meetingId ?? "");
            setMeetingPasscode(course?.meetingPasscode ?? "");
            setScheduleNotes(course?.scheduleNotes ?? "");

            lastAppliedGroupFilter.current = "";
            if (course?.studentIds && course.studentIds.length > 0 && allStudents.length > 0) {
                const { groups, manual } = buildGroupsFromStudentIds(course.studentIds);
                setEnrolledGroups(groups);
                setManualStudentIds(manual);
            } else {
                setEnrolledGroups([]);
                setManualStudentIds(course?.studentIds ?? []);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, course, allStudents]);

    const handleProgramChange = (value: string) => {
        setProgram(value);
        setCourseName("");
        setIsCustomCourse(false);
        clearError("program");
        clearError("courseName");
    };
    const handleDepartmentChange = (value: string) => {
        setDepartment(value);
        setCourseName("");
        setIsCustomCourse(false);
        clearError("department");
        clearError("courseName");
    };
    const handleSessionChange = (value: string) => {
        setSession(value);
        clearError("session");
    };
    const handleCourseNameChange = (value: string) => {
        setCourseName(value);
        clearError("courseName");
    };
    const handleTeacherDeptChange = (value: string) => {
        setTeacherDeptFilter(value);
    };
    const handleStudentProgramChange = (value: string) => {
        setStudentProgram(value);
        setStudentDept("");
        setStudentSession("");
        lastAppliedGroupFilter.current = "";
    };
    const handleStudentDeptChange = (value: string) => {
        setStudentDept(value);
        setStudentSession("");
        lastAppliedGroupFilter.current = "";
    };
    const handleStudentSessionChange = (value: string) => {
        setStudentSession(value);
        lastAppliedGroupFilter.current = "";
    };
    const removeGroup = (index: number) => {
        setEnrolledGroups((prev) => prev.filter((_, i) => i !== index));
    };
    const handleManualSearch = (value: string) => {
        setManualStudentSearch(value);
        if (value.trim().length >= 2) {
            const results = allStudents.filter(
                (s) =>
                    (s.studentDetails?.studentId ?? "").toLowerCase().includes(value.toLowerCase()) ||
                    s.email.toLowerCase().includes(value.toLowerCase()) ||
                    s.name.toLowerCase().includes(value.toLowerCase())
            );
            setManualStudentResults(results);
            setShowManualResults(true);
        } else {
            setManualStudentResults([]);
            setShowManualResults(false);
        }
    };
    const addManualStudent = (student: AdminUser) => {
        setManualStudentIds((prev) => {
            if (prev.includes(student.id)) return prev;
            return [...prev, student.id];
        });
        setManualStudentSearch("");
        setManualStudentResults([]);
        setShowManualResults(false);
    };
    const removeManualStudent = (id: number) => {
        setManualStudentIds((prev) => prev.filter((s) => s !== id));
    };
    const toggleTeacher = (id: number) => {
        setTeacherIds((prev) =>
            prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
        );
    };
    const clearError = (key: string) =>
        setErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });

    const getAllStudentIds = (): number[] => {
        const groupIds = enrolledGroups.flatMap((g) => g.studentIds);
        const allIds = new Set([...groupIds, ...manualStudentIds]);
        return Array.from(allIds);
    };

    const validate = () => {
        const next: Record<string, string> = {};
        if (!program) next.program = "Track / level is required.";
        if (!department) next.department = "Category is required.";
        if (!session) next.session = "Cohort / schedule is required.";
        if (!courseName) next.courseName = "Course title is required.";
        return next;
    };

    const handleSubmit = () => {
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;
        onSave({
            name: courseName,
            program,
            department,
            teacherIds,
            studentIds: getAllStudentIds(),
            session,
            isActive,
            meetingProvider,
            meetingUrl: meetingUrl || null,
            meetingId,
            meetingPasscode,
            scheduleNotes,
        });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {course ? "Edit Course" : "Add New Course"}
                    </h2>
                    <button type="button" onClick={onClose} className="cursor-pointer rounded-full p-2 text-gray-600 hover:bg-gray-100">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-6">
                    {loadingData && (
                        <p className="text-sm text-gray-500">Loading academic data & users…</p>
                    )}

                    <section>
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">Course Details</h3>
                        <div className="grid gap-5 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                    Learning Track / Level <span className="text-[#c5221f]">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={program}
                                        onChange={(e) => handleProgramChange(e.target.value)}
                                        className={`w-full appearance-none rounded-md border bg-white px-3.5 py-2.5 pr-10 text-[15px] focus:outline-none ${errors.program
                                            ? "border-[#c5221f] focus:border-[#c5221f] focus:ring-1 focus:ring-[#c5221f]"
                                            : "border-gray-400/80 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                                            } ${program ? "text-gray-900" : "text-gray-600"}`}
                                    >
                                        <option value="" disabled>Select track or level</option>
                                        {programOptions.map((p) => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-700" />
                                </div>
                                {errors.program && <span className="mt-1 block text-sm text-[#c5221f]">{errors.program}</span>}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                    Category / Domain <span className="text-[#c5221f]">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={department}
                                        onChange={(e) => handleDepartmentChange(e.target.value)}
                                        className={`w-full appearance-none rounded-md border bg-white px-3.5 py-2.5 pr-10 text-[15px] focus:outline-none ${errors.department
                                            ? "border-[#c5221f] focus:border-[#c5221f] focus:ring-1 focus:ring-[#c5221f]"
                                            : "border-gray-400/80 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                                            } ${department ? "text-gray-900" : "text-gray-600"}`}
                                    >
                                        <option value="" disabled>Select category</option>
                                        {departmentOptions.map((d) => (
                                            <option key={d.value} value={d.value}>{d.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-700" />
                                </div>
                                {errors.department && <span className="mt-1 block text-sm text-[#c5221f]">{errors.department}</span>}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                    Cohort / Schedule <span className="text-[#c5221f]">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={session}
                                        onChange={(e) => handleSessionChange(e.target.value)}
                                        className={`w-full appearance-none rounded-md border bg-white px-3.5 py-2.5 pr-10 text-[15px] focus:outline-none ${errors.session
                                            ? "border-[#c5221f] focus:border-[#c5221f] focus:ring-1 focus:ring-[#c5221f]"
                                            : "border-gray-400/80 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                                            } ${session ? "text-gray-900" : "text-gray-600"}`}
                                    >
                                        <option value="" disabled>Select cohort / schedule</option>
                                        {sessionOptions.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-700" />
                                </div>
                                {errors.session && <span className="mt-1 block text-sm text-[#c5221f]">{errors.session}</span>}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-sm font-medium text-gray-800">
                                        Course Title <span className="text-[#c5221f]">*</span>
                                    </label>
                                    {program && department && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsCustomCourse(!isCustomCourse);
                                                clearError("courseName");
                                            }}
                                            className="text-xs font-medium text-[#1a73e8] hover:underline cursor-pointer"
                                        >
                                            {isCustomCourse
                                                ? "← Pick from catalog/database"
                                                : "+ Enter custom title"}
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    {!isCustomCourse ? (
                                        <>
                                            <select
                                                value={courseName}
                                                onChange={(e) => {
                                                    if (e.target.value === "__custom__") {
                                                        setIsCustomCourse(true);
                                                        setCourseName("");
                                                    } else {
                                                        handleCourseNameChange(e.target.value);
                                                    }
                                                }}
                                                disabled={!program || !department}
                                                className={`w-full appearance-none rounded-md border bg-white px-3.5 py-2.5 pr-10 text-[15px] focus:outline-none ${errors.courseName
                                                    ? "border-[#c5221f] focus:border-[#c5221f] focus:ring-1 focus:ring-[#c5221f]"
                                                    : "border-gray-400/80 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                                                    } ${!program || !department ? "cursor-not-allowed bg-gray-100 text-gray-500" : courseName ? "text-gray-900" : "text-gray-600"}`}
                                            >
                                                <option value="" disabled>
                                                    {!program || !department
                                                        ? "Select track & category first"
                                                        : availableCourses.length === 0
                                                            ? "No catalog courses available"
                                                            : "Select course title"}
                                                </option>
                                                {availableCourses.map((c) => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                                <option value="__custom__">+ Enter custom course title...</option>
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-700" />
                                        </>
                                    ) : (
                                        <input
                                            type="text"
                                            value={courseName}
                                            onChange={(e) => handleCourseNameChange(e.target.value)}
                                            placeholder="e.g. Full-Stack Web Development Bootcamp"
                                            disabled={!program || !department}
                                            className={`w-full rounded-md border bg-white px-3.5 py-2.5 text-[15px] focus:outline-none ${errors.courseName
                                                ? "border-[#c5221f] focus:border-[#c5221f] focus:ring-1 focus:ring-[#c5221f]"
                                                : "border-gray-400/80 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                                                } ${!program || !department ? "cursor-not-allowed bg-gray-100 text-gray-500" : "text-gray-900"}`}
                                        />
                                    )}
                                </div>
                                {errors.courseName && <span className="mt-1 block text-sm text-[#c5221f]">{errors.courseName}</span>}
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">
                            Live Class Configuration
                        </h3>
                        <div className="grid gap-5 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                    Meeting Provider
                                </label>
                                <select
                                    value={meetingProvider}
                                    onChange={(e) => setMeetingProvider(e.target.value)}
                                    className="w-full rounded-md border border-gray-400/80 bg-white px-3.5 py-2.5 text-sm focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                                >
                                    <option value="">Select provider</option>
                                    <option value="zoom">Zoom</option>
                                    <option value="meet">Google Meet</option>
                                    <option value="teams">Microsoft Teams</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                    Meeting URL
                                </label>
                                <input
                                    type="url"
                                    value={meetingUrl}
                                    onChange={(e) => setMeetingUrl(e.target.value)}
                                    placeholder="https://zoom.us/j/123456789"
                                    className="w-full rounded-md border border-gray-400/80 px-3.5 py-2.5 text-sm focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                    Meeting ID
                                </label>
                                <input
                                    type="text"
                                    value={meetingId}
                                    onChange={(e) => setMeetingId(e.target.value)}
                                    placeholder="e.g., 123 456 7890"
                                    className="w-full rounded-md border border-gray-400/80 px-3.5 py-2.5 text-sm focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                    Passcode
                                </label>
                                <input
                                    type="text"
                                    value={meetingPasscode}
                                    onChange={(e) => setMeetingPasscode(e.target.value)}
                                    placeholder="e.g., abc123"
                                    className="w-full rounded-md border border-gray-400/80 px-3.5 py-2.5 text-sm focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                    Schedule Notes
                                </label>
                                <input
                                    type="text"
                                    value={scheduleNotes}
                                    onChange={(e) => setScheduleNotes(e.target.value)}
                                    placeholder="e.g., Every Monday & Wednesday, 7:00 PM – 9:00 PM (GMT+6)"
                                    className="w-full rounded-md border border-gray-400/80 px-3.5 py-2.5 text-sm focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                                />
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">
                            Assigned Instructors
                            {teacherIds.length > 0 && (
                                <span className="ml-2 rounded-full bg-[#e8f0fe] px-2 py-0.5 text-xs font-medium text-[#174ea6]">
                                    {teacherIds.length} selected
                                </span>
                            )}
                        </h3>
                        <div className="mb-3">
                            <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                Filter by Category / Domain
                            </label>
                            <div className="relative">
                                <select
                                    value={teacherDeptFilter}
                                    onChange={(e) => handleTeacherDeptChange(e.target.value)}
                                    className="w-full appearance-none rounded-md border border-gray-400/80 bg-white px-3.5 py-2.5 pr-10 text-[15px] text-gray-900 focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                                >
                                    <option value="" disabled>Select category / domain</option>
                                    {departmentOptions.map((d) => (
                                        <option key={d.value} value={d.value}>{d.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-700" />
                            </div>
                        </div>
                        {teacherDeptFilter && (
                            <div className="max-h-48 overflow-y-auto rounded-md border border-gray-200">
                                {filteredTeachers.length === 0 ? (
                                    <p className="px-4 py-3 text-sm text-gray-500">No active instructors in {teacherDeptFilter}.</p>
                                ) : (
                                    filteredTeachers.map((t) => (
                                        <label key={t.id} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={teacherIds.includes(t.id)}
                                                onChange={() => toggleTeacher(t.id)}
                                                className="h-4 w-4 accent-[#1a73e8]"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <span className="block truncate text-sm text-gray-900">{t.name}</span>
                                                <span className="block text-xs text-gray-500">
                                                    {t.teacherDetails?.teacherId ?? "N/A"} • {t.teacherDetails?.department ?? "N/A"} • {t.teacherDetails?.designation ?? "Instructor"}
                                                </span>
                                            </div>
                                        </label>
                                    ))
                                )}
                            </div>
                        )}
                        {teacherIds.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {teacherIds.map((id) => {
                                    const teacher = allUsers.find((u) => u.id === id);
                                    return teacher ? (
                                        <span key={id} className="inline-flex items-center gap-1 rounded-full bg-[#e8f0fe] px-3 py-1 text-xs font-medium text-[#174ea6]">
                                            {teacher.name}
                                            <button type="button" onClick={() => toggleTeacher(id)} className="ml-1 cursor-pointer text-[#174ea6] hover:text-[#c5221f]">
                                                ×
                                            </button>
                                        </span>
                                    ) : null;
                                })}
                            </div>
                        )}
                    </section>

                    <section>
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">
                            Enrolled Learners
                            {totalEnrolledCount > 0 && (
                                <span className="ml-2 rounded-full bg-[#e6f4ea] px-2 py-0.5 text-xs font-medium text-[#137333]">
                                    {totalEnrolledCount} enrolled
                                </span>
                            )}
                        </h3>
                        <div className="mb-4 rounded-md border border-gray-200 bg-[#f8f9fa] p-4">
                            <p className="mb-3 text-sm font-medium text-gray-700">Cohort & Track Enrollment</p>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="relative">
                                    <select
                                        value={studentProgram}
                                        onChange={(e) => handleStudentProgramChange(e.target.value)}
                                        className="w-full appearance-none rounded-md border border-gray-400/80 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                                    >
                                        <option value="" disabled>Select track</option>
                                        {programOptions.map((p) => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-700" />
                                </div>
                                <div className="relative">
                                    <select
                                        value={studentDept}
                                        onChange={(e) => handleStudentDeptChange(e.target.value)}
                                        disabled={!studentProgram}
                                        className={`w-full appearance-none rounded-md border border-gray-400/80 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8] ${!studentProgram ? "cursor-not-allowed bg-gray-100" : ""}`}
                                    >
                                        <option value="" disabled>Select category</option>
                                        {departmentOptions.map((d) => (
                                            <option key={d.value} value={d.value}>{d.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-700" />
                                </div>
                                <div className="relative">
                                    <select
                                        value={studentSession}
                                        onChange={(e) => handleStudentSessionChange(e.target.value)}
                                        disabled={!studentDept}
                                        className={`w-full appearance-none rounded-md border border-gray-400/80 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8] ${!studentDept ? "cursor-not-allowed bg-gray-100" : ""}`}
                                    >
                                        <option value="" disabled>Select cohort / schedule</option>
                                        {combinedStudentSessionOptions.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-700" />
                                </div>
                            </div>
                        </div>

                        <div className="mb-4 rounded-md border border-gray-200 bg-[#f8f9fa] p-4">
                            <p className="mb-3 text-sm font-medium text-gray-700">Individual Learner Enrollment</p>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    value={manualStudentSearch}
                                    onChange={(e) => handleManualSearch(e.target.value)}
                                    placeholder="Type learner ID, email, or name..."
                                    className="w-full rounded-md border border-gray-400/80 py-2 pl-10 pr-4 text-sm focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                                />
                                {showManualResults && manualStudentResults.length > 0 && (
                                    <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-40 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                        {manualStudentResults.map((s) => {
                                            const isAlreadyEnrolled =
                                                manualStudentIds.includes(s.id) ||
                                                enrolledGroups.some((g) => g.studentIds.includes(s.id));
                                            return (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() => addManualStudent(s)}
                                                    className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50"
                                                >
                                                    <UserPlus className="h-4 w-4 shrink-0 text-[#1a73e8]" />
                                                    <div className="min-w-0 flex-1">
                                                        <span className="block truncate text-sm text-gray-900">{s.name}</span>
                                                        <span className="block text-xs text-gray-500">
                                                            {s.studentDetails?.studentId ?? "N/A"} • {s.email}
                                                        </span>
                                                    </div>
                                                    {isAlreadyEnrolled && (
                                                        <span className="shrink-0 text-xs text-[#137333]">Already enrolled</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {enrolledGroups.length > 0 && (
                            <div className="mb-4">
                                <p className="mb-2 text-sm font-medium text-gray-700">
                                    Enrolled Cohorts / Groups ({enrolledGroups.length})
                                </p>
                                <div className="space-y-2">
                                    {enrolledGroups.map((group, index) => (
                                        <div
                                            key={`${group.program}-${group.department}-${group.session}`}
                                            className="flex items-center gap-3 rounded-md border border-[#c8e6c9] bg-[#e8f5e9] px-4 py-3"
                                        >
                                            <Users className="h-5 w-5 shrink-0 text-[#137333]" />
                                            <div className="min-w-0 flex-1">
                                                <span className="block text-sm font-medium text-[#137333]">
                                                    {group.program} • {group.department} • {group.session}
                                                </span>
                                                <span className="block text-xs text-[#2e7d32]">
                                                    {group.studentIds.length} learner{group.studentIds.length === 1 ? "" : "s"} enrolled
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeGroup(index)}
                                                className="shrink-0 cursor-pointer rounded-full p-1.5 text-[#2e7d32] hover:bg-[#c8e6c9] hover:text-[#c5221f]"
                                                title="Remove entire group"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {manualStudentIds.length > 0 && (
                            <div>
                                <p className="mb-2 text-sm font-medium text-gray-700">
                                    Individually Enrolled Learners ({manualStudentIds.length})
                                </p>
                                <div className="max-h-48 overflow-y-auto rounded-md border border-gray-200">
                                    {manualStudentIds.map((id) => {
                                        const student = allUsers.find((u) => u.id === id);
                                        return student ? (
                                            <div key={id} className="flex items-center gap-3 border-b border-gray-100 px-4 py-2.5 last:border-b-0">
                                                <div className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm text-gray-900">{student.name}</span>
                                                    <span className="block text-xs text-gray-500">
                                                        {student.studentDetails?.studentId ?? "N/A"} • {student.studentDetails?.department ?? "N/A"} • {student.studentDetails?.semesterSession ?? "N/A"}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeManualStudent(id)}
                                                    className="shrink-0 cursor-pointer rounded p-1 text-gray-500 hover:bg-red-50 hover:text-[#c5221f]"
                                                    title="Remove learner"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}
                    </section>

                    <div className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-3">
                        <span className="text-sm text-gray-800">Active Course</span>
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
                        {course ? "Save Changes" : "Create Course"}
                    </button>
                </div>
            </div>
        </div>
    );
}