// frontend/lib/api/client.ts
import { clearSession, getAccessToken, getRefreshToken, setTokens } from "@/lib/auth/session";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

interface ApiFetchOptions extends RequestInit {
    auth?: boolean;
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshTokens(): Promise<boolean> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;
    try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        const nextAccess = data.accessToken ?? data.token;
        const nextRefresh = data.refreshToken;
        if (!nextAccess || !nextRefresh) return false;
        setTokens(nextAccess, nextRefresh);
        return true;
    } catch {
        return false;
    }
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
    const { auth = true, headers, body, ...rest } = options;

    if (auth && !getAccessToken() && !getRefreshToken()) {
        clearSession();
        throw new ApiError(401, "No authentication token found");
    }

    const buildHeaders = (token: string | null): Headers => {
        const h = new Headers(headers);
        // Don't set Content-Type for FormData, let the browser set it with the correct boundary
        if (body !== undefined && !(body instanceof FormData) && !h.has("Content-Type")) {
            h.set("Content-Type", "application/json");
        }
        if (auth && token) h.set("Authorization", `Bearer ${token}`);
        return h;
    };

    const doFetch = (token: string | null) =>
        fetch(`${API_URL}${path}`, { ...rest, body, headers: buildHeaders(token) });

    let response = await doFetch(auth ? getAccessToken() : null);

    if (response.status === 401 && auth) {
        if (!refreshPromise) {
            refreshPromise = tryRefreshTokens().finally(() => {
                refreshPromise = null;
            });
        }
        const refreshed = await refreshPromise;
        if (refreshed) response = await doFetch(getAccessToken());
        else clearSession();
    }

    if (!response.ok) {
        let message = `Request failed with status ${response.status}`;
        try {
            const errorBody = await response.json();
            if (errorBody && typeof errorBody.error === "string") message = errorBody.error;
            else if (errorBody && typeof errorBody.detail === "string") message = errorBody.detail;
            else if (errorBody && typeof errorBody.title === "string") message = errorBody.title;
        } catch { }
        throw new ApiError(response.status, message);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
}