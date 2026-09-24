// components/admin/StatusBadge.tsx

interface StatusBadgeProps {
    status: string;
    variant?: "success" | "warning" | "danger" | "info" | "neutral";
}

const VARIANT_CLASSES: Record<string, string> = {
    success: "bg-[#e6f4ea] text-[#137333] dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-800/40",
    warning: "bg-[#fef7e0] text-[#b06000] dark:bg-amber-950/60 dark:text-amber-300 dark:border dark:border-amber-800/40",
    danger: "bg-[#fce8e6] text-[#c5221f] dark:bg-rose-950/60 dark:text-rose-300 dark:border dark:border-rose-800/40",
    info: "bg-[#e8f0fe] text-[#174ea6] dark:bg-blue-950/60 dark:text-blue-300 dark:border dark:border-blue-800/40",
    neutral: "bg-[#e8eaed] text-[#3c4043] dark:bg-slate-800 dark:text-slate-300 dark:border dark:border-slate-700/50",
};

function getVariant(status: string): string {
    const lower = status.toLowerCase();
    if (["active", "published", "graded", "turned in", "done"].includes(lower)) return "success";
    if (["draft", "submitted", "assigned"].includes(lower)) return "info";
    if (["pending"].includes(lower)) return "warning";
    if (["inactive", "missing", "overdue"].includes(lower)) return "danger";
    return "neutral";
}

export function StatusBadge({ status, variant }: StatusBadgeProps) {
    const v = variant ?? getVariant(status);
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANT_CLASSES[v]}`}>
            {status}
        </span>
    );
}