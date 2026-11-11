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
Deno.serve(async req => {
  const origin = getOrigin(req.headers.get("origin"));
  if (!origin) return new Response("Forbidden origin", { status: 403 });
  if (req.method === "OPTIONS") return new Response("ok", { headers: headers(origin) });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405, origin);
  const { data: ctx, error: ctxError } = await createSupabaseContext(req, { auth: "user" });
  if (ctxError || !ctx?.userClaims?.sub || !ctx.supabaseAdmin) return reply({ error: "Sign in with an administrator account." }, 401, origin);
  let raw: unknown;
  try { raw = await req.json(); } catch { return reply({ error: "Invalid request." }, 400, origin); }
  const b = raw as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const fullName = typeof b.fullName === "string" ? b.fullName.trim() : "";
  const employeeCode = typeof b.employeeCode === "string" ? b.employeeCode.trim() : "";
  const department = typeof b.department === "string" ? b.department.trim() : "";
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const role = b.role;
  if (!emailOk(email) || fullName.length < 2 || fullName.length > 150) return reply({ error: "Enter a valid school email and full name." }, 400, origin);
  if (role !== "teacher" && role !== "homeroom_teacher") return reply({ error: "Only teacher and homeroom-teacher roles are allowed." }, 400, origin);
  if (employeeCode.length > 40 || department.length > 120 || title.length > 80) return reply({ error: "Staff field exceeds the allowed length." }, 400, origin);
  const admin = ctx.supabaseAdmin;
  const actor = ctx.userClaims.sub;
  const { data: adminRole, error: roleError } = await admin.from("user_roles").select("user_id").eq("user_id", actor).eq("role", "admin").maybeSingle();
  if (roleError || !adminRole) return reply({ error: "Only a school administrator can invite staff." }, 403, origin);
  if (employeeCode) {
    const { data: existing, error: codeError } = await admin.from("teachers").select("id").eq("employee_code", employeeCode).maybeSingle();
    if (codeError) return reply({ error: "Could not validate employee code." }, 503, origin);
    if (existing) return reply({ error: "Employee code is already assigned." }, 409, origin);
  }
  const redirectTo = new URL("/auth/callback?next=%2Fauth%2Fupdate-password", origin).toString();
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { data: { full_name: fullName }, redirectTo });
  const user = invited?.user;
  if (inviteError || !user?.id) return reply({ error: "Invitation failed. Email may already exist or SMTP may not be configured." }, 409, origin);
  const { error: profileError } = await admin.from("profiles").update({ full_name: fullName, email }).eq("id", user.id);
  const { error: roleInsertError } = profileError ? { error: profileError } : await admin.from("user_roles").insert({ user_id: user.id, role, is_primary: true });
  const { error: teacherError } = profileError || roleInsertError ? { error: profileError ?? roleInsertError } : await admin.from("teachers").insert({
    profile_id: user.id, employee_code: employeeCode || null, department: department || null, title: title || null
  });
  if (profileError || roleInsertError || teacherError) {
    await admin.auth.admin.deleteUser(user.id);
    return reply({ error: "Staff provisioning failed; invitation was rolled back. Check duplicate employee codes and retry." }, 500, origin);
  }
  const { error: auditError } = await admin.from("audit_logs").insert({
    actor_id: actor, action: "staff.invited", resource_type: "teacher", resource_id: user.id,
    details: { role, employee_code_assigned: Boolean(employeeCode), department_assigned: Boolean(department) }
  });
  return reply({
    ok: true, invitedUserId: user.id, email, role,
    message: "Invitation sent. The teacher must accept the email link and set a password.",
    ...(auditError ? { warning: "Account was created but the audit event could not be recorded." } : {})
  }, 200, origin);
});