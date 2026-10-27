"use client";
import Link from "next/link";
import { useState } from "react";
import { cloudConfigured, supabase } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const sb = supabase();
  const redirectTo = typeof window !== "undefined" ? `${location.origin}/auth/callback` : undefined;

  if (!cloudConfigured || !sb) {
    return (
      <main className="mx-auto min-h-dvh max-w-xl px-5 py-12">
        <h1 className="font-serif text-3xl">Sync isn't set up</h1>
        <p className="mt-4 text-muted">Ballast is running fully on this device. To enable sign-in and sync, add your Supabase keys (see the README).</p>
        <Link href="/today" className="btn mt-8">Back to today</Link>
      </main>
    );
  }
  return (
    <main className="mx-auto min-h-dvh max-w-xl px-5 py-12">
      <h1 className="font-serif text-3xl">Sign in</h1>
      <p className="mt-3 text-muted">We'll email you a link. No password.</p>
      <form className="mt-6 space-y-4" onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
        setMsg(error ? error.message : "Check your email for the link.");
        setBusy(false);
      }}>
        <label htmlFor="email" className="sr-only">Email</label>
        <input id="email" type="email" required className="field" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <button className="btn w-full" disabled={busy || !email}>Email me a link</button>
      </form>
      <button className="btn btn-ghost mt-3 w-full" onClick={() => sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo } })}>Continue with Google</button>
      <p aria-live="polite" className="mt-4 text-[15px]">{msg}</p>
      <p className="mt-8 text-[15px]"><Link href="/today" className="text-brass-ink underline underline-offset-4">Continue on this device only</Link></p>
    </main>
  );
}
