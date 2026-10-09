"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    CheckCircle2,
    Database,
    Eye,
    FileText,
    Layers,
    Lock,
    Printer,
    Search,
    Server,
    ShieldCheck,
    UserCheck,
} from "lucide-react";
import { useAppSettings } from "@/context";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { resolveBrandAssetUrl } from "@/lib/utils/format";

const SECTIONS = [
    { id: "overview", title: "1. Overview & Scope" },
    { id: "collection", title: "2. Information We Collect" },
    { id: "usage", title: "3. How We Use Your Data" },
    { id: "sharing", title: "4. Third-Party Sharing & Disclosure" },
    { id: "security", title: "5. Data Security & Encryption" },
    { id: "retention", title: "6. Data Retention & Archival" },
    { id: "rights", title: "7. User Rights & Privacy Controls" },
    { id: "cookies", title: "8. Cookies & Local Storage" },
    { id: "contact", title: "9. Contact & Compliance" },
];

export function PrivacyPolicyView() {
    const { platformName, brandLogoDark, brandLogoLight } = useAppSettings();
    const appName = platformName || "CourseDesk";
    const logoUrl = brandLogoDark || brandLogoLight ? resolveBrandAssetUrl(brandLogoDark || brandLogoLight) : "";
    const [logoError, setLogoError] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeSection, setActiveSection] = useState("overview");

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
                            Legal &amp; Privacy
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/terms"
                            className="hidden text-xs font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 sm:block transition-colors"
                        >
                            Terms of Service
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
                        <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        Privacy &amp; Data Protection
                    </div>
                    <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
                        Privacy Policy
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
                        Your privacy, academic records, and personal integrity are essential to us.
                        Learn how {appName} collects, safeguards, and handles your information.
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
                            Print Policy
                        </button>
                    </div>

                    {/* Nav Switch between Privacy and Terms */}
                    <div className="mt-8 flex justify-center">
                        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
                            <span className="rounded-lg bg-white px-4 py-1.5 text-xs font-bold text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400">
                                Privacy Policy
                            </span>
                            <Link
                                href="/terms"
                                className="rounded-lg px-4 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                            >
                                Terms of Service
                            </Link>
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

                            {/* Trust Badge Box */}
                            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                                <div className="flex items-center gap-2 font-bold">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    <span>Zero Data Selling Pledge</span>
                                </div>
                                <p className="mt-1 text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-400/90">
                                    {appName} never monetizes, sells, or rents personal student or faculty data to advertising brokers.
                                </p>
                            </div>
                        </div>
                    </aside>

                    {/* Right Body Text */}
                    <div className="space-y-10 lg:col-span-8">
                        {/* Section 1 */}
                        <section
                            id="overview"
                            className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
                        >
                            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                                <Eye className="h-5 w-5" />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    1. Overview &amp; Scope
                                </h2>
                            </div>
                            <div className="mt-4 space-y-3.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                <p>
                                    Welcome to <strong>{appName}</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;the Platform&quot;).
                                    This Privacy Policy explains how personal data is collected, stored, processed, and safeguarded when
                                    instructors, learners, program coordinators, and institution administrators interact with our course
                                    management services, assignment portals, and communication interfaces.
                                </p>
                                <p>
                                    By creating an account, accessing courses, or submitting coursework on {appName}, you agree
                                    to the practices outlined in this policy. If you are accessing {appName} through an academic
                                    institution or corporate learning sponsor, their institutional policies may also apply in conjunction
                                    with this document.
                                </p>
                            </div>
                        </section>

                        {/* Section 2 */}
                        <section
                            id="collection"
                            className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
                        >
                            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                                <Database className="h-5 w-5" />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    2. Information We Collect
                                </h2>
                            </div>
                            <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                <p>We collect information in three categories to deliver educational workflows effectively:</p>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                                        <h3 className="font-semibold text-slate-900 dark:text-white">
                                            Account &amp; Identity Data
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                            Full name, institutional email address, hashed passwords, avatar photographs, user roles (Admin, Coordinator, Instructor, Learner), and enrolled cohort IDs.
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                                        <h3 className="font-semibold text-slate-900 dark:text-white">
                                            Academic &amp; Coursework Submissions
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                            Uploaded assignment files (PDF, ZIP, DOCX, code repositories), grading rubrics, instructor feedback notes, submission timestamps, and peer reviews.
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                                        <h3 className="font-semibold text-slate-900 dark:text-white">
                                            Activity &amp; Engagement Logs
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                            Course module completion status, quiz attempts, login history, last active timestamps, and user-initiated notification preferences.
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                                        <h3 className="font-semibold text-slate-900 dark:text-white">
                                            Technical &amp; Device Information
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                            Browser version, operating system, IP address (truncated for security anomaly detection), session tokens, and crash diagnostics.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 3 */}
                        <section
                            id="usage"
                            className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
                        >
                            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                                <UserCheck className="h-5 w-5" />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    3. How We Use Your Data
                                </h2>
                            </div>
                            <div className="mt-4 space-y-3.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                <ul className="list-disc space-y-2 pl-5">
                                    <li>
                                        <strong>Educational Delivery:</strong> Enabling instructors to publish syllabus materials, evaluate submitted assignments, assign marks, and conduct grading sessions.
                                    </li>
                                    <li>
                                        <strong>Account Security &amp; Verification:</strong> Validating multi-factor authentication codes (OTP), protecting against brute-force login attempts, and issuing password reset tokens.
                                    </li>
                                    <li>
                                        <strong>Platform Administration:</strong> Permitting program coordinators and system administrators to oversee cohort progress, allocate teaching resources, and generate performance summaries.
                                    </li>
                                    <li>
                                        <strong>Service Notifications:</strong> Sending automated email alerts for new assignments, upcoming deadlines, published grades, and maintenance broadcasts.
                                    </li>
                                </ul>
                            </div>
                        </section>

                        {/* Section 4 */}
                        <section
                            id="sharing"
                            className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
                        >
                            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                                <Server className="h-5 w-5" />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    4. Third-Party Sharing &amp; Disclosure
                                </h2>
                            </div>
                            <div className="mt-4 space-y-3.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                <p>
                                    We do <strong>not</strong> sell personal student or staff data to data brokers or advertisers under any circumstances. We share information strictly with vetted service providers required to operate the infrastructure:
                                </p>
                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                                    <ul className="space-y-2 text-xs">
                                        <li>
                                            <strong>Cloud Storage &amp; Hosting:</strong> Managed cloud providers (e.g., Cloudflare R2 / AWS S3) for secure storage of submitted files and system backups.
                                        </li>
                                        <li>
                                            <strong>Email Dispatch Providers:</strong> Transactional email relays for sending password reset links and account verification OTPs.
                                        </li>
                                        <li>
                                            <strong>Institutional Stakeholders:</strong> Authorised representatives from your registered school, university, or company cohort coordinator.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Section 5 */}
                        <section
                            id="security"
                            className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
                        >
                            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                                <Lock className="h-5 w-5" />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    5. Data Security &amp; Encryption
                                </h2>
                            </div>
                            <div className="mt-4 space-y-3.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                <p>
                                    {appName} enforces defense-in-depth security standards to protect academic confidentiality:
                                </p>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-xl border border-slate-200/60 bg-white p-3.5 text-center dark:border-slate-800 dark:bg-slate-800">
                                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">TLS 1.3</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">Encryption in Transit</div>
                                    </div>
                                    <div className="rounded-xl border border-slate-200/60 bg-white p-3.5 text-center dark:border-slate-800 dark:bg-slate-800">
                                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">AES-256</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">Encryption at Rest</div>
                                    </div>
                                    <div className="rounded-xl border border-slate-200/60 bg-white p-3.5 text-center dark:border-slate-800 dark:bg-slate-800">
                                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">Argon2 / Bcrypt</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">Salted Password Hashing</div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    All database connections utilize parameterized queries and strict role-based access control (RBAC) ensuring users cannot inspect records outside their authorized scope.
                                </p>
                            </div>
                        </section>

                        {/* Section 6 */}
                        <section
                            id="retention"
                            className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
                        >
                            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                                <Database className="h-5 w-5" />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    6. Data Retention &amp; Archival
                                </h2>
                            </div>
                            <div className="mt-4 space-y-3.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                <p>
                                    Academic coursework and submission files are retained for the duration of the active academic term plus an archival retention window determined by institutional audit guidelines (typically 1 to 5 years).
                                </p>
                                <p>
                                    Inactive guest or demo accounts created for evaluation purposes may be pruned after 90 days of inactivity. Upon formal graduation or account deactivation, students may request an export of their submitted coursework portfolio.
                                </p>
                            </div>
                        </section>

                        {/* Section 7 */}
                        <section
                            id="rights"
                            className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
                        >
                            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                                <ShieldCheck className="h-5 w-5" />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    7. User Rights &amp; Privacy Controls
                                </h2>
                            </div>
                            <div className="mt-4 space-y-3.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                <p>Depending on your jurisdiction, you maintain specific rights concerning your educational record:</p>
                                <ul className="list-disc space-y-1.5 pl-5">
                                    <li><strong>Right of Access:</strong> Review your stored profile information and complete submission record.</li>
                                    <li><strong>Right to Rectification:</strong> Request correction of inaccurate biographical or academic metadata.</li>
                                    <li><strong>Right to Data Portability:</strong> Download a copy of your submitted files and assessment feedback.</li>
                                    <li><strong>Right to Deletion:</strong> Request account erasure subject to mandatory institutional grade retention policies.</li>
                                </ul>
                            </div>
                        </section>

                        {/* Section 8 */}
                        <section
                            id="cookies"
                            className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
                        >
                            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                                <FileText className="h-5 w-5" />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    8. Cookies &amp; Local Storage
                                </h2>
                            </div>
                            <div className="mt-4 space-y-3.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                <p>
                                    {appName} uses strictly necessary session storage and local cookies to power platform features:
                                </p>
                                <ul className="list-disc space-y-1.5 pl-5 text-xs text-slate-600 dark:text-slate-400">
                                    <li><code>access_token</code>: Secure HTTP-only or authorization header cookie to maintain your authenticated login session.</li>
                                    <li><code>coursedesk_theme</code>: Remembers your preferred appearance (light mode, dark mode, or system default).</li>
                                    <li><code>coursedesk_public_settings</code>: Caches platform branding and site name for seamless navigation.</li>
                                </ul>
                                <p className="text-xs">
                                    We do not inject third-party ad tracking pixels or behavioral profiling cookies.
                                </p>
                            </div>
                        </section>

                        {/* Section 9 */}
                        <section
                            id="contact"
                            className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
                        >
                            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                                <Lock className="h-5 w-5" />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    9. Contact &amp; Compliance Inquiries
                                </h2>
                            </div>
                            <div className="mt-4 space-y-3.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                <p>
                                    If you have questions regarding this Privacy Policy, wish to exercise privacy rights, or need to report an academic security vulnerability, please contact our privacy desk:
                                </p>
                                <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-xs dark:border-blue-900/50 dark:bg-blue-950/30">
                                    <div className="font-semibold text-slate-900 dark:text-slate-100">{appName} Data Governance &amp; Security</div>
                                    <div className="mt-1 text-slate-600 dark:text-slate-400">Email: <a href="mailto:privacy@coursedesk.com" className="font-medium text-blue-600 hover:underline dark:text-blue-400">privacy@coursedesk.com</a></div>
                                    <div className="mt-0.5 text-slate-600 dark:text-slate-400">Academic Support: <a href="mailto:support@coursedesk.com" className="font-medium text-blue-600 hover:underline dark:text-blue-400">support@coursedesk.com</a></div>
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
                                    Sign in to your account or review our Terms of Service.
                                </p>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <Link
                                    href="/terms"
                                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
                                >
                                    Terms of Service
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
                        <Link href="/privacy" className="font-semibold text-blue-600 dark:text-blue-400">Privacy Policy</Link>
                        <span>•</span>
                        <Link href="/terms" className="hover:text-slate-800 dark:hover:text-slate-200">Terms of Service</Link>
                        <span>•</span>
                        <Link href="/" className="hover:text-slate-800 dark:hover:text-slate-200">Sign in</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
