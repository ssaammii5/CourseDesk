"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
    getPublicPlatformSettingsRequest,
    type PublicPlatformSettingsDto,
} from "@/lib/api/appSettings";
import { resolveBrandAssetUrl } from "@/lib/utils/format";

const SETTINGS_STORAGE_KEY = "coursedesk_public_settings";

interface AppSettingsContextType {
    platformName: string;
    siteName: string;
    platformTagline: string;
    brandLogoLight: string;
    brandLogoDark: string;
    brandFavicon: string;
    maintenanceMode: boolean;
    maintenanceBannerMessage: string;
    isLoading: boolean;
    refreshSettings: () => Promise<void>;
}

export const defaultSettings: PublicPlatformSettingsDto = {
    platformName: "CourseDesk",
    siteName: "CourseDesk",
    platformTagline: "Learning Platform",
    brandLogoLight: "/brand/logo-light.svg",
    brandLogoDark: "/brand/logo-dark.svg",
    brandFavicon: "/brand/favicon.svg",
    maintenanceMode: false,
    maintenanceBannerMessage:
        "CourseDesk is currently undergoing scheduled maintenance. Normal access will resume shortly.",
};

export function getCachedSettings(): PublicPlatformSettingsDto {
    if (typeof window === "undefined") return defaultSettings;
    try {
        const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                ...defaultSettings,
                ...parsed,
            };
        }
    } catch {}
    return defaultSettings;
}

export function updateDocumentTitleAndFavicon(settings: PublicPlatformSettingsDto) {
    if (typeof document === "undefined") return;
    const brand = (settings.platformName || "CourseDesk").trim();
    const tagline = (settings.platformTagline || "").trim();
    const targetTitle = tagline ? `${brand} - ${tagline}` : brand;
    if (document.title !== targetTitle) {
        document.title = targetTitle;
    }
    applyFavicon(settings.brandFavicon);
}

export function applyFavicon(faviconUrl?: string | null) {
    if (typeof document === "undefined") return;
    const raw = (faviconUrl || "").trim() || "/brand/favicon.svg";
    const resolved = resolveBrandAssetUrl(raw);

    let mimeType = "image/x-icon";
    const lower = resolved.toLowerCase();
    if (lower.endsWith(".svg") || lower.includes("image/svg+xml")) {
        mimeType = "image/svg+xml";
    } else if (lower.endsWith(".png") || lower.includes("image/png")) {
        mimeType = "image/png";
    } else if (lower.endsWith(".webp") || lower.includes("image/webp")) {
        mimeType = "image/webp";
    } else if (lower.endsWith(".gif")) {
        mimeType = "image/gif";
    }

    // Safely update existing link tags in-place without removing them from DOM
    // (calling .remove() on nodes tracked by React causes "Cannot read properties of null (reading 'removeChild')")
    const existingIcons = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
    if (existingIcons.length > 0) {
        existingIcons.forEach((el) => {
            if (el.getAttribute("href") !== resolved) {
                el.setAttribute("href", resolved);
            }
            if (el.type !== mimeType) {
                el.type = mimeType;
            }
            if (mimeType === "image/svg+xml") {
                el.setAttribute("sizes", "any");
            } else {
                el.removeAttribute("sizes");
            }
        });
    } else {
        const link = document.createElement("link");
        link.id = "coursedesk-favicon";
        link.rel = "icon";
        link.type = mimeType;
        if (mimeType === "image/svg+xml") {
            link.setAttribute("sizes", "any");
        }
        link.href = resolved;
        document.head.appendChild(link);
    }
}

const AppSettingsContext = createContext<AppSettingsContextType>({
    ...defaultSettings,
    isLoading: false,
    refreshSettings: async () => {},
});

export function AppSettingsProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [settings, setSettings] = useState<PublicPlatformSettingsDto>(() => getCachedSettings());
    const [isLoading, setIsLoading] = useState(false);

    const refreshSettings = useCallback(async () => {
        try {
            const data = await getPublicPlatformSettingsRequest();
            setSettings(data);
            if (typeof window !== "undefined") {
                try {
                    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data));
                } catch {}
            }
            updateDocumentTitleAndFavicon(data);
        } catch {
            // Keep existing or cached settings
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial immediate sync from cache + background fetch
    useEffect(() => {
        const cached = getCachedSettings();
        updateDocumentTitleAndFavicon(cached);
        void refreshSettings();
    }, [refreshSettings]);

    // Keep title & favicon in sync on client-side route transitions
    useEffect(() => {
        updateDocumentTitleAndFavicon(settings);
    }, [pathname, settings]);

    // Listen for real-time updates broadcast across tabs or local saves
    useEffect(() => {
        const handleUpdate = (e: Event) => {
            const customEvent = e as CustomEvent<PublicPlatformSettingsDto>;
            if (customEvent.detail) {
                setSettings(customEvent.detail);
                updateDocumentTitleAndFavicon(customEvent.detail);
            }
        };
        const handleStorage = (e: StorageEvent) => {
            if (e.key === SETTINGS_STORAGE_KEY && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    setSettings((prev) => ({ ...prev, ...parsed }));
                    updateDocumentTitleAndFavicon(parsed);
                } catch {}
            }
        };
        window.addEventListener("coursedesk:settings-updated", handleUpdate);
        window.addEventListener("storage", handleStorage);
        return () => {
            window.removeEventListener("coursedesk:settings-updated", handleUpdate);
            window.removeEventListener("storage", handleStorage);
        };
    }, []);

    return (
        <AppSettingsContext.Provider
            value={{
                ...settings,
                isLoading,
                refreshSettings,
            }}
        >
            {children}
        </AppSettingsContext.Provider>
    );
}

export function useAppSettings() {
    return useContext(AppSettingsContext);
}
