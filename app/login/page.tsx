"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [routeNotice, setRouteNotice] = useState("");
  const demoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.RNMCOM_DEMO_MODE === "true";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("error");
    if (code === "role-not-assigned") setRouteNotice("Your account is not assigned a school role yet. Contact the school administrator.");
    else if (code === "not-configured") setRouteNotice("The authentication project has not been configured.");
    else if (code) setRouteNotice("The sign-in link could not be verified. Please try again.");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const supabase = createClient();
    if (!supabase) return setError("The Supabase project is not configured yet.");
    setBusy(true);

    if (resetMode) {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
      });
      setBusy(false);
      if (resetError) return setError(resetError.message);
      return setMessage("Password recovery instructions have been sent if the account exists.");
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signInError) return setError("Sign-in failed. Check your email and password.");
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="auth-page">
      <div className="auth-decoration auth-decoration-one" />
      <div className="auth-decoration auth-decoration-two" />
      <section className="auth-card">
        <div className="brand-lockup"><span className="brand-mark">R</span><span>RNMCOM</span></div>
        <div className="auth-icon"><LockKeyhole size={22} /></div>
        <p className="eyebrow">SCHOOL, CONNECTED.</p>
        <h1>{resetMode ? "Reset your password" : "Welcome back"}</h1>
        <p className="auth-copy">
          {resetMode ? "We will send a secure recovery link to your school email." : "Sign in to continue to your school workspace."}
        </p>

        {demoMode && (
          <div className="demo-callout">
            <ShieldCheck size={18} />
            <div><strong>Demo environment</strong><span>Backend credentials are not configured. You can preview the sample workspace.</span></div>
            <Link href="/dashboard">Open demo <ArrowRight size={14} /></Link>
          </div>
        )}

        {routeNotice && <p className="form-error">{routeNotice}</p>}
        <form onSubmit={submit} className="auth-form">
          <label>
            School email
            <span className="input-with-icon"><Mail size={17} /><input type="email" autoComplete="email" placeholder="you@school.ac.th" value={email} onChange={(e) => setEmail(e.target.value)} required /></span>
          </label>
          {!resetMode && (
            <label>
              Password
              <span className="input-with-icon"><LockKeyhole size={17} /><input type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required /><button className="icon-button password-toggle" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span>
            </label>
          )}
          <div className="auth-form-meta">
            <span>School-managed account</span>
            {!resetMode && <button type="button" className="text-button" onClick={() => { setResetMode(true); setError(""); setMessage(""); }}>Forgot password?</button>}
          </div>
          {error && <p className="form-error">{error}</p>}
          {message && <p className="form-success">{message}</p>}
          <button className="primary-button full-button" type="submit" disabled={busy || demoMode}>
            {busy ? "Please wait…" : resetMode ? "Send recovery link" : "Sign in"} <ArrowRight size={16} />
          </button>
        </form>
        {resetMode && <button type="button" className="text-button back-to-login" onClick={() => { setResetMode(false); setError(""); setMessage(""); }}>Back to sign in</button>}
        <div className="auth-footer"><ShieldCheck size={15} /> Protected school workspace · Privacy first</div>
      </section>
      <p className="auth-bottom">© {new Date().getFullYear()} RNMCOM · School Management & Communication</p>
    </main>
  );
}