import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ballast",
    short_name: "Ballast",
    description: "A quiet daily gratitude practice.",
    start_url: "/today",
    scope: "/",
    display: "standalone",
    background_color: "#F6F1E7",
    theme_color: "#16223A",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
