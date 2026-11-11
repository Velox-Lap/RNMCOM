"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LockKeyhole, ArrowRight } from "lucide-react";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    if (!supabase) {
      setError("The authentication service is not configured.");
      setCheckingSession(false);
      return;
    }

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      setHasSession(Boolean(data.session));
      setCheckingSession(false);
      if (sessionError) {
        setError("The password-reset session could not be verified. Request a new link.");
      }
    });

    return () => {
      active = false;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!hasSession) {
      setError("Your password-reset session has expired. Request a new link.");
      return;
    }
    if (password.length < 12) return setError("Use at least 12 characters.");
    if (password !== confirm) return setError("The passwords do not match.");

    const supabase = createClient();
    if (!supabase) return setError("Supabase is not configured.");

    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (updateError) {
      setError("The password could not be updated. Your reset link may have expired; request a new one.");
      return;
    }

    setPassword("");
    setConfirm("");
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-lockup"><span className="brand-mark">R</span><span>RNMCOM</span></div>
        <div className="auth-icon"><LockKeyhole size={22} /></div>
        <p className="eyebrow">ACCOUNT SECURITY</p>
        <h1>Set a new password</h1>

        {checkingSession ? (
          <p className="auth-copy" role="status">Verifying your secure reset link…</p>
        ) : !hasSession ? (
          <div className="auth-form" role="alert">
            <p className="form-error">
              This password-reset link is expired, already used, or could not establish a secure session.
              Request a new link to continue.
            </p>
            <Link className="primary-button full-button" href="/login?mode=reset">
              Request a new reset link <ArrowRight size={16} />
            </Link>
            <Link className="text-button back-to-login" href="/login">Back to sign in</Link>
          </div>
        ) : (
          <>
            <p className="auth-copy">Choose a strong password for your RNMCOM account.</p>
            <form onSubmit={submit} className="auth-form">
              <label>
                New password
                <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={12} maxLength={128} />
              </label>
              <label>
                Confirm password
                <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={12} maxLength={128} />
              </label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="primary-button full-button" type="submit" disabled={busy}>
                {busy ? "Updating…" : "Update password"} <ArrowRight size={16} />
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
