"use client";

/* eslint-disable @next/next/no-img-element -- private five-minute signed URLs cannot use the public optimizer safely */

import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { LeadVendorInvitations } from "./lead-vendor-invitations";
import styles from "./lead-workspace.module.css";

type Lead = { id: string; referenceId: string; name: string; mobile: string; email: string | null; pickupCity: string | null; destinationCity: string | null; shiftingType: string | null; shiftingDate: string | null; source: string; status: string; createdAt: string; lastUpdatedAt: string; _count: { bookings: number; quotations: number } };
type LeadDetail = Lead & {
  pickupState: string | null; pickupPincode: string | null; pickupDigipin: string | null;
  destinationState: string | null; destinationPincode: string | null; destinationDigipin: string | null;
  houseType: string | null; officeSize: string | null; pickupFloor: string | null; liftAvailable: string | null; packingRequired: string | null;
  bikeCount: number | null; carCount: number | null; vehicleCount: number | null; vehicleType: string | null; plantsIncluded: boolean | null;
  request: { pickupAddress: string | null; destinationAddress: string | null; destinationFloor: string | null; destinationLift: string | null; parking: string | null; specialItems: string | null; additionalServices: string | null; submittedAt: string | null; pricingDecision: { route?: string; reasons?: string[] } | null };
  assistance: { callbackRequested: boolean; callbackSlot: string | null; surveyPreference: "REQUESTED" | "VENDOR_DECIDES"; surveyStatus: "PENDING" | "NOT_REQUESTED" };
  inventory: null | { id: string; status: string; completionPercentage: number; updatedAt: string; callbackRequested: boolean; callbackSlot: string | null; photoInventoryRequested: boolean; pickupFloor: number | null; pickupLiftAvailable: boolean; pickupParkingDistance: string | null; pickupPropertyType: string | null; destinationFloor: number | null; destinationLiftAvailable: boolean; destinationParkingDistance: string | null; destinationPropertyType: string | null; packingType: string | null; surveyType: string | null; remarks: string | null; items: Array<{ id: string; category: string; itemName: string; quantity: number; fragile: boolean; requiresPacking: boolean; remarks: string | null }>; photos: Array<{ id: string; roomType: string | null; createdAt: string; url: string | null }> };
  quotations: Array<{
    id: string; quotationNumber: string; status: string; currency: string;
    transportationCost: string; packingCost: string; unpackingCost: string;
    labourCost: string; insuranceCost: string; otherCost: string;
    discountAmount: string; taxAmount: string; totalAmount: string;
    pickupDate: string | null; deliveryDate: string | null; transitDays: number | null;
    validUntil: string | null; inclusionsJson: unknown; exclusionsJson: unknown;
    remarks: string | null; createdAt: string; updatedAt: string;
    vendor: { vendorCode: string; companyName: string; ratingSummary: null | { averageRating: string; totalReviews: number; completedBookings: number; onTimeDeliveryScore: string; recommendationRate: string } };
  }>;
  bookings: Array<{ id: string; bookingNumber: string; bookingStatus: string; paymentStatus: string; totalAmount: string; currency: string; createdAt: string }>;
  moveSurveys: Array<{ id: string; surveyNumber: string; version: number; status: string; mode: string; assignedToUserId: string | null; assignedToVendorId: string | null; scheduledAt: string | null; customerConfirmedAt: string | null; submittedAt: string | null; reviewedAt: string | null; approvedAt: string | null; sharedAt: string | null; reviewRemarks: string | null; _count: { rooms: number; media: number } }>;
  surveyAssignees: Array<{ id: string; fullName: string; email: string | null; mobile: string }>;
  capabilities: { canAssignSurvey: boolean };
};
type Pagination = { page: number; pageSize: number; total: number; totalPages: number };

