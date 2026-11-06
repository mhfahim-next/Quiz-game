import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "কুইজ কিডস",
    short_name: "কুইজ কিডস",
    description: "শিশুদের জন্য মজার কুইজ খেলা — প্রাণী, ফল, গণিত, বাংলা ও ইংরেজি।",
    lang: "bn",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fef3c7",
    theme_color: "#7c3aed",
    categories: ["education", "kids", "games"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
