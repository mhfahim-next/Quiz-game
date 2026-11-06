import type { Metadata, Viewport } from "next";
import { Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { ProgressProvider } from "@/components/providers/progress-provider";
import { AppHeader } from "@/components/layout/app-header";
import { Toaster } from "@/components/ui/sonner";

const hind = Hind_Siliguri({
  variable: "--font-hind",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "কুইজ কিডস", template: "%s · কুইজ কিডস" },
  description: "শিশুদের জন্য মজার কুইজ খেলা — প্রাণী, ফল, গণিত, বাংলা ও ইংরেজি শেখো খেলতে খেলতে!",
  applicationName: "কুইজ কিডস",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "কুইজ কিডস", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7c3aed",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bn" className={hind.variable}>
      <body className="min-h-dvh bg-gradient-to-b from-amber-100 via-pink-50 to-sky-100 font-sans text-slate-800 antialiased">
        <ProgressProvider>
          <AppHeader />
          <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-4">{children}</main>
          <Toaster position="top-center" richColors />
        </ProgressProvider>
      </body>
    </html>
  );
}
