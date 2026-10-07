"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import {
    getPublicPlatformSettingsRequest,
    type PublicPlatformSettingsDto,
} from "@/lib/api/appSettings";
import { resolveBrandAssetUrl } from "@/lib/utils/format";

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

const defaultSettings: PublicPlatformSettingsDto = {
    platformName: "CourseDesk",
    siteName: "CourseDesk",
    platformTagline: "Modern Learning & Assessment Management Platform",
    brandLogoLight: "",
    brandLogoDark: "",
    brandFavicon: "/favicon.ico",
    maintenanceMode: false,
    maintenanceBannerMessage:
        "CourseDesk is currently undergoing scheduled maintenance. Normal access will resume shortly.",
};

const AppSettingsContext = createContext<AppSettingsContextType>({
    ...defaultSettings,
    isLoading: true,
    refreshSettings: async () => {},
});

export function applyFavicon(faviconUrl?: string | null) {
    if (typeof document === "undefined") return;
    const raw = (faviconUrl || "").trim() || "/favicon.ico";
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

    const existingIcons = document.querySelectorAll<HTMLLinkElement>(
        "link[rel*='icon']"
    );

    if (existingIcons.length > 0) {
        existingIcons.forEach((link) => {
            link.type = mimeType;
            if (mimeType === "image/svg+xml") {
                link.setAttribute("sizes", "any");
            } else {
                link.removeAttribute("sizes");
            }
            link.href = resolved;
        });
    } else {
        const link = document.createElement("link");
        link.rel = "icon";
        link.type = mimeType;
        if (mimeType === "image/svg+xml") {
            link.setAttribute("sizes", "any");
        }
        link.href = resolved;
        document.head.appendChild(link);
    }
}


export function AppSettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<PublicPlatformSettingsDto>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);

    const refreshSettings = useCallback(async () => {
        try {
            const data = await getPublicPlatformSettingsRequest();
            setSettings(data);

            // Update document title dynamically
            if (typeof document !== "undefined") {
                const brand = data.platformName || "CourseDesk";
                const tagline = data.platformTagline ? ` - ${data.platformTagline}` : " - Course & Assignment Management";
                document.title = `${brand}${tagline}`;

                // Update favicon dynamically
                applyFavicon(data.brandFavicon);
            }
        } catch {
            // Keep existing or default settings if fetch fails
        } finally {
            setIsLoading(false);
        }
    }, []);


    useEffect(() => {
        void refreshSettings();
    }, [refreshSettings]);

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
