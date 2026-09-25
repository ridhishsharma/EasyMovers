"use client";

import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import styles from "./crm-directory.module.css";

type Vendor = { id: string; vendorCode: string; companyName: string; ownerName: string; ownerMobile: string; ownerEmail: string | null; city: string | null; state: string | null; status: string; rating: number; completedMoves: number; createdAt: string; _count: { serviceAreas: number; vehicles: number; documents: number; assignedBookings: number } };
type Lead = { id: string; referenceId: string; name: string; mobile: string; email: string | null; pickupCity: string | null; destinationCity: string | null; shiftingType: string | null; shiftingDate: string | null; source: string; status: string; createdAt: string; lastUpdatedAt: string; _count: { bookings: number; quotations: number } };
type Pagination = { page: number; pageSize: number; total: number; totalPages: number };

const vendorStatuses = [["", "All statuses"], ["ACTIVE", "Active"], ["INACTIVE", "Inactive"], ["PENDING", "Pending verification"]];
const leadStatuses = [["", "All statuses"], ["OPEN", "Open pipeline"], ["NEW", "New"], ["CONTACTED", "Contacted"], ["QUALIFIED", "Qualified"], ["INVENTORY_PENDING", "Inventory pending"], ["QUOTATION_REQUESTED", "Quotation requested"], ["QUOTATION_RECEIVED", "Quotation received"], ["BOOKING_CREATED", "Booking created"], ["CONVERTED", "Converted"], ["LOST", "Lost"], ["CLOSED", "Closed"]];
const label = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/^./, character => character.toUpperCase());
const dateTime = (value: string) => new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export function CrmDirectory({ kind, supabaseUrl, publishableKey }: { kind: "vendors" | "leads"; supabaseUrl: string; publishableKey: string }) {
  const router = useRouter();
  const client = useMemo(() => supabaseUrl && publishableKey ? createClient(supabaseUrl, publishableKey) : null, [supabaseUrl, publishableKey]);
  const initial = useMemo(() => typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search), []);
  const [status, setStatus] = useState(initial.get("status")?.toUpperCase() ?? "");
  const [period, setPeriod] = useState(initial.get("period")?.toLowerCase() ?? "");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [records, setRecords] = useState<Array<Vendor | Lead>>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 25, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async (page = 1) => {
    if (!client) { setMessage("Administrator sign-in is not configured."); setLoading(false); return; }
    setLoading(true); setMessage("");
    const { data } = await client.auth.getSession();
    if (!data.session) { router.replace(`/admin/login?returnTo=/admin/${kind}`); return; }
    const query = new URLSearchParams({ page: String(page), pageSize: "25" });
    if (status) query.set("status", status);
    if (period) query.set("period", period);
    if (appliedSearch) query.set("search", appliedSearch);
    try {
      const response = await fetch(`/api/admin/${kind}?${query}`, { cache: "no-store", headers: { Authorization: `Bearer ${data.session.access_token}` } });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload?.error?.message || `Unable to load ${kind}.`);
      setRecords(payload.data[kind]); setPagination(payload.data.pagination);
      const address = new URLSearchParams(); if (status) address.set("status", status); if (period) address.set("period", period); if (appliedSearch) address.set("search", appliedSearch);
      window.history.replaceState(null, "", `/admin/${kind}${address.size ? `?${address}` : ""}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : `Unable to load ${kind}.`); }
    finally { setLoading(false); }
  }, [appliedSearch, client, kind, period, router, status]);

  useEffect(() => { void load(1); }, [load]);
  const filterOptions = kind === "vendors" ? vendorStatuses : leadStatuses;
  const heading = kind === "vendors" ? "Vendor directory" : "Lead pipeline";

  function searchRecords(event: FormEvent) { event.preventDefault(); setAppliedSearch(search.trim()); }

  return <main className={styles.page}>
    <header className={styles.heading}><div><p>{kind === "vendors" ? "PARTNER NETWORK" : "SALES OPERATIONS"}</p><h1>{heading}</h1><span>{kind === "vendors" ? "Review vendor readiness and operational capacity." : "Identify, prioritise and follow every moving enquiry."}</span></div><button onClick={() => void load(pagination.page)}>Refresh</button></header>
    <section className={styles.toolbar} aria-label={`${heading} filters`}>
      <form onSubmit={searchRecords}><input maxLength={100} aria-label={`Search ${kind}`} placeholder={kind === "vendors" ? "Search vendor, code, owner, city…" : "Search lead, reference, mobile, city…"} value={search} onChange={event => setSearch(event.target.value)} /><button>Search</button></form>
      <select aria-label={`Filter ${kind} by status`} value={status} onChange={event => setStatus(event.target.value)}>{filterOptions.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select>
      {kind === "leads" && <select aria-label="Filter leads by date" value={period} onChange={event => setPeriod(event.target.value)}><option value="">Any date</option><option value="today">Received today</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select>}
    </section>
    {message && <p className={styles.error} role="alert">{message}</p>}
    <section className={styles.panel}>
      <div className={styles.summary}><strong>{pagination.total} {kind}</strong><span>Page {pagination.page} of {Math.max(1, pagination.totalPages)}</span></div>
      {loading ? <p className={styles.empty}>Loading {kind}…</p> : records.length === 0 ? <p className={styles.empty}>No records match these filters.</p> : <div className={styles.tableWrap}><table><thead>{kind === "vendors" ? <tr><th>Vendor</th><th>Status</th><th>Location</th><th>Contact</th><th>Operational record</th></tr> : <tr><th>Lead</th><th>Status</th><th>Route</th><th>Contact</th><th>Received</th></tr>}</thead><tbody>{records.map(record => kind === "vendors" ? <VendorRow key={record.id} vendor={record as Vendor} /> : <LeadRow key={record.id} lead={record as Lead} />)}</tbody></table></div>}
      <div className={styles.pagination}><button disabled={loading || pagination.page <= 1} onClick={() => void load(pagination.page - 1)}>Previous</button><button disabled={loading || pagination.page >= pagination.totalPages} onClick={() => void load(pagination.page + 1)}>Next</button></div>
    </section>
  </main>;
}

function VendorRow({ vendor }: { vendor: Vendor }) {
  return <tr><td><strong>{vendor.companyName}</strong><small>{vendor.vendorCode}<br/>{vendor.ownerName}</small></td><td><span className={`${styles.badge} ${styles[vendor.status] || ""}`}>{label(vendor.status)}</span></td><td>{vendor.city || "—"}{vendor.state ? `, ${vendor.state}` : ""}</td><td><a href={`tel:+91${vendor.ownerMobile}`}>+91 {vendor.ownerMobile}</a>{vendor.ownerEmail && <small><a href={`mailto:${vendor.ownerEmail}`}>{vendor.ownerEmail}</a></small>}</td><td><strong>{vendor._count.assignedBookings} bookings</strong><small>{vendor._count.serviceAreas} areas · {vendor._count.vehicles} vehicles · {vendor._count.documents} documents</small></td></tr>;
}

function LeadRow({ lead }: { lead: Lead }) {
  return <tr><td><strong>{lead.name}</strong><small>{lead.referenceId}<br/>{label(lead.source)}</small></td><td><span className={`${styles.badge} ${styles[lead.status] || ""}`}>{label(lead.status)}</span></td><td>{lead.pickupCity || "Not supplied"} → {lead.destinationCity || "Not supplied"}<small>{lead.shiftingType ? label(lead.shiftingType) : "Move type pending"}</small></td><td><a href={`tel:+91${lead.mobile}`}>+91 {lead.mobile}</a>{lead.email && <small><a href={`mailto:${lead.email}`}>{lead.email}</a></small>}</td><td>{dateTime(lead.createdAt)}<small>{lead._count.quotations} quotations · {lead._count.bookings} bookings</small></td></tr>;
}
