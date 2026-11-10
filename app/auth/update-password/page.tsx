"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LockKeyhole, ArrowRight } from "lucide-react";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 10) return setError("Use at least 10 characters.");
    if (password !== confirm) return setError("The passwords do not match.");
    const supabase = createClient();
    if (!supabase) return setError("Supabase is not configured.");
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) return setError(updateError.message);
    router.replace("/dashboard");
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-lockup"><span className="brand-mark">R</span><span>RNMCOM</span></div>
        <div className="auth-icon"><LockKeyhole size={22} /></div>
        <p className="eyebrow">ACCOUNT SECURITY</p>
        <h1>Set a new password</h1>
        <p className="auth-copy">Choose a strong password to secure your account.</p>
        <form onSubmit={submit} className="auth-form">
          <label>New password<input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={10} /></label>
          <label>Confirm password<input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={10} /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button full-button" type="submit" disabled={busy}>{busy ? "Updating…" : "Update password"} <ArrowRight size={16} /></button>
        </form>
      </section>
    </main>
  );
}