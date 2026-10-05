"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getMeRequest, loginRequest, logoutRequest } from "@/lib/api/auth";
import { clearSession, getAccessToken, setTokens } from "@/lib/auth/session";
import {
    avatarClassFor,
    mapRole,
    type CurrentUser,
} from "@/types";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
    user: CurrentUser | null;
    status: AuthStatus;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<CurrentUser | null>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function toCurrentUser(source: {
    id?: number;
    name: string;
    email: string;
    role: string;
    learnerDetails?: CurrentUser["learnerDetails"];
    instructorDetails?: CurrentUser["instructorDetails"];
    studentDetails?: CurrentUser["studentDetails"];
    teacherDetails?: CurrentUser["teacherDetails"];
}): CurrentUser {
    const role = mapRole(source.role);
    const learnerDetails = source.learnerDetails || source.studentDetails;
    const instructorDetails = source.instructorDetails || source.teacherDetails;
    const avatar = (source as any).avatar || instructorDetails?.avatar || learnerDetails?.avatar || "";
    return {
        id: source.id,
        name: source.name,
        email: source.email,
        role,
        avatarClass: avatarClassFor(role),
        avatar,
        learnerDetails,
        instructorDetails,
        studentDetails: learnerDetails,
        teacherDetails: instructorDetails,
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [status, setStatus] = useState<AuthStatus>("loading");

    // On first load, restore the session from the stored access token.
    useEffect(() => {
        let isMounted = true;

        // Safety fallback: if anything hangs (e.g. stalled network), fall back to unauthenticated after 4s
        const safetyTimeout = window.setTimeout(() => {
            if (isMounted) {
                setStatus((prev) => (prev === "loading" ? "unauthenticated" : prev));
            }
        }, 4000);

        const bootstrap = async () => {
            try {
                const token = getAccessToken();
                if (!token) {
                    if (isMounted) setStatus("unauthenticated");
                    return;
                }

                try {
                    const me = await getMeRequest();
                    if (isMounted) {
                        setUser(toCurrentUser(me));
                        setStatus("authenticated");
                    }
                } catch {
                    clearSession();
                    if (isMounted) {
                        setUser(null);
                        setStatus("unauthenticated");
                    }
                }
            } catch {
                if (isMounted) {
                    setUser(null);
                    setStatus("unauthenticated");
                }
            } finally {
                window.clearTimeout(safetyTimeout);
            }
        };

        void bootstrap();
        return () => {
            isMounted = false;
            window.clearTimeout(safetyTimeout);
        };
    }, []);

    useEffect(() => {
        const onSessionCleared = () => {
            setUser(null);
            setStatus("unauthenticated");
        };
        window.addEventListener("ecp_session_cleared", onSessionCleared);
        return () => window.removeEventListener("ecp_session_cleared", onSessionCleared);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const response = await loginRequest(email, password);
        const accessToken = response.accessToken || response.token;
        setTokens(accessToken, response.refreshToken);
        try {
            const me = await getMeRequest();
            setUser(toCurrentUser(me));
        } catch {
            setUser(toCurrentUser(response));
        }
        setStatus("authenticated");
    }, []);

    const logout = useCallback(async () => {
        try {
            await logoutRequest();
        } catch {
            // Even if revoking server-side fails, we still clear the local session.
        }
        clearSession();
        setUser(null);
        setStatus("unauthenticated");
    }, []);

    const refreshUser = useCallback(async () => {
        try {
            const me = await getMeRequest();
            const curr = toCurrentUser(me);
            setUser(curr);
            return curr;
        } catch {
            return null;
        }
    }, []);

    const value = useMemo(
        () => ({ user, status, login, logout, refreshUser }),
        [user, status, login, logout, refreshUser],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return ctx;
}

/**
 * Client-side route guard for the dashboard. Renders children only once the
 * user is authenticated; redirects to / otherwise.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
    const { status } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-[#1a73e8]" />
            </div>
        );
    }

    if (status === "unauthenticated") {
        return null;
    }

    return <>{children}</>;
}
