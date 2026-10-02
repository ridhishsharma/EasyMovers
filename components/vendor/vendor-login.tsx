"use client";

import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import styles from "./vendor-login.module.css";

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
  const [resetEmail, setResetEmail] = useState("");
  const [requestingReset, setRequestingReset] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const verify = useCallback(async (accessToken: string) => {
    const response = await fetch("/api/vendor/portal", { cache: "no-store", headers: { Authorization: `Bearer ${accessToken}` } });
    if (response.ok) { router.replace(destination()); return true; }
    await client?.auth.signOut({ scope: "local" });
    setMessage("This login is not linked to an active EasyMovers vendor account.");
    return false;
  }, [client, router]);

  useEffect(() => {
    if (!client) return;
    void client.auth.getSession().then(({ data }) => {
      const recoveryMode = new URLSearchParams(window.location.search).get("mode") === "recovery";
      const authLink = /(?:type=invite|type=recovery)/.test(window.location.hash);
      if (data.session && (recoveryMode || authLink)) setRecovery(true);
      if (data.session && !(recoveryMode || authLink)) void verify(data.session.access_token);
    });
    const { data } = client.auth.onAuthStateChange(event => {
      const recoveryMode = new URLSearchParams(window.location.search).get("mode") === "recovery";
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && recoveryMode)) setRecovery(true);
    });
    return () => data.subscription.unsubscribe();
  }, [client, verify]);

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

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    if (!client || busy) return;
    if (newPassword.length < 12) { setMessage("Use a password containing at least 12 characters."); return; }
    if (newPassword !== confirmPassword) { setMessage("The new passwords do not match."); return; }
    setBusy(true); setMessage("");
    try {
      const { error } = await client.auth.updateUser({ password: newPassword });
      if (error) throw error;
      await client.auth.signOut({ scope: "local" });
      setRecovery(false); setNewPassword(""); setConfirmPassword("");
      setMessage("Password created successfully. Sign in to your vendor workspace.");
    } catch { setMessage("Unable to create the password. Ask EasyMovers to send a fresh invitation."); }
    finally { setBusy(false); }
  }

  async function requestPasswordReset(event: FormEvent) {
    event.preventDefault();
    if (!client || busy) return;
    const email = resetEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setMessage("Enter the registered vendor email address."); return; }
    setBusy(true); setMessage("");
    try {
      const redirectTo = `${window.location.origin}/vendor/login?mode=recovery&returnTo=%2Fvendor%2Fdashboard`;
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setMessage("If this email is linked to an active vendor account, a password-reset link has been sent.");
    } catch {
      setMessage("The password-reset email could not be sent. Try again later or contact EasyMovers support.");
    } finally { setBusy(false); }
  }

  if (!client) return <main className={styles.loginPage}><section className={styles.signIn}><h1>Partner access</h1><p>Vendor sign-in is not configured.</p></section></main>;
  return <main className={styles.loginPage}>
    <section className={styles.partnerIntro}>
      <p>EASYMOVERS PARTNER NETWORK</p>
      <h2>Your operations.<br />Your enquiries.<br /><span>One secure workspace.</span></h2>
      <ul><li>Manage availability</li><li>Receive matched enquiries</li><li>Submit quotations securely</li></ul>
    </section>
    <form className={styles.signIn} onSubmit={recovery ? changePassword : requestingReset ? requestPasswordReset : signIn}>
      <div className={styles.loginLogo}><Image src="/image/New_Logo_NBG.png" alt="EasyMovers" width={61} height={56} priority /></div>
      <p className={styles.eyebrow}>EASYMOVERS PARTNER NETWORK</p>
      <h1>{recovery ? "Create vendor password" : requestingReset ? "Reset vendor password" : "Vendor sign in"}</h1>
      <p className={styles.moduleName}>{recovery ? "Secure invitation acceptance" : requestingReset ? "Recover portal access" : "Manage work availability and enquiries"}</p>
      <p className={styles.signInHelp}>{recovery ? "Choose a strong password for this vendor account." : requestingReset ? "We will email a secure password-reset link to the registered vendor address." : "Use the email address or Indian mobile number linked to your approved vendor account."}</p>
      {recovery ? <>
        <label>New password<input type="password" autoComplete="new-password" minLength={12} required value={newPassword} onChange={event => setNewPassword(event.target.value)} /></label>
        <label>Confirm password<input type="password" autoComplete="new-password" minLength={12} required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} /></label>
        <button className={styles.primary} disabled={busy}>{busy ? "Creating password…" : "Create password"}</button>
      </> : requestingReset ? <>
        <label>Registered email<input type="email" autoCapitalize="none" spellCheck={false} autoComplete="email" required value={resetEmail} onChange={event => setResetEmail(event.target.value)} /></label>
        <button className={styles.primary} disabled={busy}>{busy ? "Sending link…" : "Send password-reset link"}</button>
        <button type="button" className={styles.textButton} onClick={() => { setRequestingReset(false); setMessage(""); }}>Back to vendor sign in</button>
      </> : <>
        <label>Email or mobile number<input autoCapitalize="none" spellCheck={false} autoComplete="username" inputMode="email" required value={identifier} onChange={event => setIdentifier(event.target.value)} /></label>
        <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /></label>
        <button className={styles.primary} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <button type="button" className={styles.textButton} onClick={() => { setRequestingReset(true); setResetEmail(identifier.includes("@") ? identifier : ""); setMessage(""); }}>Forgot password?</button>
      </>}
      {message && <p className={styles.accountMessage} role="status">{message}</p>}
      <aside className={styles.accessNotice}><strong>Approved EasyMovers partners only.</strong><span>Account invitation and password recovery will be managed through the registered contact.</span></aside>
    </form>
  </main>;
}
