import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createSupabaseContext } from "npm:@supabase/server";

const appUrl = Deno.env.get("APP_SITE_URL") ?? "";
function getOrigin(raw: string | null): string | null {
  if (!raw) return appUrl || null;
  try {
    const u = new URL(raw);
    const local = u.protocol === "http:" && u.hostname === "localhost" && u.port === "3000";
    const prod = u.protocol === "https:" && (u.hostname === "rnmcom.vercel.app" || (u.hostname.startsWith("rnmcom-") && u.hostname.endsWith(".vercel.app")));
    return local || prod ? u.origin : null;
  } catch { return null; }
}
function headers(origin: string): HeadersInit {
  return { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin", "Content-Type": "application/json" };
}
function reply(data: Record<string, unknown>, status: number, origin: string) {
  return new Response(JSON.stringify(data), { status, headers: headers(origin) });
}
function emailOk(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254; }
async function hash(v: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v));
  return Array.from(new Uint8Array(d)).map(x => x.toString(16).padStart(2, "0")).join("");
}
Deno.serve(async req => {
  const origin = getOrigin(req.headers.get("origin"));
  if (!origin) return new Response("Forbidden origin", { status: 403 });
  if (req.method === "OPTIONS") return new Response("ok", { headers: headers(origin) });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405, origin);
  const { data: ctx, error: ctxError } = await createSupabaseContext(req, { auth: "none" });
  if (ctxError || !ctx?.supabaseAdmin) return reply({ error: "Provisioning service unavailable." }, 503, origin);
  let raw: unknown;
  try { raw = await req.json(); } catch { return reply({ error: "Invalid request." }, 400, origin); }
  const b = raw as Record<string, unknown>;
  const code = typeof b.code === "string" ? b.code.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const fullName = typeof b.fullName === "string" ? b.fullName.trim() : "";
  if (code.length < 40 || code.length > 64 || !/^[A-Za-z0-9_-]+$/.test(code) || !emailOk(email) || fullName.length < 2 || fullName.length > 150)
    return reply({ error: "Enter a valid setup code, name and school email." }, 400, origin);
  const admin = ctx.supabaseAdmin;
  const tokenHash = await hash(code);
  const { data: claimed, error: claimError } = await admin.rpc("claim_first_admin_bootstrap", { p_token_hash: tokenHash, p_email: email });
  if (claimError || claimed !== true) return reply({ error: "Setup code invalid, expired, already used, or an administrator already exists." }, 409, origin);
  const redirectTo = new URL("/auth/callback?next=%2Fauth%2Fupdate-password", origin).toString();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { data: { full_name: fullName }, redirectTo });
  if (error || !data?.user?.id) {
    await admin.rpc("release_first_admin_bootstrap", { p_token_hash: tokenHash, p_email: email });
    return reply({ error: "Invitation failed. Check whether the email is already registered and whether SMTP is configured." }, 409, origin);
  }
  const { data: completed, error: completeError } = await admin.rpc("complete_first_admin_bootstrap", {
    p_token_hash: tokenHash, p_email: email, p_user_id: data.user.id, p_full_name: fullName
  });
  if (completeError || completed !== true) {
    await admin.auth.admin.deleteUser(data.user.id);
    await admin.rpc("release_first_admin_bootstrap", { p_token_hash: tokenHash, p_email: email });
    return reply({ error: "Admin setup failed and the invitation was rolled back. Contact the system operator." }, 500, origin);
  }
  return reply({ ok: true, message: "Administrator invitation sent. Accept the email invitation and set a password." }, 200, origin);
});