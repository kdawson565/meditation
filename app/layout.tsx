import type { Metadata, Viewport } from "next";
import "./globals.css";
import Boot from "@/components/Boot";

export const metadata: Metadata = {
  title: "Ballast",
  description: "A quiet daily gratitude practice for people who want to feel full while still hungry.",
  applicationName: "Ballast",
  appleWebApp: { capable: true, title: "Ballast", statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F1E7" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1626" },
  ],
};

const themeScript = `try{var t=localStorage.getItem('ballast-theme');var d=t==='dark'||((!t||t==='system')&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <Boot />
        {children}
      </body>
    </html>
  );
}
