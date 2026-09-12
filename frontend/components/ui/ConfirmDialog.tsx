// components/admin/ConfirmDialog.tsx
"use client";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: "danger" | "default";
}

export function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
    variant = "default",
}: ConfirmDialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-gray-700">{message}</p>
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="cursor-pointer rounded-full border border-gray-400 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`cursor-pointer rounded-full px-5 py-2 text-sm font-medium text-white ${variant === "danger"
                                ? "bg-[#c5221f] hover:bg-[#a31815]"
                                : "bg-[#1a63d8] hover:bg-[#1554b5]"
                            }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}