"use client";

import { createClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./vendor-portal.module.css";
import performanceStyles from "./vendor-performance.module.css";
import ledgerStyles from "./vendor-financial-ledger.module.css";
import quoteStyles from "./vendor-quotation.module.css";
import { calculatePlatformFee } from "@/lib/platform-fee-policy";

type PortalData = {
  user: { fullName: string; email: string | null; mobile: string };
  vendor: { vendorCode: string; companyName: string; businessType: string; engagementMode: string; status: string };
  capabilities: { instantAvailability: boolean; quotationEnquiries: boolean };
  availability: { state: string; lastHeartbeatAt: string | null };
  enquiryPreference: { acceptingQuotationEnquiries: boolean; pausedUntil: string | null };
  summary: { pendingChanges: number; activeVehicles: number };
  quotationPerformance: {
    counts: { total: number; open: number; submitted: number; revised: number; shortlisted: number; accepted: number; unsuccessful: number; expired: number; withdrawn: number };
    acceptanceRate: number | null;
    totalQuotedValue: number;
    totalAcceptedValue: number;
    recent: Array<{
      id: string; quotationNumber: string; status: string; outcome: "ACCEPTED" | "NOT_ACCEPTED" | "IN_PROGRESS";
      totalAmount: number; validUntil: string | null; createdAt: string; updatedAt: string;
      booking: { bookingNumber: string; serviceType: string; moveType: string; moveDate: string; pickupCity: string; pickupState: string; dropCity: string; dropState: string };
    }>;
  };
  financialLedger: {
    summary: { bookings: number; customerTotal: number; customerReceived: number; customerOutstanding: number; commissionAmount: number; vendorNetPayable: number; settledAmount: number; failedAmount: number; vendorOutstanding: number; commissionPendingBookings: number };
    rows: Array<{
      id: string; paymentNumber: string; paymentStatus: string; currency: string; quotationNumber: string | null;
      booking: { bookingNumber: string; bookingStatus: string; serviceType: string; moveType: string; moveDate: string; pickupCity: string; pickupState: string; dropCity: string; dropState: string };
      customerTotal: number; customerReceived: number; customerOutstanding: number; vendorQuotedAmount: number | null;
      commissionAmount: number | null; commissionStatus: "LOCKED" | "PENDING_CONFIGURATION"; vendorNetPayable: number | null;
      settledAmount: number; processingAmount: number; failedAmount: number; vendorOutstanding: number | null; updatedAt: string;
    }>;
  };
};
type Opportunity = {
  id: string; bookingNumber: string; serviceType: string; moveType: string; moveDate: string;
  deliveryDate: string | null;
  pickupCity: string; pickupState: string; dropCity: string; dropState: string;
  pickupPincode: string; dropPincode: string; createdAt: string;
  pickupDetails: unknown; dropDetails: unknown; inventory: unknown; inventorySummary: unknown;
  requestedServices: unknown; requirements: unknown; schedule: unknown;
  myQuotation: null | {
    id: string; quotationNumber: string; status: string; transportationCost: number;
    packingCost: number; unpackingCost: number; labourCost: number; insuranceCost: number;
    otherCost: number; discountAmount: number; taxAmount: number; totalAmount: number;
    pickupDate: string | null; deliveryDate: string | null; validUntil: string | null; inclusions: unknown; exclusions: unknown; remarks: string | null; createdAt: string; updatedAt: string; editable: boolean;
  };
};

const detailRows = (value: unknown, prefix = ""): Array<[string, string]> => {
  if (value === null || value === undefined || value === "") return [];
  if (Array.isArray(value)) return value.flatMap((item, index) => detailRows(item, `${prefix}${prefix ? " " : ""}${index + 1}`));
  if (typeof value === "object") return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) => detailRows(item, `${prefix}${prefix ? " · " : ""}${key.replaceAll("_", " ")}`));
  return [[prefix || "Detail", typeof value === "boolean" ? value ? "Yes" : "No" : String(value)]];
};

function RequirementGroup({ title, value }: { title: string; value: unknown }) {
  const rows = detailRows(value);
  return <article><h3>{title}</h3>{rows.length ? <dl>{rows.map(([name, value], index) => <div key={`${name}-${index}`}><dt>{name}</dt><dd>{value}</dd></div>)}</dl> : <p>No additional details provided.</p>}</article>;
}

