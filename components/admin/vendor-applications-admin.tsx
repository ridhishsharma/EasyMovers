"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import styles from "./vendor-applications-admin.module.css";

type Status = "PENDING" | "UNDER_REVIEW" | "NEEDS_INFORMATION" | "APPROVED" | "REJECTED" | "WITHDRAWN";
type ApplicationSummary = {
  id: string; referenceId: string; companyName: string; businessType: string; operatingCategory: string;
  contactName: string; mobile: string; email: string; city: string; state: string; postalCode: string;
  status: Status; createdAt: string; updatedAt: string; reviewedAt: string | null;
  vendor: { id: string; vendorCode: string; status: string } | null; _count: { callbackRequests: number };
};
type ApplicationDetail = ApplicationSummary & {
  gstNumber: string | null; panNumber: string | null; addressLine1: string; consentAt: string;
  reviewNotes: string | null;
  reviewedByUser: { id: string; fullName: string; email: string | null; role: string } | null;
  vendor: ({ id: string; vendorCode: string; companyName: string; status: string; createdAt: string }) | null;
  callbackRequests: Array<{ id: string; fullName: string; mobile: string; preferredTime: string; status: string; createdAt: string }>;
};
type Pagination = { page: number; pageSize: number; total: number; totalPages: number };

const statuses: Array<{ value: "" | Status; label: string }> = [
  { value: "", label: "All statuses" }, { value: "PENDING", label: "Pending" },
  { value: "UNDER_REVIEW", label: "Under review" }, { value: "NEEDS_INFORMATION", label: "Needs information" },
  { value: "APPROVED", label: "Approved" }, { value: "REJECTED", label: "Rejected" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];
const statusLabel = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/^./, letter => letter.toUpperCase());
const dateTime = (value?: string | null) => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

async function accessToken(client: SupabaseClient) {
  const { data } = await client.auth.getSession();
  if (!data.session) throw new Error("Your session has expired. Please sign in again.");
  return data.session.access_token;
}

