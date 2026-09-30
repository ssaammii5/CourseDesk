const ACCESS_TOKEN_KEY = "ecp_access_token";
const REFRESH_TOKEN_KEY = "ecp_refresh_token";

function isBrowser(): boolean {
    return typeof window !== "undefined";
}

export function getAccessToken(): string | null {
    if (!isBrowser()) return null;
    try {
        return window.localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
        return null;
    }
}

export function getRefreshToken(): string | null {
    if (!isBrowser()) return null;
    try {
        return window.localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
        return null;
    }
}

export function setTokens(accessToken: string, refreshToken: string): void {
    if (!isBrowser()) return;
    try {
        window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch {
        // ignore storage write errors (e.g. incognito quota)
    }
}

export function clearSession(): void {
    if (!isBrowser()) return;
    try {
        window.localStorage.removeItem(ACCESS_TOKEN_KEY);
        window.localStorage.removeItem(REFRESH_TOKEN_KEY);
        window.dispatchEvent(new Event("ecp_session_cleared"));
    } catch {
        // ignore storage errors
    }
}

export function hasAccessToken(): boolean {
    return Boolean(getAccessToken());
}