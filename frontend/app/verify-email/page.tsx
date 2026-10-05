import { Suspense } from "react";
import { VerifyEmailView } from "@/features/auth";
import { Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-dvh items-center justify-center bg-white dark:bg-slate-950">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            }
        >
            <VerifyEmailView />
        </Suspense>
    );
}
