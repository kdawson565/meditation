"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useProfile } from "@/lib/hooks";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { syncNow } from "@/lib/sync";

const NAV = [
  { href: "/today", label: "Today", d: "M12 3v18M3 12h18", also: [] as string[] },
  { href: "/map", label: "Map", d: "M4 4h16v16H4zM12 4v16M4 12h16", also: [] },
  { href: "/ledger", label: "Ledger", d: "M4 5h7v14H4zM13 5h7v14h-7z", also: [] },
  { href: "/thanks", label: "Thanks", d: "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z", also: [] },
  { href: "/more", label: "More", d: "M5 12h.01M12 12h.01M19 12h.01", also: ["/archive", "/reflection", "/insights", "/settings"] },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const profile = useProfile();

  useEffect(() => {
    if (profile !== null) return;
    let cancelled = false;
    (async () => {
      // New device, signed-in account: pull from the cloud before deciding this person is new.
      const sb = supabase();
      if (sb && (await sb.auth.getSession()).data.session) {
        await syncNow();
        if (await db.profile.get("me")) return;
      }
      if (!cancelled) router.replace("/onboarding");
    })();
    return () => { cancelled = true; };
  }, [profile, router]);

  if (!profile) return <div className="min-h-dvh" aria-busy="true" />;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
      <main className="flex-1 px-5 pb-28 pt-8">{children}</main>
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/90 backdrop-blur" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <ul className="mx-auto flex max-w-xl justify-around">
          {NAV.map((n) => {
            const active = [n.href, ...n.also].some((h) => path === h || path.startsWith(h + "/"));
            return (
              <li key={n.href} className="flex-1">
                <Link href={n.href} aria-current={active ? "page" : undefined} className={`flex min-h-[56px] flex-col items-center justify-center gap-1 text-[11px] transition-colors duration-calm ${active ? "text-ink" : "text-muted"}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.9 : 1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={n.d} />
                  </svg>
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
