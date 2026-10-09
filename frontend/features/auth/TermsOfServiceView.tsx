"use client";

import { useState } from "react";
import Link from "next/link";
import {
    AlertCircle,
    ArrowLeft,
    BookOpen,
    CheckCircle2,
    FileText,
    HelpCircle,
    Layers,
    Lock,
    Printer,
    Scale,
    Search,
    ShieldAlert,
    Users,
} from "lucide-react";
import { useAppSettings } from "@/context";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { resolveBrandAssetUrl } from "@/lib/utils/format";

const SECTIONS = [
    { id: "acceptance", title: "1. Acceptance of Terms" },
    { id: "eligibility", title: "2. Eligibility & Accounts" },
    { id: "roles", title: "3. User Roles & Governance" },
    { id: "conduct", title: "4. Academic Integrity & Conduct" },
    { id: "intellectual-property", title: "5. Intellectual Property & Coursework" },
    { id: "submissions", title: "6. Assignments & Submissions" },
    { id: "availability", title: "7. Platform Availability & Maintenance" },
    { id: "liability", title: "8. Disclaimers & Limitations" },
    { id: "termination", title: "9. Termination & Account Suspension" },
    { id: "contact", title: "10. Contact Information" },
];

export function TermsOfServiceView() {
    const { platformName, brandLogoDark, brandLogoLight } = useAppSettings();
    const appName = platformName || "CourseDesk";
    const logoUrl = brandLogoDark || brandLogoLight ? resolveBrandAssetUrl(brandLogoDark || brandLogoLight) : "";
    const [logoError, setLogoError] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeSection, setActiveSection] = useState("acceptance");

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 transition-colors dark:bg-slate-950 dark:text-slate-100">
            {/* Top Navigation */}
            <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
                            title={`Back to ${appName} Home`}
                        >
                            {logoUrl && !logoError ? (
                                <img
                                    src={logoUrl}
                                    alt={appName}
                                    onError={() => setLogoError(true)}
                                    className="h-8 max-w-[150px] object-contain"
                                />
                            ) : (
                                <>
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/25">
                                        <Layers className="h-5 w-5" />
                                    </span>
                                    <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                                        {appName}
                                    </span>
                                </>
                            )}
                        </Link>
                        <span className="hidden h-5 w-px bg-slate-200 dark:bg-slate-700 sm:block" />
                        <span className="hidden text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 sm:block">
                            Legal &amp; Terms
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/privacy"
                            className="hidden text-xs font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 sm:block transition-colors"
                        >
                            Privacy Policy
                        </Link>
                        <ThemeToggle />
                        <Link
                            href="/"
                            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-blue-400"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            <span>Back to Sign in</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Banner */}
            <div className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-blue-50/70 via-white to-slate-50 px-4 py-12 dark:border-slate-800/80 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
                        <Scale className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        Platform Agreement
                    </div>
                    <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
                        Terms of Service
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
                        These terms establish the rules, expectations, and academic guidelines for all users
                        collaborating on {appName}.
                    </p>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <span className="rounded-lg bg-slate-200/70 px-2.5 py-1 dark:bg-slate-800">
                            Effective: October 1, 2026
                        </span>
                        <span>•</span>
                        <span className="rounded-lg bg-slate-200/70 px-2.5 py-1 dark:bg-slate-800">
                            Version 2.4 (Demo LMS)
                        </span>
                        <span>•</span>
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:border-slate-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-blue-400 transition"
                        >
                            <Printer className="h-3.5 w-3.5" />
                            Print Terms
                        </button>
                    </div>

                    {/* Nav Switch between Privacy and Terms */}
                    <div className="mt-8 flex justify-center">
                        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
                            <Link
                                href="/privacy"
                                className="rounded-lg px-4 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                            >
                                Privacy Policy
                            </Link>
                            <span className="rounded-lg bg-white px-4 py-1.5 text-xs font-bold text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400">
                                Terms of Service
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                    {/* Left Sticky Sidebar (Table of Contents) */}
                    <aside className="hidden lg:col-span-4 lg:block">
                        <div className="sticky top-24 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Filter sections..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:border-blue-400"
                                    />
                                </div>
                            </div>

                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Document Index
                            </p>
                            <nav className="mt-3 space-y-1">
                                {SECTIONS.filter((s) =>
                                    s.title.toLowerCase().includes(searchQuery.toLowerCase())
                                ).map((sec) => (
                                    <button
                                        key={sec.id}
                                        type="button"
                                        onClick={() => scrollToSection(sec.id)}
                                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition-all ${
                                            activeSection === sec.id
                                                ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
                                        }`}
                                    >
                                        <span className="truncate">{sec.title}</span>
                                        {activeSection === sec.id && (
                                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600 dark:bg-blue-400" />
                                        )}
                                    </button>
                                ))}
                            </nav>

                            {/* Academic Integrity Highlight Box */}
                            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
                                <div className="flex items-center gap-2 font-bold">
                                    <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <span>Academic Honor Code</span>
                                </div>
                                <p className="mt-1 text-[11px] leading-relaxed text-blue-800 dark:text-blue-400/90">
                                    All coursework submitted through {appName} must be original student work, unless explicitly designated as collaborative group study.
                                </p>
                            </div>
                        </div>
                    </aside>

                    {/* Right Body Text */}
                    <div className="space-y-10 lg:col-span-8">
                        {/* Section 1 */}
                        <section
                            id="acceptance"
                            className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
                        >
                            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                                <CheckCircle2 className="h-5 w-5" />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    1. Acceptance of Terms
                                </h2>
                            </div>
                            <div className="mt-4 space-y-3.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                <p>
                                    By accessing or utilizing <strong>{appName}</strong> (&quot;the Platform&quot;, &quot;Service&quot;),
                                    you confirm that you have read, understood, and agreed to be legally bound by these Terms of Service,
                                    together with our <Link href="/privacy" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">Privacy Policy</Link>.
                                </p>
                                <p>
                                    If you are enrolling on behalf of an educational institution, program coordinator, or organizational
                                    sponsor, you represent that you possess the authority to bind that entity to these Terms. If you do
                                    not agree, you must discontinue using {appName} immediately.
                                </p>
                            </div>
                        </section>

                        {/* Section 2 */}
                        <section
                            id="eligibility"
                            className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
                        >
                            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                                <Users className="h-5 w-5" />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    2. Eligibility &amp; Accounts
                                </h2>
                            </div>
                            <div className="mt-4 space-y-3.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                <p>
                                    Users must provide accurate, current, and complete registration information during account creation.
                                    You are solely responsible for preserving the confidentiality of your login credentials and for all
                                    actions performed under your account.
                                </p>
                                <ul className="list-disc space-y-1.5 pl-5">
                                    <li>Credentials may not be shared between multiple individuals or used concurrently across cohorts.</li>
                                    <li>You must immediately inform administrative staff if you suspect unauthorized account access.</li>
                                    <li>Automated bot signups or credential stuffing attempts are strictly prohibited.</li>
                                </ul>
                            </div>
                        </section>

                        {/* Section 3 */}
                        <section
                            id="roles"
                            className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
                        >
                            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                                <Lock className="h-5 w-5" />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    3. User Roles &amp; Governance
                                </h2>
                            </div>
                            <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                <p>{appName} provides differentiated role privileges with distinct responsibilities:</p>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                                        <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                                            Platform Administrator
                                        </div>
                                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                            Manages system settings, cohort allocation, global user provisioning, and maintenance broadcasts.
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-4 dark:border-sky-900/40 dark:bg-sky-950/20">
                                        <div className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                                            Program Coordinator
                                        </div>
                                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                            Oversees instructional timelines, course curriculum tracks, enrollment quotas, and grading audits.
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                                        <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                            Course Instructor
                                        </div>
                                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                            Publishes assignments, defines rubrics, evaluates learner submissions, and delivers feedback.
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                                        <div className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                            Active Learner
                                        </div>
                                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                            Enrolls in assigned learning paths, reviews learning materials, and submits coursework on time.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 4 */}
                        <section
                            id="conduct"
                            className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
                        >
                            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                                <ShieldAlert className="h-5 w-5" />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    4. Academic Integrity &amp; Acceptable Use
                                </h2>
                            </div>
                            <div className="mt-4 space-y-3.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                <p>Users agree NOT to engage in any of the following prohibited behaviors:</p>
                                <ul className="list-disc space-y-2 pl-5 text-xs sm:text-sm">
                                    <li>Submitting plagiarized, ghostwritten, or unauthorized third-party content without formal citation.</li>
                                    <li>Distributing instructor answer keys, exam repositories, or solution manuals outside the class cohort.</li>
                                    <li>Harassing, threatening, or impersonating other learners, faculty, or system administrators.</li>
                                    <li>Attempting to probe, scan, or exploit security vulnerabilities or bypass authentication controls.</li>
                                    <li>Uploading malicious code, trojans, corrupted archive files, or disproportionately large payload attacks.</li>
                                </ul>
                            </div>
                        </section>

                        {/* Section 5 */}
                        <section
                            id="intellectual-property"
                            className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
                        >
                            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                                <FileText className="h-5 w-5" />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    5. Intellectual Property &amp; Coursework Ownership
                                </h2>
                            </div>
                            <div className="mt-4 space-y-3.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                <p>
                                    <strong>Learner Intellectual Property:</strong> Learners retain copyright and full intellectual ownership of original coursework, code projects, and media submitted through the Platform. By submitting work, learners grant instructors and the institution a limited license solely for evaluation, grading, and plagiarism verification.
                                </p>
                                <p>
                                    <strong>Platform &amp; Instructor Materials:</strong> All course lecture slides, syllabi, software codebases, and platform UI designs provided on {appName} remain the intellectual property of {appName} or the respective instructor/institution and may not be redistributed commercially.
                                </p>
                            </div>
                        </section>

                        {/* Section 6 */}
                        <section
                            id="submissions"
                            className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
                        >
                            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                                <BookOpen className="h-5 w-5" />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    6. Assignments, Deadlines &amp; Grading
                                </h2>
                            </div>
                            <div className="mt-4 space-y-3.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                <p>
                                    Submission deadlines are governed by the server timestamp registered in the platform database. {appName} provides visual delivery receipts and submission verification records upon upload completion.
                                </p>
                                <p>
                                    Evaluation scores, grading scales, feedback criteria, and grade adjustments remain under the sole pedagogical discretion of course instructors and academic department chairs.
                                </p>
                            </div>
                        </section>

                        {/* Section 7 */}
                        <section
                            id="availability"
                            className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
                        >
                            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                                <AlertCircle className="h-5 w-5" />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    7. Platform Availability &amp; Maintenance
                                </h2>
                            </div>
                            <div className="mt-4 space-y-3.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                <p>
                                    While we target 99.9% platform availability, {appName} may occasionally undergo scheduled maintenance, infrastructure updates, or security patches. Maintenance notices are broadcast in advance via the system banner.
                                </p>
                                <p>
                                    We encourage learners to avoid submitting critical assignments at the final minute to protect against local network interruptions or unexpected connectivity issues.
                                </p>
                            </div>
                        </section>

                        {/* Section 8 */}
                        <section
                            id="liability"
                            className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
                        >
                            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                                <Scale className="h-5 w-5" />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    8. Disclaimers &amp; Limitations of Liability
                                </h2>
                            </div>
                            <div className="mt-4 space-y-3.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                                    Warranty Disclaimer
                                </p>
                                <p>
                                    {appName} is provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of any kind, whether express or implied. In no event will {appName} or its developers be held liable for indirect, incidental, punitive, or consequential damages resulting from lost course submissions, interrupted tests, or network failures.
                                </p>
                            </div>
                        </section>

                        {/* Section 9 */}
                        <section
                            id="termination"
                            className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
                        >
                            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                                <Lock className="h-5 w-5" />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    9. Termination &amp; Account Suspension
                                </h2>
                            </div>
                            <div className="mt-4 space-y-3.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                <p>
                                    Platform administrators reserve the right to temporarily suspend or permanently terminate access to {appName} for accounts that repeatedly breach the Academic Honor Code, attempt security bypasses, or violate these Terms.
                                </p>
                                <p>
                                    Upon account termination, access to pending course modules and assignment submission portals will be revoked, while archived grades may be preserved for regulatory compliance.
                                </p>
                            </div>
                        </section>

                        {/* Section 10 */}
                        <section
                            id="contact"
                            className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
                        >
                            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                                <HelpCircle className="h-5 w-5" />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    10. Contact &amp; Governance
                                </h2>
                            </div>
                            <div className="mt-4 space-y-3.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                <p>
                                    For inquiries regarding these Terms of Service, institutional licensing, or platform policy clarifications:
                                </p>
                                <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-xs dark:border-blue-900/50 dark:bg-blue-950/30">
                                    <div className="font-semibold text-slate-900 dark:text-slate-100">{appName} Legal &amp; Student Affairs</div>
                                    <div className="mt-1 text-slate-600 dark:text-slate-400">Email: <a href="mailto:legal@coursedesk.com" className="font-medium text-blue-600 hover:underline dark:text-blue-400">legal@coursedesk.com</a></div>
                                    <div className="mt-0.5 text-slate-600 dark:text-slate-400">General Support: <a href="mailto:support@coursedesk.com" className="font-medium text-blue-600 hover:underline dark:text-blue-400">support@coursedesk.com</a></div>
                                </div>
                            </div>
                        </section>

                        {/* Return to Sign in CTA */}
                        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 text-center sm:flex-row sm:text-left dark:border-blue-900/60 dark:from-slate-900 dark:to-blue-950/40">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">
                                    Ready to access your learning portal?
                                </h3>
                                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                                    Sign in to your account or review our Privacy Policy.
                                </p>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <Link
                                    href="/privacy"
                                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
                                >
                                    Privacy Policy
                                </Link>
                                <Link
                                    href="/"
                                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition"
                                >
                                    Sign in Now
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-16 border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p>&copy; {new Date().getFullYear()} {appName}. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                        <Link href="/privacy" className="hover:text-slate-800 dark:hover:text-slate-200">Privacy Policy</Link>
                        <span>•</span>
                        <Link href="/terms" className="font-semibold text-blue-600 dark:text-blue-400">Terms of Service</Link>
                        <span>•</span>
                        <Link href="/" className="hover:text-slate-800 dark:hover:text-slate-200">Sign in</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
