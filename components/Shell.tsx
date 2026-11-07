"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useProfile } from "@/lib/hooks";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { syncNow } from "@/lib/sync";

// Four tabs. Everything else (values, ledger, thanks, archive, reflection, settings) lives behind "You", top right.
const NAV = [
  { href: "/today", label: "Today", d: "M3 15h18M7 15a5 5 0 0 1 10 0M12 4v3M5.2 7.2l1.6 1.6M18.8 7.2l-1.6 1.6", also: [] as string[] },
  { href: "/tide", label: "Tide", d: "M4 5h16v15H4zM4 10h16M9 3v4M15 3v4", also: [] },
  { href: "/map", label: "Map", d: "M4 4h16v16H4zM12 4v16M4 12h16", also: [] },
  { href: "/library", label: "Library", d: "M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z", also: [] },
];
const YOU = ["/you", "/more", "/values", "/ledger", "/thanks", "/archive", "/reflection", "/insights", "/settings"];

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
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col print:min-h-0 print:max-w-none">
      <div className="flex h-14 items-center justify-end px-3 print:hidden">
        <Link href="/you" aria-label="You: values, ledger, thanks, reflection and settings" aria-current={YOU.some((h) => path === h || path.startsWith(h + "/")) ? "page" : undefined}
          className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-calm ${YOU.some((h) => path === h || path.startsWith(h + "/")) ? "text-ink" : "text-muted hover:text-ink"}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
            <circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c1.2-3.6 3.8-5.5 7-5.5s5.8 1.9 7 5.5" />
          </svg>
        </Link>
      </div>
      <main className="flex-1 px-5 pb-28 pt-1 print:p-0">{children}</main>
      <nav aria-label="Primary" className="print:hidden fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/90 backdrop-blur" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <ul className="mx-auto flex max-w-xl justify-around">
          {NAV.map((n) => {
            const active = [n.href, ...n.also].some((h) => path === h || path.startsWith(h + "/"));
            return (
              <li key={n.href} className="flex-1">
                <Link href={n.href} aria-current={active ? "page" : undefined} className={`flex min-h-[56px] flex-col items-center justify-center gap-1 text-xs transition-colors duration-calm ${active ? "text-ink" : "text-muted"}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
