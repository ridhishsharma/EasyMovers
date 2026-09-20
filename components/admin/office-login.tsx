"use client";

import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import styles from "./office-login.module.css";

const DEFAULT_DESTINATION = "/admin/vendor-applications";

function safeDestination() {
  const requested = new URLSearchParams(window.location.search).get("returnTo");
  return requested?.startsWith("/admin/") && !requested.startsWith("//")
    ? requested
    : DEFAULT_DESTINATION;
}

export function OfficeLogin({ supabaseUrl, publishableKey }: { supabaseUrl: string; publishableKey: string }) {
  const router = useRouter();
  const client = useMemo(() => supabaseUrl && publishableKey ? createClient(supabaseUrl, publishableKey) : null, [supabaseUrl, publishableKey]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const recordSessionEvent = useCallback(async (accessToken: string, event: "INVITATION_ACCEPTED" | "PASSWORD_SET" | "LOGIN" | "LOGOUT") => {
    await fetch("/api/admin/session-events", {
      method: "POST", cache: "no-store",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ event }),
    });
  }, []);

  const verifyOfficeAccess = useCallback(async (accessToken: string) => {
    const response = await fetch("/api/admin/vendor-applications?page=1&pageSize=1", {
      cache: "no-store",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.ok) { await recordSessionEvent(accessToken, "LOGIN"); router.replace(safeDestination()); return true; }
    if (response.status === 401 || response.status === 403) {
      await client?.auth.signOut();
      setMessage("This account is not linked to an active EasyMovers administrator.");
      return false;
    }
    setMessage("Office access could not be verified. Please try again.");
    return false;
  }, [client, recordSessionEvent, router]);

  useEffect(() => {
    if (!client) return;
    void client.auth.getSession().then(({ data }) => {
      const recoveryMode = new URLSearchParams(window.location.search).get("mode") === "recovery";
      if (data.session && recoveryMode) { setRecovery(true); void recordSessionEvent(data.session.access_token, "INVITATION_ACCEPTED"); }
      if (data.session && !recoveryMode) {
        void verifyOfficeAccess(data.session.access_token);
      }
    });
    const { data } = client.auth.onAuthStateChange(event => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => data.subscription.unsubscribe();
  }, [client, recordSessionEvent, verifyOfficeAccess]);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    if (!client || busy) return;
    setBusy(true); setMessage("");
    try {
      const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      setPassword("");
      await verifyOfficeAccess(data.session.access_token);
    } catch {
      setMessage("Sign-in failed. Use an active EasyMovers administrator account.");
    } finally { setBusy(false); }
  }

  async function forgotPassword() {
    if (!client || busy) return;
    if (!email.trim()) { setMessage("Enter your administrator email address first."); return; }
    setBusy(true); setMessage("");
    try {
      const returnTo = encodeURIComponent(safeDestination());
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/admin/login?mode=recovery&returnTo=${returnTo}`,
      });
      if (error) throw error;
      setMessage("If this administrator account exists, a secure password-reset email has been sent.");
    } catch {
      setMessage("Password recovery is temporarily unavailable. Contact the system administrator.");
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
      const { data } = await client.auth.getSession();
      if (data.session) {
        await recordSessionEvent(data.session.access_token, "PASSWORD_SET");
        await recordSessionEvent(data.session.access_token, "LOGOUT");
      }
      await client.auth.signOut();
      setRecovery(false); setNewPassword(""); setConfirmPassword("");
      setMessage("Password changed successfully. Sign in with your new password.");
    } catch {
      setMessage("Unable to change the password. Request a new recovery email and try again.");
    } finally { setBusy(false); }
  }

  if (!client) return <main className={styles.loginPage}><section className={styles.signIn}><h1>Administrator access</h1><p>Supabase administrator sign-in is not configured.</p></section></main>;

  return <main className={styles.loginPage}>
    <form className={styles.signIn} onSubmit={recovery ? changePassword : signIn}>
      <div className={styles.loginLogo}><Image src="/image/New_Logo_NBG.png" alt="EasyMovers" width={61} height={56} priority /></div>
      <p className={styles.eyebrow}>EASYMOVERS OPERATIONS</p>
      <h1>{recovery ? "Set new password" : "Office sign in"}</h1>
      <p className={styles.moduleName}>{recovery ? "Administrator account recovery" : "EasyMovers CRM"}</p>
      <p className={styles.signInHelp}>{recovery ? "Choose a strong password for your office account." : "Use your linked EasyMovers administrator account."}</p>
      {recovery ? <>
        <label>New password<input type="password" autoComplete="new-password" minLength={12} required value={newPassword} onChange={event => setNewPassword(event.target.value)} /></label>
        <label>Confirm password<input type="password" autoComplete="new-password" minLength={12} required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} /></label>
        <button className={styles.primary} disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
      </> : <>
        <label>Email address<input type="email" inputMode="email" autoCapitalize="none" spellCheck={false} autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} /></label>
        <label>Password<span className={styles.passwordInput}><input type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /><button type="button" aria-pressed={showPassword} aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(value => !value)}>{showPassword ? "Hide" : "Show"}</button></span></label>
        <button className={styles.primary} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <button type="button" className={styles.textAction} disabled={busy} onClick={() => void forgotPassword()}>Forgot password?</button>
      </>}
      {message && <p className={styles.accountMessage} role="status">{message}</p>}
      <aside className={styles.accessNotice}><strong>Authorised EasyMovers personnel only.</strong><span>Having trouble signing in? Contact your system administrator.</span></aside>
    </form>
  </main>;
}