export function VendorApplicationsAdmin({ supabaseUrl, publishableKey }: { supabaseUrl: string; publishableKey: string }) {
  const router = useRouter();
  const client = useMemo(() => supabaseUrl && publishableKey ? createClient(supabaseUrl, publishableKey) : null, [supabaseUrl, publishableKey]);
  const [signedIn, setSignedIn] = useState(false);
  const [sessionReady, setSessionReady] = useState(() => !client);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState(""); const [confirmPassword, setConfirmPassword] = useState("");
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [selected, setSelected] = useState<ApplicationDetail | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [status, setStatus] = useState<"" | Status>(""); const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState(""); const [reason, setReason] = useState("");
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const requestNumber = useRef(0);

  const signOutOffice = useCallback(async () => {
    if (!client) return;
    const { data } = await client.auth.getSession();
    if (data.session) {
      await fetch("/api/admin/session-events", {
        method: "POST", cache: "no-store",
        headers: { Authorization: `Bearer ${data.session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ event: "LOGOUT" }),
      }).catch(() => undefined);
    }
    await client.auth.signOut();
  }, [client]);

  const api = useCallback(async (path: string, init?: RequestInit) => {
    if (!client) throw new Error("Administrator sign-in is not configured.");
    const token = await accessToken(client);
    const response = await fetch(path, {
      ...init, cache: "no-store",
      headers: { Authorization: `Bearer ${token}`, ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
      if (response.status === 401 || response.status === 403) {
        setSignedIn(false);
        await client.auth.signOut();
        router.replace("/admin/login?returnTo=/admin/vendor-applications");
      }
      throw new Error(result?.error?.message || "The administrator service is temporarily unavailable.");
    }
    return result.data;
  }, [client, router]);

  const loadApplications = useCallback(async (page = 1) => {
    const currentRequest = ++requestNumber.current; setBusy(true); setMessage("");
    try {
      const query = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (status) query.set("status", status); if (appliedSearch) query.set("search", appliedSearch);
      const data = await api(`/api/admin/vendor-applications?${query}`);
      if (currentRequest === requestNumber.current) { setApplications(data.applications); setPagination(data.pagination); }
    } catch (error) { if (currentRequest === requestNumber.current) setMessage(error instanceof Error ? error.message : "Unable to load applications."); }
    finally { if (currentRequest === requestNumber.current) setBusy(false); }
  }, [api, appliedSearch, status]);

  const openApplication = useCallback(async (id: string) => {
    setBusy(true); setMessage("");
    try { const data = await api(`/api/admin/vendor-applications/${encodeURIComponent(id)}`); setSelected(data.application); setReason(data.application.reviewNotes || ""); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load the application."); }
    finally { setBusy(false); }
  }, [api]);

  useEffect(() => {
    if (!client) return;
    void client.auth.getSession().then(({ data }) => {
      setSignedIn(Boolean(data.session)); setSessionReady(true);
      if (!data.session) router.replace("/admin/login?returnTo=/admin/vendor-applications");
    });
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
      if (!session) { setApplications([]); setSelected(null); router.replace("/admin/login?returnTo=/admin/vendor-applications"); }
    });
    return () => data.subscription.unsubscribe();
  }, [client, router]);
  useEffect(() => {
    if (!signedIn) return;
    const task = window.setTimeout(() => void loadApplications(1), 0);
    return () => window.clearTimeout(task);
  }, [signedIn, loadApplications]);

  async function changePassword(event: FormEvent) {
    event.preventDefault(); if (!client || busy) return;
    if (newPassword.length < 12) { setMessage("Use a password containing at least 12 characters."); return; }
    if (newPassword !== confirmPassword) { setMessage("The new passwords do not match."); return; }
    setBusy(true); setMessage("");
    try {
      const { error } = await client.auth.updateUser({ password: newPassword }); if (error) throw error;
      setNewPassword(""); setConfirmPassword(""); setChangingPassword(false);
      await signOutOffice();
      setMessage("Password changed successfully. Sign in again with your new password.");
    } catch { setMessage("Unable to change the password. Request a new recovery email and try again."); }
    finally { setBusy(false); }
  }
  async function review(action: "START_REVIEW" | "REQUEST_INFORMATION" | "REJECT") {
    if (!selected || busy) return; setBusy(true); setMessage("");
    try {
      await api(`/api/admin/vendor-applications/${encodeURIComponent(selected.referenceId)}/review`, { method: "POST", body: JSON.stringify({ action, reason }) });
      await openApplication(selected.referenceId); await loadApplications(pagination.page);
      setMessage(action === "START_REVIEW" ? "Review started." : action === "REJECT" ? "Application rejected." : "Information request recorded.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to update the review."); setBusy(false); }
  }
  async function approve() {
    if (!selected || busy || !window.confirm(`Approve ${selected.companyName} and create an inactive vendor profile?`)) return;
    setBusy(true); setMessage("");
    try {
      const data = await api(`/api/admin/vendor-applications/${encodeURIComponent(selected.referenceId)}/approve`, { method: "POST", body: JSON.stringify({ notes: reason }) });
      await openApplication(selected.referenceId); await loadApplications(pagination.page);
      setMessage(`Approved. Vendor ${data.vendor.vendorCode} was created as ${data.vendor.status}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to approve the application."); setBusy(false); }
  }

  if (!sessionReady) return <main className={styles.page}><p className={styles.loading}>Checking administrator session…</p></main>;
  if (!client) return <main className={styles.page}><section className={styles.signIn}><h1>Administrator access</h1><p>Supabase administrator sign-in is not configured.</p></section></main>;
  if (!signedIn) return <main className={styles.page}><p className={styles.loading}>Redirecting to office sign in…</p></main>;

  return <main className={styles.page}>
    <header className={styles.titleRow}><div><p className={styles.eyebrow}>PARTNER OPERATIONS</p><h1>Vendor applications</h1><p>Review company applications before creating inactive vendor profiles.</p></div><div className={styles.accountActions}><button className={styles.linkButton} onClick={() => { setChangingPassword(value => !value); setMessage(""); }}>Change password</button><button className={styles.linkButton} onClick={() => void signOutOffice()}>Sign out</button></div></header>
    {changingPassword && <form className={styles.passwordPanel} onSubmit={changePassword}><div><h2>Change administrator password</h2><p>Use at least 12 characters. You will be signed out after the password changes.</p></div><label>New password<input type="password" autoComplete="new-password" minLength={12} required value={newPassword} onChange={event => setNewPassword(event.target.value)} /></label><label>Confirm password<input type="password" autoComplete="new-password" minLength={12} required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} /></label><div className={styles.actionButtons}><button className={styles.primary} disabled={busy}>{busy ? "Updating…" : "Update password"}</button><button type="button" className={styles.secondary} disabled={busy} onClick={() => { setChangingPassword(false); setNewPassword(""); setConfirmPassword(""); }}>Cancel</button></div></form>}
    <section className={styles.toolbar} aria-label="Application filters">
      <form onSubmit={event => { event.preventDefault(); setAppliedSearch(search.trim()); }}><label><span className={styles.srOnly}>Search applications</span><input maxLength={100} placeholder="Search reference, company, contact…" value={search} onChange={event => setSearch(event.target.value)} /></label><button className={styles.secondary}>Search</button></form>
      <label><span className={styles.srOnly}>Filter by status</span><select value={status} onChange={event => { setStatus(event.target.value as "" | Status); setSelected(null); }}>{statuses.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <button className={styles.linkButton} disabled={busy} onClick={() => void loadApplications(pagination.page)}>Refresh</button>
    </section>
    {message && <p className={message.includes("failed") || message.includes("Unable") || message.includes("required") ? styles.errorBanner : styles.successBanner} role="status">{message}</p>}
    <div className={styles.workspace}>
      <section className={styles.listPanel} aria-label="Vendor applications">
        <div className={styles.listHeading}><strong>{pagination.total} application{pagination.total === 1 ? "" : "s"}</strong><span>Page {pagination.page} of {Math.max(1, pagination.totalPages)}</span></div>
        {busy && !applications.length ? <p className={styles.empty}>Loading applications…</p> : !applications.length ? <p className={styles.empty}>No applications match these filters.</p> : <ul className={styles.applicationList}>{applications.map(application => <li key={application.id}><button className={selected?.id === application.id ? styles.selectedCard : styles.applicationCard} onClick={() => void openApplication(application.referenceId)}><span className={styles.cardTop}><strong>{application.companyName}</strong><span className={`${styles.badge} ${styles[application.status]}`}>{statusLabel(application.status)}</span></span><span>{application.referenceId}</span><span>{application.city}, {application.state} · {application.contactName}</span><small>Received {dateTime(application.createdAt)}</small></button></li>)}</ul>}
        <div className={styles.pagination}><button disabled={busy || pagination.page <= 1} onClick={() => void loadApplications(pagination.page - 1)}>Previous</button><button disabled={busy || pagination.page >= pagination.totalPages} onClick={() => void loadApplications(pagination.page + 1)}>Next</button></div>
      </section>
      <section className={styles.detailPanel} aria-label="Application detail">
        {!selected ? <div className={styles.emptyDetail}><h2>Select an application</h2><p>Review its business, contact and callback details here.</p></div> : <>
          <div className={styles.detailTitle}><div><span className={`${styles.badge} ${styles[selected.status]}`}>{statusLabel(selected.status)}</span><h2>{selected.companyName}</h2><p>{selected.referenceId}</p></div><button className={styles.close} aria-label="Close application details" onClick={() => setSelected(null)}>×</button></div>
          <dl className={styles.details}><dt>Business type</dt><dd>{statusLabel(selected.businessType)}</dd><dt>Operating category</dt><dd>{statusLabel(selected.operatingCategory)}</dd><dt>Contact</dt><dd>{selected.contactName}<br/><a href={`tel:+91${selected.mobile}`}>+91 {selected.mobile}</a><br/><a href={`mailto:${selected.email}`}>{selected.email}</a></dd><dt>Registered address</dt><dd>{selected.addressLine1}, {selected.city}, {selected.state} {selected.postalCode}</dd><dt>GST / PAN</dt><dd>{selected.gstNumber || "Not provided"} / {selected.panNumber || "Not provided"}</dd><dt>Consent recorded</dt><dd>{dateTime(selected.consentAt)}</dd><dt>Reviewer</dt><dd>{selected.reviewedByUser ? `${selected.reviewedByUser.fullName} (${selected.reviewedByUser.role})` : "Not assigned"}</dd><dt>Review completed</dt><dd>{dateTime(selected.reviewedAt)}</dd>{selected.vendor && <><dt>Vendor profile</dt><dd><strong>{selected.vendor.vendorCode}</strong> · {selected.vendor.status}</dd></>}</dl>
          {selected.callbackRequests.length > 0 && <section className={styles.callbacks}><h3>Callback requests ({selected.callbackRequests.length})</h3>{selected.callbackRequests.map(callback => <p key={callback.id}><strong>{callback.fullName}</strong> · {callback.mobile}<br/><span>{dateTime(callback.preferredTime)} · {statusLabel(callback.status)}</span></p>)}</section>}
          {!(["APPROVED", "REJECTED", "WITHDRAWN"] as Status[]).includes(selected.status) && <section className={styles.actions}><h3>Review decision</h3><label>Review note or reason<textarea maxLength={1000} rows={4} value={reason} onChange={event => setReason(event.target.value)} placeholder="Required when requesting information or rejecting" /></label><div className={styles.actionButtons}>{selected.status !== "UNDER_REVIEW" && <button disabled={busy} className={styles.secondary} onClick={() => void review("START_REVIEW")}>Start review</button>}<button disabled={busy || reason.trim().length < 3} className={styles.secondary} onClick={() => void review("REQUEST_INFORMATION")}>Request information</button><button disabled={busy || selected.status !== "UNDER_REVIEW"} className={styles.primary} onClick={() => void approve()}>Approve</button><button disabled={busy || reason.trim().length < 3} className={styles.danger} onClick={() => void review("REJECT")}>Reject</button></div></section>}
        </>}
      </section>
    </div>
  </main>;
}
