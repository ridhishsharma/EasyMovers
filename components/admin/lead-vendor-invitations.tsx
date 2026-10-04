"use client";

import { createClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./lead-workspace.module.css";

type Candidate = { id: string; vendorCode: string; companyName: string; city: string | null; state: string | null; rating: number; completedMoves: number; quotationCount: number; engagementMode: string; recommended: boolean; reasons: string[] };
type Invitation = { id: string; status: string; invitedAt: string; expiresAt: string; viewedAt: string | null; respondedAt: string | null; declinedAt: string | null; declineReason: string | null; vendor: { id: string; vendorCode: string; companyName: string } };
type Workspace = { booking: { id: string; bookingNumber: string; bookingStatus: string } | null; candidates: Candidate[]; invitations: Invitation[]; capabilities: { canInvite: boolean } };
const dateTime = (value: string) => new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
const label = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/^./, character => character.toUpperCase());
const defaultDeadline = () => { const value = new Date(Date.now() + 86400000); value.setMinutes(0, 0, 0); return new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };

export function LeadVendorInvitations({ leadId, supabaseUrl, publishableKey }: { leadId: string; supabaseUrl: string; publishableKey: string }) {
  const client = useMemo(() => supabaseUrl && publishableKey ? createClient(supabaseUrl, publishableKey) : null, [publishableKey, supabaseUrl]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const request = useCallback(async (method = "GET", body?: unknown) => {
    if (!client) throw new Error("Administrator sign-in is not configured.");
    const { data } = await client.auth.getSession();
    if (!data.session) throw new Error("Sign in again to manage quotation invitations.");
    const response = await fetch(`/api/admin/leads/${encodeURIComponent(leadId)}/quotation-invitations`, { method, cache: "no-store", headers: { Authorization: `Bearer ${data.session.access_token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload?.error?.message || "Unable to manage quotation invitations.");
    return payload;
  }, [client, leadId]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const payload = await request();
      setWorkspace(payload.data);
      const invited = new Set(payload.data.invitations.map((invitation: Invitation) => invitation.vendor.id));
      setSelected(payload.data.candidates.filter((candidate: Candidate) => candidate.recommended && !invited.has(candidate.id)).slice(0, 5).map((candidate: Candidate) => candidate.id));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to find eligible vendors."); }
    finally { setLoading(false); }
  }, [request]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  function toggle(vendorId: string) { setSelected(current => current.includes(vendorId) ? current.filter(id => id !== vendorId) : current.length < 5 ? [...current, vendorId] : current); }
  async function send() {
    setSending(true); setError(""); setMessage("");
    try { const payload = await request("POST", { vendorIds: selected, expiresAt: new Date(deadline).toISOString() }); setMessage(payload.message); await load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to send quotation requests."); }
    finally { setSending(false); }
  }

  if (loading) return <section className={styles.invitationPanel}><h3>Vendor quotation invitations</h3><p>Finding eligible vendors…</p></section>;
  return <section className={styles.invitationPanel}><div className={styles.invitationTitle}><div><h3>Vendor quotation invitations</h3><p>Eligibility is automatic; sending the RFQ remains under staff control. This does not assign the job.</p></div><button type="button" onClick={() => void load()}>Refresh eligibility</button></div>
    {message && <p className={styles.successMessage} role="status">{message}</p>}{error && <p className={styles.inlineError} role="alert">{error}</p>}
    {workspace?.invitations.length ? <div className={styles.invitationList}><strong>Invitation progress</strong>{workspace.invitations.map(invitation => <article key={invitation.id}><span><b>{invitation.vendor.companyName}</b><small>{invitation.vendor.vendorCode}</small></span><i className={styles.invitationStatus}>{label(invitation.status)}</i><small>Sent {dateTime(invitation.invitedAt)} · Due {dateTime(invitation.expiresAt)}</small></article>)}</div> : <p className={styles.muted}>No vendor has been invited for this request.</p>}
    {!workspace?.candidates.length ? <p className={styles.inlineError}>No active quotation vendor currently matches the service, route, enquiry preference and portal-access requirements.</p> : <><div className={styles.candidateList}>{workspace.candidates.map(candidate => { const invited = workspace.invitations.some(invitation => invitation.vendor.id === candidate.id); return <label key={candidate.id} className={invited ? styles.invitedCandidate : undefined}><input type="checkbox" disabled={invited || sending} checked={invited || selected.includes(candidate.id)} onChange={() => toggle(candidate.id)}/><span><strong>{candidate.companyName}</strong><small>{candidate.vendorCode} · {[candidate.city, candidate.state].filter(Boolean).join(", ") || "Location not recorded"}</small><small>{candidate.rating.toFixed(1)} rating · {candidate.completedMoves} completed · {candidate.quotationCount} quotations</small><em>{candidate.reasons.join(" · ")}</em></span><b>{invited ? "Invited" : candidate.recommended ? "Recommended" : "Eligible"}</b></label>; })}</div><div className={styles.invitationActions}><label>Quotation deadline<input type="datetime-local" value={deadline} min={new Date().toISOString().slice(0, 16)} onChange={event => setDeadline(event.target.value)}/></label><span>{selected.length}/5 vendors selected</span><button type="button" disabled={sending || !selected.length || !workspace.capabilities.canInvite} onClick={() => void send()}>{sending ? "Sending…" : "Send quotation request"}</button></div></>}
  </section>;
}
