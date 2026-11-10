import { redirect } from "next/navigation";
import { Workspace } from "@/app/dashboard/workspace";
import { createClient } from "@/lib/supabase/server";
import { isAppRole, type AppRole } from "@/lib/types";

export const dynamic = "force-dynamic";

const isConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_RNMCOM_DEMO_MODE !== "true"
);

export default async function DashboardPage() {
  if (!isConfigured) {
    return (
      <Workspace
        initialRoles={["admin", "teacher", "homeroom_teacher", "student", "parent"]}
        initialRole="admin"
        demoMode
        profileName="Alex Morgan"
      />
    );
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (typeof userId !== "string") redirect("/login");

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role, is_primary").eq("user_id", userId),
  ]);

  const roles = (roleRows ?? [])
    .map((row) => row.role)
    .filter((role): role is AppRole => typeof role === "string" && isAppRole(role));

  if (roles.length === 0) redirect("/login?error=role-not-assigned");

  const primary = roleRows?.find((row) => row.is_primary)?.role;
  const initialRole = typeof primary === "string" && isAppRole(primary) ? primary : roles[0];

  return (
    <Workspace
      initialRoles={roles}
      initialRole={initialRole}
      demoMode={false}
      profileName={profile?.full_name || "RNMCOM User"}
    />
  );
}