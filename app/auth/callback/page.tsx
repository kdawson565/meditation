"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { syncNow } from "@/lib/sync";

export default function Callback() {
  const router = useRouter();
  useEffect(() => {
    const sb = supabase();
    if (!sb) return router.replace("/today");
    const code = new URLSearchParams(location.search).get("code");
    (async () => {
      if (code) await sb.auth.exchangeCodeForSession(code);
      await syncNow();
      router.replace("/today");
    })();
  }, [router]);
  return <main className="p-8 text-muted">Signing you in…</main>;
}
