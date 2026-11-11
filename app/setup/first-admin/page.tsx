"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function FirstAdminSetupPage() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("sunuratperapon@gmail.com");
  const [fullName, setFullName] = useState("Velox");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess(false);

    if (password.length < 12 || password.length > 128) {
      setError("Use a password between 12 and 128 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError("The school authentication service is not configured.");
      return;
    }

    setBusy(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("bootstrap-first-admin", {
        body: {
          code: code.trim(),
          email: email.trim(),
          fullName: fullName.trim(),
          password,
        },
      });

      if (invokeError || !data?.ok) {
        setError(data?.error || invokeError?.message || "Administrator setup could not be completed.");
        return;
      }

      setCode("");
      setPassword("");
      setConfirmPassword("");
      setSuccess(true);
    } catch {
      setError("Could not reach the school authentication service. Please try again.");
    } finally {
      setBusy(false);
    }
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
        <p className="auth-copy">
          Create the first school administrator account directly. No confirmation email or localhost callback is used.
          Only the person formally authorized by the school should complete this one-time setup.
        </p>

        <div className="section-note">
          <KeyRound size={16} />
          <span>
            The setup code is single-use and expires automatically. The email is marked confirmed based on school authorization.
            Double-check the email address before creating the account.
          </span>
        </div>

        {success ? (
          <div className="form-success" role="status">
            <strong>Administrator account created.</strong>
            <p>You can sign in immediately with the email address and password you just set.</p>
            <Link className="primary-button full-button" href="/login">Continue to sign in <ArrowRight size={16} /></Link>
          </div>
        ) : (
          <form onSubmit={submit} className="auth-form">
            <label>
              One-time setup code
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                minLength={40}
                maxLength={64}
                autoComplete="one-time-code"
                placeholder="Enter the code provided to the school"
              />
            </label>
            <label>
              Authorized administrator's name
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={2} maxLength={150} autoComplete="name" />
            </label>
            <label>
              Account email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={254} autoComplete="email" />
            </label>
            <label>
              Create password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                placeholder="At least 12 characters"
              />
            </label>
            <label>
              Confirm password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
              />
            </label>
            <p className="auth-copy">
              Your password is sent securely to Supabase Auth and stored as a password hash. RNMCOM does not save or log the plain-text password.
              Because email confirmation is skipped, use only the exact address approved by the school.
            </p>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button full-button" type="submit" disabled={busy}>
              {busy ? "Creating administrator account…" : "Create first administrator"} <ArrowRight size={16} />
            </button>
          </form>
        )}
        <div className="auth-footer"><Link href="/login">Return to sign in</Link></div>
      </section>
    </main>
  );
}
