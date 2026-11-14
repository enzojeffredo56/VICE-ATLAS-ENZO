import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${siteConfig.name} — ${siteConfig.slogan}`,
    short_name: siteConfig.name,
    description: siteConfig.description,
    lang: "fr",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0B1020",
    theme_color: "#0B1020",
    categories: ["games", "entertainment", "navigation"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Carte", url: "/carte", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "GTA Roulette", url: "/roulette", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "STUNT ARENA", url: "/stunts", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
