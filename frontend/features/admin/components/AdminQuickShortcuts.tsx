"use client";

import { useRouter } from "next/navigation";
import {
    BookOpen,
    ClipboardList,
    FileText,
    Users,
    GraduationCap,
    Layers,
    Settings,
    ArrowUpRight,
    UserCheck,
    Compass,
} from "lucide-react";

interface AdminQuickShortcutsProps {
    isCoordinator: boolean;
}

interface ShortcutItem {
    title: string;
    description: string;
    icon: React.ReactNode;
    iconBg: string;
    href: string;
}

export function AdminQuickShortcuts({ isCoordinator }: AdminQuickShortcutsProps) {
    const router = useRouter();

    const shortcuts: ShortcutItem[] = [
        {
            title: "Course Catalog",
            description: "Curriculum structure, syllabus, instructor assignments & tags",
            icon: <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
            iconBg: "bg-amber-50 dark:bg-amber-950/60",
            href: "/courses",
        },
        {
            title: "Assignments Hub",
            description: "Homework, quizzes, study materials & evaluation deadlines",
            icon: <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
            iconBg: "bg-blue-50 dark:bg-blue-950/60",
            href: "/assignments",
        },
        {
            title: "Evaluation Desk",
            description: "Review submissions, assign marks, and provide learner feedback",
            icon: <FileText className="h-5 w-5 text-rose-600 dark:text-rose-400" />,
            iconBg: "bg-rose-50 dark:bg-rose-950/60",
            href: "/submissions",
        },
        {
            title: "Learner Directory",
            description: "Student profiles, enrollment status & batch registration",
            icon: <GraduationCap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
            iconBg: "bg-emerald-50 dark:bg-emerald-950/60",
            href: "/learners",
        },
        {
            title: "Faculty & Instructors",
            description: "Instructor directory, invitations & assigned teaching roster",
            icon: <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />,
            iconBg: "bg-indigo-50 dark:bg-indigo-950/60",
            href: "/instructors",
        },
        ...(!isCoordinator
            ? [
                  {
                      title: "Academic Structure",
                      description: "Programs, departments, sessions, and taxonomy tags",
                      icon: <Layers className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
                      iconBg: "bg-teal-50 dark:bg-teal-950/60",
                      href: "/categories",
                  },
                  {
                      title: "Coordinators",
                      description: "Academic coordinators, permissions & scope oversight",
                      icon: <UserCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
                      iconBg: "bg-purple-50 dark:bg-purple-950/60",
                      href: "/coordinators",
                  },
                  {
                      title: "Platform Settings",
                      description: "Branding, maintenance windows & system preferences",
                      icon: <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />,
                      iconBg: "bg-slate-100 dark:bg-slate-800",
                      href: "/app-settings",
                  },
              ]
            : []),
    ];

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        Administrative Command Shortcuts
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Rapid navigation into key administrative workspaces
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {shortcuts.map((item) => (
                    <button
                        key={item.title}
                        type="button"
                        onClick={() => router.push(item.href)}
                        className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-slate-700"
                    >
                        <div className="flex items-start justify-between">
                            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconBg}`}>
                                {item.icon}
                            </div>
                            <span className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-500">
                                <ArrowUpRight className="h-4 w-4" />
                            </span>
                        </div>

                        <div className="mt-4">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                {item.title}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                                {item.description}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );
}
