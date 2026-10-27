import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/** Deletes the signed-in user and (via ON DELETE CASCADE) every row they own. Server-only: needs the service role key. */
export async function DELETE(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return NextResponse.json({ error: "Cloud account deletion isn't configured." }, { status: 501 });

  const token = req.headers.get("authorization")?.replace(/^Bearer /i, "");
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

  const { error: delErr } = await admin.auth.admin.deleteUser(data.user.id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