const statuses = [["", "All statuses"], ["OPEN", "Open pipeline"], ["NEW", "New"], ["CONTACTED", "Contacted"], ["QUALIFIED", "Qualified"], ["INVENTORY_PENDING", "Inventory pending"], ["QUOTATION_REQUESTED", "Quotation requested"], ["QUOTATION_RECEIVED", "Quotation received"], ["BOOKING_CREATED", "Booking created"], ["CONVERTED", "Converted"], ["LOST", "Lost"], ["CLOSED", "Closed"]];
const label = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/^./, character => character.toUpperCase());
const dateTime = (value: string) => new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
const show = (value: unknown, fallback = "Not provided") => value === null || value === undefined || value === "" ? fallback : String(value);
const money = (currency: string, value: string) => new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value));
const jsonItems = (value: unknown) => Array.isArray(value)
  ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];

export function LeadWorkspace({ supabaseUrl, publishableKey }: { supabaseUrl: string; publishableKey: string }) {
  const router = useRouter();
  const client = useMemo(() => supabaseUrl && publishableKey ? createClient(supabaseUrl, publishableKey) : null, [supabaseUrl, publishableKey]);
  const initial = useMemo(() => typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search), []);
  const [status, setStatus] = useState(initial.get("status")?.toUpperCase() || "");
  const [period, setPeriod] = useState(initial.get("period")?.toLowerCase() || "");
  const [search, setSearch] = useState(initial.get("search") || "");
  const [appliedSearch, setAppliedSearch] = useState(initial.get("search") || "");
  const [records, setRecords] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 25, total: 0, totalPages: 0 });
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [message, setMessage] = useState("");

  const session = useCallback(async () => {
    if (!client) throw new Error("Administrator sign-in is not configured.");
    const { data } = await client.auth.getSession();
    if (!data.session) { router.replace("/admin/login?returnTo=/admin/leads"); throw new Error("Sign in to review leads."); }
    return data.session;
  }, [client, router]);

  const loadDetail = useCallback(async (leadId: string) => {
    setSelectedId(leadId); setDetailLoading(true); setDetail(null); setMessage("");
    try {
      const activeSession = await session();
      const response = await fetch(`/api/admin/leads/${encodeURIComponent(leadId)}`, { cache: "no-store", headers: { Authorization: `Bearer ${activeSession.access_token}` } });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload?.error?.message || "Unable to load lead details.");
      setDetail(payload.data);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load lead details."); }
    finally { setDetailLoading(false); }
  }, [session]);

  const load = useCallback(async (page = 1) => {
    setLoading(true); setMessage("");
    try {
      const activeSession = await session();
      const query = new URLSearchParams({ page: String(page), pageSize: "25" });
      if (status) query.set("status", status); if (period) query.set("period", period); if (appliedSearch) query.set("search", appliedSearch);
      const response = await fetch(`/api/admin/leads?${query}`, { cache: "no-store", headers: { Authorization: `Bearer ${activeSession.access_token}` } });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload?.error?.message || "Unable to load leads.");
      setRecords(payload.data.leads); setPagination(payload.data.pagination);
      window.history.replaceState(null, "", `/admin/leads${query.size > 2 ? `?${new URLSearchParams([...query].filter(([key]) => !["page", "pageSize"].includes(key)))}` : ""}`);
      if (selectedId && !payload.data.leads.some((lead: Lead) => lead.id === selectedId)) { setSelectedId(""); setDetail(null); }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load leads."); }
    finally { setLoading(false); }
  }, [appliedSearch, period, selectedId, session, status]);

  useEffect(() => {
    // The query result is an external server resource synchronized to the filters.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(1);
  }, [load]);
  function searchLeads(event: FormEvent) { event.preventDefault(); setAppliedSearch(search.trim()); }

  return <main className={styles.page}>
    <header className={styles.heading}><div><p>SALES OPERATIONS</p><h1>Customer leads</h1><span>Review every submitted requirement before inviting vendors to quote.</span></div><button type="button" onClick={() => void load(pagination.page)}>Refresh</button></header>
    <section className={styles.toolbar} aria-label="Lead filters"><form onSubmit={searchLeads}><input maxLength={100} aria-label="Search leads" placeholder="Search reference, customer, mobile, email or city…" value={search} onChange={event => setSearch(event.target.value)}/><button>Search</button></form><select aria-label="Filter leads by status" value={status} onChange={event => setStatus(event.target.value)}>{statuses.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select><select aria-label="Filter leads by date" value={period} onChange={event => setPeriod(event.target.value)}><option value="">Any date</option><option value="today">Received today</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></section>
    {message && <p className={styles.error} role="alert">{message}</p>}
    <div className={styles.workspace}><section className={styles.listPanel}><div className={styles.summary}><strong>{pagination.total} leads</strong><span>Page {pagination.page} of {Math.max(1, pagination.totalPages)}</span></div>{loading ? <p className={styles.empty}>Loading leads…</p> : records.length === 0 ? <p className={styles.empty}>No leads match these filters.</p> : <div className={styles.leadList}>{records.map(lead => <button type="button" key={lead.id} className={selectedId === lead.id ? styles.selected : ""} onClick={() => void loadDetail(lead.id)}><span><strong>{lead.name}</strong><small>{lead.referenceId}</small><small>{lead.pickupCity || "Not supplied"} → {lead.destinationCity || "Not supplied"}</small></span><span><i className={`${styles.badge} ${styles[lead.status] || ""}`}>{label(lead.status)}</i><small>{dateTime(lead.createdAt)}</small><small>{lead._count.quotations} quotations</small></span></button>)}</div>}<div className={styles.pagination}><button disabled={loading || pagination.page <= 1} onClick={() => void load(pagination.page - 1)}>Previous</button><button disabled={loading || pagination.page >= pagination.totalPages} onClick={() => void load(pagination.page + 1)}>Next</button></div></section><LeadDetailPanel detail={detail} loading={detailLoading} supabaseUrl={supabaseUrl} publishableKey={publishableKey} onReload={loadDetail}/></div>
  </main>;
}

