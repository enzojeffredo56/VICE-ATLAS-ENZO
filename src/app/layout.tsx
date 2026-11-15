import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, Yellowtail } from "next/font/google";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { MotionProviders } from "@/components/motion/providers";
import { ScrollProgress } from "@/components/motion/scroll-progress";
import { CursorGlow } from "@/components/motion/cursor-glow";
import { Toaster } from "@/components/ui/sonner";
import { publicEnv } from "@/lib/env";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], display: "swap" });
// Police du logo : script néon façon enseigne de Miami années 80 (police libre, licence OFL)
const brand = Yellowtail({ variable: "--font-yellowtail", weight: "400", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
  title: { default: `${siteConfig.name} — ${siteConfig.slogan}`, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  appleWebApp: { capable: true, title: siteConfig.name, statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#0B1020",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${inter.variable} ${spaceGrotesk.variable} ${brand.variable} dark`}>
      <body className="min-h-dvh overflow-x-clip">
        <a
          href="#contenu"
          className="sr-only z-[70] rounded-full bg-pink px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Aller au contenu
        </a>
        <MotionProviders>
          <ScrollProgress />
          <CursorGlow />
          <SiteHeader />
          <main id="contenu" className="relative">
            {children}
          </main>
          <SiteFooter />
          <MobileTabBar />
          <Toaster />
        </MotionProviders>
      </body>
    </html>
  );
}
