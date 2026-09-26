"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./vendor-change-review-admin.module.css";

type Person = { id: string; fullName: string; email: string | null } | null;
type Change = {
  id: string;
  vendorId: string;
  entityType: string;
  action: string;
  entityId: string | null;
  source: string;
  status: string;
  proposedData: Record<string, unknown>;
  previousData: Record<string, unknown> | null;
  submissionNote: string | null;
  reviewNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  vendor: { vendorCode: string; companyName: string };
  submittedBy: Person;
  reviewedBy: Person;
};

const labels: Record<string, string> = {
  VEHICLE: "Vehicle", DOCUMENT: "Document", BANK_ACCOUNT: "Bank account",
  PROFILE: "Commercial profile", SERVICE_AREA: "Service area", SERVICE_OFFERING: "Service offering",
  CREATE: "Add", UPDATE: "Update", DEACTIVATE: "Deactivate",
};
const label = (value: string) => labels[value] || value.replaceAll("_", " ").toLowerCase().replace(/^./, character => character.toUpperCase());
const sensitive = new Set(["accountNumber", "documentNumber", "insuranceNumber"]);
function displayValue(key: string, value: unknown) {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (sensitive.has(key)) {
    const text = String(value);
    return text.length <= 4 ? "••••" : `${"•".repeat(Math.min(text.length - 4, 8))}${text.slice(-4)}`;
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ") || "None";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value).replaceAll("_", " ");
}

export function VendorChangeReviewAdmin({ supabaseUrl, publishableKey }: { supabaseUrl: string; publishableKey: string }) {
  const router = useRouter();
  const client = useMemo(() => supabaseUrl && publishableKey ? createClient(supabaseUrl, publishableKey) : null, [supabaseUrl, publishableKey]);
  const [changes, setChanges] = useState<Change[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [reviewNote, setReviewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const request = useCallback(async (path: string, init?: RequestInit) => {
    if (!client) throw new Error("Office authentication is not configured.");
    const { data } = await client.auth.getSession();
    if (!data.session) {
      router.replace("/admin/login?returnTo=/admin/vendor-changes");
      throw new Error("Office session expired.");
    }
    const response = await fetch(path, { ...init, cache: "no-store", headers: { Authorization: `Bearer ${data.session.access_token}`, ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers } });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload?.error?.message || "Vendor change operation failed.");
    return payload.data;
  }, [client, router]);

  const load = useCallback(async () => {
    setLoading(true); setMessage(""); setSuccess(false);
    try {
      const data = await request(`/api/admin/vendor-changes?status=${status}`);
      setChanges(data.changes);
      setCurrentUserId(data.currentUserId);
      setSelectedId(current => data.changes.some((item: Change) => item.id === current) ? current : data.changes[0]?.id || "");
      setReviewNote("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load vendor changes.");
    } finally { setLoading(false); }
  }, [request, status]);

  useEffect(() => { void load(); }, [load]);
  const selected = changes.find(item => item.id === selectedId) || null;
  const ownSubmission = selected?.submittedBy?.id === currentUserId;
  const fields = selected ? [...new Set([...Object.keys(selected.previousData || {}), ...Object.keys(selected.proposedData || {})])] : [];

  async function review(decision: "APPROVED" | "REJECTED") {
    if (!selected || busy || ownSubmission) return;
    if (decision === "REJECTED" && !reviewNote.trim()) {
      setSuccess(false); setMessage("Enter a rejection reason before rejecting this change."); return;
    }
    setBusy(true); setMessage(""); setSuccess(false);
    try {
      await request(`/api/admin/vendor-changes/${encodeURIComponent(selected.id)}/review`, { method: "POST", body: JSON.stringify({ decision, reviewNote: reviewNote.trim() || null }) });
      setSuccess(true); setMessage(decision === "APPROVED" ? "Change approved and applied to the vendor record." : "Change rejected and retained in the audit history.");
      const data = await request(`/api/admin/vendor-changes?status=${status}`);
      setChanges(data.changes); setCurrentUserId(data.currentUserId); setSelectedId(data.changes[0]?.id || ""); setReviewNote("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to review vendor change.");
    } finally { setBusy(false); }
  }

  return <main className={styles.page}>
    <header className={styles.heading}>
      <div><p>VENDOR CONTROL</p><h1>Maker–checker review</h1><span>Independently verify vendor record changes before they take effect.</span></div>
      <button onClick={() => void load()} disabled={loading || busy}>Refresh</button>
    </header>
    <section className={styles.toolbar}>
      <label>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="CANCELLED">Cancelled</option><option value="SUPERSEDED">Superseded</option></select></label>
      <span>{changes.length} {status.toLowerCase()} change{changes.length === 1 ? "" : "s"}</span>
    </section>
    {message && <p className={success ? styles.success : styles.error}>{message}</p>}
    <div className={styles.workspace}>
      <section className={styles.list} aria-label="Vendor change requests">
        {loading ? <p>Loading review queue…</p> : changes.length ? changes.map(change => <button key={change.id} className={selectedId === change.id ? styles.selected : ""} onClick={() => { setSelectedId(change.id); setReviewNote(""); setMessage(""); }}>
          <span><strong>{change.vendor.companyName}</strong><em>{label(change.action)}</em></span>
          <b>{label(change.entityType)}</b>
          <small>{change.vendor.vendorCode} · {new Date(change.submittedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</small>
          <small>Maker: {change.submittedBy?.fullName || "Vendor portal"}</small>
        </button>) : <p>No {status.toLowerCase()} vendor changes.</p>}
      </section>
      <section className={styles.detail}>
        {!selected ? <div className={styles.empty}>Select a change request to review.</div> : <>
          <div className={styles.title}><div><span>{label(selected.action)} {label(selected.entityType)}</span><h2>{selected.vendor.companyName}</h2><p>{selected.vendor.vendorCode} · Submitted by {selected.submittedBy?.fullName || "Vendor portal"}</p></div><em className={styles[selected.status]}>{label(selected.status)}</em></div>
          <dl className={styles.meta}><div><dt>Source</dt><dd>{label(selected.source)}</dd></div><div><dt>Submitted</dt><dd>{new Date(selected.submittedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</dd></div>{selected.reviewedBy && <div><dt>Checker</dt><dd>{selected.reviewedBy.fullName}</dd></div>}</dl>
          {selected.submissionNote && <div className={styles.note}><strong>Maker note</strong><p>{selected.submissionNote}</p></div>}
          <div className={styles.comparison}><h3>Change comparison</h3><div className={styles.compareHead}><span>Field</span><span>Existing value</span><span>Proposed value</span></div>{fields.map(key => <div className={styles.compareRow} key={key}><strong>{label(key.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase())}</strong><span>{displayValue(key, selected.previousData?.[key])}</span><span>{displayValue(key, selected.proposedData[key])}</span></div>)}</div>
          {selected.status === "PENDING" ? <div className={styles.decision}>
            {ownSubmission && <p className={styles.conflict}>You submitted this change. Another authorised checker must review it.</p>}
            <label>Checker note<textarea value={reviewNote} maxLength={1000} onChange={event => setReviewNote(event.target.value)} placeholder="Required for rejection; optional for approval" /></label>
            <div><button className={styles.approve} disabled={busy || ownSubmission} onClick={() => void review("APPROVED")}>{busy ? "Processing…" : "Approve & apply"}</button><button className={styles.reject} disabled={busy || ownSubmission} onClick={() => void review("REJECTED")}>Reject</button></div>
          </div> : <div className={styles.note}><strong>Review outcome</strong><p>{selected.reviewNote || "No checker note recorded."}</p></div>}
          <Link className={styles.vendorLink} href={`/admin/vendors?search=${encodeURIComponent(selected.vendor.vendorCode)}`}>Open vendor readiness →</Link>
        </>}
      </section>
    </div>
  </main>;
}
