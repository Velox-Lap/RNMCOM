"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // In production, connect this boundary to the school's approved error-monitoring service.
    console.error("RNMCOM application error", error);
  }, [error]);

  return (
    <main className="error-page">
      <span className="auth-icon"><AlertCircle size={22} /></span>
      <p className="eyebrow">WORKSPACE ERROR</p>
      <h1>We couldn't load this page</h1>
      <p className="auth-copy">Your account and school records have not been changed by this display error. Try again or return to your workspace.</p>
      <button className="primary-button" onClick={reset}><RefreshCw size={15} /> Try again</button>
    </main>
  );
}