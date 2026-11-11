"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, Mail, ShieldCheck, UserPlus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type TeacherRecord = {
  id: string;
  employee_code: string | null;
  department: string | null;
  title: string | null;
  profile: { full_name: string; email: string | null } | null;
};

export function ProvisioningModule() {
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [department, setDepartment] = useState("");
  const [title, setTitle] = useState("");
  const [role, setRole] = useState<"teacher" | "homeroom_teacher">("teacher");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const supabase = createClient();
      if (!supabase) {
        if (active) { setError("Supabase is not configured."); setLoading(false); }
        return;
      }
      const { data, error: loadError } = await supabase
        .from("teachers")
        .select("id, employee_code, department, title, profiles!teachers_profile_id_fkey(full_name, email)")
        .order("created_at", { ascending: false });
      if (!active) return;
      if (loadError) {
        setError("Could not load the teacher directory. Check your administrator access and database relationship.");
      } else {
        setTeachers((data ?? []).map((row) => {
          const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
          return {
            id: row.id,
            employee_code: row.employee_code,
            department: row.department,
            title: row.title,
            profile: profile ?? null,
          };
        }));
      }
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const supabase = createClient();
    if (!supabase) return setError("Supabase is not configured.");
    setBusy(true);
    const { data, error: invokeError } = await supabase.functions.invoke("invite-school-user", {
      body: { email, fullName, employeeCode, department, title, role },
    });
    setBusy(false);
    if (invokeError || !data?.ok) {
      setError(data?.error || invokeError?.message || "The invitation could not be sent.");
      return;
    }
    setSuccess(`Invitation sent to ${email}. The teacher must accept the email and set a password.`);
    setEmail("");
    setFullName("");
    setEmployeeCode("");
    setDepartment("");
    setTitle("");
    const { data: refreshed } = await supabase
      .from("teachers")
      .select("id, employee_code, department, title, profiles!teachers_profile_id_fkey(full_name, email)")
      .order("created_at", { ascending: false });
    if (refreshed) setTeachers(refreshed.map((row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return { id: row.id, employee_code: row.employee_code, department: row.department, title: row.title, profile: profile ?? null };
    }));
  }

  return (
    <>
      <div className="page-heading">
        <div><div className="breadcrumb">School management / Secure provisioning</div><h1>Teacher accounts</h1><p>Invite school staff, assign a school role and maintain the staff directory.</p></div>
        <span className="status-pill green"><ShieldCheck size={12} /> Admin only</span>
      </div>
      <div className="section-note"><ShieldCheck size={17} /><span>Invitations are sent through Supabase Auth. Teachers set their own password from the email link. Only an administrator can assign staff roles; public sign-up and self-role assignment are disabled.</span></div>
      <div className="module-grid" style={{ marginTop: 16 }}>
        <section className="module-card full">
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}><UserPlus size={18} /><h3 style={{ margin: 0 }}>Invite a teacher</h3></div>
          <form onSubmit={submit} className="modal-body" style={{ padding: 0 }}>
            <div className="module-grid">
              <label>Full name<input value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={2} maxLength={150} placeholder="Teacher's full name" /></label>
              <label>School email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={254} placeholder="teacher@school.ac.th" /></label>
              <label>Employee code<input value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} maxLength={40} placeholder="Optional staff ID" /></label>
              <label>Department<input value={department} onChange={(e) => setDepartment(e.target.value)} maxLength={120} placeholder="e.g. Mathematics" /></label>
              <label>Position / title<input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="e.g. Senior Teacher" /></label>
              <label>School role<select value={role} onChange={(e) => setRole(e.target.value as "teacher" | "homeroom_teacher")}><option value="teacher">Teacher</option><option value="homeroom_teacher">Homeroom Teacher</option></select></label>
            </div>
            {error && <p className="form-error" role="alert"><AlertCircle size={14} /> {error}</p>}
            {success && <p className="form-success" role="status"><CheckCircle2 size={14} /> {success}</p>}
            <div className="module-actions"><button className="primary-button" type="submit" disabled={busy}>{busy ? "Sending invitation…" : "Send invitation"} <Mail size={14} /></button></div>
          </form>
        </section>
        <section className="module-card full">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ display: "flex", alignItems: "center", gap: 9 }}><Users size={18} /><h3 style={{ margin: 0 }}>Staff directory</h3></div><span className="status-pill blue">{teachers.length} staff</span></div>
          {loading ? <p>Loading staff records…</p> : teachers.length === 0 ? <div className="inline-empty">No teacher accounts have been provisioned yet.</div> : (
            <div className="table-wrap"><table className="data-table"><thead><tr><th>Name</th><th>Email</th><th>Employee code</th><th>Department</th><th>Position</th></tr></thead><tbody>
              {teachers.map((teacher) => <tr key={teacher.id}><td><strong>{teacher.profile?.full_name ?? "—"}</strong></td><td>{teacher.profile?.email ?? "—"}</td><td>{teacher.employee_code ?? "—"}</td><td>{teacher.department ?? "—"}</td><td>{teacher.title ?? "—"}</td></tr>)}
            </tbody></table></div>
          )}
        </section>
      </div>
    </>
  );
}
