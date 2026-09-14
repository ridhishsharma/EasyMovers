"use client";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import styles from "@/components/moving/moving.module.css";

type Booking = { bookingNumber: string; bookingStatus: string; trackingStatus: string; updatedAt: string; pickupCity: string; dropCity: string };
export function MoveStatus({ supabaseUrl, publishableKey }: { supabaseUrl: string; publishableKey: string }) {
  const client = useMemo(() => supabaseUrl && publishableKey ? createClient(supabaseUrl, publishableKey) : null, [supabaseUrl, publishableKey]);
  const [signedIn, setSignedIn] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [number, setNumber] = useState("");
  const [observedAt, setObservedAt] = useState("");
  const lock = useRef(false);
  useEffect(() => { if (!client) return; void client.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session))); const { data } = client.auth.onAuthStateChange((_event, session) => { setSignedIn(Boolean(session)); if (!session) setBooking(null); }); return () => data.subscription.unsubscribe(); }, [client]);
  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!client || lock.current) return; lock.current = true; setBusy(true); setMessage("");
    try { const { error } = await client.auth.signInWithPassword({ email, password }); if (error) throw error; setPassword(""); setSignedIn(true); } catch { setMessage("Sign-in failed. Check your email and password and that your account is confirmed."); } finally { lock.current = false; setBusy(false); }
  }
  async function track(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault(); if (!client || lock.current) return; lock.current = true; setBusy(true); setMessage(""); setBooking(null);
    try { const { data } = await client.auth.getSession(); if (!data.session) { setSignedIn(false); throw new Error("Please sign in again."); } const response = await fetch(`/api/customer/move-status?bookingNumber=${encodeURIComponent(number.trim())}`, { headers: { Authorization: `Bearer ${data.session.access_token}` }, cache: "no-store" }); const result = await response.json(); if (!response.ok || !result.success) throw new Error(result.message || "Tracking unavailable"); setBooking(result.booking); setObservedAt(result.observedAt); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to check status."); } finally { lock.current = false; setBusy(false); }
  }
  return <section className={styles.card} style={{maxWidth:650}}>
    <h2>Track a confirmed booking</h2>
    <p className={styles.muted}>View the latest recorded booking and moving stage.</p>
    <label className={styles.field}>Booking number<input required maxLength={100} placeholder="e.g. EM202609…" value={number} onChange={e=>{setNumber(e.target.value);setBooking(null);setMessage("");}}/></label>
    {!client ? <p className={styles.muted}>Account sign-in is not configured yet. Contact your move coordinator.</p> : !signedIn ? <form onSubmit={signIn} className={styles.fields} style={{marginTop:20}}><p className={styles.muted}>Sign in with the account linked to your booking.</p><label className={styles.field}>Email<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label className={styles.field}>Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={busy} className={styles.primary}>{busy?"Signing in…":"Sign in"}</button></form> : <><button type="button" className={styles.primary} style={{marginTop:20}} disabled={busy||!number.trim()} onClick={()=>track()}>{busy?"Checking…":"Check latest status"}</button><button type="button" className={styles.smallLink} style={{display:"block"}} disabled={busy} onClick={()=>{setBooking(null);setMessage("");void client.auth.signOut();}}>Sign out</button></>}
    {message&&<p className={styles.error} role="alert">{message}</p>}
    {booking&&<section className={styles.review} aria-live="polite"><h3>{booking.pickupCity} → {booking.dropCity}</h3><dl><dt>Booking</dt><dd>{booking.bookingNumber}</dd><dt>Status</dt><dd>{booking.bookingStatus.replaceAll("_"," ")}</dd><dt>Moving stage</dt><dd>{booking.trackingStatus.replaceAll("_"," ")}</dd><dt>Last update</dt><dd>{new Date(booking.updatedAt).toLocaleString("en-IN")}</dd></dl><p className={styles.muted}>Checked {new Date(observedAt).toLocaleString("en-IN")}. Refresh to see the latest record.</p></section>}
  </section>;
}
