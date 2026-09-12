import type { ReactNode } from "react";

interface IconButtonProps {
    label: string;
    onClick?: () => void;
    className?: string;
    children: ReactNode;
}

export function IconButton({ label, onClick, className = "", children }: IconButtonProps) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={onClick}
            className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-900/10 ${className}`}
        >
            {children}
        </button>
    );
}