function InventoryByCategory({ value }: { value: unknown }) {
  const items = Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
  const groups = items.reduce<Record<string, Array<{ name: string; quantity: string; notes: string[] }>>>((result, item) => {
    const category = String(item.category || "Other").replaceAll("_", " ");
    const name = String(item.itemName || item.name || "Declared item");
    const quantity = String(item.quantity || 1);
    const notes = [item.fragile === true ? "Fragile" : "", item.requiresPacking === true ? "Packing required" : ""].filter(Boolean);
    (result[category] ||= []).push({ name, quantity, notes });
    return result;
  }, {});
  const categories = Object.entries(groups).sort(([left], [right]) => left.localeCompare(right));
  return <article><h3>Inventory and declared items — grouped by category</h3>{categories.length ? <dl>{categories.flatMap(([category, entries])=>entries.sort((left,right)=>left.name.localeCompare(right.name)).map((item,index)=><div key={`${category}-${item.name}-${index}`}><dt>{index === 0 ? category : ""}</dt><dd><strong>{item.name} × {item.quantity}</strong>{item.notes.length ? <small> · {item.notes.join(" · ")}</small> : null}</dd></div>))}</dl> : <p>No declared inventory items.</p>}</article>;
}

export function VendorPortalDashboard({ supabaseUrl, publishableKey }: { supabaseUrl: string; publishableKey: string }) {
  const client = useMemo(() => createClient(supabaseUrl, publishableKey), [supabaseUrl, publishableKey]);
  const [data, setData] = useState<PortalData | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [viewing, setViewing] = useState<Opportunity | null>(null);
  const [quoting, setQuoting] = useState<Opportunity | null>(null);
  const [declining, setDeclining] = useState<Opportunity | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const standardInclusions = ["Packing material", "Loading and unloading", "Furniture dismantling and reassembly", "Appliance uninstalling and installation", "Rope-pulling service", "Unpacking and placement", "Preferred pickup timing", "Dedicated move coordination"];
  const emptyQuote = { transportationCost: "", packingCost: "0", unpackingCost: "0", labourCost: "0", insuranceCost: "0", otherCost: "0", discountAmount: "0", taxAmount: "0", pickupDate: "", deliveryDate: "", validUntil: "", remarks: "", inclusions: [] as string[], exclusions: "", platformFeeAcknowledged: false };
  const [quote, setQuote] = useState(emptyQuote);
  const [quotationFilter, setQuotationFilter] = useState<"ALL" | "IN_PROGRESS" | "ACCEPTED" | "NOT_ACCEPTED">("ALL");
  const [ledgerFilter, setLedgerFilter] = useState<"ALL" | "OUTSTANDING" | "SETTLED" | "COMMISSION_PENDING">("ALL");

  const request = useCallback(async (url: string, options?: RequestInit) => {
    const { data: session } = await client.auth.getSession();
    if (!session.session) { window.location.replace("/vendor/login"); throw new Error("NO_SESSION"); }
    return fetch(url, { ...options, cache: "no-store", headers: { ...options?.headers, Authorization: `Bearer ${session.session.access_token}`, "Content-Type": "application/json" } });
  }, [client]);

  const load = useCallback(async () => {
    try {
      const response = await request("/api/vendor/portal");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Unable to load vendor portal.");
      setData(payload.data);
      if (payload.data.capabilities.quotationEnquiries) {
        const queueResponse = await request("/api/vendor/opportunities");
        const queuePayload = await queueResponse.json();
        if (queueResponse.ok) setOpportunities(queuePayload.data.opportunities);
      } else setOpportunities([]);
    } catch (error) { if ((error as Error).message !== "NO_SESSION") setMessage((error as Error).message); }
  }, [request]);

  useEffect(() => {
    // Initial remote state is loaded after the Supabase browser session exists.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    if (data?.availability.state !== "ONLINE") return;
    const timer = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition(position => {
        void request("/api/vendor/availability", {
          method: "PUT",
          body: JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        });
      }, () => undefined, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [data?.availability.state, request]);

  async function setAvailability(state: "ONLINE" | "PAUSED" | "OFFLINE") {
    setBusy(true); setMessage("");
    try {
      let location: { latitude?: number; longitude?: number } = {};
      if (state === "ONLINE") {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }));
        location = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      }
      const response = await request("/api/vendor/availability", { method: "POST", body: JSON.stringify({ state, ...location }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Availability could not be updated.");
      setMessage(state === "ONLINE" ? "You are online and eligible for matching while your heartbeat remains current." : `Work availability changed to ${state.toLowerCase()}.`);
      await load();
    } catch (error) {
      setMessage(error instanceof GeolocationPositionError ? "Allow location access before going online." : (error as Error).message);
    } finally { setBusy(false); }
  }

  async function setEnquiries(accepting: boolean) {
    setBusy(true); setMessage("");
    try {
      const response = await request("/api/vendor/enquiries", { method: "POST", body: JSON.stringify({ accepting }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Enquiry preference could not be updated.");
      setMessage(accepting ? "Quotation enquiries are now enabled." : "New quotation enquiries are paused.");
      await load();
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }

  async function submitQuotation(event: React.FormEvent) {
    event.preventDefault();
    if (!quoting) return;
    setBusy(true); setMessage("");
    try {
      const monetary = ["transportationCost", "packingCost", "unpackingCost", "labourCost", "insuranceCost", "otherCost", "discountAmount", "taxAmount"] as const;
      const amounts = Object.fromEntries(monetary.map(key => [key, Number(quote[key])]));
      if (Object.values(amounts).some(value => !Number.isFinite(value) || value < 0)) throw new Error("Enter valid non-negative quotation amounts.");
      const totalAmount = amounts.transportationCost + amounts.packingCost + amounts.unpackingCost + amounts.labourCost + amounts.insuranceCost + amounts.otherCost + amounts.taxAmount - amounts.discountAmount;
      if (totalAmount <= 0) throw new Error("Quotation total must be greater than zero.");
      const response = await request(`/api/vendor/opportunities/${quoting.id}/quotation`, {
        method: quoting.myQuotation ? "PUT" : "POST",
        body: JSON.stringify({ ...amounts, totalAmount, pickupDate: new Date(`${quote.pickupDate}T09:00:00+05:30`).toISOString(), deliveryDate: new Date(`${quote.deliveryDate}T18:00:00+05:30`).toISOString(), validUntil: quote.validUntil ? new Date(`${quote.validUntil}T23:59:59+05:30`).toISOString() : undefined, remarks: quote.remarks, inclusions: { items: quote.inclusions }, exclusions: { items: quote.exclusions.split("\n").map(item => item.trim()).filter(Boolean) }, platformFeeAcknowledged: quote.platformFeeAcknowledged }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message || "Quotation could not be submitted.");
      setMessage(`Quotation ${quoting.myQuotation ? "revised" : "submitted"} for ${quoting.bookingNumber}.`);
      setQuoting(null);
      setQuote(emptyQuote);
      await load();
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }

  async function declineInvitation(event: React.FormEvent) {
    event.preventDefault();
    if (!declining) return;
    setBusy(true); setMessage("");
    try {
      const response = await request(`/api/vendor/opportunities/${declining.id}/decline`, { method: "POST", body: JSON.stringify({ reason: declineReason }) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message || "The invitation could not be declined.");
      setMessage(`Quotation invitation ${declining.bookingNumber} declined.`); setDeclining(null); setDeclineReason(""); await load();
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }

  function prepareQuotation(item: Opportunity) {
    const current = item.myQuotation;
    const list = (value: unknown) => value && typeof value === "object" && !Array.isArray(value) && Array.isArray((value as {items?:unknown}).items) ? (value as {items:string[]}).items : [];
    setQuote(current ? {
      transportationCost: String(current.transportationCost), packingCost: String(current.packingCost),
      unpackingCost: String(current.unpackingCost), labourCost: String(current.labourCost),
      insuranceCost: String(current.insuranceCost), otherCost: String(current.otherCost),
      discountAmount: String(current.discountAmount), taxAmount: String(current.taxAmount),
      pickupDate: current.pickupDate?.slice(0, 10) || "", deliveryDate: current.deliveryDate?.slice(0, 10) || "",
      validUntil: current.validUntil?.slice(0, 10) || "", remarks: current.remarks || "", inclusions: list(current.inclusions), exclusions: list(current.exclusions).join("\n"), platformFeeAcknowledged: false,
    } : emptyQuote);
    setQuoting(item);
  }

  const newEnquiries = opportunities.filter(item => !item.myQuotation);
  const submittedQuotations = opportunities.filter(item => item.myQuotation);
  const performanceQuotations = data?.quotationPerformance.recent.filter(item => quotationFilter === "ALL" || item.outcome === quotationFilter) || [];
  const ledgerRows = data?.financialLedger.rows.filter(item => ledgerFilter === "ALL" || (ledgerFilter === "OUTSTANDING" && (item.vendorOutstanding || 0) > 0) || (ledgerFilter === "SETTLED" && item.vendorNetPayable !== null && item.vendorOutstanding === 0) || (ledgerFilter === "COMMISSION_PENDING" && item.commissionStatus === "PENDING_CONFIGURATION")) || [];
  const quoteAmounts = {transportationCost:Number(quote.transportationCost),packingCost:Number(quote.packingCost),unpackingCost:Number(quote.unpackingCost),labourCost:Number(quote.labourCost),insuranceCost:Number(quote.insuranceCost),otherCost:Number(quote.otherCost),discountAmount:Number(quote.discountAmount),taxAmount:Number(quote.taxAmount)};
  const quoteTotal = quoteAmounts.transportationCost+quoteAmounts.packingCost+quoteAmounts.unpackingCost+quoteAmounts.labourCost+quoteAmounts.insuranceCost+quoteAmounts.otherCost+quoteAmounts.taxAmount-quoteAmounts.discountAmount;
  const feePreview = calculatePlatformFee({...quoteAmounts,totalAmount:quoteTotal});
  if (!data) return <main className={styles.page}><section className={styles.loading}>{message || "Loading your vendor workspace…"}</section></main>;
  return <main className={styles.page}>
    <section className={styles.hero}>
      <div><p className={styles.eyebrow}>PARTNER WORKSPACE</p><h1>Welcome, {data.user.fullName.split(" ")[0]}</h1><p>{data.vendor.companyName} · {data.vendor.vendorCode}</p></div>
      <span className={data.vendor.status === "ACTIVE" ? styles.active : styles.inactive}>{data.vendor.status}</span>
    </section>
    {message && <p className={styles.message} role="status">{message}</p>}
    <section className={styles.summary}>
      <article><span>Work model</span><strong>{data.vendor.engagementMode.replaceAll("_", " ")}</strong></article>
      <article><span>Active vehicles</span><strong>{data.summary.activeVehicles}</strong></article>
      <article><span>Changes awaiting review</span><strong>{data.summary.pendingChanges}</strong></article>
    </section>
    {data.capabilities.quotationEnquiries && <section className={performanceStyles.panel}>
      <div className={styles.sectionTitle}><div><p className={styles.eyebrow}>QUOTATION PERFORMANCE</p><h2>Commercial results</h2></div><strong>{data.quotationPerformance.counts.total} quotations</strong></div>
      <div className={performanceStyles.cards}>
        <article><span>In progress</span><strong>{data.quotationPerformance.counts.open}</strong><small>{data.quotationPerformance.counts.shortlisted} shortlisted</small></article>
        <article><span>Accepted</span><strong>{data.quotationPerformance.counts.accepted}</strong><small>{data.quotationPerformance.acceptanceRate === null ? "No decided quotations" : `${data.quotationPerformance.acceptanceRate}% decision win rate`}</small></article>
        <article><span>Not accepted</span><strong>{data.quotationPerformance.counts.unsuccessful}</strong><small>{data.quotationPerformance.counts.expired} expired · {data.quotationPerformance.counts.withdrawn} withdrawn</small></article>
        <article><span>Accepted value</span><strong>₹{data.quotationPerformance.totalAcceptedValue.toLocaleString("en-IN")}</strong><small>Quoted ₹{data.quotationPerformance.totalQuotedValue.toLocaleString("en-IN")}</small></article>
      </div>
      <div className={performanceStyles.filters} aria-label="Filter quotation outcomes">
        {(["ALL", "IN_PROGRESS", "ACCEPTED", "NOT_ACCEPTED"] as const).map(filter => <button type="button" className={quotationFilter === filter ? performanceStyles.selected : ""} key={filter} onClick={() => setQuotationFilter(filter)}>{filter.replaceAll("_", " ")}</button>)}
      </div>
      {performanceQuotations.length ? <div className={performanceStyles.table}><div className={performanceStyles.head}><span>Quotation</span><span>Requirement</span><span>Amount</span><span>Result</span></div>{performanceQuotations.map(item => <article key={item.id}>
        <div><strong>{item.quotationNumber}</strong><small>{item.booking.bookingNumber}</small></div>
        <div><strong>{item.booking.serviceType.replaceAll("_", " ")}</strong><small>{item.booking.pickupCity}, {item.booking.pickupState} → {item.booking.dropCity}, {item.booking.dropState}</small></div>
        <strong>₹{item.totalAmount.toLocaleString("en-IN")}</strong>
        <div><em className={`${performanceStyles.outcome} ${item.outcome === "ACCEPTED" ? performanceStyles.won : item.outcome === "NOT_ACCEPTED" ? performanceStyles.lost : performanceStyles.pending}`}>{item.status.replaceAll("_", " ")}</em><small>Updated {new Date(item.updatedAt).toLocaleDateString("en-IN")}</small></div>
      </article>)}</div> : <p className={styles.empty}>No quotations match this result filter.</p>}
    </section>}
    <section className={ledgerStyles.panel}>
      <div className={styles.sectionTitle}><div><p className={styles.eyebrow}>FINANCIAL LEDGER</p><h2>Collections and vendor settlement</h2></div><strong>{data.financialLedger.summary.bookings} bookings</strong></div>
      <div className={ledgerStyles.cards}>
        <article><span>Customer received</span><strong>₹{data.financialLedger.summary.customerReceived.toLocaleString("en-IN")}</strong><small>Outstanding ₹{data.financialLedger.summary.customerOutstanding.toLocaleString("en-IN")}</small></article>
        <article><span>EasyMovers commission</span><strong>₹{data.financialLedger.summary.commissionAmount.toLocaleString("en-IN")}</strong><small>Locked booking snapshots only</small></article>
        <article><span>Vendor net payable</span><strong>₹{data.financialLedger.summary.vendorNetPayable.toLocaleString("en-IN")}</strong><small>After recorded commission</small></article>
        <article><span>Settlement remaining</span><strong>₹{data.financialLedger.summary.vendorOutstanding.toLocaleString("en-IN")}</strong><small>Settled ₹{data.financialLedger.summary.settledAmount.toLocaleString("en-IN")}{data.financialLedger.summary.failedAmount > 0 ? ` · Failed ₹${data.financialLedger.summary.failedAmount.toLocaleString("en-IN")}` : ""}</small></article>
      </div>
      {data.financialLedger.summary.commissionPendingBookings > 0 && <p className={ledgerStyles.warning}>{data.financialLedger.summary.commissionPendingBookings} booking(s) do not yet have a locked EasyMovers commission snapshot. Vendor payable is intentionally not estimated for those bookings.</p>}
      <div className={ledgerStyles.filters} aria-label="Filter settlement ledger">
        {(["ALL", "OUTSTANDING", "SETTLED", "COMMISSION_PENDING"] as const).map(filter => <button type="button" className={ledgerFilter === filter ? ledgerStyles.selected : ""} key={filter} onClick={() => setLedgerFilter(filter)}>{filter.replaceAll("_", " ")}</button>)}
      </div>
      {ledgerRows.length ? <div className={ledgerStyles.table}><div className={ledgerStyles.head}><span>Booking</span><span>Customer collection</span><span>Commission</span><span>Vendor payable</span><span>Settlement</span></div>{ledgerRows.map(item => <article key={item.id}>
        <div><strong>{item.booking.bookingNumber}</strong><small>{item.quotationNumber || item.paymentNumber}</small></div>
        <div><strong>₹{item.customerReceived.toLocaleString("en-IN")} received</strong><small>₹{item.customerOutstanding.toLocaleString("en-IN")} customer balance</small></div>
        <div>{item.commissionAmount === null ? <strong className={ledgerStyles.pending}>Pending configuration</strong> : <><strong>₹{item.commissionAmount.toLocaleString("en-IN")}</strong><small>EasyMovers commission</small></>}</div>
        <div>{item.vendorNetPayable === null ? <strong className={ledgerStyles.muted}>Not determined</strong> : <><strong>₹{item.vendorNetPayable.toLocaleString("en-IN")}</strong><small>Net payable</small></>}</div>
        <div>{item.vendorOutstanding === null ? <strong className={ledgerStyles.muted}>Awaiting commission</strong> : <><strong className={item.vendorOutstanding === 0 ? ledgerStyles.positive : ledgerStyles.pending}>₹{item.vendorOutstanding.toLocaleString("en-IN")} remaining</strong><small>₹{item.settledAmount.toLocaleString("en-IN")} settled{item.processingAmount > 0 ? ` · ₹${item.processingAmount.toLocaleString("en-IN")} processing` : ""}{item.failedAmount > 0 ? ` · ₹${item.failedAmount.toLocaleString("en-IN")} failed` : ""}</small></>}</div>
      </article>)}</div> : <p className={styles.empty}>No booking finances match this ledger filter.</p>}
    </section>
    <section className={styles.workModes}>
      {data.capabilities.instantAvailability && <article className={styles.controlCard}>
        <p className={styles.eyebrow}>INSTANT-RATE WORK</p><div className={styles.cardTitle}><h2>Driver availability</h2><span className={styles.presence}>{data.availability.state}</span></div>
        <p>Online operators may receive nearby eligible jobs. Going online requires location access and a current insured vehicle.</p>
        <div className={styles.actions}><button disabled={busy || data.availability.state === "ONLINE"} onClick={() => void setAvailability("ONLINE")}>Go online</button><button disabled={busy || data.availability.state === "PAUSED"} className={styles.secondary} onClick={() => void setAvailability("PAUSED")}>Pause</button><button disabled={busy || data.availability.state === "OFFLINE"} className={styles.secondary} onClick={() => void setAvailability("OFFLINE")}>Go offline</button></div>
      </article>}
      {data.capabilities.quotationEnquiries && <article className={styles.controlCard}>
        <p className={styles.eyebrow}>SURVEY & QUOTATION WORK</p><div className={styles.cardTitle}><h2>New enquiries</h2><span className={data.enquiryPreference.acceptingQuotationEnquiries ? styles.accepting : styles.paused}>{data.enquiryPreference.acceptingQuotationEnquiries ? "ACCEPTING" : "PAUSED"}</span></div>
        <p>Company vendors receive matched quotation enquiries without needing to remain online continuously.</p>
        <div className={styles.actions}><button disabled={busy || data.enquiryPreference.acceptingQuotationEnquiries} onClick={() => void setEnquiries(true)}>Accept enquiries</button><button disabled={busy || !data.enquiryPreference.acceptingQuotationEnquiries} className={styles.secondary} onClick={() => void setEnquiries(false)}>Pause enquiries</button></div>
      </article>}
    </section>
    <section className={styles.notice}><strong>Operational controls are immediate.</strong><p>Profile, service area, vehicle, document and bank-detail amendments remain protected by EasyMovers maker-checker approval.</p></section>
    {data.capabilities.quotationEnquiries && <section className={styles.opportunities}>
      <div className={styles.sectionTitle}><div><p className={styles.eyebrow}>MATCHED TO YOUR SERVICES & COVERAGE</p><h2>New quotation enquiries</h2></div><strong>{newEnquiries.length} awaiting quote</strong></div>
      {newEnquiries.length ? <div className={styles.opportunityGrid}>{newEnquiries.map(item => <article key={item.id}>
        <span>{item.bookingNumber}</span><h3>{item.serviceType.replaceAll("_", " ")}</h3>
        <p>{item.pickupCity}, {item.pickupState} → {item.dropCity}, {item.dropState}</p>
        <small>Move date: {new Date(item.moveDate).toLocaleDateString("en-IN")}</small>
        <div className={styles.cardActions}><button className={styles.secondaryButton} onClick={() => setViewing(item)}>View requirements</button><button className={styles.secondaryButton} onClick={() => setDeclining(item)}>Decline</button><button onClick={() => prepareQuotation(item)}>Prepare quotation</button></div>
      </article>)}</div> : <p className={styles.empty}>No eligible quotation enquiries are currently available for this vendor&apos;s active services and coverage.</p>}
    </section>}
    {declining && <form className={styles.quoteForm} onSubmit={declineInvitation}><div className={styles.sectionTitle}><div><p className={styles.eyebrow}>DECLINE QUOTATION INVITATION</p><h2>{declining.bookingNumber}</h2></div><button type="button" className={styles.close} onClick={() => { setDeclining(null); setDeclineReason(""); }}>Close</button></div><label>Reason<textarea required minLength={3} maxLength={500} value={declineReason} onChange={event => setDeclineReason(event.target.value)} placeholder="For example: unavailable on the moving date or route outside current capacity"/></label><button disabled={busy || declineReason.trim().length < 3}>{busy ? "Saving…" : "Confirm decline"}</button></form>}
    {data.capabilities.quotationEnquiries && <section className={styles.opportunities}>
      <div className={styles.sectionTitle}><div><p className={styles.eyebrow}>YOUR COMMERCIAL RESPONSES</p><h2>Submitted quotations</h2></div><strong>{submittedQuotations.length} visible</strong></div>
      {submittedQuotations.length ? <div className={styles.opportunityGrid}>{submittedQuotations.map(item => <article key={item.id}>
        <div className={styles.quoteStatus}><span>{item.myQuotation!.quotationNumber}</span><em>{item.myQuotation!.status}</em></div>
        <h3>{item.serviceType.replaceAll("_", " ")}</h3>
        <p>{item.pickupCity}, {item.pickupState} → {item.dropCity}, {item.dropState}</p>
        <strong className={styles.quoteAmount}>₹{item.myQuotation!.totalAmount.toLocaleString("en-IN")}</strong>
        <small>Updated {new Date(item.myQuotation!.updatedAt).toLocaleString("en-IN")}</small>
        <div className={styles.cardActions}><button className={styles.secondaryButton} onClick={() => setViewing(item)}>View enquiry</button>{item.myQuotation!.editable && <button onClick={() => prepareQuotation(item)}>Modify quotation</button>}</div>
      </article>)}</div> : <p className={styles.empty}>No quotations have been submitted from this vendor account.</p>}
    </section>}
    {viewing && <section className={styles.requirementPanel}>
      <div className={styles.sectionTitle}><div><p className={styles.eyebrow}>ANONYMOUS CUSTOMER REQUIREMENT</p><h2>{viewing.bookingNumber}</h2></div><button type="button" className={styles.close} onClick={() => setViewing(null)}>Close</button></div>
      <div className={styles.routeSummary}><div><span>Pickup</span><strong>{viewing.pickupCity}, {viewing.pickupState} {viewing.pickupPincode}</strong></div><b>→</b><div><span>Delivery</span><strong>{viewing.dropCity}, {viewing.dropState} {viewing.dropPincode}</strong></div><div><span>Move date</span><strong>{new Date(viewing.moveDate).toLocaleDateString("en-IN")}</strong></div></div>
      <p className={styles.privacyNote}>Customer identity, phone number, email and precise private address are hidden until the commercial workflow authorises disclosure.</p>
      <div className={styles.requirementGrid}>
        <InventoryByCategory value={viewing.inventory} />
        <RequirementGroup title="Inventory summary" value={viewing.inventorySummary} />
        <RequirementGroup title="Requested services" value={viewing.requestedServices} />
        <RequirementGroup title="Move requirements" value={viewing.requirements} />
        <RequirementGroup title="Schedule" value={viewing.schedule} />
        <RequirementGroup title="Pickup property" value={viewing.pickupDetails} />
        <RequirementGroup title="Delivery property" value={viewing.dropDetails} />
      </div>
      {(!viewing.myQuotation || viewing.myQuotation.editable) && <div className={styles.panelFooter}><button onClick={() => { setViewing(null); prepareQuotation(viewing); }}>{viewing.myQuotation ? "Modify quotation" : "Prepare quotation"}</button></div>}
    </section>}
    {quoting && <form className={styles.quoteForm} onSubmit={submitQuotation}>
      <div className={styles.sectionTitle}><div><p className={styles.eyebrow}>SECURE VENDOR QUOTATION</p><h2>{quoting.myQuotation ? `Modify ${quoting.myQuotation.quotationNumber}` : quoting.bookingNumber}</h2></div><button type="button" className={styles.close} onClick={() => setQuoting(null)}>Close</button></div>
      <div className={styles.quoteFields}>
        <label>Transportation ₹<input type="number" min="0" step="0.01" required value={quote.transportationCost} onChange={event => setQuote(current => ({ ...current, transportationCost: event.target.value, platformFeeAcknowledged: false }))} /></label>
        <label>Packing ₹<input type="number" min="0" step="0.01" value={quote.packingCost} onChange={event => setQuote(current => ({ ...current, packingCost: event.target.value, platformFeeAcknowledged: false }))} /></label>
        <label>Unpacking ₹<input type="number" min="0" step="0.01" value={quote.unpackingCost} onChange={event => setQuote(current => ({ ...current, unpackingCost: event.target.value, platformFeeAcknowledged: false }))} /></label>
        <label>Labour ₹<input type="number" min="0" step="0.01" value={quote.labourCost} onChange={event => setQuote(current => ({ ...current, labourCost: event.target.value, platformFeeAcknowledged: false }))} /></label>
        <label>Insurance ₹<input type="number" min="0" step="0.01" value={quote.insuranceCost} onChange={event => setQuote(current => ({ ...current, insuranceCost: event.target.value, platformFeeAcknowledged: false }))} /></label>
        <label>Other charges ₹<input type="number" min="0" step="0.01" value={quote.otherCost} onChange={event => setQuote(current => ({ ...current, otherCost: event.target.value, platformFeeAcknowledged: false }))} /></label>
        <label>Discount ₹<input type="number" min="0" step="0.01" value={quote.discountAmount} onChange={event => setQuote(current => ({ ...current, discountAmount: event.target.value, platformFeeAcknowledged: false }))} /></label>
        <label>Tax ₹<input type="number" min="0" step="0.01" value={quote.taxAmount} onChange={event => setQuote(current => ({ ...current, taxAmount: event.target.value, platformFeeAcknowledged: false }))} /></label>
        <label>Committed pickup date<input type="date" required value={quote.pickupDate} onChange={event => setQuote(current => ({ ...current, pickupDate: event.target.value, platformFeeAcknowledged: false }))} /></label>
        <label>Committed delivery date<input type="date" required min={quote.pickupDate} value={quote.deliveryDate} onChange={event => setQuote(current => ({ ...current, deliveryDate: event.target.value, platformFeeAcknowledged: false }))} /></label>
        <label>Valid until<input type="date" required value={quote.validUntil} onChange={event => setQuote(current => ({ ...current, validUntil: event.target.value }))} /></label>
      </div>
      <fieldset className={quoteStyles.inclusions}><legend>What is included in your price?</legend>{standardInclusions.map(item=><label key={item}><input type="checkbox" checked={quote.inclusions.includes(item)} onChange={event=>setQuote(current=>({...current,inclusions:event.target.checked?[...current.inclusions,item]:current.inclusions.filter(value=>value!==item),platformFeeAcknowledged:false}))}/>{item}</label>)}</fieldset>
      <label>Important exclusions, one per line<textarea maxLength={1000} value={quote.exclusions} onChange={event=>setQuote(current=>({...current,exclusions:event.target.value,platformFeeAcknowledged:false}))} placeholder="Example: Storage beyond the moving date" /></label>
      <label>Remarks<textarea maxLength={1000} value={quote.remarks} onChange={event => setQuote(current => ({ ...current, remarks: event.target.value }))} /></label>
      <section className={quoteStyles.payoutPreview}><div><span>Customer quotation</span><strong>₹{Math.max(0,quoteTotal).toLocaleString("en-IN")}</strong></div><div><span>Estimated EasyMovers platform fee</span><strong>₹{feePreview.fee.toLocaleString("en-IN")}</strong></div><div><span>Estimated vendor payout</span><strong>₹{feePreview.estimatedVendorPayoutBeforeTaxes.toLocaleString("en-IN")}</strong></div><p>Estimate before GST on platform services, statutory withholding and approved settlement adjustments.</p><label><input type="checkbox" checked={quote.platformFeeAcknowledged} onChange={event=>setQuote(current=>({...current,platformFeeAcknowledged:event.target.checked}))}/>I understand the estimated platform fee and vendor payout.</label></section>
      <button disabled={busy||!quote.platformFeeAcknowledged}>{busy ? "Saving…" : quoting.myQuotation ? "Save revised quotation" : "Submit quotation"}</button>
    </form>}
  </main>;
}
