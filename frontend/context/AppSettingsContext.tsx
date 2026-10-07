"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import {
    getPublicPlatformSettingsRequest,
    type PublicPlatformSettingsDto,
} from "@/lib/api/appSettings";

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

                // Update favicon dynamically if custom favicon provided
                if (data.brandFavicon) {
                    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
                    if (!link) {
                        link = document.createElement("link");
                        link.rel = "icon";
                        document.getElementsByTagName("head")[0].appendChild(link);
                    }
                    link.href = data.brandFavicon;
                }
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
