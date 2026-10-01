"use client";

import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import styles from "@/components/admin/office-login.module.css";

const DEFAULT_DESTINATION = "/vendor/dashboard";
const destination = () => {
  const requested = new URLSearchParams(window.location.search).get("returnTo");
  return requested?.startsWith("/vendor/") && !requested.startsWith("//") ? requested : DEFAULT_DESTINATION;
};

export function VendorLogin({ supabaseUrl, publishableKey }: { supabaseUrl: string; publishableKey: string }) {
  const router = useRouter();
  const client = useMemo(() => supabaseUrl && publishableKey ? createClient(supabaseUrl, publishableKey) : null, [supabaseUrl, publishableKey]);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function verify(accessToken: string) {
    const response = await fetch("/api/vendor/portal", { cache: "no-store", headers: { Authorization: `Bearer ${accessToken}` } });
    if (response.ok) { router.replace(destination()); return true; }
    await client?.auth.signOut({ scope: "local" });
    setMessage("This login is not linked to an active EasyMovers vendor account.");
    return false;
  }

  useEffect(() => {
    if (!client) return;
    void client.auth.getSession().then(({ data }) => { if (data.session) void verify(data.session.access_token); });
    // The verifier intentionally remains tied to the current client instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    if (!client || busy) return;
    setBusy(true); setMessage("");
    try {
      const value = identifier.trim();
      const credentials = value.includes("@")
        ? { email: value.toLowerCase(), password }
        : { phone: value.startsWith("+") ? value : `+91${value.replace(/\D/g, "")}`, password };
      const { data, error } = await client.auth.signInWithPassword(credentials);
      if (error) throw error;
      setPassword("");
      await verify(data.session.access_token);
    } catch {
      setMessage("Sign-in failed. Check your registered email/mobile and password.");
    } finally { setBusy(false); }
  }

  if (!client) return <main className={styles.loginPage}><section className={styles.signIn}><h1>Partner access</h1><p>Vendor sign-in is not configured.</p></section></main>;
  return <main className={styles.loginPage}>
    <form className={styles.signIn} onSubmit={signIn}>
      <div className={styles.loginLogo}><Image src="/image/New_Logo_NBG.png" alt="EasyMovers" width={61} height={56} priority /></div>
      <p className={styles.eyebrow}>EASYMOVERS PARTNER NETWORK</p>
      <h1>Vendor sign in</h1>
      <p className={styles.moduleName}>Manage work availability and enquiries</p>
      <p className={styles.signInHelp}>Use the email address or Indian mobile number linked to your approved vendor account.</p>
      <label>Email or mobile number<input autoCapitalize="none" spellCheck={false} autoComplete="username" inputMode="email" required value={identifier} onChange={event => setIdentifier(event.target.value)} /></label>
      <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /></label>
      <button className={styles.primary} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      {message && <p className={styles.accountMessage} role="status">{message}</p>}
      <aside className={styles.accessNotice}><strong>Approved EasyMovers partners only.</strong><span>Account invitation and password recovery will be managed through the registered contact.</span></aside>
    </form>
  </main>;
}
