"use client";
import { useEffect } from "react";
import { liveQuery } from "dexie";
import { db } from "@/lib/db";
import { syncNow } from "@/lib/sync";
import { supabase } from "@/lib/supabase";

/** Applies the saved theme, registers the service worker, and keeps cloud sync (if configured) ticking. */
export default function Boot() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const apply = (theme: string) => {
      try {
        localStorage.setItem("ballast-theme", theme);
      } catch {}
      const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", dark);
    };
    const themeSub = liveQuery(() => db.profile.get("me")).subscribe({ next: (p) => p && apply(p.theme) });
    const onOnline = () => void syncNow();
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && void syncNow());
    const sb = supabase();
    const auth = sb?.auth.onAuthStateChange((_e, session) => session && void syncNow());
    void syncNow();
    return () => {
      window.removeEventListener("online", onOnline);
      auth?.data.subscription.unsubscribe();
      themeSub.unsubscribe();
    };
  }, []);
  return null;
}
