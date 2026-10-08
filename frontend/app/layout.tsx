import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider, ThemeProvider, AppSettingsProvider } from "@/context";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CourseDesk - Learning Platform",
  description: "Modern Course and Assignment Management Platform for instructors, learners, and teams",
  icons: {
    icon: "/brand/favicon.svg",
    shortcut: "/brand/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head suppressHydrationWarning>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('coursedesk_theme') || 'system';
                const isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) document.documentElement.classList.add('dark');
                else document.documentElement.classList.remove('dark');

                const sRaw = localStorage.getItem('coursedesk_public_settings');
                if (sRaw) {
                  const s = JSON.parse(sRaw);
                  const b = (s.platformName || 'CourseDesk').trim();
                  const tag = (s.platformTagline || '').trim();
                  document.title = tag ? (b + ' - ' + tag) : b;
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full bg-[#eef1f4] text-gray-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>
          <AppSettingsProvider>
            <AuthProvider>{children}</AuthProvider>
          </AppSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}