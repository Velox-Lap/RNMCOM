"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function FirstAdminSetupPage() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const supabase = createClient();
    if (!supabase) return setError("The school authentication service is not configured.");
    setBusy(true);
    const { data, error: invokeError } = await supabase.functions.invoke("bootstrap-first-admin", {
      body: { code: code.trim(), email: email.trim(), fullName: fullName.trim() },
    });
    setBusy(false);
    if (invokeError || !data?.ok) {
      setError(data?.error || invokeError?.message || "Administrator setup could not be completed.");
      return;
    }
    setSuccess(data.message || "Invitation sent. Check the school email to continue.");
    setCode("");
  }

  return (
    <main className="auth-page">
      <div className="auth-decoration auth-decoration-one" />
      <div className="auth-decoration auth-decoration-two" />
      <section className="auth-card">
        <div className="brand-lockup"><span className="brand-mark">R</span><span>RNMCOM</span></div>
        <div className="auth-icon"><ShieldCheck size={22} /></div>
        <p className="eyebrow">AUTHORIZED SCHOOL SETUP</p>
        <h1>Set up the first administrator</h1>
        <p className="auth-copy">This one-time setup is only for the person formally authorized by the school. The invitation will be sent to the administrator's school email address.</p>
        <div className="section-note"><KeyRound size={16} /><span>The setup code is single-use, expires automatically, and cannot be used after the first administrator is created.</span></div>
        <form onSubmit={submit} className="auth-form">
          <label>One-time setup code<input value={code} onChange={(e) => setCode(e.target.value)} required minLength={40} maxLength={64} autoComplete="one-time-code" placeholder="Enter the code provided to the school" /></label>
          <label>Authorized administrator's full name<input value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={2} maxLength={150} autoComplete="name" /></label>
          <label>School email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={254} autoComplete="email" placeholder="admin@school.ac.th" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          {success && <p className="form-success" role="status">{success}</p>}
          <button className="primary-button full-button" type="submit" disabled={busy}>{busy ? "Creating secure invitation…" : "Create first administrator"} <ArrowRight size={16} /></button>
        </form>
        <div className="auth-footer"><Link href="/login">Return to sign in</Link></div>
      </section>
    </main>
  );
}