function LeadDetailPanel({ detail, loading, supabaseUrl, publishableKey, onReload }: { detail: LeadDetail | null; loading: boolean; supabaseUrl: string; publishableKey: string; onReload: (leadId: string) => Promise<void> }) {
  if (loading) return <aside className={styles.detailPanel}><p className={styles.empty}>Loading complete request…</p></aside>;
  if (!detail) return <aside className={styles.detailPanel}><p className={styles.empty}>Select a lead to review the complete moving request.</p></aside>;
  const surveyRequested = detail.assistance.surveyPreference === "REQUESTED";
  return <aside className={styles.detailPanel} aria-label={`Lead ${detail.referenceId} details`}><header className={styles.detailHeader}><div><i className={`${styles.badge} ${styles[detail.status] || ""}`}>{label(detail.status)}</i><h2>{detail.name}</h2><p>{detail.referenceId} · Received {dateTime(detail.createdAt)}</p></div><div className={styles.contact}><a href={`tel:+91${detail.mobile}`}>+91 {detail.mobile}</a>{detail.email && <a href={`mailto:${detail.email}`}>{detail.email}</a>}</div></header>
    <section className={styles.alertGrid}><article className={detail.assistance.callbackRequested ? styles.attention : styles.neutral}><strong>Callback</strong><span>{detail.assistance.callbackRequested ? "Requested" : "Not requested"}</span><small>{detail.assistance.callbackSlot ? dateTime(detail.assistance.callbackSlot) : "No callback slot"}</small></article><article className={surveyRequested ? styles.attention : styles.neutral}><strong>Pre-move survey</strong><span>{surveyRequested ? "Requested" : "Vendor may decide"}</span><small>{surveyRequested ? "Pending staff scheduling" : "No customer request"}</small></article><article className={styles.neutral}><strong>Pricing route</strong><span>{detail.request.pricingDecision?.route ? label(detail.request.pricingDecision.route) : "Not calculated"}</span><small>{detail.quotations.length} quotation(s)</small></article></section>
    <DetailSection title="Move requirement"><dl><dt>Route</dt><dd>{show(detail.pickupCity)} → {show(detail.destinationCity)}</dd><dt>Moving date</dt><dd>{show(detail.shiftingDate)}</dd><dt>Service</dt><dd>{detail.shiftingType ? label(detail.shiftingType) : "Not provided"}</dd><dt>Property / size</dt><dd>{[detail.houseType, detail.officeSize].filter(Boolean).join(" · ") || "Not provided"}</dd><dt>Packing</dt><dd>{show(detail.packingRequired)}</dd><dt>Special items</dt><dd>{show(detail.request.specialItems)}</dd><dt>Additional services</dt><dd>{show(detail.request.additionalServices)}</dd></dl></DetailSection>
    <DetailSection title="Addresses and access"><dl><dt>Pickup</dt><dd>{show(detail.request.pickupAddress)}<small>{[detail.pickupCity, detail.pickupState, detail.pickupPincode].filter(Boolean).join(", ")}</small></dd><dt>Destination</dt><dd>{show(detail.request.destinationAddress)}<small>{[detail.destinationCity, detail.destinationState, detail.destinationPincode].filter(Boolean).join(", ")}</small></dd><dt>Pickup access</dt><dd>Floor {show(detail.inventory?.pickupFloor ?? detail.pickupFloor)} · Lift {detail.inventory ? (detail.inventory.pickupLiftAvailable ? "Yes" : "No") : show(detail.liftAvailable)}</dd><dt>Destination access</dt><dd>Floor {show(detail.inventory?.destinationFloor ?? detail.request.destinationFloor)} · Lift {detail.inventory ? (detail.inventory.destinationLiftAvailable ? "Yes" : "No") : show(detail.request.destinationLift)}</dd><dt>Parking / loading</dt><dd>{show(detail.request.parking)}</dd></dl></DetailSection>
    <DetailSection title={`Declared inventory (${detail.inventory?.items.length || 0})`}>{!detail.inventory?.items.length ? <p>No inventory items recorded.</p> : <div className={styles.itemList}>{detail.inventory.items.map(item => <article key={item.id}><strong>{item.quantity} × {item.itemName}</strong><span>{label(item.category)}</span><small>{item.fragile ? "Fragile · " : ""}{item.requiresPacking ? "Packing required" : "No packing requested"}</small></article>)}</div>}</DetailSection>
    <DetailSection title={`Inventory photos (${detail.inventory?.photos.length || 0})`}>{!detail.inventory?.photos.length ? <p>No photos uploaded.</p> : <div className={styles.photoGrid}>{detail.inventory.photos.map(photo => photo.url ? <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer">{/* Signed private URLs are intentionally rendered without the public Next.js image optimizer. */}<img src={photo.url} alt={photo.roomType ? `${photo.roomType} inventory` : "Customer inventory"}/><span>{photo.roomType || "Inventory photo"}</span></a> : <article key={photo.id}>Photo temporarily unavailable</article>)}</div>}</DetailSection>
    <SurveyAssignment key={`${detail.id}-${detail.moveSurveys[0]?.id || "new"}`} detail={detail} supabaseUrl={supabaseUrl} publishableKey={publishableKey} onReload={onReload}/>
    <LeadVendorInvitations leadId={detail.id} supabaseUrl={supabaseUrl} publishableKey={publishableKey} address={{ pickupAddress: detail.request.pickupAddress, pickupPincode: detail.pickupPincode, destinationAddress: detail.request.destinationAddress, destinationPincode: detail.destinationPincode }} onAddressUpdated={() => void onReload(detail.id)}/>
    <DetailSection title={`Quotations (${detail.quotations.length})`}>{detail.quotations.length === 0 ? <p>No vendor quotations received yet.</p> : <><p className={styles.sectionHint}>Staff can inspect the complete commercial offer here. Customer delivery and acceptance must use the protected comparison journey.</p><div className={styles.quotationList}>{detail.quotations.map((quotation, index) => <QuotationCard key={quotation.id} quotation={quotation} position={index + 1}/>)}</div></>}</DetailSection>
    <DetailSection title={`Bookings (${detail.bookings.length})`}>{detail.bookings.length === 0 ? <p>No booking created.</p> : <div className={styles.recordList}>{detail.bookings.map(booking => <article key={booking.id}><strong>{booking.bookingNumber}</strong><span>{label(booking.bookingStatus)} · {label(booking.paymentStatus)}</span><small>{booking.currency} {booking.totalAmount}</small></article>)}</div>}</DetailSection>
  </aside>;
}

function SurveyAssignment({ detail, supabaseUrl, publishableKey, onReload }: { detail: LeadDetail; supabaseUrl: string; publishableKey: string; onReload: (leadId: string) => Promise<void> }) {
  const latest = detail.moveSurveys[0] || null;
  const [assignee, setAssignee] = useState(latest?.assignedToUserId || "");
  const [scheduledAt, setScheduledAt] = useState(latest?.scheduledAt ? new Date(latest.scheduledAt).toISOString().slice(0, 16) : "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function action(kind: "CREATE" | "SCHEDULE") {
    if (kind === "SCHEDULE" && (!latest || !assignee || !scheduledAt)) { setMessage("Choose an active staff member and a future survey time."); return; }
    setBusy(true); setMessage("");
    try {
      const client = createClient(supabaseUrl, publishableKey);
      const { data } = await client.auth.getSession();
      if (!data.session) throw new Error("Sign in again to manage the survey.");
      const response = await fetch(`/api/admin/leads/${encodeURIComponent(detail.id)}/surveys`, { method: "POST", cache: "no-store", headers: { Authorization: `Bearer ${data.session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify(kind === "CREATE" ? { action: "CREATE" } : { action: "SCHEDULE", surveyId: latest!.id, assignedToUserId: assignee, scheduledAt: new Date(scheduledAt).toISOString() }) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message || "Unable to update the survey.");
      setMessage(kind === "CREATE" ? "Survey record created. Assign it to staff now." : "Survey assigned and scheduled successfully.");
      await onReload(detail.id);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to update the survey."); }
    finally { setBusy(false); }
  }
  return <DetailSection title={`Surveys (${detail.moveSurveys.length})`}>
    {detail.moveSurveys.length === 0 ? <p>No tracked survey exists. Create one before assigning staff.</p> : <div className={styles.recordList}>{detail.moveSurveys.map(survey => <article key={survey.id}><strong>{survey.surveyNumber} · Version {survey.version}</strong><span>{label(survey.mode)} · {label(survey.status)}</span><small>{survey.assignedToUserId ? detail.surveyAssignees.find(user => user.id === survey.assignedToUserId)?.fullName || "Assigned staff" : "Unassigned"} · {survey._count.rooms} room(s) · {survey._count.media} media file(s){survey.scheduledAt ? ` · ${dateTime(survey.scheduledAt)}` : ""}</small></article>)}</div>}
    {detail.capabilities.canAssignSurvey && <div className={styles.invitationActions}>{!latest ? <button type="button" disabled={busy} onClick={() => void action("CREATE")}>{busy ? "Creating…" : "Create survey record"}</button> : <><label>Assign survey staff<select value={assignee} disabled={busy} onChange={event => setAssignee(event.target.value)}><option value="">Select active staff</option>{detail.surveyAssignees.map(user => <option key={user.id} value={user.id}>{user.fullName}{user.email ? ` · ${user.email}` : ""}</option>)}</select></label><label>Survey date and time<input type="datetime-local" min={new Date(Date.now() + 300000).toISOString().slice(0, 16)} value={scheduledAt} disabled={busy} onChange={event => setScheduledAt(event.target.value)}/></label><button type="button" disabled={busy || !assignee || !scheduledAt} onClick={() => void action("SCHEDULE")}>{busy ? "Saving…" : latest.assignedToUserId ? "Update assignment" : "Assign & schedule"}</button></>}</div>}
    {message && <p className={styles.successMessage} role="status">{message}</p>}
  </DetailSection>;
}

function QuotationCard({ quotation, position }: { quotation: LeadDetail["quotations"][number]; position: number }) {
  const rating = quotation.vendor.ratingSummary;
  const reviewed = Boolean(rating && rating.totalReviews > 0);
  const included = jsonItems(quotation.inclusionsJson);
  const excluded = jsonItems(quotation.exclusionsJson);
  const costs = [
    ["Transportation", quotation.transportationCost], ["Packing", quotation.packingCost],
    ["Unpacking", quotation.unpackingCost], ["Labour", quotation.labourCost],
    ["Insurance", quotation.insuranceCost], ["Other charges", quotation.otherCost],
    ["Vendor discount", `-${quotation.discountAmount}`], ["Tax", quotation.taxAmount],
  ] as const;
  return <details className={styles.quotationCard} open={position === 1}>
    <summary><span><strong>{quotation.vendor.companyName}</strong><small>{quotation.quotationNumber} · {label(quotation.status)}</small></span><span><b>{money(quotation.currency, quotation.totalAmount)}</b><small>Submitted {dateTime(quotation.createdAt)}</small></span></summary>
    <div className={styles.quotationBody}>
      <section className={styles.costBreakdown}><h4>Price breakdown</h4>{costs.map(([name, amount]) => <div key={name}><span>{name}</span><strong>{money(quotation.currency, amount)}</strong></div>)}<div className={styles.quotationTotal}><span>Total quotation</span><strong>{money(quotation.currency, quotation.totalAmount)}</strong></div></section>
      <section className={styles.offerDetails}><h4>Schedule and terms</h4><dl><dt>Pickup</dt><dd>{quotation.pickupDate ? dateTime(quotation.pickupDate) : "Not committed"}</dd><dt>Delivery</dt><dd>{quotation.deliveryDate ? dateTime(quotation.deliveryDate) : "Not committed"}</dd><dt>Transit</dt><dd>{quotation.transitDays ? `${quotation.transitDays} day(s)` : "Not committed"}</dd><dt>Valid until</dt><dd>{quotation.validUntil ? dateTime(quotation.validUntil) : "No expiry supplied"}</dd><dt>Vendor remarks</dt><dd>{quotation.remarks || "No remarks"}</dd></dl>{included.length > 0 ? <p><strong>Included:</strong> <span>{included.join(", ")}</span></p> : null}{excluded.length > 0 ? <p><strong>Excluded:</strong> <span>{excluded.join(", ")}</span></p> : null}</section>
      <section className={styles.vendorEvidence}><h4>Verified performance</h4>{reviewed ? <dl><dt>Customer rating</dt><dd>{Number(rating!.averageRating).toFixed(1)} / 5 ({rating!.totalReviews} reviews)</dd><dt>Completed moves</dt><dd>{rating!.completedBookings}</dd><dt>On-time delivery</dt><dd>{Number(rating!.onTimeDeliveryScore).toFixed(0)}%</dd><dt>Recommended</dt><dd>{Number(rating!.recommendationRate).toFixed(0)}%</dd></dl> : <p><strong>New partner</strong><span>No verified customer history is available yet. Do not display a fabricated rating or delivery percentage.</span></p>}</section>
    </div>
  </details>;
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className={styles.detailSection}><h3>{title}</h3>{children}</section>;
}
