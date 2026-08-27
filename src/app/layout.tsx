import type { Metadata, Viewport } from "next";
import { Sora, Source_Sans_3 } from "next/font/google";
import { Toaster } from "sonner";
import { ServiceWorkerRegister } from "@/components/layout/service-worker-register";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AppHeaderNav } from "@/components/layout/app-header-nav";
import "./globals.css";

const sora = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Train Coach Planner",
  description:
    "Combine multiple Indian Railways PNRs into one visual coach map for group travel.",
  applicationName: "Train Coach Planner",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Coach Planner",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0f766e" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1419" },
  ],
  width: "device-width",
  initialScale: 1,
};

const themeInitScript = `
(function(){
  try {
    var m = localStorage.getItem('tcp-theme') || 'system';
    var dark = m === 'dark' || (m === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${sora.variable} ${sourceSans.variable} min-h-screen font-body antialiased`}
      >
        <ThemeProvider>
          <header className="sticky top-0 z-40 material border-0 border-b-0">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-300/60 to-transparent dark:via-slate-600/50" />
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 md:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-xs font-bold tracking-wide text-white shadow-sm">
                  TCP
                </div>
                <span className="font-display truncate text-base font-semibold tracking-tight text-ink md:text-lg">
                  Train Coach Planner
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <AppHeaderNav />
                <ThemeToggle />
              </div>
            </div>
          </header>
          {children}
          <ServiceWorkerRegister />
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
